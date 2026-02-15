import Link from "next/link";
import { Clock3, ListChecks, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * @param {Date | null} value
 */
function formatUpcomingDue(value) {
  if (!value) {
    return "No upcoming due time";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

/**
 * @param {{
 *   overdueHref: string;
 *   summary: {
 *     overdueOpenCount: number;
 *     dueTodayOpenCount: number;
 *     nextUpcomingDueAt: Date | null;
 *   };
 }} props
 */
export function TaskRemindersPanel({ overdueHref, summary }) {
  return (
    <section
      className="bg-card space-y-3 rounded-lg border p-4"
      aria-labelledby="reminders-heading"
    >
      <h2 id="reminders-heading" className="text-base font-semibold">
        Reminders
      </h2>
      <ul className="grid gap-3 md:grid-cols-3">
        <li className="bg-muted/50 space-y-1 rounded-md border p-3">
          <p className="text-muted-foreground flex items-center gap-2 text-xs font-medium uppercase">
            <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
            Overdue open
          </p>
          <p className="text-xl font-semibold">{summary.overdueOpenCount}</p>
          <Link
            href={overdueHref}
            aria-label="Filter tasks to overdue"
            className={cn(
              "text-sm underline underline-offset-4",
              "focus-visible:ring-ring/50 rounded-sm focus-visible:ring-2 focus-visible:outline-none"
            )}
          >
            View overdue
          </Link>
        </li>

        <li className="bg-muted/50 space-y-1 rounded-md border p-3">
          <p className="text-muted-foreground flex items-center gap-2 text-xs font-medium uppercase">
            <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
            Due today (open)
          </p>
          <p className="text-xl font-semibold">{summary.dueTodayOpenCount}</p>
          <p className="text-muted-foreground text-sm">Tasks that need attention today.</p>
        </li>

        <li className="bg-muted/50 space-y-1 rounded-md border p-3">
          <p className="text-muted-foreground flex items-center gap-2 text-xs font-medium uppercase">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            Next upcoming
          </p>
          <p className="text-sm font-medium">{formatUpcomingDue(summary.nextUpcomingDueAt)}</p>
          <p className="text-muted-foreground text-sm">Earliest open task with a due date.</p>
        </li>
      </ul>
    </section>
  );
}
