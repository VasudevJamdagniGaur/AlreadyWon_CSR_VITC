import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDashboardData } from "@/services/dashboard/service";
import { applyDemoAccountScore } from "@/lib/demoAccountScores";
import { parseJsonObject } from "@/lib/utils";
import { MyProjectsClient } from "@/components/projects/MyProjectsClient";

export default async function MyProjectsPage() {
  const user = await requireUser();
  if (!user) redirect("/login");
  if (!user.companyId) redirect("/onboarding");

  const data = await getDashboardData(user.companyId);
  if (!data) redirect("/onboarding");

  const top = data.topRecommendation;
  let reason =
    "Highest-scoring proposal in the current KellyOS portfolio based on weighted CSR fit.";
  if (top?.project.recommendations[0]) {
    reason = top.project.recommendations[0].reason;
  } else if (top?.score?.explanation) {
    const expl = parseJsonObject(top.score.explanation, { overall: "" });
    if (expl.overall) reason = String(expl.overall);
  }

  const portfolioRaw = await prisma.project.findMany({
    where: {
      companyId: user.companyId,
      NOT: {
        OR: [{ sourceName: "CSRBOX" }, { isCsrOpportunity: true }],
      },
    },
    include: {
      ngo: true,
      scores: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: [{ overallScore: "desc" }, { name: "asc" }],
  });

  // If portfolio is empty, fall back to company projects including active CSR opportunities owned by company
  const fallback =
    portfolioRaw.length > 0
      ? portfolioRaw
      : await prisma.project.findMany({
          where: { companyId: user.companyId },
          include: {
            ngo: true,
            scores: { orderBy: { createdAt: "desc" }, take: 1 },
          },
          orderBy: [{ overallScore: "desc" }, { name: "asc" }],
        });

  const projects = fallback
    .map((p) => {
      const latest = p.scores[0];
      return applyDemoAccountScore(user.email, {
        id: p.id,
        name: p.name,
        category: p.category,
        status: p.status,
        overallScore: p.overallScore,
        socialImpact: latest?.socialImpact ?? null,
        executionReliability: latest?.executionReliability ?? null,
        companyAlignment: latest?.companyAlignment ?? null,
        communityBrandResonance: latest?.communityBrandResonance ?? null,
        costRiskEfficiency: latest?.costRiskEfficiency ?? null,
        requestedBudget: p.requestedBudget,
        approvedBudget: p.approvedBudget,
        riskLevel: p.riskLevel,
        organization: p.organization,
        ngoName: p.ngo?.name ?? null,
      });
    })
    .sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0));

  const topRecommendation = top
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
    : null;

  return (
    <MyProjectsClient
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
      topRecommendation={topRecommendation}
      upcomingMilestones={data.upcomingMilestones.map((m) => ({
        id: m.id,
        name: m.name,
        projectName: m.projectName,
        projectId: m.projectId,
        dueDate: m.dueDate?.toISOString() ?? null,
        status: m.status,
        actualProgress: m.actualProgress,
      }))}
      projects={projects}
    />
  );
}
