import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const levelVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "destructive",
  CRITICAL: "destructive",
};

export function RiskBadge({ level, className }: { level: string; className?: string }) {
  return (
    <Badge variant={levelVariant[level] ?? "secondary"} className={cn(className)}>
      {level}
    </Badge>
  );
}
