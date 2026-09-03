import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, logAudit } from "@/lib/auth";
import { parseJsonArray, parseJsonObject, toJson } from "@/lib/utils";
import { matchNGOsToProject } from "@/services/matching/ngoMatching";
import { allocateBudget } from "@/services/allocation/allocationEngine";
import { AllocationRequestSchema } from "@/lib/validation";
import { analyzeProjectRisks, highestRiskLevel } from "@/services/risk/riskEngine";
import { getAIProvider } from "@/services/ai";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        scores: { orderBy: { createdAt: "desc" }, take: 1 },
        evidence: true,
        milestones: { orderBy: { sortOrder: "asc" } },
        budgets: { take: 1 },
        transactions: { orderBy: { date: "desc" } },
        risks: { where: { isActive: true } },
        documents: true,
        ngo: true,
        matches: { include: { ngo: true }, orderBy: { matchScore: "desc" } },
        fundingRecommendations: { orderBy: { createdAt: "desc" }, take: 1 },
        progressSnapshots: { orderBy: { createdAt: "asc" } },
        recommendations: { where: { isActive: true }, take: 3 },
        impactMetrics: true,
      },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }
    return NextResponse.json({ project });
  } catch {
    return NextResponse.json({ error: "Unable to load project." }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();

    if (body.overrideScore != null) {
      if (!body.reason || String(body.reason).length < 5) {
        return NextResponse.json(
          { error: "Override reason is required." },
          { status: 400 }
        );
      }
      await prisma.projectScore.updateMany({
        where: { projectId: id },
        data: {
          isOverride: true,
          overrideReason: body.reason,
          overallScore: Number(body.overrideScore),
        },
      });
      await prisma.project.update({
        where: { id },
        data: { overallScore: Number(body.overrideScore) },
      });
      await logAudit({
        userId: user?.id,
        actor: user?.name ?? "CSR Manager",
        action: "SCORE_OVERRIDE",
        entity: "Project",
        entityId: id,
        details: { score: body.overrideScore, reason: body.reason },
      });
      return NextResponse.json({ ok: true });
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.progress != null ? { progress: body.progress } : {}),
        ...(body.ngoId ? { ngoId: body.ngoId } : {}),
        ...(body.approvedBudget != null ? { approvedBudget: body.approvedBudget } : {}),
      },
    });

    await logAudit({
      userId: user?.id,
      actor: user?.name ?? "CSR Manager",
      action: "PROJECT_UPDATED",
      entity: "Project",
      entityId: id,
      details: body,
    });

    return NextResponse.json({ project });
  } catch {
    return NextResponse.json({ error: "Unable to update project." }, { status: 500 });
  }
}
