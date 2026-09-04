import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocalDemoKellyProjects, isLocalDemoMode } from "@/lib/localDemoStore";
import { parseJsonArray, parseJsonObject, statusLabel } from "@/lib/utils";
import { AnalyticsClient } from "@/components/analytics/AnalyticsClient";

export default async function AnalyticsPage() {
  const user = await requireUser();
  if (!user?.companyId) redirect("/onboarding");

  const projects = isLocalDemoMode()
    ? getLocalDemoKellyProjects(user.companyId)
    : await prisma.project.findMany({
        where: {
          OR: [
            { companyId: user.companyId },
            { sourceName: "CSRBOX" },
            { isCsrOpportunity: true },
          ],
        },
      });

  const byCategory = new Map<string, number>();
  const byGeo = new Map<string, number>();
  const byStatus = new Map<string, number>();

  let totalSpend = 0;
  let scoreSum = 0;
  let scoreCount = 0;
  let completed = 0;

  const scatter = projects.map((p) => {
    const budget = p.approvedBudget ?? p.requestedBudget ?? 0;
    totalSpend += p.spentBudget || budget * ((p.progress ?? 0) / 100);
    if (p.overallScore != null) {
      scoreSum += p.overallScore;
      scoreCount += 1;
    }
    if (p.status === "COMPLETED" || p.status === "CLOSED") completed += 1;

    const cat = p.category || "Other";
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + (budget || 0));

    const geos = parseJsonArray(p.geography);
    for (const g of geos) {
      byGeo.set(g, (byGeo.get(g) ?? 0) + (budget || 0) / Math.max(1, geos.length));
    }

    byStatus.set(p.status, (byStatus.get(p.status) ?? 0) + 1);

    const beneficiaries = parseJsonObject(p.beneficiaries, {
      count: 0,
      groups: [] as string[],
    });

    return {
      name: p.name,
      investment: budget || 0,
      impact: p.overallScore ?? 0,
      beneficiaries: beneficiaries.count ?? 0,
      risk: p.riskLevel,
    };
  });

  return (
    <AnalyticsClient
      totalSpend={Math.round(totalSpend)}
      projectCount={projects.length}
      successRate={projects.length ? (completed / projects.length) * 100 : 0}
      avgScore={scoreCount ? scoreSum / scoreCount : 0}
      spendByCategory={Array.from(byCategory.entries()).map(([name, value]) => ({
        name,
        value: Math.round(value),
      }))}
      spendByGeography={Array.from(byGeo.entries()).map(([name, value]) => ({
        name,
        value: Math.round(value),
      }))}
      scatter={scatter}
      statusCounts={Array.from(byStatus.entries()).map(([name, value]) => ({
        name: statusLabel(name),
        value,
      }))}
    />
  );
}
