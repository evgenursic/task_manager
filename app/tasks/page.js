import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageTitle } from "@/components/page-title";
import { Badge } from "@/components/ui/badge";
import { listTasks } from "@/lib/tasks/service";
import { cn } from "@/lib/utils";
import { TaskCreateDialog } from "./task-create-dialog";
import { TaskDoneToggle } from "./task-done-toggle";
import { TaskRowActions } from "./task-row-actions";

/** @typedef {import("@prisma/client").Task} Task */

const PRIORITY_LABELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

const STATUS_LABELS = {
  OPEN: "Open",
  DONE: "Done",
};

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "done", label: "Done" },
];

/**
 * @param {Date | null} value
 */
function formatDateTime(value) {
  if (!value) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

/**
 * @param {Task} task
 * @param {Date} now
 */
function isDueSoon(task, now) {
  if (!task.dueAt || task.status !== "OPEN") {
    return false;
  }

  const delta = task.dueAt.getTime() - now.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  return delta >= 0 && delta <= oneDayMs;
}

/**
 * @param {Task} task
 * @param {Date} now
 */
function isOverdue(task, now) {
  if (!task.dueAt || task.status !== "OPEN") {
    return false;
  }

  return task.dueAt.getTime() < now.getTime();
}

/**
 * @param {unknown} value
 */
function normalizeStatusFilter(value) {
  if (value === "open" || value === "done" || value === "all") {
    return value;
  }
  return "all";
}

/**
 * @param {{ task: Task; now: Date }} props
 */
function TaskItem({ task, now }) {
  const overdue = isOverdue(task, now);
  const done = task.status === "DONE";
  const taskForActions = {
    id: task.id,
    title: task.title,
    notes: task.notes,
    dueAt: task.dueAt ? task.dueAt.toISOString() : null,
    priority: task.priority,
    status: task.status,
  };

  return (
    <li>
      <article
        className={cn(
          "bg-card rounded-lg border p-4 shadow-sm",
          overdue && "border-red-500/40 bg-red-500/5 ring-1 ring-red-500/25",
          done && "opacity-75"
        )}
        aria-label={`Task ${task.title}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h3
              className={cn(
                "text-base font-semibold",
                done && "text-muted-foreground line-through decoration-1"
              )}
            >
              {task.title}
            </h3>
            {task.notes ? <p className="text-muted-foreground text-sm">{task.notes}</p> : null}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Badge variant={task.priority === "HIGH" ? "default" : "secondary"}>
                {PRIORITY_LABELS[task.priority]}
              </Badge>
              <Badge variant={done ? "secondary" : "outline"}>{STATUS_LABELS[task.status]}</Badge>
              {overdue ? <Badge variant="destructive">Overdue</Badge> : null}
            </div>
            <TaskDoneToggle taskId={task.id} title={task.title} initialStatus={task.status} />
            <TaskRowActions task={taskForActions} />
          </div>
        </div>

        <dl className="text-muted-foreground mt-3 grid gap-1 text-xs sm:grid-cols-3">
          <div>
            <dt className="text-foreground font-medium">Due</dt>
            <dd>{formatDateTime(task.dueAt)}</dd>
          </div>
          <div>
            <dt className="text-foreground font-medium">Created</dt>
            <dd>{formatDateTime(task.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-foreground font-medium">Updated</dt>
            <dd>{formatDateTime(task.updatedAt)}</dd>
          </div>
        </dl>
      </article>
    </li>
  );
}

export default async function TasksPage({ searchParams }) {
  const now = new Date();
  const params = await Promise.resolve(searchParams);
  const statusFilter = normalizeStatusFilter(params?.status);
  const serviceStatus =
    statusFilter === "open" ? "OPEN" : statusFilter === "done" ? "DONE" : undefined;

  const { items: tasks } = await listTasks({
    status: serviceStatus,
    sort: { field: "dueAt", direction: "asc" },
  });

  const dueSoonTasks = tasks.filter((task) => isDueSoon(task, now));
  const otherTasks = tasks.filter((task) => !isDueSoon(task, now));

  return (
    <section className="space-y-8">
      <PageTitle
        title="Tasks"
        description="Focused list of upcoming work, with clear urgency and status signals."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-muted inline-flex items-center rounded-md p-1">
              {STATUS_FILTER_OPTIONS.map((option) => {
                const isActive = statusFilter === option.value;

                return (
                  <Link
                    key={option.value}
                    href={option.value === "all" ? "/tasks" : `/tasks?status=${option.value}`}
                    className={cn(
                      "rounded-sm px-2 py-1 text-xs font-medium transition-colors",
                      "focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:outline-none",
                      isActive
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {option.label}
                  </Link>
                );
              })}
            </div>
            <TaskCreateDialog />
          </div>
        }
      />

      <section className="space-y-3" aria-labelledby="due-soon-heading">
        <h2 id="due-soon-heading" className="text-lg font-semibold">
          Due soon (next 24h)
        </h2>
        {dueSoonTasks.length === 0 ? (
          <EmptyState
            title="No tasks due soon"
            description="No open tasks are due within the next 24 hours."
          />
        ) : (
          <ul className="space-y-3" aria-label="Due soon tasks">
            {dueSoonTasks.map((task) => (
              <TaskItem key={`due-soon-${task.id}`} task={task} now={now} />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="all-tasks-heading">
        <h2 id="all-tasks-heading" className="text-lg font-semibold">
          All tasks
        </h2>
        {otherTasks.length === 0 ? (
          <EmptyState title="No other tasks" description="Everything else is clear for now." />
        ) : (
          <ul className="space-y-3" aria-label="All tasks">
            {otherTasks.map((task) => (
              <TaskItem key={task.id} task={task} now={now} />
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
