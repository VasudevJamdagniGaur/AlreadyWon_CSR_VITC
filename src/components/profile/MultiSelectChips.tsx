"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type MultiSelectChipsProps = {
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  className?: string;
};

export function MultiSelectChips({
  options,
  value,
  onChange,
  className,
}: MultiSelectChipsProps) {
  function toggle(option: string) {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const selected = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              selected
                ? "border-cyan-400/40 bg-cyan-400/20 text-cyan-50"
                : "border-input bg-background text-muted-foreground hover:border-navy-300 hover:text-cyan-50"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

type RankedFocusProps = {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
};

/** Select priority focus areas in order (click to add, click again to remove). */
export function RankedFocusSelect({
  options,
  value,
  onChange,
  max = 5,
}: RankedFocusProps) {
  function toggle(option: string) {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
      return;
    }
    if (value.length >= max) return;
    onChange([...value, option]);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const idx = value.indexOf(option);
          const selected = idx >= 0;
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                selected
                  ? "border-cyan-400/40 bg-cyan-400/20 text-cyan-50"
                  : "border-input bg-background text-muted-foreground hover:border-navy-300"
              )}
            >
              {selected && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                  {idx + 1}
                </Badge>
              )}
              {option}
            </button>
          );
        })}
      </div>
      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Priority order: {value.join(" → ")}
        </p>
      )}
    </div>
  );
}
