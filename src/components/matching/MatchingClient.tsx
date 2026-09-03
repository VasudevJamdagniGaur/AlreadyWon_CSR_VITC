"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { formatScore, parseJsonObject } from "@/lib/utils";

export type MatchProjectOption = {
  id: string;
  name: string;
  category: string | null;
};

export type MatchRow = {
  id: string;
  projectId: string;
  ngoId: string;
  ngoName: string;
  matchScore: number;
  expertiseMatch: number;
  geographicMatch: number;
  beneficiaryMatch: number;
  executionReliability: number;
  relevantExperience: number;
  riskScore: number;
  confidence: number;
  isSelected: boolean;
  explanation: string | null;
  isDemo: boolean;
};

export function MatchingClient({
  projects,
  initialProjectId,
  initialMatches,
}: {
  projects: MatchProjectOption[];
  initialProjectId: string | null;
  initialMatches: MatchRow[];
}) {
  const router = useRouter();
  const [projectId, setProjectId] = useState(initialProjectId ?? projects[0]?.id ?? "");
  const [matches, setMatches] = useState(initialMatches);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeNgoId, setActiveNgoId] = useState<string | null>(
    initialMatches[0]?.ngoId ?? null
  );

  const filtered = useMemo(
    () => matches.filter((m) => m.projectId === projectId).sort((a, b) => b.matchScore - a.matchScore),
    [matches, projectId]
  );

  const active = filtered.find((m) => m.ngoId === activeNgoId) ?? filtered[0] ?? null;

  const why = useMemo(() => {
    if (!active?.explanation) return { reasons: [] as string[], risks: [] as string[] };
    const parsed = parseJsonObject(active.explanation, {
      reasons: [] as string[],
      risks: [] as string[],
    });
    return {
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons.map(String) : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks.map(String) : [],
    };
  }, [active]);

  async function runMatching(pid: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/matching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: pid }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Matching failed.");
        return;
      }
      // Reload from server for full rows
      router.refresh();
      const mapped: MatchRow[] = (data.matches ?? []).map(
        (m: {
          ngoId: string;
          ngoName: string;
          matchScore: number;
          expertiseMatch: number;
          geographicMatch: number;
          beneficiaryMatch: number;
          executionReliability: number;
          relevantExperience: number;
          riskScore: number;
          confidence: number;
          reasons?: string[];
          risks?: string[];
        }) => ({
          id: `${pid}-${m.ngoId}`,
          projectId: pid,
          ngoId: m.ngoId,
          ngoName: m.ngoName,
          matchScore: m.matchScore,
          expertiseMatch: m.expertiseMatch,
          geographicMatch: m.geographicMatch,
          beneficiaryMatch: m.beneficiaryMatch,
          executionReliability: m.executionReliability,
          relevantExperience: m.relevantExperience,
          riskScore: m.riskScore,
          confidence: m.confidence,
          isSelected: false,
          explanation: JSON.stringify({ reasons: m.reasons ?? [], risks: m.risks ?? [] }),
          isDemo: true,
        })
      );
      setMatches((prev) => [...prev.filter((x) => x.projectId !== pid), ...mapped]);
      setActiveNgoId(mapped[0]?.ngoId ?? null);
    } catch {
      setError("Unable to run matching.");
    } finally {
      setLoading(false);
    }
  }

  async function selectNgo(ngoId: string) {
    if (!projectId) return;
    setSelecting(ngoId);
    setError(null);
    try {
      const res = await fetch("/api/matching/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, ngoId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Selection failed.");
        return;
      }
      setMatches((prev) =>
        prev.map((m) =>
          m.projectId === projectId
            ? { ...m, isSelected: m.ngoId === ngoId }
            : m
        )
      );
    } catch {
      setError("Unable to select NGO.");
    } finally {
      setSelecting(null);
    }
  }

  return (
    <AppShell breadcrumbs={[{ label: "NGO Matching" }]}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
            Smart NGO Matching
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rank implementation partners by expertise, geography, and delivery reliability.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={projectId}
            onValueChange={(v) => {
              setProjectId(v);
              setActiveNgoId(null);
            }}
          >
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => projectId && void runMatching(projectId)}
            disabled={!projectId || loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Matching…" : "Run matching"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ranked matches</CardTitle>
            <CardDescription>Synthetic figures for walkthrough</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No matches yet. Select a project and run matching.
              </p>
            ) : (
              filtered.map((m, i) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveNgoId(m.ngoId)}
                  className={`w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/40 ${
                    active?.ngoId === m.ngoId ? "border-navy-400 bg-muted/50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">#{i + 1}</span>
                        <Link
                          href={`/ngos/${m.ngoId}`}
                          className="font-medium hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {m.ngoName}
                        </Link>
                        {m.isSelected && <Badge variant="success">Selected</Badge>}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Confidence {(m.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{formatScore(m.matchScore)}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        disabled={selecting === m.ngoId || m.isSelected}
                        onClick={(e) => {
                          e.stopPropagation();
                          void selectNgo(m.ngoId);
                        }}
                      >
                        {selecting === m.ngoId
                          ? "Saving…"
                          : m.isSelected
                            ? "Selected"
                            : "Select NGO"}
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {[
                      ["Expertise", m.expertiseMatch],
                      ["Geography", m.geographicMatch],
                      ["Beneficiaries", m.beneficiaryMatch],
                      ["Execution", m.executionReliability],
                      ["Experience", m.relevantExperience],
                      ["Risk fit", m.riskScore],
                    ].map(([label, val]) => (
                      <div key={String(label)}>
                        <div className="mb-0.5 flex justify-between text-[10px] text-muted-foreground">
                          <span>{label}</span>
                          <span>{formatScore(Number(val))}</span>
                        </div>
                        <Progress value={Number(val)} className="h-1" />
                      </div>
                    ))}
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>WHY panel</CardTitle>
            <CardDescription>
              {active ? active.ngoName : "Select a match to explain"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {!active ? (
              <p className="text-muted-foreground">Run matching to see rationale.</p>
            ) : (
              <>
                <div>
                  <p className="mb-1 font-medium">Strengths</p>
                  <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                    {why.reasons.length ? (
                      why.reasons.map((r) => <li key={r}>{r}</li>)
                    ) : (
                      <li>Strong overall fit on available signals.</li>
                    )}
                  </ul>
                </div>
                <div>
                  <p className="mb-1 font-medium">Watch-outs</p>
                  <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                    {why.risks.length ? (
                      why.risks.map((r) => <li key={r}>{r}</li>)
                    ) : (
                      <li>Human due diligence still required before contracting.</li>
                    )}
                  </ul>
                </div>
                <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-900">
                  Decision support only — not a guarantee of partner performance.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
