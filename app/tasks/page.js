import { mockTasks } from "@/lib/mock-tasks";
import { cn } from "@/lib/utils";
import { formatDateTime, isDueSoon, isOverdue, sortByDueDate } from "@/lib/task-utils";

/**
 * @param {{ label: string; variant?: "default" | "outline" | "destructive" }} props
 */
function Badge({ label, variant = "outline" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        variant === "default" && "bg-primary text-primary-foreground border-transparent",
        variant === "destructive" &&
          "border-red-600/30 bg-red-500/10 text-red-700 dark:text-red-300"
      )}
    >
      {label}
    </span>
  );
}

/**
 * @param {{ task: import("@/lib/mock-tasks").Task; now: Date }} props
 */
function TaskCard({ task, now }) {
  const overdue = isOverdue(task, now);
  const dueSoon = isDueSoon(task, now);

  return (
    <article
      className={cn(
        "bg-card rounded-lg border p-4 shadow-sm",
        overdue && "border-red-600/30 ring-1 ring-red-600/20"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{task.title}</h3>
          <p className="text-muted-foreground text-sm">{task.notes}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge label={task.priority} variant={task.priority === "High" ? "default" : "outline"} />
          <Badge label={task.status} variant={task.status === "Done" ? "default" : "outline"} />
          {overdue ? <Badge label="Overdue" variant="destructive" /> : null}
          {!overdue && dueSoon ? <Badge label="Due soon" /> : null}
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
  );
}

export default function TasksPage() {
  const now = new Date();
  const tasks = sortByDueDate(mockTasks);
  const dueSoonTasks = tasks.filter((task) => isDueSoon(task, now));

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground text-sm">
          Milestone 1: static UI with priority, status, due date metadata, and overdue indicators.
        </p>
      </div>

      <section className="space-y-3" aria-labelledby="due-soon-heading">
        <h2 id="due-soon-heading" className="text-lg font-semibold">
          Due soon (next 24h)
        </h2>
        {dueSoonTasks.length === 0 ? (
          <p className="text-muted-foreground text-sm">No tasks due in the next 24 hours.</p>
        ) : (
          <div className="space-y-3">
            {dueSoonTasks.map((task) => (
              <TaskCard key={`soon-${task.id}`} task={task} now={now} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="all-tasks-heading">
        <h2 id="all-tasks-heading" className="text-lg font-semibold">
          All tasks
        </h2>
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} now={now} />
          ))}
        </div>
      </section>
    </section>
  );
}
