"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

function getSessionLabel(session) {
  const name = session?.user?.name?.trim();
  if (name) {
    return name;
  }

  const email = session?.user?.email?.trim();
  if (email) {
    return email;
  }

  return "Signed in";
}

export function AuthControls() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <p className="text-muted-foreground hidden text-sm sm:block" aria-live="polite">
        Checking session...
      </p>
    );
  }

  if (!session) {
    return (
      <Button asChild size="sm">
        <Link href="/login">Sign in</Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <p className="text-muted-foreground hidden max-w-40 truncate text-sm sm:block">
        {getSessionLabel(session)}
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => signOut({ redirectTo: "/login" })}
      >
        Sign out
      </Button>
    </div>
  );
}
