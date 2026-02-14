"use client";

import { useMemo, useState } from "react";
import { CalendarClock, ListFilter, Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageTitle } from "@/components/page-title";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockTasks } from "@/lib/mock-tasks";
import {
  filterTasks,
  formatDateTime,
  isDueSoon,
  isOverdue,
  sortByDueDate,
  sortTasks,
} from "@/lib/task-utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "overdue", label: "Overdue" },
  { value: "done", label: "Done" },
];

const SORT_OPTIONS = [
  { value: "due", label: "Due date" },
  { value: "priority", label: "Priority" },
  { value: "created", label: "Created" },
];

/**
 * @param {string} value
 */
function isFilter(value) {
  return FILTER_OPTIONS.some((option) => option.value === value);
}

/**
 * @param {{ task: import("@/lib/mock-tasks").Task; now: Date }} props
 */
function TaskCard({ task, now }) {
  const overdue = isOverdue(task, now);
  const dueSoon = isDueSoon(task, now);

  return (
    <article
      className={cn(
        "bg-card rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md",
        overdue && "border-red-600/40 ring-1 ring-red-600/20"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{task.title}</h3>
          <p className="text-muted-foreground text-sm">{task.notes}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={task.priority === "High" ? "default" : "secondary"}>
            {task.priority}
          </Badge>
          <Badge variant={task.status === "Done" ? "secondary" : "outline"}>{task.status}</Badge>
          {overdue ? <Badge variant="destructive">Overdue</Badge> : null}
          {!overdue && dueSoon ? <Badge variant="outline">Due soon</Badge> : null}
        </div>
      </div>
      <dl className="text-muted-foreground mt-3 grid gap-1 text-xs sm:grid-cols-3">
        <div>
          <dt className="text-foreground font-medium">Due</dt>
          <dd>{formatDateTime(task.dueAt)}</dd>
        </div>
        <div>
          <dt className="text-foreground font-medium">Created</dt>
          <dd>{formatDateTime(task.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-foreground font-medium">Updated</dt>
          <dd>{formatDateTime(task.updatedAt)}</dd>
        </div>
      </dl>
    </article>
  );
}

export default function TasksPage() {
  const now = useMemo(() => new Date(), []);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("due");
  const [dialogOpen, setDialogOpen] = useState(false);

  const dueSoonTasks = useMemo(
    () => sortByDueDate(mockTasks.filter((task) => isDueSoon(task, now))),
    [now]
  );

  const visibleTasks = useMemo(() => {
    const filtered = filterTasks(mockTasks, filter, now);
    return sortTasks(filtered, sortBy);
  }, [filter, now, sortBy]);

  function openAddTaskDialog() {
    setDialogOpen(true);
  }

  /**
   * @param {import("react").FormEvent<HTMLFormElement>} event
   */
  function handleCreateTask(event) {
    event.preventDefault();
    setDialogOpen(false);
    toast.info("Task creation will be added in Milestone 2 (database + actions).");
  }

  return (
    <section className="space-y-8">
      <PageTitle
        title="Tasks"
        description="Track priorities, spot overdue work, and keep the week under control."
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <ListFilter className="h-4 w-4" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {SORT_OPTIONS.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={sortBy === option.value}
                    onCheckedChange={() => setSortBy(option.value)}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form className="space-y-4" onSubmit={handleCreateTask}>
                  <DialogHeader>
                    <DialogTitle>Create task</DialogTitle>
                    <DialogDescription>
                      Milestone 1 keeps this as UI-only. Save logic comes with Prisma + Server
                      Actions.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <label className="block space-y-1">
                      <span className="text-sm font-medium">Title</span>
                      <Input name="title" placeholder="Prepare sprint planning" required />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-sm font-medium">Due date</span>
                      <Input name="dueAt" type="datetime-local" />
                    </label>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create task</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <section className="space-y-3" aria-labelledby="due-soon-heading">
        <h2 id="due-soon-heading" className="text-lg font-semibold">
          Due soon (next 24h)
        </h2>
        {dueSoonTasks.length === 0 ? (
          <EmptyState
            title="No urgent tasks"
            description="Nothing is due in the next 24 hours. Nice breathing room."
          />
        ) : (
          <div className="space-y-3">
            {dueSoonTasks.map((task) => (
              <TaskCard key={`due-soon-${task.id}`} task={task} now={now} />
            ))}
          </div>
        )}
      </section>

      <Tabs
        value={filter}
        onValueChange={(value) => {
          if (isFilter(value)) {
            setFilter(value);
          }
        }}
      >
        <TabsList aria-label="Task filters">
          {FILTER_OPTIONS.map((option) => (
            <TabsTrigger key={option.value} value={option.value}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {FILTER_OPTIONS.map((option) => (
          <TabsContent key={option.value} value={option.value} className="space-y-3">
            <h2 className="text-lg font-semibold">{option.label}</h2>
            {visibleTasks.length === 0 ? (
              <EmptyState
                title={`No ${option.label.toLowerCase()} tasks`}
                description="Create a task or pick another filter."
                actionLabel="Add task"
                onAction={openAddTaskDialog}
              />
            ) : (
              <div className="space-y-3">
                {visibleTasks.map((task) => (
                  <TaskCard key={`${option.value}-${task.id}`} task={task} now={now} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <CalendarClock className="h-3.5 w-3.5" />
        Keyboard tip: use <kbd className="rounded border px-1 font-mono text-[11px]">Tab</kbd> to
        move across controls and triggers.
      </div>
    </section>
  );
}
