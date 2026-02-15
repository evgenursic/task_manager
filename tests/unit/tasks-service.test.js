import { describe, expect, it, vi } from "vitest";
import {
  deleteTask,
  getTaskById,
  getTaskReminderSummary,
  listTasks,
  updateTask,
} from "@/lib/tasks/service";

const OWNER_ID = "cowner12345678901234567890";
const OTHER_OWNER_ID = "cowner99999999999999999999";

/**
 * @param {Partial<import("@prisma/client").Task>} overrides
 */
function makeTask(overrides = {}) {
  return {
    id: "c123456789012345678901234",
    ownerId: OWNER_ID,
    title: "Task title",
    notes: null,
    dueAt: null,
    priority: "MEDIUM",
    status: "OPEN",
    createdAt: new Date("2026-02-15T09:00:00.000Z"),
    updatedAt: new Date("2026-02-15T09:00:00.000Z"),
    ...overrides,
  };
}

describe("listTasks", () => {
  it("builds prisma where/orderBy from filters", async () => {
    const from = new Date("2026-02-15T00:00:00.000Z");
    const to = new Date("2026-02-20T23:59:59.999Z");
    const findMany = vi.fn().mockResolvedValue([makeTask()]);
    const client = { task: { findMany } };

    await listTasks(
      {
        status: "OPEN",
        query: "roadmap",
        dateRange: { from, to },
        sort: { field: "dueAt", direction: "asc" },
      },
      OWNER_ID,
      /** @type {any} */ (client)
    );

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        ownerId: OWNER_ID,
        status: "OPEN",
        OR: [{ title: { contains: "roadmap" } }, { notes: { contains: "roadmap" } }],
        dueAt: { gte: from, lte: to },
      },
      orderBy: { dueAt: "asc" },
    });
  });

  it("sorts priority as HIGH -> LOW when requested", async () => {
    const tasks = [
      makeTask({ id: "c111111111111111111111111", priority: "LOW" }),
      makeTask({ id: "c222222222222222222222222", priority: "HIGH" }),
      makeTask({ id: "c333333333333333333333333", priority: "MEDIUM" }),
    ];
    const findMany = vi.fn().mockResolvedValue(tasks);
    const client = { task: { findMany } };

    const result = await listTasks(
      { sort: { field: "priority", direction: "desc" } },
      OWNER_ID,
      /** @type {any} */ (client)
    );

    expect(findMany).toHaveBeenCalledWith({
      where: { ownerId: OWNER_ID },
      orderBy: { createdAt: "desc" },
    });
    expect(result.items.map((task) => task.priority)).toEqual(["HIGH", "MEDIUM", "LOW"]);
  });

  it("returns validation error for invalid filters", async () => {
    await expect(
      listTasks(
        {
          sort: { field: "not-valid-field", direction: "asc" },
        },
        OWNER_ID,
        /** @type {any} */ ({ task: { findMany: vi.fn() } })
      )
    ).rejects.toMatchObject({
      name: "TaskServiceError",
      code: "VALIDATION_ERROR",
      status: 400,
    });
  });

  it("requires owner id for scoped queries", async () => {
    await expect(
      listTasks({}, "", /** @type {any} */ ({ task: { findMany: vi.fn() } }))
    ).rejects.toMatchObject({
      name: "TaskServiceError",
      code: "AUTH_REQUIRED",
      status: 401,
    });
  });
});

