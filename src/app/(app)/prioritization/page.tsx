import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { applyDemoAccountScore } from "@/lib/demoAccountScores";
import { PrioritizationClient } from "@/components/prioritization/PrioritizationClient";

export default async function PrioritizationPage() {
  const user = await requireUser();
  if (!user?.companyId) redirect("/onboarding");

  const projects = await prisma.project.findMany({
    where: {
      OR: [{ companyId: user.companyId }, { sourceName: "CSRBOX" }, { isCsrOpportunity: true }],
    },
    include: { scores: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: [{ overallScore: "desc" }, { name: "asc" }],
  });

  return (
    <PrioritizationClient
      initialProjects={projects
        .map((p) => {
          const s = p.scores[0];
          return applyDemoAccountScore(user.email, {
            id: p.id,
            name: p.name,
            organization: p.organization,
            category: p.category,
            overallScore: p.overallScore,
            recommendationLevel: p.recommendationLevel,
            riskLevel: p.riskLevel,
            requestedBudget: p.requestedBudget,
            socialImpact: s?.socialImpact ?? null,
            executionReliability: s?.executionReliability ?? null,
            companyAlignment: s?.companyAlignment ?? null,
            communityBrandResonance: s?.communityBrandResonance ?? null,
            costRiskEfficiency: s?.costRiskEfficiency ?? null,
          });
        })
        .sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0))}
    />
  );
}
