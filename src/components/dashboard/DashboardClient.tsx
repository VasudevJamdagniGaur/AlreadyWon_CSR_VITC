"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  FolderKanban,
  IndianRupee,
  Play,
  Users,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { KpiCard } from "@/components/shared/KpiCard";
import { DonutChart, SimpleBarChart } from "@/components/shared/Charts";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { RecommendationCard } from "@/components/shared/RecommendationCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatScore, statusLabel } from "@/lib/utils";

export type DashboardClientProps = {
  userName: string;
  greeting: string;
  notificationCount: number;
  kpis: {
    annualBudget: number;
    allocated: number;
    remaining: number;
    activeProjects: number;
    atRisk: number;
    ngoPartners: number;
  };
  portfolio: { name: string; value: number }[];
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
};

const WALKTHROUGH = [
  "Upload or review proposals on Prioritization",
  "Inspect scores and risks on each project",
  "Run Smart NGO Matching for a shortlist",
  "Review recommended fund allocation",
  "Monitor progress and impact analytics",
];

type DemoStep = { step: number; title: string; href: string; detail: string };

export function DashboardClient(props: DashboardClientProps) {
  const {
    userName,
    greeting,
    notificationCount,
    kpis,
    portfolio,
    byStatus,
    impact,
    riskGroups,
    topRecommendation,
    upcomingMilestones,
    notifications,
  } = props;

  const [demoSteps, setDemoSteps] = useState<DemoStep[] | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

  async function runDemo() {
    setDemoLoading(true);
    try {
      const res = await fetch("/api/demo", { method: "POST" });
      const data = await res.json();
      if (res.ok) setDemoSteps(data.steps ?? []);
    } finally {
      setDemoLoading(false);
    }
  }

  return (
    <AppShell
      breadcrumbs={[{ label: "Dashboard" }]}
      notificationCount={notificationCount}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
            {greeting}, {userName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Decision intelligence for your CSR portfolio.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/prioritization">Open Prioritize</Link>
          </Button>
          <Button onClick={runDemo} disabled={demoLoading}>
            <Play className="h-4 w-4" />
            {demoLoading ? "Loading…" : "Run"}
          </Button>
        </div>
      </div>

      {demoSteps && (
        <Card className="mb-6 border-navy-200 bg-navy-50/40">
          <CardHeader>
            <CardTitle className="text-base">Demo walkthrough</CardTitle>
            <CardDescription>
              STEP 1 Prioritize → STEP 2 Funding → STEP 3 Match NGO → STEP 4 Monitor → STEP 5 Review risk
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-5">
            {demoSteps.map((s) => (
              <Link
                key={s.step}
                href={s.href}
                className="rounded-lg border bg-white p-3 transition hover:border-navy-300 hover:shadow-sm"
              >
                <p className="text-xs font-semibold text-navy-600">STEP {s.step}</p>
                <p className="mt-1 text-sm font-medium">{s.title}</p>
                <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{s.detail}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs text-primary">
                  Open <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard
          title="Total CSR Budget"
          value={formatCurrency(kpis.annualBudget, true)}
          icon={IndianRupee}
        />
        <KpiCard
          title="Allocated"
          value={formatCurrency(kpis.allocated, true)}
          icon={Wallet}
        />
        <KpiCard
          title="Remaining"
          value={formatCurrency(kpis.remaining, true)}
          icon={Wallet}
        />
        <KpiCard
          title="Active Projects"
          value={String(kpis.activeProjects)}
          icon={FolderKanban}
        />
        <KpiCard
          title="At-Risk"
          value={String(kpis.atRisk)}
          icon={AlertTriangle}
        />
        <KpiCard
          title="NGO Partners"
          value={String(kpis.ngoPartners)}
          icon={Building2}
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Budget Allocation</CardTitle>
            <CardDescription>Allocated vs remaining CSR budget</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart data={portfolio} />
          </CardContent>
        </Card>
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

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
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
              Synthetic figures for demo walkthrough
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
                        className="text-xs text-navy-800 hover:underline"
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

        <Card>
          <CardHeader>
            <CardTitle>Demo Walkthrough</CardTitle>
            <CardDescription>Suggested KellyOS path</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {WALKTHROUGH.map((step, i) => (
                <li key={step} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs text-white">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
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
