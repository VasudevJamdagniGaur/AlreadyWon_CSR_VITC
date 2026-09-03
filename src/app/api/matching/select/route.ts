import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, logAudit } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const projectId = body.projectId as string;
    const ngoId = body.ngoId as string;

    if (!projectId || !ngoId) {
      return NextResponse.json({ error: "projectId and ngoId required" }, { status: 400 });
    }

    await prisma.nGOMatch.updateMany({
      where: { projectId },
      data: { isSelected: false },
    });

    await prisma.nGOMatch.updateMany({
      where: { projectId, ngoId },
      data: { isSelected: true },
    });

    const project = await prisma.project.update({
      where: { id: projectId },
      data: { ngoId },
      include: { ngo: true },
    });

    await logAudit({
      userId: user?.id,
      actor: user?.name ?? "CSR Manager",
      action: "NGO_SELECTED",
      entity: "Project",
      entityId: projectId,
      details: { ngoId, ngoName: project.ngo?.name },
    });

    return NextResponse.json({ project, message: "NGO partner selected." });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Unable to select NGO." }, { status: 500 });
  }
}
