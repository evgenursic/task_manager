// @ts-check

/**
 * @typedef {import("@/lib/mock-tasks").Task} Task
 */
/**
 * @typedef {"all" | "today" | "week" | "overdue" | "done"} TaskFilter
 * @typedef {"due" | "priority" | "created"} TaskSort
 */

/** @type {Record<Task["priority"], number>} */
export const PRIORITY_ORDER = {
  High: 0,
  Med: 1,
  Low: 2,
};

/**
 * @param {Task} task
 * @param {Date} now
 */
export function isOverdue(task, now) {
  if (!task.dueAt || task.status === "Done") {
    return false;
  }

  return new Date(task.dueAt).getTime() < now.getTime();
}

/**
 * @param {Task} task
 * @param {Date} now
 */
export function isDueSoon(task, now) {
  if (!task.dueAt || task.status === "Done") {
    return false;
  }

  const dueMs = new Date(task.dueAt).getTime();
  const diffMs = dueMs - now.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  return diffMs >= 0 && diffMs <= oneDayMs;
}

/**
 * @param {Task} task
 * @param {Date} now
 */
export function isDueToday(task, now) {
  if (!task.dueAt) {
    return false;
  }

  const due = new Date(task.dueAt);
  return (
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
  );
}

/**
 * @param {Date} date
 */
function getStartOfWeek(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

/**
 * @param {Task} task
 * @param {Date} now
 */
export function isInThisWeek(task, now) {
  if (!task.dueAt) {
    return false;
  }

  const due = new Date(task.dueAt);
  const weekStart = getStartOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return due >= weekStart && due < weekEnd;
}

/**
 * @param {Task[]} tasks
 * @param {TaskFilter} filter
 * @param {Date} now
 */
export function filterTasks(tasks, filter, now) {
  switch (filter) {
    case "today":
      return tasks.filter((task) => isDueToday(task, now));
    case "week":
      return tasks.filter((task) => isInThisWeek(task, now));
    case "overdue":
      return tasks.filter((task) => isOverdue(task, now));
    case "done":
      return tasks.filter((task) => task.status === "Done");
    case "all":
    default:
      return tasks;
  }
}

/**
 * @param {Task[]} tasks
 */
export function sortByDueDate(tasks) {
  return [...tasks].sort((a, b) => {
    if (!a.dueAt) return 1;
    if (!b.dueAt) return -1;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });
}

/**
 * @param {Task[]} tasks
 */
export function sortByCreated(tasks) {
  return [...tasks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * @param {Task[]} tasks
 */
export function sortByPriority(tasks) {
  return [...tasks].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

/**
 * @param {Task[]} tasks
 * @param {TaskSort} sort
 */
export function sortTasks(tasks, sort) {
  switch (sort) {
    case "created":
      return sortByCreated(tasks);
    case "priority":
      return sortByPriority(tasks);
    case "due":
    default:
      return sortByDueDate(tasks);
  }
}

/**
 * @param {string | null} isoDate
 */
export function formatDateTime(isoDate) {
  if (!isoDate) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoDate));
}
