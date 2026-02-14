"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { toggleTaskDoneAction } from "@/app/tasks/actions";
import { cn } from "@/lib/utils";

/**
 * @param {{
 *   taskId: string;
 *   title: string;
 *   initialStatus: "OPEN" | "DONE";
 * }} props
 */
export function TaskDoneToggle({ taskId, title, initialStatus }) {
  const router = useRouter();
  const [optimisticStatus, setOptimisticStatus] = useState(initialStatus);
  const [isToggling, setIsToggling] = useState(false);
  const isDone = optimisticStatus === "DONE";

  async function handleToggle() {
    if (isToggling) {
      return;
    }

    const previousStatus = optimisticStatus;
    const nextStatus = previousStatus === "DONE" ? "OPEN" : "DONE";
    setOptimisticStatus(nextStatus);
    setIsToggling(true);

    try {
      const result = await toggleTaskDoneAction({ id: taskId });

      if (!result.ok) {
        setOptimisticStatus(previousStatus);
        toast.error(result.error.message);
        return;
      }

      router.refresh();
    } finally {
      setIsToggling(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isToggling}
      aria-pressed={isDone}
      aria-label={isDone ? `Mark ${title} as open` : `Mark ${title} as done`}
      className={cn(
        "group border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-8 items-center gap-2 rounded-md border px-2 text-xs font-medium transition-all",
        "focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:outline-none",
        isDone && "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        isToggling && "animate-pulse"
      )}
    >
      <span
        className={cn(
          "inline-flex size-4 items-center justify-center rounded-sm border transition-transform duration-200",
          isDone
            ? "scale-100 border-emerald-600 bg-emerald-600 text-white"
            : "border-muted-foreground/40 scale-90 text-transparent group-hover:scale-100"
        )}
      >
        <Check className="h-3 w-3" />
      </span>
      <span>{isDone ? "Done" : "Mark done"}</span>
    </button>
  );
}
