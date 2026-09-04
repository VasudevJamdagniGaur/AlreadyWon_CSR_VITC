"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ScoreBreakdownButton } from "@/components/shared/ScoreBreakdownButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type DashboardClientProps = {
  userName: string;
  greeting: string;
  notificationCount: number;
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
  const { userName, greeting, notificationCount, availableCsrs } = props;

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
    </AppShell>
  );
}
