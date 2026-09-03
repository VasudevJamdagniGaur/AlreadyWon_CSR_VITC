import { Button } from "@/components/ui/button";
import { Inbox } from "lucide-react";
import Link from "next/link";

export function EmptyPlaceholder({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center">
      <Inbox className="mb-3 h-10 w-10 text-muted-foreground/60" />
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {actionLabel && actionHref && (
        <Button asChild className="mt-4" size="sm">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
