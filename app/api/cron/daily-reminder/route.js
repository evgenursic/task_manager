import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formatEmailDate, formatEmailDateTime } from "@/lib/email/format-date";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * @param {Date} value
 */
function endOfDay(value) {
  const next = new Date(value);
  next.setHours(23, 59, 59, 999);
  return next;
}

/**
 * @param {string} value
 */
function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * @param {Array<{ title: string; dueAt: Date | null; priority: "LOW" | "MEDIUM" | "HIGH" }>} tasks
 */
function renderTaskItems(tasks) {
  return tasks
    .map((task) => {
      return `<li><strong>${escapeHtml(task.title)}</strong> - ${formatEmailDateTime(task.dueAt)} (${task.priority})</li>`;
    })
    .join("");
}

/**
 * @param {{
 *   now: Date;
 *   dueTodayTasks: Array<{ title: string; dueAt: Date | null; priority: "LOW" | "MEDIUM" | "HIGH" }>;
 *   overdueTasks: Array<{ title: string; dueAt: Date | null; priority: "LOW" | "MEDIUM" | "HIGH" }>;
 * }} params
 */
function buildEmailContent({ now, dueTodayTasks, overdueTasks }) {
  const total = dueTodayTasks.length + overdueTasks.length;
  const dateLabel = formatEmailDate(now);

  if (total === 0) {
    return {
      subject: `Taskflow daily digest (${dateLabel}): all clear`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;">
          <h2 style="margin:0 0 12px;">Taskflow daily reminder</h2>
          <p style="margin:0 0 12px;">All clear for today. No overdue or due-today open tasks.</p>
          <p style="margin:0;color:#6B7280;font-size:12px;">Generated on ${escapeHtml(dateLabel)}</p>
        </div>
      `,
    };
  }

  return {
    subject: `Taskflow daily digest (${dateLabel}): ${total} task(s) need attention`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;">
        <h2 style="margin:0 0 12px;">Taskflow daily reminder</h2>
        <p style="margin:0 0 12px;">
          <strong>${overdueTasks.length}</strong> overdue and
          <strong>${dueTodayTasks.length}</strong> due today.
        </p>

        <h3 style="margin:16px 0 8px;">Overdue open tasks</h3>
        ${
          overdueTasks.length > 0
            ? `<ul style="margin:0 0 12px 20px;padding:0;">${renderTaskItems(overdueTasks)}</ul>`
            : `<p style="margin:0 0 12px;color:#6B7280;">No overdue tasks.</p>`
        }

        <h3 style="margin:16px 0 8px;">Due today open tasks</h3>
        ${
          dueTodayTasks.length > 0
            ? `<ul style="margin:0 0 12px 20px;padding:0;">${renderTaskItems(dueTodayTasks)}</ul>`
            : `<p style="margin:0 0 12px;color:#6B7280;">No tasks due today.</p>`
        }

        <p style="margin:0;color:#6B7280;font-size:12px;">Generated on ${escapeHtml(dateLabel)}</p>
      </div>
    `,
  };
}

function getConfig() {
  const config = {
    cronSecret: process.env.CRON_SECRET,
    reminderEmail: process.env.REMINDER_EMAIL,
    resendApiKey: process.env.RESEND_API_KEY,
    resendFromEmail: process.env.RESEND_FROM_EMAIL ?? "Taskflow <onboarding@resend.dev>",
  };

  const missing = [];

  if (!config.cronSecret) {
    missing.push("CRON_SECRET");
  }

  if (!config.reminderEmail) {
    missing.push("REMINDER_EMAIL");
  }

  if (!config.resendApiKey) {
    missing.push("RESEND_API_KEY");
  }

  return { config, missing };
}

/**
 * @param {Request} request
 */
async function handleDailyReminder(request) {
  const { config, missing } = getConfig();

  if (missing.length > 0) {
    console.warn("[daily-reminder] missing env vars", { missing: missing.length });
    return NextResponse.json(
      {
        ok: false,
        error: `Missing required env vars: ${missing.join(", ")}`,
      },
      { status: 500 }
    );
  }

  const cronSecretHeader = request.headers.get("x-cron-secret");
  if (!cronSecretHeader || cronSecretHeader !== config.cronSecret) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized cron request.",
      },
      { status: 401 }
    );
  }

  try {
    const now = new Date();
    const end = endOfDay(now);

    const [dueTodayTasks, overdueTasks] = await Promise.all([
      db.task.findMany({
        where: {
          status: "OPEN",
          dueAt: {
            gte: now,
            lte: end,
          },
        },
        orderBy: { dueAt: "asc" },
        select: {
          title: true,
          dueAt: true,
          priority: true,
        },
      }),
      db.task.findMany({
        where: {
          status: "OPEN",
          dueAt: { lt: now },
        },
        orderBy: { dueAt: "asc" },
        select: {
          title: true,
          dueAt: true,
          priority: true,
        },
      }),
    ]);

    const { subject, html } = buildEmailContent({
      now,
      dueTodayTasks,
      overdueTasks,
    });

    const resendResponse = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.resendFromEmail,
        to: [config.reminderEmail],
        subject,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const responseBody = await resendResponse.text();
      console.error("[daily-reminder] resend failed", {
        status: resendResponse.status,
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Failed to send reminder email.",
          details: responseBody.slice(0, 300),
        },
        { status: 502 }
      );
    }

    const resendPayload = await resendResponse.json();

    console.info("[daily-reminder] email sent", {
      overdue: overdueTasks.length,
      dueToday: dueTodayTasks.length,
    });

    return NextResponse.json({
      ok: true,
      counts: {
        overdue: overdueTasks.length,
        dueToday: dueTodayTasks.length,
      },
      emailId: resendPayload?.id ?? null,
    });
  } catch (error) {
    console.error("[daily-reminder] unexpected error", {
      message: error instanceof Error ? error.message : "unknown",
    });

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to process daily reminder.",
      },
      { status: 500 }
    );
  }
}

/**
 * @param {Request} request
 */
export async function GET(request) {
  return handleDailyReminder(request);
}

/**
 * @param {Request} request
 */
export async function POST(request) {
  return handleDailyReminder(request);
}
