"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatScore, statusLabel } from "@/lib/utils";

export type PrioritizationRow = {
  id: string;
  name: string;
  category: string | null;
  overallScore: number | null;
  recommendationLevel: string | null;
  riskLevel: string;
  requestedBudget: number | null;
  socialImpact: number | null;
  executionReliability: number | null;
  companyAlignment: number | null;
  communityBrandResonance: number | null;
  costRiskEfficiency: number | null;
};

export function PrioritizationClient({
  initialProjects,
}: {
  initialProjects: PrioritizationRow[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [projects, setProjects] = useState(initialProjects);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = projects.find((p) => p.id === selectedId) ?? null;

  async function onUpload(file: File) {
    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/projects/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed.");
        return;
      }
      setMessage(
        `${data.project.name} scored ${formatScore(data.score.overallScore)} via ${data.analysisMode}.`
      );
      router.refresh();
      setProjects((prev) => {
        const score = data.score;
        const row: PrioritizationRow = {
          id: data.project.id,
          name: data.project.name,
          category: data.project.category,
          overallScore: data.project.overallScore,
          recommendationLevel: data.project.recommendationLevel,
          riskLevel: data.project.riskLevel,
          requestedBudget: data.project.requestedBudget,
          socialImpact: score?.dimensions?.socialImpact?.score ?? null,
          executionReliability: score?.dimensions?.executionReliability?.score ?? null,
          companyAlignment: score?.dimensions?.companyAlignment?.score ?? null,
          communityBrandResonance: score?.dimensions?.communityBrandResonance?.score ?? null,
          costRiskEfficiency: score?.dimensions?.costRiskEfficiency?.score ?? null,
        };
        return [row, ...prev.filter((p) => p.id !== row.id)].sort(
          (a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0)
        );
      });
      setSelectedId(data.project.id);
    } catch {
      setError("Unable to upload proposal.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <AppShell breadcrumbs={[{ label: "Prioritization" }]}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
            Project Prioritization
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rank CSR proposals by weighted impact, alignment, and risk efficiency.
          </p>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onUpload(f);
            }}
          />
          <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Analyzing…" : "Upload Proposal"}
          </Button>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ranking</CardTitle>
            <CardDescription>Click a row for dimension detail</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="pb-2 pr-2 font-medium">Rank</th>
                  <th className="pb-2 pr-2 font-medium">Project</th>
                  <th className="pb-2 pr-2 font-medium">Overall</th>
                  <th className="pb-2 pr-2 font-medium">Impact</th>
                  <th className="pb-2 pr-2 font-medium">Exec</th>
                  <th className="pb-2 pr-2 font-medium">Align</th>
                  <th className="pb-2 pr-2 font-medium">Brand</th>
                  <th className="pb-2 pr-2 font-medium">Eff</th>
                  <th className="pb-2 pr-2 font-medium">Budget</th>
                  <th className="pb-2 pr-2 font-medium">Risk</th>
                  <th className="pb-2 font-medium">Rec</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p, i) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={`cursor-pointer border-b transition-colors hover:bg-muted/50 ${
                      selectedId === p.id ? "bg-muted/60" : ""
                    }`}
                  >
                    <td className="py-3 pr-2 font-medium">{i + 1}</td>
                    <td className="py-3 pr-2">
                      <Link
                        href={`/projects/${p.id}`}
                        className="font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {p.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{p.category ?? "—"}</p>
                    </td>
                    <td className="py-3 pr-2 font-semibold">
                      {p.overallScore != null ? formatScore(p.overallScore) : "—"}
                    </td>
                    <td className="py-3 pr-2">
                      {p.socialImpact != null ? formatScore(p.socialImpact) : "—"}
                    </td>
                    <td className="py-3 pr-2">
                      {p.executionReliability != null
                        ? formatScore(p.executionReliability)
                        : "—"}
                    </td>
                    <td className="py-3 pr-2">
                      {p.companyAlignment != null ? formatScore(p.companyAlignment) : "—"}
                    </td>
                    <td className="py-3 pr-2">
                      {p.communityBrandResonance != null
                        ? formatScore(p.communityBrandResonance)
                        : "—"}
                    </td>
                    <td className="py-3 pr-2">
                      {p.costRiskEfficiency != null
                        ? formatScore(p.costRiskEfficiency)
                        : "—"}
                    </td>
                    <td className="py-3 pr-2">
                      {p.requestedBudget != null
                        ? formatCurrency(p.requestedBudget, true)
                        : "—"}
                    </td>
                    <td className="py-3 pr-2">
                      <RiskBadge level={p.riskLevel} />
                    </td>
                    <td className="py-3">
                      <Badge variant="outline">
                        {p.recommendationLevel
                          ? statusLabel(p.recommendationLevel)
                          : "—"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-muted-foreground">
                      No projects yet. Upload a proposal to begin ranking.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detail</CardTitle>
            <CardDescription>
              {selected ? selected.name : "Select a ranked project"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {!selected ? (
              <p className="text-muted-foreground">
                Select a row to inspect dimension scores and open the full project dashboard.
              </p>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Overall</span>
                  <span className="font-semibold">
                    {selected.overallScore != null
                      ? formatScore(selected.overallScore)
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Risk</span>
                  <RiskBadge level={selected.riskLevel} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Budget</span>
                  <span>
                    {selected.requestedBudget != null
                      ? formatCurrency(selected.requestedBudget)
                      : "—"}
                  </span>
                </div>
                <Button asChild className="mt-2 w-full" variant="outline">
                  <Link href={`/projects/${selected.id}`}>Open project</Link>
                </Button>
                <Button asChild className="w-full" variant="secondary">
                  <Link href={`/matching?projectId=${selected.id}`}>Find NGO match</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
