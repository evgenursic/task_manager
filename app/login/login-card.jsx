"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

/**
 * @param {{ authConfigured: boolean; nextPath: string }} props
 */
export function LoginCard({ authConfigured, nextPath }) {
  const [isPending, setIsPending] = useState(false);

  const handleGitHubSignIn = async () => {
    if (!authConfigured || isPending) {
      return;
    }

    setIsPending(true);
    await signIn("github", { redirectTo: nextPath || "/tasks" });
    setIsPending(false);
  };

  return (
    <article className="bg-card mx-auto w-full max-w-md space-y-4 rounded-xl border p-6 shadow-sm">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in to Taskflow</h1>
        <p className="text-muted-foreground text-sm">
          Continue with GitHub to access your task workspace.
        </p>
      </header>

      <Button
        type="button"
        className="w-full"
        onClick={handleGitHubSignIn}
        disabled={!authConfigured || isPending}
      >
        {isPending ? "Redirecting..." : "Sign in with GitHub"}
      </Button>

      {!authConfigured ? (
        <p className="text-destructive text-sm" role="alert">
          Auth is not configured. Set AUTH_SECRET, AUTH_GITHUB_ID, and AUTH_GITHUB_SECRET.
        </p>
      ) : null}
    </article>
  );
}
