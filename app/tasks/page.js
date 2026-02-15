import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentOwner } from "@/lib/auth/current-user";
import { getTaskReminderSummary, listTasks } from "@/lib/tasks/service";
import { cn } from "@/lib/utils";
import { TaskCreateDialog } from "./task-create-dialog";
import { TaskDoneToggle } from "./task-done-toggle";
import { TaskFilterBar } from "./task-filter-bar";
import { TaskRemindersPanel } from "./task-reminders-panel";
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

const TAB_VALUES = ["all", "today", "week", "overdue", "done"];
const SORT_VALUES = ["due-asc", "due-desc", "priority", "created"];

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
 * @param {Date} value
 */
function startOfDay(value) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

/**
 * @param {Date} value
 */
function endOfDay(value) {
  const next = new Date(value);
  next.setHours(23, 59, 59, 999);
  return next;
}

/**
 * @param {Date} value
 */
function endOfWeek(value) {
  const next = endOfDay(value);
  const day = next.getDay();
  next.setDate(next.getDate() + (6 - day));
  return next;
}

/**
 * @param {unknown} value
 */
function getParamValue(value) {
  if (Array.isArray(value)) {
    return value[0];
  }
  if (typeof value === "string") {
    return value;
  }
  return "";
}

/**
 * @param {string} value
 */
function normalizeTab(value) {
  return TAB_VALUES.includes(value) ? value : "all";
}

/**
 * @param {string} value
 */
function normalizeSort(value) {
  return SORT_VALUES.includes(value) ? value : "due-asc";
}

/**
 * @param {string} value
 */
function normalizeQuery(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  return trimmed.slice(0, 200);
}

/**
 * @param {"due-asc" | "due-desc" | "priority" | "created"} sort
 */
function mapSort(sort) {
  if (sort === "due-desc") {
    return { field: "dueAt", direction: "desc" };
  }
  if (sort === "priority") {
    return { field: "priority", direction: "desc" };
  }
  if (sort === "created") {
    return { field: "createdAt", direction: "desc" };
  }
  return { field: "dueAt", direction: "asc" };
}

/**
 * @param {{ tab: string; query: string; sort: string }} params
 */
function buildTasksHref(params) {
  const next = new URLSearchParams();

  if (params.tab && params.tab !== "all") {
    next.set("tab", params.tab);
  }
  if (params.query) {
    next.set("query", params.query);
  }
  if (params.sort && params.sort !== "due-asc") {
    next.set("sort", params.sort);
  }

  const search = next.toString();
  return search ? `/tasks?${search}` : "/tasks";
}

/**
 * @param {"all" | "today" | "week" | "overdue" | "done"} tab
 * @param {Date} now
 */
function buildServiceFilters(tab, now) {
  if (tab === "done") {
    return { status: "DONE" };
  }
  if (tab === "today") {
    return {
      status: "OPEN",
      dateRange: {
        from: startOfDay(now),
        to: endOfDay(now),
      },
    };
  }
  if (tab === "week") {
    return {
      status: "OPEN",
      dateRange: {
        from: startOfDay(now),
        to: endOfWeek(now),
      },
    };
  }
  if (tab === "overdue") {
    return {
      status: "OPEN",
      dateRange: {
        to: new Date(now.getTime() - 1),
      },
    };
  }
  return {};
}

/**
 * @param {"all" | "today" | "week" | "overdue" | "done"} tab
 */
function getListEmptyState(tab) {
  if (tab === "done") {
    return {
      title: "No completed tasks yet",
      description: "Mark tasks as done to build visible progress here.",
    };
  }

  if (tab === "overdue") {
    return {
      title: "No overdue tasks",
      description: "You're on track. Nothing is past its due time.",
    };
  }

  if (tab === "today") {
    return {
      title: "No other tasks due today",
      description: "Today's remaining schedule looks clear.",
    };
  }

  if (tab === "week") {
    return {
      title: "No other tasks due this week",
      description: "You are clear beyond the immediate due-soon items.",
    };
  }

  return {
    title: "No other tasks yet",
    description: "Create your first task to get this list moving.",
  };
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
  const owner = await getCurrentOwner();

  if (!owner) {
    return (
      <section className="space-y-8">
        <PageTitle
          title="Tasks"
          description="Sign in to view and manage your personal task list."
          actions={
            <Button asChild size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          }
        />
        <EmptyState
          title="You're not signed in"
          description="Sign in with GitHub to load your tasks, reminders, and filters."
        />
      </section>
    );
  }

  const now = new Date();
  const params = await Promise.resolve(searchParams);
  const tab = normalizeTab(getParamValue(params?.tab));
  const sort = normalizeSort(getParamValue(params?.sort));
  const query = normalizeQuery(getParamValue(params?.query));
  const serviceFilters = buildServiceFilters(tab, now);
  const showDueSoonSection = tab === "all" || tab === "today" || tab === "week";

  const [{ items: tasks }, reminderSummary] = await Promise.all([
    listTasks(
      {
        ...serviceFilters,
        query: query || undefined,
        sort: mapSort(sort),
      },
      owner.id
    ),
    getTaskReminderSummary({ now }, owner.id),
  ]);

  const dueSoonTasks = tasks.filter((task) => isDueSoon(task, now));
  const listTasksItems = showDueSoonSection ? tasks.filter((task) => !isDueSoon(task, now)) : tasks;
  const allTasksHeading = tab === "done" ? "Done tasks" : "All tasks";
  const listEmptyState = getListEmptyState(tab);
  const overdueTabHref = buildTasksHref({
    tab: "overdue",
    query,
    sort,
  });

  return (
    <section className="space-y-8">
      <PageTitle
        title="Tasks"
        description="Focused list of upcoming work, with clear urgency and status signals."
        actions={<TaskCreateDialog />}
      />

      <TaskFilterBar tab={tab} query={query} sort={sort} />
      <TaskRemindersPanel summary={reminderSummary} overdueHref={overdueTabHref} />

      {showDueSoonSection ? (
        <section className="space-y-3" aria-labelledby="due-soon-heading">
          <h2 id="due-soon-heading" className="text-lg font-semibold">
            Due soon (next 24h)
          </h2>
          {dueSoonTasks.length === 0 ? (
            <EmptyState
              title="Nothing due in the next 24 hours"
              description="Good buffer. Add a task or adjust filters if you expected something here."
            />
          ) : (
            <ul className="space-y-3" aria-label="Due soon tasks">
              {dueSoonTasks.map((task) => (
                <TaskItem key={`due-soon-${task.id}`} task={task} now={now} />
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <section className="space-y-3" aria-labelledby="all-tasks-heading">
        <h2 id="all-tasks-heading" className="text-lg font-semibold">
          {allTasksHeading}
        </h2>
        {listTasksItems.length === 0 ? (
          <EmptyState title={listEmptyState.title} description={listEmptyState.description} />
        ) : (
          <ul className="space-y-3" aria-label="All tasks">
            {listTasksItems.map((task) => (
              <TaskItem key={task.id} task={task} now={now} />
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
