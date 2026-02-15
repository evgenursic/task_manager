"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import {
  TaskServiceError,
  createTask,
  deleteTask,
  getTaskById,
  updateTask,
} from "@/lib/tasks/service";
import { getCurrentOwner } from "@/lib/auth/current-user";
import { TaskCreateSchema, TaskIdSchema, TaskUpdateSchema } from "@/lib/tasks/schemas";

/**
 * @typedef {{ id: string; message: string; field?: string }} ActionIssue
 * @typedef {{ code: string; message: string; issues: ActionIssue[] }} ActionError
 * @typedef {{ ok: true; data: unknown } | { ok: false; error: ActionError }} TaskActionResult
 */

/**
 * Supports direct calls and form action calls (including useActionState signature).
 * @param {unknown} inputOrPrevState
 * @param {unknown} [maybeInput]
 */
function getActionInput(inputOrPrevState, maybeInput) {
  const candidate = maybeInput ?? inputOrPrevState;

  if (candidate instanceof FormData) {
    return Object.fromEntries(candidate.entries());
  }

  return candidate ?? {};
}

/**
 * @param {string} actionName
 * @param {unknown} error
 */
function logActionError(actionName, error) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  if (error instanceof TaskServiceError) {
    console.error(`[tasks/actions] ${actionName} failed`, {
      code: error.code,
      status: error.status,
      issues: error.issues.length,
    });
    return;
  }

  if (error instanceof ZodError) {
    console.error(`[tasks/actions] ${actionName} validation failed`, {
      issues: error.issues.length,
    });
    return;
  }

  console.error(`[tasks/actions] ${actionName} failed with unknown error type`);
}

/**
 * @param {unknown} error
 * @returns {ActionError}
 */
function toActionError(error) {
  if (error instanceof TaskServiceError) {
    return {
      code: error.code,
      message: error.message,
      issues: error.issues,
    };
  }

  if (error instanceof ZodError) {
    return {
      code: "VALIDATION_ERROR",
      message: "Provided task data is invalid.",
      issues: error.issues.map((issue, index) => ({
        id: `validation-${index + 1}`,
        message: issue.message,
        field: issue.path.length > 0 ? issue.path.join(".") : undefined,
      })),
    };
  }

  return {
    code: "UNEXPECTED_ACTION_ERROR",
    message: "Request failed. Please try again.",
    issues: [{ id: "unexpected-1", message: "Unexpected error in server action." }],
  };
}

async function requireActionOwnerId() {
  const owner = await getCurrentOwner();
  if (owner?.id) {
    return owner.id;
  }

  throw new TaskServiceError({
    code: "AUTH_REQUIRED",
    status: 401,
    message: "Please sign in to manage tasks.",
    issues: [{ id: "auth-required-1", message: "You need to be signed in." }],
  });
}

/**
 * @param {unknown} inputOrPrevState
 * @param {unknown} [maybeInput]
 * @returns {Promise<TaskActionResult>}
 */
export async function createTaskAction(inputOrPrevState, maybeInput) {
  try {
    const ownerId = await requireActionOwnerId();
    const input = getActionInput(inputOrPrevState, maybeInput);
    const parsed = TaskCreateSchema.parse(input);
    const task = await createTask(parsed, ownerId);
    revalidatePath("/tasks");

    return { ok: true, data: task };
  } catch (error) {
    logActionError("createTaskAction", error);
    return { ok: false, error: toActionError(error) };
  }
}

/**
 * @param {unknown} inputOrPrevState
 * @param {unknown} [maybeInput]
 * @returns {Promise<TaskActionResult>}
 */
export async function updateTaskAction(inputOrPrevState, maybeInput) {
  try {
    const ownerId = await requireActionOwnerId();
    const input = getActionInput(inputOrPrevState, maybeInput);
    const parsed = TaskUpdateSchema.parse(input);
    const task = await updateTask(parsed, ownerId);
    revalidatePath("/tasks");

    return { ok: true, data: task };
  } catch (error) {
    logActionError("updateTaskAction", error);
    return { ok: false, error: toActionError(error) };
  }
}

/**
 * @param {unknown} inputOrPrevState
 * @param {unknown} [maybeInput]
 * @returns {Promise<TaskActionResult>}
 */
export async function toggleTaskDoneAction(inputOrPrevState, maybeInput) {
  try {
    const ownerId = await requireActionOwnerId();
    const input = getActionInput(inputOrPrevState, maybeInput);
    const { id } = TaskIdSchema.parse(input);

    const existingTask = await getTaskById({ id }, ownerId);
    const nextStatus = existingTask.status === "DONE" ? "OPEN" : "DONE";
    const task = await updateTask({ id, status: nextStatus }, ownerId);

    revalidatePath("/tasks");

    return {
      ok: true,
      data: task,
    };
  } catch (error) {
    logActionError("toggleTaskDoneAction", error);
    return { ok: false, error: toActionError(error) };
  }
}

/**
 * @param {unknown} inputOrPrevState
 * @param {unknown} [maybeInput]
 * @returns {Promise<TaskActionResult>}
 */
export async function deleteTaskAction(inputOrPrevState, maybeInput) {
  try {
    const ownerId = await requireActionOwnerId();
    const input = getActionInput(inputOrPrevState, maybeInput);
    const { id } = TaskIdSchema.parse(input);
    const task = await deleteTask({ id }, ownerId);

    revalidatePath("/tasks");

    return { ok: true, data: task };
  } catch (error) {
    logActionError("deleteTaskAction", error);
    return { ok: false, error: toActionError(error) };
  }
}
