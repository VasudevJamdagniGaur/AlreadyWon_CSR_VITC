"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatScore } from "@/lib/utils";
import { FileText } from "lucide-react";

interface ScoreCardProps {
  title: string;
  score: number;
  weight?: number;
  confidence?: number;
  description?: string;
  evidence?: string[];
  status?: string;
}

export function ScoreCard({
  title,
  score,
  weight,
  confidence,
  description,
  evidence = [],
  status,
}: ScoreCardProps) {
  const contribution = weight != null ? (score * weight) / 100 : undefined;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {status && <Badge variant="secondary">{status}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end gap-2">
          <span className="text-3xl font-semibold tracking-tight text-cyan-50 animate-count-up">
            {formatScore(score)}
          </span>
          <span className="mb-1 text-sm text-muted-foreground">/100</span>
        </div>
        <Progress value={score} className="h-1.5" />
        {weight != null && (
          <p className="text-xs text-muted-foreground">
            Weight {weight}% · Contribution {contribution?.toFixed(1)}
          </p>
        )}
        {confidence != null && (
          <p className="text-xs text-muted-foreground">
            Confidence {(confidence * 100).toFixed(0)}%
          </p>
        )}
        {description && <p className="text-sm text-foreground/80">{description}</p>}
        {evidence.length > 0 && (
          <ul className="space-y-1">
            {evidence.map((e) => (
              <li key={e} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <FileText className="mt-0.5 h-3 w-3 shrink-0" />
                <span>{e}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
