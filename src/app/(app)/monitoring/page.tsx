import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyPlaceholder } from "@/components/shared/EmptyPlaceholder";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, statusLabel } from "@/lib/utils";

const ACTIVE = ["FUNDED", "IN_PROGRESS", "MONITORING", "AT_RISK"];

export default async function MonitoringPage() {
  const user = await requireUser();
  if (!user?.companyId) redirect("/onboarding");

  const projects = await prisma.project.findMany({
    where: { companyId: user.companyId, status: { in: ACTIVE } },
    include: {
      risks: { where: { isActive: true }, take: 3 },
      budgets: { take: 1 },
      ngo: true,
    },
    orderBy: [{ riskLevel: "desc" }, { name: "asc" }],
  });

  return (
    <AppShell breadcrumbs={[{ label: "Monitoring" }]}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Monitoring</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Active project health — progress, budget burn, and open risks.
        </p>
      </div>

      {projects.length === 0 ? (
        <EmptyPlaceholder
          title="No active projects"
          description="Funded or in-progress initiatives will appear here for monitoring."
          actionLabel="View projects"
          actionHref="/projects"
        />
      ) : (
        <div className="space-y-4">
          {projects.map((p) => {
            const approved = p.approvedBudget ?? p.requestedBudget ?? 0;
            const burn = approved > 0 ? (p.spentBudget / approved) * 100 : 0;
            const budgetStatus = p.budgets[0]?.status ?? "HEALTHY";
            return (
              <Card key={p.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">
                        <Link href={`/projects/${p.id}`} className="hover:underline">
                          {p.name}
                        </Link>
                      </CardTitle>
                      <CardDescription>
                        {p.ngo?.name ?? p.organization ?? "No partner"} ·{" "}
                        {statusLabel(p.status)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <RiskBadge level={p.riskLevel} />
                      <Badge variant="outline">{budgetStatus}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>
                        {Math.round(p.progress)}% / expected {Math.round(p.expectedProgress)}%
                      </span>
                    </div>
                    <Progress value={p.progress} />
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>Budget burn</span>
                      <span>
                        {formatCurrency(p.spentBudget, true)} /{" "}
                        {formatCurrency(approved, true)}
                      </span>
                    </div>
                    <Progress value={Math.min(100, burn)} />
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Open risks</p>
                    {p.risks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">None flagged</p>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {p.risks.map((r) => (
                          <li key={r.id} className="flex items-center gap-2">
                            <RiskBadge level={r.level} />
                            <span className="truncate">{r.title}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
