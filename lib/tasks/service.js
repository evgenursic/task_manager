// @ts-check

import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { db } from "@/lib/db";
import {
  TaskCreateSchema,
  TaskFilterSchema,
  TaskIdSchema,
  TaskUpdateSchema,
} from "@/lib/tasks/schemas";

/**
 * @typedef {import("@prisma/client").Task} TaskRecord
 * @typedef {import("@prisma/client").PrismaClient} PrismaClient
 */

/**
 * @typedef {{ id: string; message: string; field?: string }} ServiceIssue
 */

/**
 * @typedef {{ code: string; message: string; status: number; issues: ServiceIssue[] }} ServiceErrorPayload
 */

export class TaskServiceError extends Error {
  /**
   * @param {ServiceErrorPayload} payload
   */
  constructor(payload) {
    super(payload.message);
    this.name = "TaskServiceError";
    this.code = payload.code;
    this.status = payload.status;
    this.issues = payload.issues;
  }
}

/**
 * @param {TaskRecord} task
 */
function toTaskDTO(task) {
  return {
    id: task.id,
    title: task.title,
    notes: task.notes,
    dueAt: task.dueAt,
    priority: task.priority,
    status: task.status,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

/**
 * @param {ZodError} error
 */
function toValidationError(error) {
  const issues = error.issues.map((issue, index) => ({
    id: `validation-${index + 1}`,
    message: issue.message,
    field: issue.path.length > 0 ? issue.path.join(".") : undefined,
  }));

  return new TaskServiceError({
    code: "VALIDATION_ERROR",
    status: 400,
    message: "Task data is invalid.",
    issues,
  });
}

/**
 * @param {unknown} error
 */
function toServiceError(error) {
  if (error instanceof TaskServiceError) {
    return error;
  }

  if (error instanceof ZodError) {
    return toValidationError(error);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return new TaskServiceError({
        code: "TASK_NOT_FOUND",
        status: 404,
        message: "Task was not found.",
        issues: [{ id: "not-found-1", message: "The requested task does not exist anymore." }],
      });
    }
  }

  return new TaskServiceError({
    code: "TASK_SERVICE_ERROR",
    status: 500,
    message: "Something went wrong while processing task data.",
    issues: [
      { id: "generic-1", message: "Try again, or contact support if the problem persists." },
    ],
  });
}

/**
 * @param {unknown} input
 * @param {PrismaClient} [client]
 */
export async function createTask(input, client = db) {
  try {
    const data = TaskCreateSchema.parse(input);
    const task = await client.task.create({ data });
    return toTaskDTO(task);
  } catch (error) {
    throw toServiceError(error);
  }
}

/**
 * @param {unknown} input
 * @param {PrismaClient} [client]
 */
export async function updateTask(input, client = db) {
  try {
    const { id, ...data } = TaskUpdateSchema.parse(input);
    const task = await client.task.update({
      where: { id },
      data,
    });
    return toTaskDTO(task);
  } catch (error) {
    throw toServiceError(error);
  }
}

/**
 * @param {unknown} input
 * @param {PrismaClient} [client]
 */
export async function getTaskById(input, client = db) {
  try {
    const { id } = TaskIdSchema.parse(input);
    const task = await client.task.findUnique({ where: { id } });

    if (!task) {
      throw new TaskServiceError({
        code: "TASK_NOT_FOUND",
        status: 404,
        message: "Task was not found.",
        issues: [{ id: "not-found-1", message: "The requested task does not exist." }],
      });
    }

    return toTaskDTO(task);
  } catch (error) {
    throw toServiceError(error);
  }
}

/**
 * @param {unknown} input
 * @param {PrismaClient} [client]
 */
export async function deleteTask(input, client = db) {
  try {
    const { id } = TaskIdSchema.parse(input);
    const task = await client.task.delete({ where: { id } });
    return toTaskDTO(task);
  } catch (error) {
    throw toServiceError(error);
  }
}

/**
 * @param {unknown} input
 * @param {PrismaClient} [client]
 */
export async function listTasks(input = {}, client = db) {
  try {
    const filters = TaskFilterSchema.parse(input);

    /** @type {import("@prisma/client").Prisma.TaskWhereInput} */
    const where = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.query) {
      where.OR = [{ title: { contains: filters.query } }, { notes: { contains: filters.query } }];
    }

    if (filters.dateRange?.from || filters.dateRange?.to) {
      where.dueAt = {};
      if (filters.dateRange.from) {
        where.dueAt.gte = filters.dateRange.from;
      }
      if (filters.dateRange.to) {
        where.dueAt.lte = filters.dateRange.to;
      }
    }

    const items = await client.task.findMany({
      where,
      orderBy: {
        [filters.sort.field]: filters.sort.direction,
      },
    });

    return {
      items: items.map(toTaskDTO),
      total: items.length,
      filters,
    };
  } catch (error) {
    throw toServiceError(error);
  }
}
