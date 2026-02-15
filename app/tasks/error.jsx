"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * @param {{ error: Error & { digest?: string }; reset: () => void }} props
 */
export default function TasksError({ error, reset }) {
  useEffect(() => {
    console.error("[tasks/error-boundary]", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <section
      className="bg-card mx-auto mt-8 max-w-2xl rounded-lg border p-6 text-center"
      role="alert"
      aria-live="assertive"
    >
      <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-semibold">Tasks are temporarily unavailable</h2>
      <p className="text-muted-foreground mt-2 text-sm">
        We could not load this view right now. Try again, and if the issue persists, refresh the
        page in a moment.
      </p>
      <div className="mt-5">
        <Button onClick={reset} aria-label="Retry loading tasks">
          Try again
        </Button>
      </div>
    </section>
  );
}
