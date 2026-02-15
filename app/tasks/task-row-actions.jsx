"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { deleteTaskAction } from "@/app/tasks/actions";
import { TaskEditDialog } from "@/app/tasks/task-edit-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * @param {{
 *   task: {
 *     id: string;
 *     title: string;
 *     notes: string | null;
 *     dueAt: string | null;
 *     priority: "LOW" | "MEDIUM" | "HIGH";
 *     status: "OPEN" | "DONE";
 *   };
 * }} props
 */
export function TaskRowActions({ task }) {
  const router = useRouter();
  const triggerRef = useRef(/** @type {HTMLButtonElement | null} */ (null));
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  function focusTriggerButton() {
    requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }

  /**
   * @param {boolean} nextOpen
   */
  function handleEditOpenChange(nextOpen) {
    setEditOpen(nextOpen);
    if (!nextOpen) {
      focusTriggerButton();
    }
  }

  /**
   * @param {boolean} nextOpen
   */
  function handleDeleteOpenChange(nextOpen) {
    setDeleteOpen(nextOpen);
    if (!nextOpen) {
      setDeleteError("");
      focusTriggerButton();
    }
  }

  async function handleDeleteConfirm() {
    setDeleteError("");
    setIsDeleting(true);

    try {
      const result = await deleteTaskAction({ id: task.id });

      if (!result.ok) {
        setDeleteError(result.error.message);
        toast.error(result.error.message);
        return;
      }

      toast.success("Task deleted.");
      setDeleteOpen(false);
      router.refresh();
    } catch {
      const message = "Delete failed. Please try again.";
      setDeleteError(message);
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={triggerRef}
            variant="ghost"
            size="icon"
            aria-label={`Open actions for ${task.title}`}
            className="size-8"
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)} aria-label="Edit">
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setDeleteOpen(true)}
            aria-label="Delete"
            className="text-red-600 dark:text-red-300"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TaskEditDialog
        task={task}
        open={editOpen}
        onOpenChange={handleEditOpenChange}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          focusTriggerButton();
        }}
      />

      <Dialog open={deleteOpen} onOpenChange={handleDeleteOpenChange}>
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            focusTriggerButton();
          }}
        >
          <DialogHeader>
            <DialogTitle>Delete task?</DialogTitle>
            <DialogDescription>
              This will permanently remove <span className="font-medium">{task.title}</span>. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteError ? (
            <p role="alert" className="text-sm text-red-600 dark:text-red-300">
              {deleteError}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              aria-label="Cancel deleting task"
              onClick={() => handleDeleteOpenChange(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              aria-label="Delete task"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Deleting...
                </>
              ) : (
                "Delete task"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
