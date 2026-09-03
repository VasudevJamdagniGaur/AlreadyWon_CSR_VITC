import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser();
    const { id } = await params;
    const ngo = await prisma.nGO.findUnique({
      where: { id },
      include: {
        projectHistory: { orderBy: { completedAt: "desc" } },
        documents: true,
        projects: { select: { id: true, name: true, status: true, overallScore: true } },
        matches: {
          include: { project: { select: { id: true, name: true } } },
          orderBy: { matchScore: "desc" },
          take: 10,
        },
      },
    });
    if (!ngo) {
      return NextResponse.json({ error: "NGO not found." }, { status: 404 });
    }
    return NextResponse.json({
      ngo,
      disclaimer:
        "AI-assisted due diligence — Human review required. Synthetic demo organization.",
    });
  } catch {
    return NextResponse.json({ error: "Unable to load NGO." }, { status: 500 });
  }
}
