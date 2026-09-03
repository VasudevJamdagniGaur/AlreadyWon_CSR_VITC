import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PrioritizationClient } from "@/components/prioritization/PrioritizationClient";

export default async function PrioritizationPage() {
  const user = await requireUser();
  if (!user?.companyId) redirect("/onboarding");

  const projects = await prisma.project.findMany({
    where: { companyId: user.companyId },
    include: { scores: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: [{ overallScore: "desc" }, { name: "asc" }],
  });

  return (
    <PrioritizationClient
      initialProjects={projects.map((p) => {
        const s = p.scores[0];
        return {
          id: p.id,
          name: p.name,
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
        };
      })}
    />
  );
}