describe("getTaskReminderSummary", () => {
  it("returns deterministic reminder counters", async () => {
    const now = new Date("2026-02-15T10:30:00.000Z");
    const count = vi.fn().mockResolvedValueOnce(2).mockResolvedValueOnce(4);
    const findFirst = vi.fn().mockResolvedValue({
      dueAt: new Date("2026-02-15T12:00:00.000Z"),
    });
    const client = { task: { count, findFirst } };

    const summary = await getTaskReminderSummary({ now }, OWNER_ID, /** @type {any} */ (client));

    expect(summary).toEqual({
      overdueOpenCount: 2,
      dueTodayOpenCount: 4,
      nextUpcomingDueAt: new Date("2026-02-15T12:00:00.000Z"),
    });
    expect(count).toHaveBeenNthCalledWith(1, {
      where: {
        ownerId: OWNER_ID,
        status: "OPEN",
        dueAt: { lt: now },
      },
    });
    expect(count).toHaveBeenCalledTimes(2);

    const secondCountCall = count.mock.calls[1][0];
    expect(secondCountCall.where.status).toBe("OPEN");
    expect(secondCountCall.where.ownerId).toBe(OWNER_ID);
    expect(secondCountCall.where.dueAt.gte).toBeInstanceOf(Date);
    expect(secondCountCall.where.dueAt.lte).toBeInstanceOf(Date);
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        ownerId: OWNER_ID,
        status: "OPEN",
        dueAt: { gte: now },
      },
      orderBy: { dueAt: "asc" },
      select: { dueAt: true },
    });
  });
});

describe("task ownership boundaries", () => {
  it("getTaskById returns a task only for matching owner", async () => {
    const findFirst = vi.fn().mockResolvedValue(makeTask());
    const client = { task: { findFirst } };

    const task = await getTaskById({ id: makeTask().id }, OWNER_ID, /** @type {any} */ (client));

    expect(task.id).toBe(makeTask().id);
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: makeTask().id, ownerId: OWNER_ID },
    });
  });

  it("getTaskById hides another owner's task as not found", async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const client = { task: { findFirst } };

    await expect(
      getTaskById({ id: makeTask().id }, OTHER_OWNER_ID, /** @type {any} */ (client))
    ).rejects.toMatchObject({
      name: "TaskServiceError",
      code: "TASK_NOT_FOUND",
      status: 404,
    });
  });

  it("updateTask updates only when owner matches", async () => {
    const findFirst = vi.fn().mockResolvedValue({ id: makeTask().id });
    const update = vi.fn().mockResolvedValue(makeTask({ title: "Updated title" }));
    const client = { task: { findFirst, update } };

    const updated = await updateTask(
      { id: makeTask().id, title: "Updated title" },
      OWNER_ID,
      /** @type {any} */ (client)
    );

    expect(updated.title).toBe("Updated title");
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: makeTask().id, ownerId: OWNER_ID },
      select: { id: true },
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: makeTask().id },
      data: { title: "Updated title" },
    });
  });

  it("updateTask returns TASK_NOT_FOUND for another owner's task", async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const update = vi.fn();
    const client = { task: { findFirst, update } };

    await expect(
      updateTask({ id: makeTask().id, title: "Nope" }, OTHER_OWNER_ID, /** @type {any} */ (client))
    ).rejects.toMatchObject({
      name: "TaskServiceError",
      code: "TASK_NOT_FOUND",
      status: 404,
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("deleteTask deletes only when owner matches", async () => {
    const findFirst = vi.fn().mockResolvedValue(makeTask());
    const del = vi.fn().mockResolvedValue(makeTask());
    const client = { task: { findFirst, delete: del } };

    const deleted = await deleteTask({ id: makeTask().id }, OWNER_ID, /** @type {any} */ (client));

    expect(deleted.id).toBe(makeTask().id);
    expect(del).toHaveBeenCalledWith({ where: { id: makeTask().id } });
  });

  it("deleteTask returns TASK_NOT_FOUND for another owner's task", async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const del = vi.fn();
    const client = { task: { findFirst, delete: del } };

    await expect(
      deleteTask({ id: makeTask().id }, OTHER_OWNER_ID, /** @type {any} */ (client))
    ).rejects.toMatchObject({
      name: "TaskServiceError",
      code: "TASK_NOT_FOUND",
      status: 404,
    });
    expect(del).not.toHaveBeenCalled();
  });
});
