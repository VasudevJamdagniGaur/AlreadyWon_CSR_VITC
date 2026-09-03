import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, logAudit } from "@/lib/auth";
import { toJson } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    if (!user?.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const projects = await prisma.project.findMany({
      where: {
        companyId: user.companyId,
        ...(status ? { status } : {}),
      },
      include: {
        scores: { orderBy: { createdAt: "desc" }, take: 1 },
        ngo: true,
        risks: { where: { isActive: true }, take: 3 },
      },
      orderBy: [{ overallScore: "desc" }, { name: "asc" }],
    });

    return NextResponse.json({ projects });
  } catch {
    return NextResponse.json({ error: "Unable to load projects." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!user?.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const project = await prisma.project.create({
      data: {
        companyId: user.companyId,
        name: body.name || "Untitled Project",
        organization: body.organization,
        category: body.category,
        description: body.description,
        geography: toJson(body.geography ?? []),
        beneficiaries: toJson(body.beneficiaries ?? { count: 0, groups: [] }),
        requestedBudget: body.requestedBudget,
        durationMonths: body.durationMonths,
        status: "DRAFT",
        isDemo: true,
      },
    });

    await logAudit({
      userId: user.id as string,
      actor: user.name as string,
      action: "PROJECT_CREATED",
      entity: "Project",
      entityId: project.id as string,
      details: { name: project.name },
    });

    return NextResponse.json({ project });
  } catch {
    return NextResponse.json({ error: "Unable to create project." }, { status: 500 });
  }
}
