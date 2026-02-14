// @ts-check

import { z } from "zod";

const PriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);
const StatusEnum = z.enum(["OPEN", "DONE"]);

const TitleSchema = z
  .string({ error: "Title is required." })
  .trim()
  .min(1, "Title cannot be empty.")
  .max(140, "Title must be 140 characters or less.");

const NotesSchema = z
  .string({ error: "Notes must be text." })
  .trim()
  .max(2000, "Notes must be 2000 characters or less.");

const OptionalNullableDateSchema = z.preprocess(
  (value) => {
    if (value === undefined) {
      return undefined;
    }
    if (value === null || value === "") {
      return null;
    }
    return value;
  },
  z.coerce.date({ error: "Invalid due date." }).nullable().optional()
);

const OptionalNullableNotesSchema = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }
  return value;
}, NotesSchema.nullable().optional());

export const TaskCreateSchema = z.object({
  title: TitleSchema,
  notes: OptionalNullableNotesSchema,
  dueAt: OptionalNullableDateSchema,
  priority: PriorityEnum.default("MEDIUM"),
  status: StatusEnum.default("OPEN"),
});

export const TaskUpdateSchema = z
  .object({
    id: z.string({ error: "Task id is required." }).cuid("Invalid task id."),
    title: TitleSchema.optional(),
    notes: OptionalNullableNotesSchema,
    dueAt: OptionalNullableDateSchema,
    priority: PriorityEnum.optional(),
    status: StatusEnum.optional(),
  })
  .superRefine((value, context) => {
    const { id: _, ...changes } = value;
    const hasAnyChange = Object.values(changes).some((item) => item !== undefined);

    if (!hasAnyChange) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide at least one field to update.",
      });
    }
  });

const DateRangeSchema = z
  .object({
    from: z.coerce.date({ error: "Invalid start date." }).optional(),
    to: z.coerce.date({ error: "Invalid end date." }).optional(),
  })
  .optional()
  .superRefine((value, context) => {
    if (!value?.from || !value?.to) {
      return;
    }

    if (value.from.getTime() > value.to.getTime()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "`dateRange.from` cannot be after `dateRange.to`.",
      });
    }
  });

export const TaskFilterSchema = z.object({
  status: StatusEnum.optional(),
  dateRange: DateRangeSchema,
  query: z
    .string({ error: "Query must be text." })
    .trim()
    .min(1, "Query cannot be empty.")
    .max(200, "Query must be 200 characters or less.")
    .optional(),
  sort: z
    .object({
      field: z.enum(["dueAt", "priority", "createdAt", "updatedAt"]).default("dueAt"),
      direction: z.enum(["asc", "desc"]).default("asc"),
    })
    .default({ field: "dueAt", direction: "asc" }),
});

export const TaskIdSchema = z.object({
  id: z.string({ error: "Task id is required." }).cuid("Invalid task id."),
});

export { PriorityEnum, StatusEnum };
