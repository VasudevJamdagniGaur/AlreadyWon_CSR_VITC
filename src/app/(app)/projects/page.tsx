import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyPlaceholder } from "@/components/shared/EmptyPlaceholder";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatScore, parseJsonObject, statusLabel } from "@/lib/utils";

export default async function ProjectsPage() {
  const user = await requireUser();
  if (!user?.companyId) redirect("/onboarding");

  const projects = await prisma.project.findMany({
    where: {
      OR: [{ companyId: user.companyId }, { sourceName: "CSRBOX" }, { isCsrOpportunity: true }],
    },
    include: { ngo: true },
    orderBy: [{ overallScore: "desc" }, { name: "asc" }],
  });

  const availableCsrs = projects.filter(
    (p) => p.sourceName === "CSRBOX" || p.isCsrOpportunity === true
  );
  const portfolio = projects.filter(
    (p) => p.companyId === user.companyId && !(p.sourceName === "CSRBOX" || p.isCsrOpportunity)
  );

  return (
    <AppShell breadcrumbs={[{ label: "Projects" }]}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All CSR proposals and funded initiatives in KellyOS.
        </p>
      </div>

      {projects.length === 0 ? (
        <EmptyPlaceholder
          title="No projects yet"
          description="Upload a proposal to score and prioritize your first CSR project."
          actionLabel="Upload proposal"
          actionHref="/prioritization"
        />
      ) : (
        <div className="space-y-6">
          {availableCsrs.length > 0 && (
            <Card id="available-csrs">
              <CardHeader>
                <CardTitle>Available CSRs</CardTitle>
                <CardDescription>
                  CSR opportunities with provenance. {availableCsrs.length} listed.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="pb-2 pr-3 font-medium">Project Name</th>
                      <th className="pb-2 pr-3 font-medium">NGO / Organisation</th>
                      <th className="pb-2 pr-3 font-medium">Sector</th>
                      <th className="pb-2 pr-3 font-medium">Sub-sector</th>
                      <th className="pb-2 pr-3 font-medium">Location</th>
                      <th className="pb-2 pr-3 font-medium">Budget</th>
                      <th className="pb-2 pr-3 font-medium">Status</th>
                      <th className="pb-2 pr-3 font-medium">Beneficiaries</th>
                      <th className="pb-2 pr-3 font-medium">KellyOS score</th>
                      <th className="pb-2 font-medium">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableCsrs.map((p) => {
                      const beneficiaries = parseJsonObject(p.beneficiaries, {
                        estimatedLabel: null as string | null,
                        groups: [] as string[],
                      });
                      let geography: string[] = [];
                      try {
                        geography = JSON.parse(p.geography || "[]");
                        if (!Array.isArray(geography)) geography = [];
                      } catch {
                        geography = [];
                      }
                      const budgetLabel =
                        (p.budgetDisplay as string | null | undefined) ||
                        (p.requestedBudget != null
                          ? formatCurrency(p.requestedBudget, true)
                          : "—");
                      const statusText =
                        (p.sourceProjectStatus as string | null | undefined) ||
                        statusLabel(p.status);
                      const beneficiaryLabel =
                        beneficiaries.estimatedLabel ||
                        (beneficiaries.groups?.length
                          ? beneficiaries.groups.join(", ")
                          : "—");

                      return (
                        <tr key={p.id} className="border-b last:border-0 hover:bg-muted/40">
                          <td className="py-3 pr-3">
                            <Link
                              href={`/projects/${p.id}`}
                              className="font-medium hover:underline"
                            >
                              {p.name}
                            </Link>
                          </td>
                          <td className="py-3 pr-3 text-muted-foreground">
                            {p.organization || p.ngo?.name || "—"}
                          </td>
                          <td className="py-3 pr-3 text-muted-foreground">
                            {(p.developmentSector as string | null) || p.category || "—"}
                          </td>
                          <td className="py-3 pr-3 text-muted-foreground">
                            {(p.subSector as string | null) || "—"}
                          </td>
                          <td className="py-3 pr-3 text-muted-foreground">
                            {geography.length ? geography.join(", ") : "—"}
                          </td>
                          <td className="py-3 pr-3">{budgetLabel}</td>
                          <td className="py-3 pr-3">
                            <Badge variant="secondary">{statusText}</Badge>
                          </td>
                          <td className="py-3 pr-3 text-muted-foreground">{beneficiaryLabel}</td>
                          <td className="py-3 pr-3 font-semibold">
                            {p.overallScore != null ? formatScore(p.overallScore) : "—"}
                          </td>
                          <td className="py-3">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-medium">
                                Source: {p.sourceName || "CSRBOX"}
                              </span>
                              {typeof p.sourceUrl === "string" && p.sourceUrl && (
                                <a
                                  href={p.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-navy-800 hover:underline"
                                >
                                  Open Original Source ↗
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {portfolio.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Portfolio</CardTitle>
                <CardDescription>{portfolio.length} projects</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
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
                    {portfolio.map((p) => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="py-3 pr-3">
                          <Link
                            href={`/projects/${p.id}`}
                            className="font-medium hover:underline"
                          >
                            {p.name}
                          </Link>
                        </td>
                        <td className="py-3 pr-3 text-muted-foreground">
                          {p.category ?? "—"}
                        </td>
                        <td className="py-3 pr-3">
                          <Badge variant="secondary">{statusLabel(p.status)}</Badge>
                        </td>
                        <td className="py-3 pr-3 font-semibold">
                          {p.overallScore != null ? formatScore(p.overallScore) : "—"}
                        </td>
                        <td className="py-3 pr-3">
                          {formatCurrency(p.approvedBudget ?? p.requestedBudget ?? 0, true)}
                        </td>
                        <td className="py-3 pr-3">
                          <RiskBadge level={p.riskLevel} />
                        </td>
                        <td className="py-3">
                          {p.ngo ? (
                            <Link href={`/ngos/${p.ngo.id}`} className="hover:underline">
                              {p.ngo.name}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">
                              {p.organization || "Unassigned"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </AppShell>
  );
}
