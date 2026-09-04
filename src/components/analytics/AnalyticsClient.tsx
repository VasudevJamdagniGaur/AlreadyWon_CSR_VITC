"use client";

import dynamic from "next/dynamic";
import { AppShell } from "@/components/layout/AppShell";
import { KpiCard } from "@/components/shared/KpiCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatScore } from "@/lib/utils";

const ChartSkeleton = () => (
  <div className="h-[220px] animate-pulse rounded-xl bg-white/10" aria-hidden />
);

const DonutChart = dynamic(
  () => import("@/components/shared/Charts").then((m) => m.DonutChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const SimpleBarChart = dynamic(
  () => import("@/components/shared/Charts").then((m) => m.SimpleBarChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const ImpactScatterChart = dynamic(
  () => import("@/components/shared/Charts").then((m) => m.ImpactScatterChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

export type AnalyticsClientProps = {
  totalSpend: number;
  projectCount: number;
  successRate: number;
  avgScore: number;
  spendByCategory: { name: string; value: number }[];
  spendByGeography: { name: string; value: number }[];
  scatter: {
    name: string;
    investment: number;
    impact: number;
    beneficiaries: number;
    risk: string;
  }[];
  statusCounts: { name: string; value: number }[];
};

export function AnalyticsClient(props: AnalyticsClientProps) {
  const {
    totalSpend,
    projectCount,
    successRate,
    avgScore,
    spendByCategory,
    spendByGeography,
    scatter,
    statusCounts,
  } = props;

  return (
    <AppShell breadcrumbs={[{ label: "Analytics" }]}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-cyan-50">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Portfolio spend, geography, and impact-vs-investment views from KellyOS.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total spend" value={formatCurrency(totalSpend, true)} />
        <KpiCard title="Projects" value={String(projectCount)} />
        <KpiCard title="Success rate" value={`${successRate.toFixed(0)}%`} />
        <KpiCard title="Avg score" value={formatScore(avgScore)} />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spend by category</CardTitle>
            <CardDescription>Approved / requested budget rollup</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart data={spendByCategory} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Spend by geography</CardTitle>
            <CardDescription>Attributed by project regions</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={spendByGeography} xKey="name" yKey="value" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Impact vs investment</CardTitle>
            <CardDescription>Scatter of score, budget, and beneficiaries</CardDescription>
          </CardHeader>
          <CardContent>
            <ImpactScatterChart data={scatter} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pipeline by status</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={statusCounts}
              xKey="name"
              yKey="value"
              color="#486581"
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
