import { NextResponse } from "next/server";
import { requireUser, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Run Demo — returns the golden-path checklist with live entity IDs
 * so the UI can walk judges through KellyOS in one continuous flow.
 */
export async function POST() {
  try {
    const user = await requireUser();
    if (!user?.companyId) {
      return NextResponse.json(
        { error: "No demo company. Run npm run db:seed first." },
        { status: 404 }
      );
    }

    const company = await prisma.company.findUnique({ where: { id: user.companyId } });
    const sunrise = await prisma.project.findFirst({
      where: { companyId: user.companyId, name: "Project Sunrise" },
      include: {
        scores: { orderBy: { createdAt: "desc" }, take: 1 },
        risks: { where: { isActive: true }, take: 3 },
        matches: { include: { ngo: true }, orderBy: { matchScore: "desc" }, take: 1 },
      },
    });
    const seva = await prisma.nGO.findFirst({ where: { name: "Seva Foundation" } });

    await logAudit({
      userId: user.id,
      actor: user.name,
      action: "DEMO_RUN_STARTED",
      entity: "System",
      details: { company: company?.name },
    });

    return NextResponse.json({
      company: company?.name ?? "Northstar Industries",
      steps: [
        {
          step: 1,
          title: "Prioritize projects",
          href: "/prioritization",
          detail: "Compare proposals using five transparent KellyOS dimensions.",
        },
        {
          step: 2,
          title: "Review Project Sunrise",
          href: sunrise ? `/projects/${sunrise.id}` : "/projects",
          detail: sunrise
            ? `Overall score ${sunrise.overallScore}/100 — recommended for high-priority review.`
            : "Open a scored project from the portfolio.",
          score: sunrise?.overallScore,
        },
        {
          step: 3,
          title: "Choose funding",
          href: "/allocation",
          detail: "Review recommended allocation within the remaining CSR budget.",
        },
        {
          step: 4,
          title: "Match NGO",
          href: sunrise ? `/matching?projectId=${sunrise.id}` : "/matching",
          detail: seva
            ? `Top match signal: ${seva.name} (synthetic demo organization).`
            : "Rank implementation partners for the selected project.",
          matchScore: sunrise?.matches?.[0]?.matchScore,
        },
        {
          step: 5,
          title: "Monitor execution",
          href: "/monitoring",
          detail:
            sunrise?.risks?.[0]?.reason ??
            "Track milestones, budget burn, and deterministic risk signals.",
        },
      ],
      disclaimer: "Demo environment — all organizations and figures are synthetic.",
    });
  } catch {
    return NextResponse.json({ error: "Unable to start demo walkthrough." }, { status: 500 });
  }
}
