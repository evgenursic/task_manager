import { describe, expect, it, vi } from "vitest";
import { getTaskReminderSummary, listTasks } from "@/lib/tasks/service";

/**
 * @param {Partial<import("@prisma/client").Task>} overrides
 */
function makeTask(overrides = {}) {
  return {
    id: "c123456789012345678901234",
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
      /** @type {any} */ (client)
    );

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      where: {
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
      /** @type {any} */ (client)
    );

    expect(findMany).toHaveBeenCalledWith({
      where: {},
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
        /** @type {any} */ ({ task: { findMany: vi.fn() } })
      )
    ).rejects.toMatchObject({
      name: "TaskServiceError",
      code: "VALIDATION_ERROR",
      status: 400,
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

    const summary = await getTaskReminderSummary({ now }, /** @type {any} */ (client));

    expect(summary).toEqual({
      overdueOpenCount: 2,
      dueTodayOpenCount: 4,
      nextUpcomingDueAt: new Date("2026-02-15T12:00:00.000Z"),
    });
    expect(count).toHaveBeenNthCalledWith(1, {
      where: {
        status: "OPEN",
        dueAt: { lt: now },
      },
    });
    expect(count).toHaveBeenCalledTimes(2);

    const secondCountCall = count.mock.calls[1][0];
    expect(secondCountCall.where.status).toBe("OPEN");
    expect(secondCountCall.where.dueAt.gte).toBeInstanceOf(Date);
    expect(secondCountCall.where.dueAt.lte).toBeInstanceOf(Date);
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        status: "OPEN",
        dueAt: { gte: now },
      },
      orderBy: { dueAt: "asc" },
      select: { dueAt: true },
    });
  });
});
