import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AllocationClient } from "@/components/allocation/AllocationClient";

export default async function AllocationPage() {
  const user = await requireUser();
  if (!user?.companyId) redirect("/onboarding");

  const company = await prisma.company.findUnique({ where: { id: user.companyId } });
  if (!company) redirect("/onboarding");

  const recommendations = await prisma.fundingRecommendation.findMany({
    include: { project: true },
    orderBy: { recommendedBudget: "desc" },
  });

  // Prefer latest per project
  const seen = new Set<string>();
  const unique = recommendations.filter((r) => {
    if (seen.has(r.projectId)) return false;
    seen.add(r.projectId);
    return r.project.companyId === user.companyId;
  });

  const allocated = unique.reduce(
    (s, r) => s + (r.isOverride && r.overrideAmount != null ? r.overrideAmount : r.recommendedBudget),
    0
  );

  return (
    <AllocationClient
      totalBudget={company.annualBudget}
      allocated={allocated || company.allocatedBudget}
      remaining={company.annualBudget - (allocated || company.allocatedBudget)}
      rows={unique.map((r) => ({
        id: r.id,
        projectId: r.projectId,
        projectName: r.project.name,
        requestedBudget: r.requestedBudget,
        recommendedBudget:
          r.isOverride && r.overrideAmount != null ? r.overrideAmount : r.recommendedBudget,
        coverage: r.coverage,
        expectedImpact: r.expectedImpact,
        riskLevel: r.riskLevel,
        explanation: r.explanation,
        isOverride: r.isOverride,
        overrideAmount: r.overrideAmount,
        overrideReason: r.overrideReason,
      }))}
    />
  );
}
