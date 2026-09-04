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

  const top = data.topRecommendation;
  let reason =
    "Highest-scoring proposal in the current KellyOS portfolio based on weighted CSR fit.";
  if (top?.project.recommendations[0]) {
    reason = top.project.recommendations[0].reason;
  } else if (top?.score?.explanation) {
    const expl = parseJsonObject(top.score.explanation, { overall: "" });
    if (expl.overall) reason = String(expl.overall);
  }

  return (
    <DashboardClient
      userName={user.name.split(" ")[0] || user.name}
      greeting={getGreeting()}
      notificationCount={data.notifications.filter((n) => !n.isRead).length}
      byStatus={data.byStatus}
      impact={data.impact}
      riskGroups={{
        HIGH: data.riskGroups.HIGH.map((p) => ({
          id: p.id,
          name: p.name,
          riskLevel: p.riskLevel,
          status: p.status,
        })),
        MEDIUM: data.riskGroups.MEDIUM.map((p) => ({
          id: p.id,
          name: p.name,
          riskLevel: p.riskLevel,
          status: p.status,
        })),
        LOW: data.riskGroups.LOW.map((p) => ({
          id: p.id,
          name: p.name,
          riskLevel: p.riskLevel,
          status: p.status,
        })),
      }}
      topRecommendation={
        top
          ? (() => {
              const demo = applyDemoAccountScore(user.email, {
                name: top.project.name,
                organization: top.project.organization,
                overallScore: top.project.overallScore,
                socialImpact: top.score?.socialImpact ?? null,
                executionReliability: top.score?.executionReliability ?? null,
                companyAlignment: top.score?.companyAlignment ?? null,
                communityBrandResonance: top.score?.communityBrandResonance ?? null,
                costRiskEfficiency: top.score?.costRiskEfficiency ?? null,
              });
              return {
                projectId: top.project.id,
                projectName: top.project.name,
                category: top.project.category,
                overallScore: demo.overallScore,
                recommendationLevel: top.project.recommendationLevel,
                reason,
                score:
                  demo.socialImpact != null
                    ? {
                        overallScore: demo.overallScore ?? 0,
                        socialImpact: demo.socialImpact ?? 0,
                        executionReliability: demo.executionReliability ?? 0,
                        companyAlignment: demo.companyAlignment ?? 0,
                        communityBrandResonance: demo.communityBrandResonance ?? 0,
                        costRiskEfficiency: demo.costRiskEfficiency ?? 0,
                        overallConfidence: top.score?.overallConfidence ?? 0.85,
                      }
                    : top.score
                      ? {
                          overallScore: top.score.overallScore,
                          socialImpact: top.score.socialImpact,
                          executionReliability: top.score.executionReliability,
                          companyAlignment: top.score.companyAlignment,
                          communityBrandResonance: top.score.communityBrandResonance,
                          costRiskEfficiency: top.score.costRiskEfficiency,
                          overallConfidence: top.score.overallConfidence,
                        }
                      : null,
              };
            })()
          : null
      }
      upcomingMilestones={data.upcomingMilestones.map((m) => ({
        id: m.id,
        name: m.name,
        projectName: m.projectName,
        projectId: m.projectId,
        dueDate: m.dueDate?.toISOString() ?? null,
        status: m.status,
        actualProgress: m.actualProgress,
      }))}
      notifications={data.notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        createdAt: n.createdAt.toISOString(),
        isRead: n.isRead,
      }))}
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
