import { cn, statusLabel } from "@/lib/utils";
import { LIFECYCLE_STAGES } from "@/types";
import { Check, Circle } from "lucide-react";

const STAGE_ORDER = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "FUNDED",
  "IN_PROGRESS",
  "MONITORING",
  "COMPLETED",
  "CLOSED",
  "AT_RISK",
];

export function LifecycleTimeline({ status }: { status: string }) {
  const currentIdx = STAGE_ORDER.indexOf(status === "AT_RISK" ? "IN_PROGRESS" : status);

  return (
    <div className="w-full overflow-x-auto">
      <ol className="flex min-w-[640px] items-center gap-0">
        {LIFECYCLE_STAGES.map((stage, i) => {
          const stageIdx = STAGE_ORDER.indexOf(stage.key);
          const done = currentIdx > stageIdx || status === "COMPLETED" || status === "CLOSED";
          const active = STAGE_ORDER[currentIdx] === stage.key || (status === "AT_RISK" && stage.key === "IN_PROGRESS");

          return (
            <li key={stage.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs",
                    done && "border-success bg-success text-white",
                    active && !done && "border-primary bg-primary text-primary-foreground",
                    !done && !active && "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : active ? <Circle className="h-3 w-3 fill-current" /> : i + 1}
                </div>
                <span className={cn("text-[10px] font-medium", active && "text-primary")}>
                  {stage.label}
                </span>
              </div>
              {i < LIFECYCLE_STAGES.length - 1 && (
                <div className={cn("mb-4 h-0.5 flex-1", done ? "bg-success" : "bg-border")} />
              )}
            </li>
          );
        })}
      </ol>
      {status === "AT_RISK" && (
        <p className="mt-2 text-xs text-destructive">Status: {statusLabel(status)}</p>
      )}
    </div>
  );
}
