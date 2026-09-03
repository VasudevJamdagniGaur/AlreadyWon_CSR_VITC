import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, logAudit } from "@/lib/auth";
import { allocateBudget } from "@/services/allocation/allocationEngine";
import { AllocationRequestSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!user?.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = AllocationRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid allocation request." }, { status: 400 });
    }

    const projects = await prisma.project.findMany({
      where: { id: { in: parsed.data.projectIds }, companyId: user.companyId },
    });

    const items = allocateBudget({
      totalBudget: parsed.data.totalBudget,
      minAllocationPct: parsed.data.minAllocationPct,
      maxAllocationPct: parsed.data.maxAllocationPct,
      projects: projects.map((p) => ({
        projectId: p.id,
        projectName: p.name,
        score: p.overallScore ?? 50,
        requestedBudget: p.requestedBudget ?? 0,
        riskLevel: p.riskLevel,
        confidence: 0.75,
      })),
    });

    for (const a of items) {
      await prisma.fundingRecommendation.create({
        data: {
          projectId: a.projectId,
          requestedBudget: a.requested,
          recommendedBudget: a.recommended,
          coverage: a.coverage,
          expectedImpact: a.expectedImpact,
          riskLevel: a.riskLevel,
          explanation: a.explanation,
        },
      });
      await prisma.allocation.create({
        data: {
          projectId: a.projectId,
          totalBudget: parsed.data.totalBudget,
          allocatedAmount: a.recommended,
          coverage: a.coverage,
          efficiencyScore: a.efficiency,
          explanation: a.explanation,
        },
      });
    }

    await logAudit({
      userId: user.id,
      actor: user.name,
      action: "FUNDING_RECOMMENDATION_GENERATED",
      entity: "Allocation",
      details: { count: items.length, totalBudget: parsed.data.totalBudget },
    });

    return NextResponse.json({
      allocations: items,
      label: "Recommended allocation",
      note: "This is a decision-support recommendation, not a correct or optimal allocation guarantee.",
    });
  } catch {
    return NextResponse.json({ error: "Unable to generate allocation." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    if (!user?.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const recommendations = await prisma.fundingRecommendation.findMany({
      include: { project: true },
      orderBy: { recommendedBudget: "desc" },
    });
    return NextResponse.json({ recommendations });
  } catch {
    return NextResponse.json({ error: "Unable to load allocations." }, { status: 500 });
  }
}
