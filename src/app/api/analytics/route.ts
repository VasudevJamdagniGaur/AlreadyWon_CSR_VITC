import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseJsonArray, parseJsonObject } from "@/lib/utils";

export async function GET() {
  try {
    const user = await requireUser();
    if (!user?.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: { companyId: user.companyId },
      include: { budgets: true, milestones: true },
    });
    const ngos = await prisma.nGO.findMany();

    const byCategory: Record<string, number> = {};
    const byGeography: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const scatter: {
      name: string;
      investment: number;
      impact: number;
      beneficiaries: number;
      risk: string;
    }[] = [];

    let successCount = 0;
    let completedCount = 0;
    let scoreSum = 0;
    let scoreCount = 0;
    let delayCount = 0;
    let milestoneCount = 0;
    let varianceSum = 0;
    let varianceCount = 0;

    for (const p of projects) {
      const cat = p.category || "Other";
      const spend = p.spentBudget || p.approvedBudget || p.requestedBudget || 0;
      byCategory[cat] = (byCategory[cat] ?? 0) + spend;
      byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;

      for (const g of parseJsonArray(p.geography)) {
        byGeography[g] = (byGeography[g] ?? 0) + spend;
      }

      if (["COMPLETED", "CLOSED"].includes(p.status)) {
        completedCount++;
        if (p.progress >= 90) successCount++;
      }

      if (p.overallScore) {
        scoreSum += p.overallScore;
        scoreCount++;
      }

      const bens = parseJsonObject(p.beneficiaries, { count: 0, groups: [] as string[] });
      scatter.push({
        name: p.name,
        investment: (p.approvedBudget ?? p.requestedBudget ?? 0) / 100000,
        impact: p.overallScore ?? 0,
        beneficiaries: bens.count ?? 0,
        risk: p.riskLevel,
      });

      for (const m of p.milestones) {
        milestoneCount++;
        if (["DELAYED", "AT_RISK"].includes(m.status)) delayCount++;
      }

      const budget = p.budgets[0];
      if (budget?.variance != null) {
        varianceSum += Math.abs(budget.variance);
        varianceCount++;
      }
    }

    const avgReliability =
      ngos.filter((n) => n.executionReliability != null).reduce((s, n) => s + (n.executionReliability ?? 0), 0) /
      Math.max(1, ngos.filter((n) => n.executionReliability != null).length);

    return NextResponse.json({
      spendByCategory: Object.entries(byCategory).map(([name, value]) => ({ name, value })),
      spendByGeography: Object.entries(byGeography).map(([name, value]) => ({ name, value })),
      projectsByStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
      projectSuccessRate: completedCount > 0 ? (successCount / completedCount) * 100 : 0,
      averageProjectScore: scoreCount > 0 ? scoreSum / scoreCount : 0,
      averageNgoReliability: avgReliability || 0,
      budgetVarianceAvg: varianceCount > 0 ? varianceSum / varianceCount : 0,
      milestoneDelayRate: milestoneCount > 0 ? (delayCount / milestoneCount) * 100 : 0,
      impactVsInvestment: scatter,
      beneficiariesByProject: projects.map((p) => {
        const b = parseJsonObject(p.beneficiaries, { count: 0, groups: [] as string[] });
        return { name: p.name, value: b.count ?? 0 };
      }),
    });
  } catch {
    return NextResponse.json({ error: "Unable to load analytics." }, { status: 500 });
  }
}
