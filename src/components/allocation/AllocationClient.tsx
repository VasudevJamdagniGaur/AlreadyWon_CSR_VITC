"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { KpiCard } from "@/components/shared/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatScore } from "@/lib/utils";

export type AllocationRow = {
  id: string;
  projectId: string;
  projectName: string;
  requestedBudget: number;
  recommendedBudget: number;
  coverage: number;
  expectedImpact: number | null;
  riskLevel: string | null;
  explanation: string | null;
  isOverride: boolean;
  overrideAmount: number | null;
  overrideReason: string | null;
};

export function AllocationClient({
  totalBudget,
  allocated,
  remaining,
  rows: initialRows,
}: {
  totalBudget: number;
  allocated: number;
  remaining: number;
  rows: AllocationRow[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const active = rows.find((r) => r.id === activeId) ?? null;

  function openOverride(row: AllocationRow) {
    setActiveId(row.id);
    setAmount(String(row.overrideAmount ?? row.recommendedBudget));
    setReason(row.overrideReason ?? "");
    setError(null);
    setOpen(true);
  }

  function applyOverride() {
    if (!active) return;
    if (reason.trim().length < 5) {
      setError("Override reason is required (min 5 characters).");
      return;
    }
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 0) {
      setError("Enter a valid amount.");
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.id === active.id
          ? {
              ...r,
              isOverride: true,
              overrideAmount: value,
              overrideReason: reason.trim(),
              recommendedBudget: value,
              coverage: r.requestedBudget
                ? Math.min(100, (value / r.requestedBudget) * 100)
                : r.coverage,
            }
          : r
      )
    );
    setOpen(false);
  }

  return (
    <AppShell breadcrumbs={[{ label: "Fund Allocation" }]}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
          Fund Allocation
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Recommended CSR allocations from KellyOS — decision support, not a guarantee.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiCard title="Total CSR Budget" value={formatCurrency(totalBudget, true)} demo />
        <KpiCard title="Recommended / Allocated" value={formatCurrency(allocated, true)} demo />
        <KpiCard title="Remaining" value={formatCurrency(remaining, true)} demo />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recommended allocations</CardTitle>
          <CardDescription>
            From FundingRecommendation · override locally for demo walkthrough
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recommendations yet. Seed data or generate via allocation API.
            </p>
          ) : (
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="pb-2 pr-2 font-medium">Project</th>
                  <th className="pb-2 pr-2 font-medium">Requested</th>
                  <th className="pb-2 pr-2 font-medium">Recommended</th>
                  <th className="pb-2 pr-2 font-medium">Coverage</th>
                  <th className="pb-2 pr-2 font-medium">Impact</th>
                  <th className="pb-2 pr-2 font-medium">Risk</th>
                  <th className="pb-2 pr-2 font-medium">Explanation</th>
                  <th className="pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b align-top last:border-0">
                    <td className="py-3 pr-2">
                      <Link href={`/projects/${r.projectId}`} className="font-medium hover:underline">
                        {r.projectName}
                      </Link>
                      {r.isOverride && (
                        <Badge variant="warning" className="ml-2">
                          Override
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 pr-2">{formatCurrency(r.requestedBudget, true)}</td>
                    <td className="py-3 pr-2 font-semibold">
                      {formatCurrency(r.recommendedBudget, true)}
                    </td>
                    <td className="py-3 pr-2">{r.coverage.toFixed(0)}%</td>
                    <td className="py-3 pr-2">
                      {r.expectedImpact != null ? formatScore(r.expectedImpact) : "—"}
                    </td>
                    <td className="py-3 pr-2">
                      {r.riskLevel ? <RiskBadge level={r.riskLevel} /> : "—"}
                    </td>
                    <td className="max-w-xs py-3 pr-2 text-xs text-muted-foreground">
                      {r.overrideReason || r.explanation || "—"}
                    </td>
                    <td className="py-3">
                      <Button size="sm" variant="outline" onClick={() => openOverride(r)}>
                        Override
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override allocation</DialogTitle>
            <DialogDescription>
              {active?.projectName} — reason required for audit trail
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Override amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why the recommended amount is being changed…"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyOverride}>Save override</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
