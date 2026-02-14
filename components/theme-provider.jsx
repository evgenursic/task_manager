"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * @param {import("next-themes").ThemeProviderProps} props
 */
export function ThemeProvider(props) {
  return <NextThemesProvider {...props} />;
}
