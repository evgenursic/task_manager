import { Button } from "@/components/ui/button";

export default function TasksPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground text-sm">
          Milestone 1 will add the full task management UI and interactions.
        </p>
      </div>
      <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Project scaffold is ready</h2>
          <p className="text-muted-foreground text-sm">
            Next.js App Router, Tailwind, shadcn/ui foundation, dark mode, and formatting tooling
            are configured.
          </p>
        </div>
        <div className="mt-4">
          <Button disabled>Add Task (Coming in next milestone)</Button>
        </div>
      </div>
    </section>
  );
}
