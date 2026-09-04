"use client";

import { useEffect, useRef, useState } from "react";
import { formatScore } from "@/lib/utils";
import { SCORE_DIMENSION_LABELS } from "@/lib/demoAccountScores";

export type ScoreBreakdown = {
  overallScore: number | null;
  socialImpact?: number | null;
  executionReliability?: number | null;
  companyAlignment?: number | null;
  communityBrandResonance?: number | null;
  costRiskEfficiency?: number | null;
};

export function ScoreBreakdownButton({
  score,
  className = "",
}: {
  score: ScoreBreakdown;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (score.overallScore == null) {
    return <span className={className}>—</span>;
  }

  const hasDivision =
    score.socialImpact != null ||
    score.executionReliability != null ||
    score.companyAlignment != null ||
    score.communityBrandResonance != null ||
    score.costRiskEfficiency != null;

  if (!hasDivision) {
    return (
      <span className={`font-semibold ${className}`}>
        {formatScore(score.overallScore)}
      </span>
    );
  }

  return (
    <div ref={rootRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="rounded px-1.5 py-0.5 font-semibold text-navy-900 underline decoration-dotted underline-offset-4 hover:bg-muted/60"
        aria-expanded={open}
        title="View score division"
      >
        {formatScore(score.overallScore)}
      </button>
      {open && (
        <div
          className="absolute left-0 z-30 mt-1 w-64 rounded-lg border bg-white p-3 text-left shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Score division
          </p>
          <ul className="space-y-1.5 text-xs">
            {SCORE_DIMENSION_LABELS.map((d) => {
              const value = score[d.key];
              return (
                <li key={d.key} className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">
                    {d.label}{" "}
                    <span className="text-[10px] text-muted-foreground/80">({d.weight})</span>
                  </span>
                  <span className="font-semibold tabular-nums text-navy-900">
                    {value != null ? formatScore(value) : "—"}
                  </span>
                </li>
              );
            })}
            <li className="mt-1 flex items-center justify-between border-t pt-1.5 font-semibold">
              <span>Final</span>
              <span className="tabular-nums">{formatScore(score.overallScore)}</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
