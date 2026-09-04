"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { SimpleBarChart } from "@/components/shared/Charts";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { RecommendationCard } from "@/components/shared/RecommendationCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatScore, statusLabel } from "@/lib/utils";
import { ScoreBreakdownButton } from "@/components/shared/ScoreBreakdownButton";

export type DashboardClientProps = {
  userName: string;
  greeting: string;
  notificationCount: number;
  byStatus: { name: string; value: number }[];
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
  notifications: {
    id: string;
    title: string;
    message: string;
    type: string;
    createdAt: string;
    isRead: boolean;
  }[];
  availableCsrs: {
    id: string;
    name: string;
    organization: string | null;
    category: string | null;
    subSector: string | null;
    geography: string | null;
    budgetDisplay: string | null;
    status: string;
    beneficiaries: string | null;
    overallScore: number | null;
    socialImpact?: number | null;
    executionReliability?: number | null;
    companyAlignment?: number | null;
    communityBrandResonance?: number | null;
    costRiskEfficiency?: number | null;
    sourceName: string;
    sourceUrl: string | null;
  }[];
};

export function DashboardClient(props: DashboardClientProps) {
  const {
    userName,
    greeting,
    notificationCount,
    byStatus,
    impact,
    riskGroups,
    topRecommendation,
    upcomingMilestones,
    notifications,
    availableCsrs,
  } = props;

  return (
    <AppShell
      breadcrumbs={[{ label: "Dashboard" }]}
      notificationCount={notificationCount}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-cyan-50">
          {greeting}, {userName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Decision intelligence for your CSR portfolio.
        </p>
      </div>

      <div className="mb-6" id="available-csrs">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle>Available CSRs</CardTitle>
              <CardDescription>
                CSR opportunities ready for review
                {availableCsrs.length > 0 ? ` · ${availableCsrs.length} listed` : ""}
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/projects#available-csrs">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {availableCsrs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No CSR opportunities yet. Import or open Projects to browse proposals.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="pb-2 pr-3 font-medium">Project</th>
                      <th className="pb-2 pr-3 font-medium">Organisation</th>
                      <th className="pb-2 pr-3 font-medium">Location</th>
                      <th className="pb-2 pr-3 font-medium">Budget</th>
                      <th className="pb-2 pr-3 font-medium">Score</th>
                      <th className="pb-2 font-medium">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableCsrs.slice(0, 8).map((p) => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="py-3 pr-3">
                          <Link
                            href={`/projects/${p.id}`}
                            className="font-medium hover:underline"
                          >
                            {p.name}
                          </Link>
                          {p.category && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                              {p.category}
                            </p>
                          )}
                        </td>
                        <td className="py-3 pr-3 text-muted-foreground">
                          {p.organization || "—"}
                        </td>
                        <td className="py-3 pr-3 text-muted-foreground">
                          {p.geography || "—"}
                        </td>
                        <td className="py-3 pr-3">{p.budgetDisplay || "—"}</td>
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
                        <td className="py-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium">Source: {p.sourceName}</span>
                            {p.sourceUrl && (
                              <a
                                href={p.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-cyan-300 hover:underline"
                              >
                                Open Original Source ↗
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {availableCsrs.length > 8 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Showing 8 of {availableCsrs.length}.{" "}
                    <Link href="/projects#available-csrs" className="text-cyan-300 hover:underline">
                      See full list
                    </Link>
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Projects by Stage</CardTitle>
            <CardDescription>Lifecycle distribution across the portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={byStatus.map((s) => ({ name: statusLabel(s.name), value: s.value }))}
              xKey="name"
              yKey="value"
            />
          </CardContent>
        </Card>
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Milestones</CardTitle>
            <CardDescription>Next deliverables across active work</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingMilestones.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming milestones.</p>
            ) : (
              <ul className="divide-y">
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

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Recent KellyOS alerts</CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notifications.</p>
            ) : (
              <ul className="divide-y">
                {notifications.map((n) => (
                  <li key={n.id} className="py-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{n.title}</p>
                      {!n.isRead && <Badge variant="info">New</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString("en-IN")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
