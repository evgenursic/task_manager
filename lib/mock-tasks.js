// @ts-check

/**
 * @typedef {"Low" | "Med" | "High"} TaskPriority
 * @typedef {"Open" | "Done"} TaskStatus
 *
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string} notes
 * @property {string | null} dueAt
 * @property {TaskPriority} priority
 * @property {TaskStatus} status
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/** @type {Task[]} */
export const mockTasks = [
  {
    id: "task-001",
    title: "Prepare weekly planning",
    notes: "Review backlog and define top three priorities for next week.",
    dueAt: "2026-02-15T09:00:00.000Z",
    priority: "High",
    status: "Open",
    createdAt: "2026-02-13T12:00:00.000Z",
    updatedAt: "2026-02-14T15:20:00.000Z",
  },
  {
    id: "task-002",
    title: "Refactor task list styles",
    notes: "Unify card spacing and improve keyboard focus visibility.",
    dueAt: "2026-02-16T14:30:00.000Z",
    priority: "Med",
    status: "Open",
    createdAt: "2026-02-12T09:30:00.000Z",
    updatedAt: "2026-02-14T10:10:00.000Z",
  },
  {
    id: "task-003",
    title: "Send status summary",
    notes: "Share milestone progress with links to branches and PRs.",
    dueAt: "2026-02-13T16:00:00.000Z",
    priority: "Low",
    status: "Done",
    createdAt: "2026-02-12T15:45:00.000Z",
    updatedAt: "2026-02-13T16:30:00.000Z",
  },
  {
    id: "task-004",
    title: "Update README milestones",
    notes: "Add upcoming milestone checklist and branch naming convention.",
    dueAt: "2026-02-14T18:00:00.000Z",
    priority: "High",
    status: "Open",
    createdAt: "2026-02-11T08:00:00.000Z",
    updatedAt: "2026-02-14T08:30:00.000Z",
  },
];
