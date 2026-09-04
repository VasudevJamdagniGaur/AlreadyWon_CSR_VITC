"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { RecommendationCard } from "@/components/shared/RecommendationCard";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { ScoreBreakdownButton } from "@/components/shared/ScoreBreakdownButton";
import { EmptyPlaceholder } from "@/components/shared/EmptyPlaceholder";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatScore, statusLabel } from "@/lib/utils";

export type MyProjectRow = {
  id: string;
  name: string;
  category: string | null;
  status: string;
  overallScore: number | null;
  socialImpact?: number | null;
  executionReliability?: number | null;
  companyAlignment?: number | null;
  communityBrandResonance?: number | null;
  costRiskEfficiency?: number | null;
  requestedBudget: number | null;
  approvedBudget: number | null;
  riskLevel: string;
  organization: string | null;
  ngoName: string | null;
};

export type MyProjectsClientProps = {
  impact: {
    beneficiaries: number;
    regions: number;
    expectedImpactScore: number;
    averageProjectScore: number;
  };
  riskGroups: {
    HIGH: { id: string; name: string; riskLevel: string; status: string }[];
    MEDIUM: { id: string; name: string; riskLevel: string; status: string }[];
    LOW: { id: string; name: string; riskLevel: string; status: string }[];
  };
  topRecommendation: {
    projectId: string;
    projectName: string;
    category: string | null;
    overallScore: number | null;
    recommendationLevel: string | null;
    reason: string;
    score?: {
      overallScore: number;
      socialImpact: number;
      executionReliability: number;
      companyAlignment: number;
      communityBrandResonance: number;
      costRiskEfficiency: number;
      overallConfidence: number;
    } | null;
  } | null;
  upcomingMilestones: {
    id: string;
    name: string;
    projectName: string;
    projectId: string;
    dueDate: string | null;
    status: string;
    actualProgress: number;
  }[];
  projects: MyProjectRow[];
};

export function MyProjectsClient({
  impact,
  riskGroups,
  topRecommendation,
  upcomingMilestones,
  projects,
}: MyProjectsClientProps) {
  return (
    <AppShell breadcrumbs={[{ label: "My Projects" }]}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-cyan-50">My Projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your portfolio recommendations, scores, and active project work.
        </p>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Impact Snapshot</CardTitle>
            <CardDescription>Aggregated expected reach</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Beneficiaries</span>
              <span className="font-semibold">{impact.beneficiaries.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Regions</span>
              <span className="font-semibold">{impact.regions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg project score</span>
              <span className="font-semibold">{formatScore(impact.averageProjectScore)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              Portfolio impact snapshot
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Monitor</CardTitle>
            <CardDescription>Projects by risk band</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(["HIGH", "MEDIUM", "LOW"] as const).map((level) => (
              <div key={level}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <RiskBadge level={level} />
                  <span className="text-muted-foreground">{riskGroups[level].length}</span>
                </div>
                <ul className="space-y-1">
                  {riskGroups[level].slice(0, 2).map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/projects/${p.id}`}
                        className="text-xs text-cyan-300 hover:underline"
                      >
                        {p.name}
                      </Link>
                    </li>
                  ))}
                  {riskGroups[level].length === 0 && (
                    <li className="text-xs text-muted-foreground">None</li>
                  )}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {topRecommendation && (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <RecommendationCard
            title={topRecommendation.projectName}
            type={topRecommendation.recommendationLevel ?? "PRIORITY"}
            score={topRecommendation.overallScore ?? undefined}
            confidence={topRecommendation.score?.overallConfidence}
            reason={topRecommendation.reason}
            actions={[
              { label: "Open project", href: `/projects/${topRecommendation.projectId}` },
              { label: "Prioritize", href: "/prioritization" },
            ]}
          />
          {topRecommendation.score && (
            <Card>
              <CardHeader>
                <CardTitle>Score Breakdown</CardTitle>
                <CardDescription>
                  {topRecommendation.category ?? "Project"} · weighted dimensions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Social Impact", value: topRecommendation.score.socialImpact },
                  {
                    label: "Execution Reliability",
                    value: topRecommendation.score.executionReliability,
                  },
                  { label: "Company Alignment", value: topRecommendation.score.companyAlignment },
                  {
                    label: "Community & Brand",
                    value: topRecommendation.score.communityBrandResonance,
                  },
                  {
                    label: "Cost & Risk Efficiency",
                    value: topRecommendation.score.costRiskEfficiency,
                  },
                ].map((d) => (
                  <div key={d.label}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span>{d.label}</span>
                      <span className="font-medium">{formatScore(d.value)}</span>
                    </div>
                    <Progress value={d.value} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Milestones</CardTitle>
            <CardDescription>Next deliverables across active work</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingMilestones.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming milestones.</p>
            ) : (
              <ul className="divide-y divide-cyan-400/10">
                {upcomingMilestones.map((m) => (
                  <li key={m.id} className="flex items-start justify-between gap-3 py-3">
                    <div>
                      <Link
                        href={`/projects/${m.projectId}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {m.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{m.projectName}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{statusLabel(m.status)}</Badge>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {m.dueDate
                          ? new Date(m.dueDate).toLocaleDateString("en-IN")
                          : "No due date"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {projects.length === 0 ? (
        <EmptyPlaceholder
          title="No portfolio projects yet"
          description="Funded or company-owned initiatives will appear here."
          actionLabel="Browse Available CSRs"
          actionHref="/dashboard#available-csrs"
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio</CardTitle>
            <CardDescription>{projects.length} projects in your company portfolio</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-cyan-400/15 text-xs text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Name</th>
                  <th className="pb-2 pr-3 font-medium">Category</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 pr-3 font-medium">Score</th>
                  <th className="pb-2 pr-3 font-medium">Budget</th>
                  <th className="pb-2 pr-3 font-medium">Risk</th>
                  <th className="pb-2 font-medium">NGO</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-cyan-400/10 last:border-0 hover:bg-cyan-400/5"
                  >
                    <td className="py-3 pr-3">
                      <Link href={`/projects/${p.id}`} className="font-medium hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">{p.category ?? "—"}</td>
                    <td className="py-3 pr-3">
                      <Badge variant="secondary">{statusLabel(p.status)}</Badge>
                    </td>
                    <td className="py-3 pr-3">
                      <ScoreBreakdownButton
                        score={{
                          overallScore: p.overallScore,
                          socialImpact: p.socialImpact,
                          executionReliability: p.executionReliability,
                          companyAlignment: p.companyAlignment,
                          communityBrandResonance: p.communityBrandResonance,
                          costRiskEfficiency: p.costRiskEfficiency,
                        }}
                      />
                    </td>
                    <td className="py-3 pr-3">
                      {formatCurrency(p.approvedBudget ?? p.requestedBudget ?? 0, true)}
                    </td>
                    <td className="py-3 pr-3">
                      <RiskBadge level={p.riskLevel} />
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {p.ngoName || p.organization || "Unassigned"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
