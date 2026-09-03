"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Loader2, Search, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { LifecycleTimeline } from "@/components/shared/LifecycleTimeline";
import { ScoreCard } from "@/components/shared/ScoreCard";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { KpiCard } from "@/components/shared/KpiCard";
import { SimpleLineChart } from "@/components/shared/Charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatCurrency,
  formatScore,
  parseJsonArray,
  parseJsonObject,
  statusLabel,
} from "@/lib/utils";
import { DEFAULT_WEIGHTS } from "@/lib/validation";

export type ProjectDetailData = {
  id: string;
  name: string;
  organization: string | null;
  category: string | null;
  description: string | null;
  status: string;
  riskLevel: string;
  progress: number;
  expectedProgress: number;
  overallScore: number | null;
  recommendationLevel: string | null;
  requestedBudget: number | null;
  approvedBudget: number | null;
  spentBudget: number;
  durationMonths: number | null;
  geography: string | null;
  beneficiaries: string | null;
  targetOutcomes: string | null;
  isDemo: boolean;
  budgetDisplay?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  sourceProjectStatus?: string | null;
  subSector?: string | null;
  developmentSector?: string | null;
  ngo: { id: string; name: string; mission: string | null } | null;
  score: {
    overallScore: number;
    socialImpact: number;
    executionReliability: number;
    companyAlignment: number;
    communityBrandResonance: number;
    costRiskEfficiency: number;
    socialImpactConfidence: number;
    executionConfidence: number;
    alignmentConfidence: number;
    resonanceConfidence: number;
    efficiencyConfidence: number;
    overallConfidence: number;
    explanation: string | null;
    weights: string | null;
  } | null;
  milestones: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    dueDate: string | null;
    actualProgress: number;
    expectedProgress: number;
    owner: string | null;
  }[];
  budget: {
    approvedAmount: number;
    spentAmount: number;
    remainingAmount: number;
    burnRate: number | null;
    status: string;
  } | null;
  transactions: {
    id: string;
    amount: number;
    description: string | null;
    category: string | null;
    date: string;
  }[];
  risks: {
    id: string;
    level: string;
    title: string;
    reason: string;
    recommendedAction: string | null;
  }[];
  documents: {
    id: string;
    name: string;
    documentType: string;
    processingStatus: string;
  }[];
  evidence: { id: string; dimension: string; claim: string; source: string | null }[];
  progressSnapshots: {
    id: string;
    monthLabel: string;
    expectedProgress: number;
    actualProgress: number;
  }[];
  impactMetrics: {
    id: string;
    name: string;
    value: number;
    unit: string | null;
    targetValue: number | null;
  }[];
  recommendations: {
    id: string;
    title: string;
    type: string;
    reason: string;
    score: number | null;
  }[];
  audit: { id: string; action: string; actor: string; timestamp: string; details: string | null }[];
};

