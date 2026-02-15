// @ts-check

import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { AuthControls } from "@/components/auth-controls";
import { AuthProvider } from "@/components/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** @type {import("next").Metadata} */
export const metadata = {
  title: "Taskflow",
  description: "Taskflow task manager scaffold with Next.js and shadcn/ui",
};

/**
 * @param {{ children: import("react").ReactNode }} props
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <header className="bg-background/95 supports-[backdrop-filter]:bg-background/70 border-b backdrop-blur">
                <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
                  <div className="flex items-center gap-6">
                    <Link href="/tasks" className="text-base font-semibold tracking-tight">
                      Taskflow
                    </Link>
                    <nav aria-label="Primary">
                      <Link
                        href="/tasks"
                        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded-sm text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                      >
                        Tasks
                      </Link>
                    </nav>
                  </div>
                  <div className="flex items-center gap-2">
                    <AuthControls />
                    <ThemeToggle />
                  </div>
                </div>
              </header>
              <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
                {children}
              </main>
            </div>
            <Toaster position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
