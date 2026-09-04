import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { applyDemoAccountScore, getAccountScoreForCsr } from "@/lib/demoAccountScores";
import { ProjectDetailClient } from "@/components/projects/ProjectDetailClient";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  if (!user?.companyId) redirect("/onboarding");

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: {
      id,
      OR: [{ companyId: user.companyId }, { sourceName: "CSRBOX" }, { isCsrOpportunity: true }],
    },
    include: {
      scores: { orderBy: { createdAt: "desc" }, take: 1 },
      evidence: true,
      milestones: { orderBy: { sortOrder: "asc" } },
      budgets: { take: 1 },
      transactions: { orderBy: { date: "desc" }, take: 20 },
      risks: { where: { isActive: true } },
      documents: true,
      ngo: true,
      progressSnapshots: { orderBy: { createdAt: "asc" } },
      recommendations: { where: { isActive: true }, take: 3 },
      impactMetrics: true,
    },
  });

  if (!project) notFound();

  const audit = await prisma.auditLog.findMany({
    where: { entity: "Project", entityId: project.id },
    orderBy: { timestamp: "desc" },
    take: 15,
  });

  const score = project.scores[0] ?? null;
  const budget = project.budgets[0] ?? null;
  const accountDemo = getAccountScoreForCsr(user.email, {
    name: project.name,
    organization: project.organization,
  });
  const demoScored = applyDemoAccountScore(user.email, {
    name: project.name,
    organization: project.organization,
    overallScore: project.overallScore,
    socialImpact: score?.socialImpact ?? null,
    executionReliability: score?.executionReliability ?? null,
    companyAlignment: score?.companyAlignment ?? null,
    communityBrandResonance: score?.communityBrandResonance ?? null,
    costRiskEfficiency: score?.costRiskEfficiency ?? null,
  });

  return (
    <ProjectDetailClient
      project={{
        id: project.id,
        name: project.name,
        organization: project.organization,
        category: project.category,
        description: project.description,
        status: project.status,
        riskLevel: project.riskLevel,
        progress: project.progress,
        expectedProgress: project.expectedProgress,
        overallScore: demoScored.overallScore,
        recommendationLevel: project.recommendationLevel,
        requestedBudget: project.requestedBudget,
        approvedBudget: project.approvedBudget,
        spentBudget: project.spentBudget,
        durationMonths: project.durationMonths,
        geography: project.geography,
        beneficiaries: project.beneficiaries,
        targetOutcomes: project.targetOutcomes,
        isDemo: project.isDemo,
        budgetDisplay: (project.budgetDisplay as string | null) ?? null,
        sourceName: (project.sourceName as string | null) ?? null,
        sourceUrl: (project.sourceUrl as string | null) ?? null,
        sourceProjectStatus: (project.sourceProjectStatus as string | null) ?? null,
        subSector: (project.subSector as string | null) ?? null,
        developmentSector: (project.developmentSector as string | null) ?? null,
        ngo: project.ngo
          ? { id: project.ngo.id, name: project.ngo.name, mission: project.ngo.mission }
          : null,
        score:
          score || accountDemo
            ? {
                overallScore: demoScored.overallScore ?? score?.overallScore ?? 0,
                socialImpact: demoScored.socialImpact ?? score?.socialImpact ?? 0,
                executionReliability:
                  demoScored.executionReliability ?? score?.executionReliability ?? 0,
                companyAlignment:
                  demoScored.companyAlignment ?? score?.companyAlignment ?? 0,
                communityBrandResonance:
                  demoScored.communityBrandResonance ?? score?.communityBrandResonance ?? 0,
                costRiskEfficiency:
                  demoScored.costRiskEfficiency ?? score?.costRiskEfficiency ?? 0,
                socialImpactConfidence: score?.socialImpactConfidence ?? 0.85,
                executionConfidence: score?.executionConfidence ?? 0.85,
                alignmentConfidence: score?.alignmentConfidence ?? 0.85,
                resonanceConfidence: score?.resonanceConfidence ?? 0.85,
                efficiencyConfidence: score?.efficiencyConfidence ?? 0.85,
                overallConfidence: score?.overallConfidence ?? 0.85,
                explanation: score?.explanation ?? null,
                weights: score?.weights ?? null,
              }
            : null,
        milestones: project.milestones.map((m) => ({
          id: m.id,
          name: m.name,
          description: m.description,
          status: m.status,
          dueDate: m.dueDate?.toISOString() ?? null,
          actualProgress: m.actualProgress,
          expectedProgress: m.expectedProgress,
          owner: m.owner,
        })),
        budget: budget
          ? {
              approvedAmount: budget.approvedAmount,
              spentAmount: budget.spentAmount,
              remainingAmount: budget.remainingAmount,
              burnRate: budget.burnRate,
              status: budget.status,
            }
          : null,
        transactions: project.transactions.map((t) => ({
          id: t.id,
          amount: t.amount,
          description: t.description,
          category: t.category,
          date: t.date.toISOString(),
        })),
        risks: project.risks.map((r) => ({
          id: r.id,
          level: r.level,
          title: r.title,
          reason: r.reason,
          recommendedAction: r.recommendedAction,
        })),
        documents: project.documents.map((d) => ({
          id: d.id,
          name: d.name,
          documentType: d.documentType,
          processingStatus: d.processingStatus,
        })),
        evidence: project.evidence.map((e) => ({
          id: e.id,
          dimension: e.dimension,
          claim: e.claim,
          source: e.source,
        })),
        progressSnapshots: project.progressSnapshots.map((s) => ({
          id: s.id,
          monthLabel: s.monthLabel,
          expectedProgress: s.expectedProgress,
          actualProgress: s.actualProgress,
        })),
        impactMetrics: project.impactMetrics.map((m) => ({
          id: m.id,
          name: m.name,
          value: m.value,
          unit: m.unit,
          targetValue: m.targetValue,
        })),
        recommendations: project.recommendations.map((r) => ({
          id: r.id,
          title: r.title,
          type: r.type,
          reason: r.reason,
          score: r.score,
        })),
        audit: audit.map((a) => ({
          id: a.id,
          action: a.action,
          actor: a.actor,
          timestamp: a.timestamp.toISOString(),
          details: a.details,
        })),
      }}
    />
  );
}