export function ProjectDetailClient({ project }: { project: ProjectDetailData }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const beneficiaries = parseJsonObject(project.beneficiaries, {
    count: 0,
    groups: [] as string[],
  });
  const geography = parseJsonArray(project.geography);
  const outcomes = parseJsonArray(project.targetOutcomes);
  const weights = parseJsonObject(project.score?.weights, DEFAULT_WEIGHTS);
  const explanation = parseJsonObject(project.score?.explanation, {
    overall: "",
    dimensions: {} as Record<string, { explanation?: string; evidence?: string[] }>,
  });

  async function generateSummary() {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/summary`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setSummaryError(data.error || "Failed to generate summary.");
        return;
      }
      setSummary(data.summary);
    } catch {
      setSummaryError("Unable to generate summary.");
    } finally {
      setSummaryLoading(false);
    }
  }

  const dimEvidence = (dim: string) =>
    project.evidence.filter((e) => e.dimension === dim).map((e) => e.claim);

  return (
    <AppShell
      breadcrumbs={[
        { label: "Projects", href: "/projects" },
        { label: project.name },
      ]}
    >
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
              {project.name}
            </h1>
            <Badge variant="secondary">{statusLabel(project.status)}</Badge>
            <RiskBadge level={project.riskLevel} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {project.developmentSector || project.category || "CSR Project"}
            {project.organization ? ` · ${project.organization}` : ""}
          </p>
          {(project.sourceName || project.sourceUrl) && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="font-medium text-navy-900">
                Source: {project.sourceName || "CSRBOX"}
              </span>
              {project.sourceUrl && (
                <a
                  href={project.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-navy-800 underline-offset-4 hover:underline"
                >
                  Open Original Source ↗
                </a>
              )}
            </div>
          )}
          {project.subSector && (
            <p className="mt-1 text-xs text-muted-foreground">Sub-sector: {project.subSector}</p>
          )}
          {project.budgetDisplay && (
            <p className="mt-1 text-xs text-muted-foreground">Budget: {project.budgetDisplay}</p>
          )}
          {project.sourceProjectStatus && (
            <p className="mt-1 text-xs text-muted-foreground">
              Source status: {project.sourceProjectStatus}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/matching?projectId=${project.id}`}>
              <Search className="h-4 w-4" />
              Find NGO
            </Link>
          </Button>
          <Button onClick={() => void generateSummary()} disabled={summaryLoading}>
            {summaryLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate Summary
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <LifecycleTimeline status={project.status} />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Overall Score"
          value={project.overallScore != null ? formatScore(project.overallScore) : "—"}
        />
        <KpiCard
          title="Budget"
          value={formatCurrency(
            project.approvedBudget ?? project.requestedBudget ?? 0,
            true
          )}
          subtitle={`Spent ${formatCurrency(project.spentBudget, true)}`}
        />
        <KpiCard
          title="Progress"
          value={`${Math.round(project.progress)}%`}
          subtitle={`Expected ${Math.round(project.expectedProgress)}%`}
        />
        <KpiCard
          title="Beneficiaries"
          value={String(beneficiaries.count ?? 0)}
          subtitle={geography.join(", ") || "Geography TBD"}
        />
      </div>

      {(summary || summaryError) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>AI Summary</CardTitle>
            <CardDescription>Human review required before external use</CardDescription>
          </CardHeader>
          <CardContent>
            {summaryError ? (
              <p className="text-sm text-destructive">{summaryError}</p>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{summary}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview">
        <TabsList className="mb-2 flex h-auto flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="partner">Partner</TabsTrigger>
          <TabsTrigger value="activity">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Project brief</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>{project.description || "No description available."}</p>
                <div>
                  <p className="font-medium">Target outcomes</p>
                  <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                    {outcomes.length ? (
                      outcomes.map((o) => <li key={o}>{o}</li>)
                    ) : (
                      <li>Not specified</li>
                    )}
                  </ul>
                </div>
                <div>
                  <p className="font-medium">Beneficiary groups</p>
                  <p className="text-muted-foreground">
                    {(beneficiaries.groups as string[])?.join(", ") || "—"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Explain recommendation</CardTitle>
                <CardDescription>
                  {project.recommendationLevel
                    ? statusLabel(project.recommendationLevel)
                    : "Scored proposal"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  {explanation.overall ||
                    project.recommendations[0]?.reason ||
                    "Weighted scoring across impact, reliability, alignment, brand resonance, and efficiency."}
                </p>
                {project.score && (
                  <p className="text-xs text-muted-foreground">
                    Confidence {(project.score.overallConfidence * 100).toFixed(0)}% · decision
                    support only
                  </p>
                )}
                {project.impactMetrics.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {project.impactMetrics.map((m) => (
                      <div key={m.id} className="rounded-md border p-2">
                        <p className="text-xs text-muted-foreground">{m.name}</p>
                        <p className="font-semibold">
                          {m.value}
                          {m.unit ? ` ${m.unit}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {project.score && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <ScoreCard
                title="Social Impact"
                score={project.score.socialImpact}
                weight={weights.socialImpact}
                confidence={project.score.socialImpactConfidence}
                evidence={dimEvidence("socialImpact")}
              />
              <ScoreCard
                title="Execution Reliability"
                score={project.score.executionReliability}
                weight={weights.executionReliability}
                confidence={project.score.executionConfidence}
                evidence={dimEvidence("executionReliability")}
              />
              <ScoreCard
                title="Company Alignment"
                score={project.score.companyAlignment}
                weight={weights.companyAlignment}
                confidence={project.score.alignmentConfidence}
                evidence={dimEvidence("companyAlignment")}
              />
              <ScoreCard
                title="Community & Brand Resonance"
                score={project.score.communityBrandResonance}
                weight={weights.communityBrandResonance}
                confidence={project.score.resonanceConfidence}
                evidence={dimEvidence("communityBrandResonance")}
              />
              <ScoreCard
                title="Cost & Risk Efficiency"
                score={project.score.costRiskEfficiency}
                weight={weights.costRiskEfficiency}
                confidence={project.score.efficiencyConfidence}
                evidence={dimEvidence("costRiskEfficiency")}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="budget">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Budget health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Approved</span>
                  <span className="font-medium">
                    {formatCurrency(
                      project.budget?.approvedAmount ??
                        project.approvedBudget ??
                        project.requestedBudget ??
                        0
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Spent</span>
                  <span>
                    {formatCurrency(project.budget?.spentAmount ?? project.spentBudget)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining</span>
                  <span>
                    {formatCurrency(
                      project.budget?.remainingAmount ??
                        (project.approvedBudget ?? project.requestedBudget ?? 0) -
                          project.spentBudget
                    )}
                  </span>
                </div>
                {project.budget && (
                  <Badge variant="outline">{project.budget.status}</Badge>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {project.transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No transactions recorded.</p>
                ) : (
                  <ul className="divide-y text-sm">
                    {project.transactions.map((t) => (
                      <li key={t.id} className="flex justify-between gap-3 py-2">
                        <div>
                          <p>{t.description || t.category || "Expense"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(t.date).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                        <span className="font-medium">{formatCurrency(t.amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="milestones">
          <Card>
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.milestones.length === 0 ? (
                <p className="text-sm text-muted-foreground">No milestones defined.</p>
              ) : (
                project.milestones.map((m) => (
                  <div key={m.id} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{m.name}</p>
                      <Badge variant="outline">{statusLabel(m.status)}</Badge>
                    </div>
                    {m.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
                    )}
                    <div className="mt-2">
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>Actual {Math.round(m.actualProgress)}%</span>
                        <span>Expected {Math.round(m.expectedProgress)}%</span>
                      </div>
                      <Progress value={m.actualProgress} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Progress vs plan</CardTitle>
            </CardHeader>
            <CardContent>
              {project.progressSnapshots.length === 0 ? (
                <div className="space-y-2">
                  <Progress value={project.progress} />
                  <p className="text-sm text-muted-foreground">
                    Current {Math.round(project.progress)}% · Expected{" "}
                    {Math.round(project.expectedProgress)}%
                  </p>
                </div>
              ) : (
                <SimpleLineChart
                  data={project.progressSnapshots.map((s) => ({
                    name: s.monthLabel,
                    expected: s.expectedProgress,
                    actual: s.actualProgress,
                  }))}
                  lines={[
                    { key: "expected", color: "#829ab1", name: "Expected" },
                    { key: "actual", color: "#243b53", name: "Actual" },
                  ]}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks">
          <div className="space-y-3">
            {project.risks.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  No active risks flagged.
                </CardContent>
              </Card>
            ) : (
              project.risks.map((r) => (
                <Card key={r.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">{r.title}</CardTitle>
                      <RiskBadge level={r.level} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>{r.reason}</p>
                    {r.recommendedAction && (
                      <p className="text-muted-foreground">
                        Recommended: {r.recommendedAction}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {project.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents attached.</p>
              ) : (
                <ul className="space-y-2">
                  {project.documents.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{d.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{statusLabel(d.documentType)}</Badge>
                        <Badge variant="secondary">{statusLabel(d.processingStatus)}</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partner">
          <Card>
            <CardHeader>
              <CardTitle>Implementation partner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {project.ngo ? (
                <>
                  <Link
                    href={`/ngos/${project.ngo.id}`}
                    className="text-base font-medium hover:underline"
                  >
                    {project.ngo.name}
                  </Link>
                  <p className="text-muted-foreground">
                    {project.ngo.mission || "No mission text on file."}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">No NGO assigned yet.</p>
                  <Button asChild>
                    <Link href={`/matching?projectId=${project.id}`}>Find NGO</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>Recent audit events for this project</CardDescription>
            </CardHeader>
            <CardContent>
              {project.audit.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity logged.</p>
              ) : (
                <ul className="divide-y text-sm">
                  {project.audit.map((a) => (
                    <li key={a.id} className="py-3">
                      <div className="flex justify-between gap-2">
                        <p className="font-medium">{statusLabel(a.action)}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(a.timestamp).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">by {a.actor}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
