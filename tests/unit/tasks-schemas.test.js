import { describe, expect, it } from "vitest";
import { TaskCreateSchema, TaskFilterSchema, TaskUpdateSchema } from "@/lib/tasks/schemas";

describe("TaskCreateSchema", () => {
  it("parses valid payload and applies defaults", () => {
    const parsed = TaskCreateSchema.parse({
      title: "  Prepare sprint notes  ",
      notes: "  ",
      dueAt: "",
      priority: "HIGH",
    });

    expect(parsed).toMatchObject({
      title: "Prepare sprint notes",
      notes: null,
      dueAt: null,
      priority: "HIGH",
      status: "OPEN",
    });
  });

  it("rejects empty title", () => {
    expect(() => TaskCreateSchema.parse({ title: "   " })).toThrow("Title cannot be empty.");
  });
});

describe("TaskUpdateSchema", () => {
  it("requires at least one changed field", () => {
    expect(() => TaskUpdateSchema.parse({ id: "c123456789012345678901234" })).toThrow(
      "Provide at least one field to update."
    );
  });
});

describe("TaskFilterSchema", () => {
  it("rejects invalid date range order", () => {
    expect(() =>
      TaskFilterSchema.parse({
        dateRange: {
          from: "2026-02-20T00:00:00.000Z",
          to: "2026-02-10T00:00:00.000Z",
        },
      })
    ).toThrow("`dateRange.from` cannot be after `dateRange.to`.");
  });

  it("trims and keeps valid query text", () => {
    const parsed = TaskFilterSchema.parse({
      query: "  release checklist  ",
    });

    expect(parsed.query).toBe("release checklist");
    expect(parsed.sort).toEqual({ field: "dueAt", direction: "asc" });
  });
});
