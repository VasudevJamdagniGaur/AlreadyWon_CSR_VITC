import { prisma } from "@/lib/db";
import { parseJsonArray, parseJsonObject } from "@/lib/utils";
import type { CompanyProfile } from "@/types";
import { DEFAULT_WEIGHTS, type ScoringWeights } from "@/lib/validation";

export async function getCompanyProfile(companyId: string): Promise<CompanyProfile | null> {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return null;
  return {
    name: company.name,
    industries: parseJsonArray(company.industries),
    csrFocus: parseJsonArray(company.csrFocus),
    targetRegions: parseJsonArray(company.targetRegions),
    beneficiaryGroups: parseJsonArray(company.beneficiaryGroups),
    strategicThemes: parseJsonArray(company.strategicThemes),
    annualBudget: company.annualBudget,
  };
}

export async function getScoringWeights(companyId: string): Promise<ScoringWeights> {
  const setting = await prisma.systemSetting.findUnique({
    where: { companyId_key: { companyId, key: "scoring_weights" } },
  });
  if (!setting) return DEFAULT_WEIGHTS;
  return parseJsonObject(setting.value, DEFAULT_WEIGHTS);
}

export async function getDashboardData(companyId: string) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return null;

  const projects = await prisma.project.findMany({
    where: { companyId },
    include: {
      scores: { orderBy: { createdAt: "desc" }, take: 1 },
      risks: { where: { isActive: true } },
      milestones: { orderBy: { dueDate: "asc" }, take: 5 },
      ngo: true,
      recommendations: { where: { isActive: true }, take: 1 },
    },
    orderBy: { overallScore: "desc" },
  });

  const availableCsrs = await prisma.project.findMany({
    where: {
      OR: [{ sourceName: "CSRBOX" }, { isCsrOpportunity: true }],
    },
    include: {
      scores: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: [{ overallScore: "desc" }, { name: "asc" }],
  });

  const ngos = await prisma.nGO.count();
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const allocated = company.allocatedBudget;
  const remaining = company.annualBudget - allocated;
  const active = projects.filter((p) =>
    ["FUNDED", "IN_PROGRESS", "MONITORING", "AT_RISK"].includes(p.status)
  ).length;
  const atRisk = projects.filter(
    (p) => p.riskLevel === "HIGH" || p.riskLevel === "CRITICAL" || p.status === "AT_RISK"
  ).length;

  const byStatus: Record<string, number> = {};
  for (const p of projects) {
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
  }

  const totalBeneficiaries = projects.reduce((s, p) => {
    const b = parseJsonObject(p.beneficiaries, { count: 0, groups: [] as string[] });
    return s + (b.count ?? 0);
  }, 0);

  const regions = new Set<string>();
  for (const p of projects) {
    for (const g of parseJsonArray(p.geography)) regions.add(g);
  }

  const scores = projects.map((p) => p.overallScore ?? 0).filter((s) => s > 0);
  const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  const topRec = projects[0];
  const topScore = topRec?.scores[0];

  const upcomingMilestones = projects
    .flatMap((p) =>
      p.milestones
        .filter((m) => m.status !== "COMPLETED")
        .map((m) => ({ ...m, projectName: p.name, projectId: p.id }))
    )
    .sort((a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0))
    .slice(0, 6);

  const riskGroups = {
    HIGH: projects.filter((p) => p.riskLevel === "HIGH" || p.riskLevel === "CRITICAL"),
    MEDIUM: projects.filter((p) => p.riskLevel === "MEDIUM"),
    LOW: projects.filter((p) => p.riskLevel === "LOW"),
  };

  return {
    company,
    kpis: {
      annualBudget: company.annualBudget,
      allocated,
      remaining,
      activeProjects: active,
      atRisk,
      ngoPartners: ngos,
    },
    portfolio: [
      { name: "Allocated", value: allocated },
      { name: "Remaining", value: Math.max(0, remaining) },
    ],
    byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
    impact: {
      beneficiaries: totalBeneficiaries,
      regions: regions.size,
      expectedImpactScore: avgScore,
      averageProjectScore: avgScore,
    },
    riskGroups,
    topRecommendation: topRec
      ? {
          project: topRec,
          score: topScore,
        }
      : null,
    upcomingMilestones,
    notifications,
    projects,
    availableCsrs,
  };
}
