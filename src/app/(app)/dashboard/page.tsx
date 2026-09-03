import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/services/dashboard/service";
import { getGreeting, parseJsonObject } from "@/lib/utils";
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
      kpis={data.kpis}
      portfolio={data.portfolio}
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
          ? {
              projectId: top.project.id,
              projectName: top.project.name,
              category: top.project.category,
              overallScore: top.project.overallScore,
              recommendationLevel: top.project.recommendationLevel,
              reason,
              score: top.score
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
            }
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
    />
  );
}
