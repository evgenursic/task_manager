"use client";

import { SessionProvider } from "next-auth/react";

/**
 * @param {{ children: import("react").ReactNode }} props
 */
export function AuthProvider({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
