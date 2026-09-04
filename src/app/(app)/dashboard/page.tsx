import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/services/dashboard/service";
import { applyDemoAccountScore } from "@/lib/demoAccountScores";
import { getGreeting, parseJsonArray, parseJsonObject } from "@/lib/utils";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const user = await requireUser();
  if (!user) redirect("/login");
  if (!user.companyId) {
    redirect("/onboarding");
  }

  const data = await getDashboardData(user.companyId);
  if (!data) {
    redirect("/onboarding");
  }

  return (
    <DashboardClient
      userName={user.name.split(" ")[0] || user.name}
      greeting={getGreeting()}
      notificationCount={data.notifications.filter((n) => !n.isRead).length}
      availableCsrs={data.availableCsrs
        .map((p) => {
          const beneficiaries = parseJsonObject(p.beneficiaries, {
            estimatedLabel: null as string | null,
            groups: [] as string[],
          });
          const latest = p.scores?.[0];
          const base = {
            id: p.id,
            name: p.name,
            organization: p.organization,
            category: (p.developmentSector as string | null) || p.category,
            subSector: (p.subSector as string | null) ?? null,
            geography: parseJsonArray(p.geography).join(", ") || null,
            budgetDisplay: (p.budgetDisplay as string | null) ?? null,
            status: (p.sourceProjectStatus as string | null) || p.status,
            beneficiaries:
              beneficiaries.estimatedLabel ||
              (beneficiaries.groups?.length ? beneficiaries.groups.join(", ") : null),
            overallScore: p.overallScore,
            socialImpact: latest?.socialImpact ?? null,
            executionReliability: latest?.executionReliability ?? null,
            companyAlignment: latest?.companyAlignment ?? null,
            communityBrandResonance: latest?.communityBrandResonance ?? null,
            costRiskEfficiency: latest?.costRiskEfficiency ?? null,
            sourceName: (p.sourceName as string | null) || "CSRBOX",
            sourceUrl: (p.sourceUrl as string | null) ?? null,
          };
          return applyDemoAccountScore(user.email, base);
        })
        .sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0))}
    />
  );
}
