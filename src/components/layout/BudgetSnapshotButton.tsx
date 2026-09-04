"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  FolderKanban,
  IndianRupee,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DonutChart } from "@/components/shared/Charts";
import { formatCurrency } from "@/lib/utils";

type SnapshotData = {
  kpis: {
    annualBudget: number;
    allocated: number;
    remaining: number;
    activeProjects: number;
    atRisk: number;
    ngoPartners: number;
  };
  portfolio: { name: string; value: number }[];
};

export function BudgetSnapshotButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<SnapshotData | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (!next || data) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Unable to load portfolio snapshot.");
        return;
      }
      setData({
        kpis: json.kpis,
        portfolio: json.portfolio ?? [],
      });
    } catch {
      setError("Unable to load portfolio snapshot.");
    } finally {
      setLoading(false);
    }
  }

  const kpis = data?.kpis;

  return (
    <div className="relative" ref={rootRef}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative"
        aria-label="Portfolio snapshot"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={toggle}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-200 ring-1 ring-cyan-400/40">
          <IndianRupee className="h-3.5 w-3.5" aria-hidden />
        </span>
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Portfolio snapshot"
          className="glass-panel-strong absolute right-0 top-full z-50 mt-2 w-[min(92vw,28rem)] rounded-2xl p-4"
        >
          <div className="mb-3 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-200 ring-1 ring-cyan-400/40">
              <IndianRupee className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-cyan-50">Portfolio Snapshot</p>
              <p className="text-xs text-muted-foreground">
                {kpis
                  ? `${formatCurrency(kpis.annualBudget, true)} budget · ${kpis.activeProjects} active projects`
                  : "CSR budget & portfolio overview"}
              </p>
            </div>
          </div>

          {loading && (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          )}
          {error && !loading && (
            <p className="py-6 text-center text-sm text-destructive">{error}</p>
          )}

          {kpis && !loading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Metric
                  label="Total Budget"
                  value={formatCurrency(kpis.annualBudget, true)}
                  icon={IndianRupee}
                />
                <Metric
                  label="Allocated"
                  value={formatCurrency(kpis.allocated, true)}
                  icon={Wallet}
                />
                <Metric
                  label="Remaining"
                  value={formatCurrency(kpis.remaining, true)}
                  icon={Wallet}
                />
                <Metric
                  label="Active Projects"
                  value={String(kpis.activeProjects)}
                  icon={FolderKanban}
                />
                <Metric label="At-Risk" value={String(kpis.atRisk)} icon={AlertTriangle} />
                <Metric
                  label="NGO Partners"
                  value={String(kpis.ngoPartners)}
                  icon={Building2}
                />
              </div>

              {data?.portfolio?.length ? (
                <div>
                  <p className="mb-1 text-xs font-medium text-cyan-50">Budget Allocation</p>
                  <DonutChart data={data.portfolio} height={180} />
                </div>
              ) : null}

              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/allocation" onClick={() => setOpen(false)}>
                  Open Fund Allocation <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof IndianRupee;
}) {
  return (
    <div className="rounded-xl border border-cyan-400/20 bg-[#07141a]/50 p-2.5 backdrop-blur-md">
      <div className="mb-1 flex items-center justify-between gap-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <Icon className="h-3 w-3 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-sm font-semibold text-cyan-50">{value}</p>
    </div>
  );
}
