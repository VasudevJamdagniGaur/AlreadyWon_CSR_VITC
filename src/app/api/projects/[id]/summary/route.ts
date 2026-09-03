import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, logAudit } from "@/lib/auth";
import { getAIProvider } from "@/services/ai";
import { parseJsonObject } from "@/lib/utils";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        ngo: true,
        milestones: true,
        risks: { where: { isActive: true } },
        impactMetrics: true,
      },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const bens = parseJsonObject(project.beneficiaries, { count: 0, groups: [] as string[] });
    const ai = getAIProvider();
    const summary = await ai.summarizeReport({
      projectName: project.name,
      partner: project.ngo?.name ?? project.organization ?? undefined,
      objective: project.description ?? undefined,
      budget: project.approvedBudget ?? project.requestedBudget ?? undefined,
      progress: project.progress,
      milestones: project.milestones.map(
        (m) => `${m.name} (${m.status}) — ${m.actualProgress}%`
      ),
      beneficiaries: bens.count,
      risks: project.risks.map((r) => `${r.level}: ${r.reason}`),
    });

    await logAudit({
      userId: user?.id,
      actor: user?.name ?? "CSR Manager",
      action: "PROJECT_SUMMARY_GENERATED",
      entity: "Project",
      entityId: id,
    });

    return NextResponse.json({
      summary,
      mode: ai.isDemo ? "Analysis" : "AI Analysis",
      note: "Structured summary for human review. Not a legal or audited report.",
    });
  } catch {
    return NextResponse.json({ error: "Unable to generate summary." }, { status: 500 });
  }
}
