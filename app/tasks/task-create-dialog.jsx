"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createTaskAction } from "@/app/tasks/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TaskCreateSchema } from "@/lib/tasks/schemas";

const DEFAULT_VALUES = {
  title: "",
  notes: "",
  dueAt: "",
  priority: "MEDIUM",
};

const FIELD_NAMES = new Set(["title", "notes", "dueAt", "priority"]);

export function TaskCreateDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState("");

  const form = useForm({
    resolver: zodResolver(TaskCreateSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onBlur",
  });

  const {
    register,
    reset,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = handleSubmit(async (values) => {
    setServerError("");

    const payload = {
      title: values.title,
      notes: values.notes ?? "",
      dueAt: values.dueAt ? new Date(values.dueAt).toISOString() : "",
      priority: values.priority,
    };

    const result = await createTaskAction(payload);

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

    toast.success("Task created.");
    setOpen(false);
    reset(DEFAULT_VALUES);
    router.refresh();
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setServerError("");
          reset(DEFAULT_VALUES);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2" aria-label="New task">
          <Plus className="h-4 w-4" aria-hidden="true" />
          New task
        </Button>
      </DialogTrigger>

      <DialogContent>
        <form onSubmit={onSubmit} className="space-y-4" aria-busy={isSubmitting}>
          <DialogHeader>
            <DialogTitle>Create task</DialogTitle>
            <DialogDescription>
              Add a clear title first, then optional details like notes, due time, and priority.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="task-title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="task-title"
                placeholder="Prepare Monday planning notes"
                aria-invalid={errors.title ? "true" : "false"}
                aria-label="Task title"
                {...register("title")}
              />
              {errors.title ? (
                <p className="text-sm text-red-600 dark:text-red-300">{errors.title.message}</p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Required. Keep it short and specific.
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="task-notes" className="text-sm font-medium">
                Notes
              </label>
              <textarea
                id="task-notes"
                rows={3}
                aria-label="Task notes"
                placeholder="Optional context, links, or acceptance criteria."
                className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                {...register("notes")}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="task-dueAt" className="text-sm font-medium">
                  Due date and time
                </label>
                <Input
                  id="task-dueAt"
                  type="datetime-local"
                  aria-label="Task due date and time"
                  {...register("dueAt")}
                />
                {errors.dueAt ? (
                  <p className="text-sm text-red-600 dark:text-red-300">{errors.dueAt.message}</p>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Optional. Leave empty for unscheduled.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="task-priority" className="text-sm font-medium">
                  Priority
                </label>
                <select
                  id="task-priority"
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
              aria-label="Cancel creating task"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} aria-label="Create task">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Creating...
                </>
              ) : (
                "Create task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
