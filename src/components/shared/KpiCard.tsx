import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  demo?: boolean;
  trend?: string;
  className?: string;
}) {
  return (
    <Card className={cn("transition-shadow hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight text-cyan-50">{value}</div>
        <div className="mt-1 flex items-center gap-2">
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && <span className="text-xs text-muted-foreground">{trend}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
