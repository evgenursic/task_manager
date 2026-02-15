"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FILTER_TABS = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "overdue", label: "Overdue" },
  { value: "done", label: "Done" },
];

const SORT_OPTIONS = [
  { value: "due-asc", label: "Due date (asc)" },
  { value: "due-desc", label: "Due date (desc)" },
  { value: "priority", label: "Priority (high to low)" },
  { value: "created", label: "Created (new to old)" },
];

/**
 * @param {EventTarget | null} target
 */
function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select";
}

/**
 * @param {{
 *   tab: "all" | "today" | "week" | "overdue" | "done";
 *   query: string;
 *   sort: "due-asc" | "due-desc" | "priority" | "created";
 * }} props
 */
export function TaskFilterBar({ tab, query, sort }) {
  const router = useRouter();
  const pathname = usePathname();
  const urlParams = useSearchParams();
  const [queryInput, setQueryInput] = useState(query);
  const queryInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  useEffect(() => {
    setQueryInput(query);
  }, [query]);

  useEffect(() => {
    /**
     * @param {KeyboardEvent} event
     */
    function onKeyDown(event) {
      if (event.key !== "/") {
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      event.preventDefault();
      queryInputRef.current?.focus();
      queryInputRef.current?.select();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  /**
   * @param {Record<string, string | null | undefined>} updates
   */
  function updateUrl(updates) {
    const params = new URLSearchParams(urlParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(nextUrl);
  }

  /**
   * @param {string} nextTab
   */
  function handleTabChange(nextTab) {
    updateUrl({ tab: nextTab === "all" ? null : nextTab });
  }

  /**
   * @param {import("react").ChangeEvent<HTMLSelectElement>} event
   */
  function handleSortChange(event) {
    const nextSort = event.target.value;
    updateUrl({ sort: nextSort === "due-asc" ? null : nextSort });
  }

  /**
   * @param {import("react").FormEvent<HTMLFormElement>} event
   */
  function handleSearchSubmit(event) {
    event.preventDefault();
    const nextQuery = queryInput.trim();
    updateUrl({ query: nextQuery || null });
  }

  function handleReset() {
    setQueryInput("");
    router.push(pathname);
  }

  return (
    <section className="bg-card space-y-3 rounded-lg border p-3" aria-label="Task filters">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={tab} onValueChange={handleTabChange} className="gap-0">
          <TabsList aria-label="Task filter tabs">
            {FILTER_TABS.map((option) => (
              <TabsTrigger key={option.value} value={option.value} aria-label={option.label}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <label htmlFor="task-sort" className="text-muted-foreground text-xs font-medium">
            Sort
          </label>
          <select
            id="task-sort"
            aria-label="Sort tasks"
            value={sort}
            onChange={handleSortChange}
            className="border-input bg-background focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2 sm:flex-row" role="search">
        <label htmlFor="task-query" className="sr-only">
          Search tasks
        </label>
        <Input
          ref={queryInputRef}
          id="task-query"
          aria-label="Search tasks"
          value={queryInput}
          onChange={(event) => setQueryInput(event.target.value)}
          placeholder="Search title or notes..."
          className="sm:max-w-md"
        />
        <div className="flex items-center gap-2">
          <Button type="submit" variant="secondary" className="gap-2" aria-label="Search">
            <Search className="h-4 w-4" aria-hidden="true" />
            Search
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="gap-2"
            aria-label="Reset filters"
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset
          </Button>
        </div>
      </form>

      <p className="text-muted-foreground text-xs" aria-label="Keyboard shortcuts hint">
        Press <kbd className="rounded border px-1 font-mono text-[11px]">/</kbd> to search and{" "}
        <kbd className="rounded border px-1 font-mono text-[11px]">N</kbd> to add a task.
      </p>
    </section>
  );
}
