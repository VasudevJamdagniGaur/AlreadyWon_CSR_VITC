import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyPlaceholder } from "@/components/shared/EmptyPlaceholder";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatScore, statusLabel } from "@/lib/utils";

export default async function ProjectsPage() {
  const user = await requireUser();
  if (!user?.companyId) redirect("/onboarding");

  const projects = await prisma.project.findMany({
    where: { companyId: user.companyId },
    include: { ngo: true },
    orderBy: [{ overallScore: "desc" }, { name: "asc" }],
  });

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
        <Card>
          <CardHeader>
            <CardTitle>Portfolio</CardTitle>
            <CardDescription>{projects.length} projects · demo data labeled</CardDescription>
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
                {projects.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="py-3 pr-3">
                      <Link href={`/projects/${p.id}`} className="font-medium hover:underline">
                        {p.name}
                      </Link>
                      {p.isDemo && (
                        <Badge variant="demo" className="ml-2 text-[10px]">
                          DEMO
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">{p.category ?? "—"}</td>
                    <td className="py-3 pr-3">
                      <Badge variant="secondary">{statusLabel(p.status)}</Badge>
                    </td>
                    <td className="py-3 pr-3 font-semibold">
                      {p.overallScore != null ? formatScore(p.overallScore) : "—"}
                    </td>
                    <td className="py-3 pr-3">
                      {formatCurrency(
                        p.approvedBudget ?? p.requestedBudget ?? 0,
                        true
                      )}
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
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
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
