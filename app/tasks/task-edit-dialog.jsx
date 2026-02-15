"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateTaskAction } from "@/app/tasks/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TaskCreateSchema } from "@/lib/tasks/schemas";

const FIELD_NAMES = new Set(["title", "notes", "dueAt", "priority"]);

/**
 * @param {string | null} isoDate
 */
function toDatetimeLocalValue(isoDate) {
  if (!isoDate) {
    return "";
  }

  const date = new Date(isoDate);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * @param {{
 *   task: {
 *     id: string;
 *     title: string;
 *     notes: string | null;
 *     dueAt: string | null;
 *     priority: "LOW" | "MEDIUM" | "HIGH";
 *   };
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   onCloseAutoFocus?: (event: Event) => void;
 * }} props
 */
export function TaskEditDialog({ task, open, onOpenChange, onCloseAutoFocus }) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const defaultValues = useMemo(
    () => ({
      title: task.title,
      notes: task.notes ?? "",
      dueAt: toDatetimeLocalValue(task.dueAt),
      priority: task.priority,
    }),
    [task.dueAt, task.notes, task.priority, task.title]
  );

  const form = useForm({
    resolver: zodResolver(TaskCreateSchema),
    defaultValues,
    mode: "onBlur",
  });

  const {
    register,
    reset,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [defaultValues, open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError("");

    const payload = {
      id: task.id,
      title: values.title,
      notes: values.notes ?? "",
      dueAt: values.dueAt ? new Date(values.dueAt).toISOString() : "",
      priority: values.priority,
    };

    const result = await updateTaskAction(payload);

    if (!result.ok) {
      let appliedFieldError = false;

      result.error.issues.forEach((issue, index) => {
        if (issue.field && FIELD_NAMES.has(issue.field)) {
          setError(issue.field, { message: issue.message });
          appliedFieldError = true;
        } else if (index === 0) {
          setServerError(issue.message);
        }
      });

      if (!appliedFieldError) {
        setServerError(result.error.message);
      }

      toast.error(result.error.message);
      return;
    }

    toast.success("Task updated.");
    onOpenChange(false);
    reset(defaultValues);
    router.refresh();
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setServerError("");
          reset(defaultValues);
        }
      }}
    >
      <DialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <form onSubmit={onSubmit} className="space-y-4" aria-busy={isSubmitting}>
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
            <DialogDescription>Update details and save your changes.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <label htmlFor={`edit-title-${task.id}`} className="text-sm font-medium">
                Title
              </label>
              <Input
                id={`edit-title-${task.id}`}
                placeholder="Prepare Monday planning notes"
                aria-invalid={errors.title ? "true" : "false"}
                aria-label="Task title"
                {...register("title")}
              />
              {errors.title ? (
                <p className="text-sm text-red-600 dark:text-red-300">{errors.title.message}</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label htmlFor={`edit-notes-${task.id}`} className="text-sm font-medium">
                Notes
              </label>
              <textarea
                id={`edit-notes-${task.id}`}
                rows={3}
                aria-label="Task notes"
                placeholder="Optional context, links, or acceptance criteria."
                className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                {...register("notes")}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor={`edit-dueAt-${task.id}`} className="text-sm font-medium">
                  Due date and time
                </label>
                <Input
                  id={`edit-dueAt-${task.id}`}
                  type="datetime-local"
                  aria-label="Task due date and time"
                  {...register("dueAt")}
                />
                {errors.dueAt ? (
                  <p className="text-sm text-red-600 dark:text-red-300">{errors.dueAt.message}</p>
                ) : null}
              </div>

              <div className="space-y-1">
                <label htmlFor={`edit-priority-${task.id}`} className="text-sm font-medium">
                  Priority
                </label>
                <select
                  id={`edit-priority-${task.id}`}
                  aria-label="Task priority"
                  className="border-input bg-background focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
                  {...register("priority")}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>

            {serverError ? (
              <p role="alert" aria-live="polite" className="text-sm text-red-600 dark:text-red-300">
                {serverError}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              aria-label="Cancel editing task"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} aria-label="Save changes">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
