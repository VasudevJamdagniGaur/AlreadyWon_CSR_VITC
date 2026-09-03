"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_WEIGHTS, type ScoringWeights } from "@/lib/validation";
import { formatCurrency } from "@/lib/utils";

export type SettingsClientProps = {
  company: {
    name: string;
    industries: string[];
    csrFocus: string[];
    targetRegions: string[];
    beneficiaryGroups: string[];
    strategicThemes: string[];
    annualBudget: number;
    isDemo: boolean;
  };
  weights: ScoringWeights;
};

export function SettingsClient({ company, weights: initialWeights }: SettingsClientProps) {
  const router = useRouter();
  const [weights, setWeights] = useState(initialWeights);
  const [profile, setProfile] = useState({
    name: company.name,
    annualBudget: String(company.annualBudget),
    industries: company.industries.join(", "),
    csrFocus: company.csrFocus.join(", "),
    targetRegions: company.targetRegions.join(", "),
    beneficiaryGroups: company.beneficiaryGroups.join(", "),
    strategicThemes: company.strategicThemes.join(", "),
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const total = useMemo(
    () =>
      weights.socialImpact +
      weights.executionReliability +
      weights.companyAlignment +
      weights.communityBrandResonance +
      weights.costRiskEfficiency,
    [weights]
  );

  function setWeight(key: keyof ScoringWeights, value: string) {
    const n = Number(value);
    setWeights((w) => ({ ...w, [key]: Number.isFinite(n) ? n : 0 }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    setMessage(null);
    if (Math.abs(total - 100) > 0.01) {
      setError("Scoring weights must total 100%.");
      setSaving(false);
      return;
    }
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          annualBudget: Number(profile.annualBudget),
          industries: profile.industries.split(",").map((s) => s.trim()).filter(Boolean),
          csrFocus: profile.csrFocus.split(",").map((s) => s.trim()).filter(Boolean),
          targetRegions: profile.targetRegions.split(",").map((s) => s.trim()).filter(Boolean),
          beneficiaryGroups: profile.beneficiaryGroups
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          strategicThemes: profile.strategicThemes
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          weights,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to save settings.");
        return;
      }
      setMessage("Settings saved.");
      router.refresh();
    } catch {
      setError("Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell breadcrumbs={[{ label: "Settings" }]}>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Settings</h1>
        {company.isDemo && <Badge variant="demo">DEMO MODE</Badge>}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Company profile</CardTitle>
            <CardDescription>CSR priorities used by KellyOS scoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="name">Company name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Annual CSR budget (₹)</Label>
              <Input
                id="budget"
                type="number"
                value={profile.annualBudget}
                onChange={(e) => setProfile((p) => ({ ...p, annualBudget: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Current display: {formatCurrency(Number(profile.annualBudget) || 0, true)}
              </p>
            </div>
            {(
              [
                ["industries", "Industries"],
                ["csrFocus", "CSR focus"],
                ["targetRegions", "Target regions"],
                ["beneficiaryGroups", "Beneficiary groups"],
                ["strategicThemes", "Strategic themes"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{label} (comma-separated)</Label>
                <Input
                  id={key}
                  value={profile[key]}
                  onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scoring weights</CardTitle>
            <CardDescription>Must total 100%</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(
              [
                ["socialImpact", "Social Impact (I)"],
                ["executionReliability", "Execution Reliability (E)"],
                ["companyAlignment", "Company Alignment (A)"],
                ["communityBrandResonance", "Community & Brand Resonance (B)"],
                ["costRiskEfficiency", "Cost & Risk Efficiency (C)"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  type="number"
                  min={0}
                  max={100}
                  value={weights[key]}
                  onChange={(e) => setWeight(key, e.target.value)}
                />
              </div>
            ))}
            <p
              className={`text-sm font-medium ${
                Math.abs(total - 100) < 0.01 ? "text-success" : "text-destructive"
              }`}
            >
              Total: {total.toFixed(1)}%
            </p>
            <div className="rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
              <p className="mb-1 font-medium text-foreground">KellyOS score formula</p>
              <p>
                S = 0.30(I) + 0.20(E) + 0.20(A) + 0.15(B) + 0.15(C)
              </p>
              <p className="mt-1">
                Default weights: I={DEFAULT_WEIGHTS.socialImpact}, E=
                {DEFAULT_WEIGHTS.executionReliability}, A={DEFAULT_WEIGHTS.companyAlignment}, B=
                {DEFAULT_WEIGHTS.communityBrandResonance}, C=
                {DEFAULT_WEIGHTS.costRiskEfficiency}. Custom weights above replace the
                coefficients when saved.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </Button>
        {message && <span className="text-sm text-success">{message}</span>}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </AppShell>
  );
}
