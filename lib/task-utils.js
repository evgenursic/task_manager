// @ts-check

/**
 * @typedef {import("@/lib/mock-tasks").Task} Task
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
