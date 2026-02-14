import { Button } from "@/components/ui/button";

/**
 * @param {{ title: string; description: string; actionLabel?: string; onAction?: () => void }} props
 */
export function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="bg-card text-card-foreground rounded-lg border border-dashed p-8 text-center">
      <div className="mx-auto max-w-sm space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {actionLabel && onAction ? (
        <div className="mt-4">
          <Button onClick={onAction} variant="outline">
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
