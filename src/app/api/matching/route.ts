import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, logAudit } from "@/lib/auth";
import { parseJsonArray, toJson } from "@/lib/utils";
import { matchNGOsToProject } from "@/services/matching/ngoMatching";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const projectId = body.projectId as string;
    if (!projectId) {
      return NextResponse.json({ error: "projectId required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const ngos = await prisma.nGO.findMany({
      include: { projectHistory: true },
    });

    const beneficiaryGroups = (() => {
              try {
                const b = JSON.parse(project.beneficiaries || "{}");
                return Array.isArray(b.groups) ? b.groups : [];
              } catch {
                return [];
              }
            })();

    const results = matchNGOsToProject(
      {
        id: project.id,
        name: project.name,
        category: project.category,
        geography: parseJsonArray(project.geography),
        beneficiaryGroups,
        requiredExpertise: parseJsonArray(project.requiredExpertise),
        description: project.description,
      },
      ngos.map((n) => ({
        id: n.id,
        name: n.name,
        primaryExpertise: parseJsonArray(n.primaryExpertise),
        regions: parseJsonArray(n.regions),
        beneficiaryGroups: parseJsonArray(n.beneficiaryGroups),
        yearsOfExperience: n.yearsOfExperience,
        projectCount: n.projectCount,
        executionReliability: n.executionReliability,
        overallPartnerScore: n.overallPartnerScore,
        isNew: n.isNew,
        riskFlags: parseJsonArray(n.riskFlags),
        historyCategories: n.projectHistory.map((h) => h.category ?? ""),
        historyGeographies: n.projectHistory.map((h) => h.geography ?? ""),
      }))
    );

    // Refresh matches
    await prisma.nGOMatch.deleteMany({ where: { projectId } });
    for (const m of results) {
      await prisma.nGOMatch.create({
        data: {
          projectId,
          ngoId: m.ngoId,
          matchScore: m.matchScore,
          expertiseMatch: m.expertiseMatch,
          geographicMatch: m.geographicMatch,
          beneficiaryMatch: m.beneficiaryMatch,
          executionReliability: m.executionReliability,
          relevantExperience: m.relevantExperience,
          riskScore: m.riskScore,
          confidence: m.confidence,
          explanation: toJson({
            reasons: m.reasons,
            risks: m.risks,
            limitedHistory: m.limitedHistory,
          }),
        },
      });
    }

    await logAudit({
      userId: user?.id,
      actor: user?.name ?? "CSR Manager",
      action: "NGO_MATCHING_RUN",
      entity: "Project",
      entityId: projectId,
      details: { matches: results.length },
    });

    return NextResponse.json({ matches: results });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Unable to run matching." }, { status: 500 });
  }
}
