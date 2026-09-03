import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowRight, CheckCircle2, Info } from "lucide-react";
import Link from "next/link";

interface RecommendationCardProps {
  title: string;
  type: string;
  score?: number;
  confidence?: number;
  reason: string;
  risks?: string[];
  actions?: { label: string; href?: string; onClick?: () => void }[];
}

export function RecommendationCard({
  title,
  type,
  score,
  confidence,
  reason,
  risks = [],
  actions = [],
}: RecommendationCardProps) {
  const icon =
    type.includes("RISK") || type.includes("DELAY") ? (
      <AlertTriangle className="h-4 w-4 text-warning" />
    ) : type.includes("MATCH") || type.includes("PRIORITY") ? (
      <CheckCircle2 className="h-4 w-4 text-success" />
    ) : (
      <Info className="h-4 w-4 text-info" />
    );

  return (
    <Card className="transition-all hover:border-navy-300 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <Badge variant="outline">{type.replace(/_/g, " ")}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-4 text-sm">
          {score != null && (
            <span>
              Score: <strong>{score}</strong>
            </span>
          )}
          {confidence != null && (
            <span className="text-muted-foreground">
              Confidence: {(confidence * 100).toFixed(0)}%
            </span>
          )}
        </div>
        <p className="text-sm text-foreground/80">{reason}</p>
        {risks.length > 0 && (
          <div className="rounded-md bg-amber-50 p-2 text-xs text-amber-900">
            <p className="font-medium">Watch-outs</p>
            <ul className="mt-1 list-disc pl-4">
              {risks.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      {actions.length > 0 && (
        <CardFooter className="gap-2">
          {actions.map((a) =>
            a.href ? (
              <Button key={a.label} asChild size="sm" variant="outline">
                <Link href={a.href}>
                  {a.label}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            ) : (
              <Button key={a.label} size="sm" variant="outline" onClick={a.onClick}>
                {a.label}
              </Button>
            )
          )}
        </CardFooter>
      )}
    </Card>
  );
}
