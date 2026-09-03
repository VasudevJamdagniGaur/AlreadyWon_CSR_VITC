import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    await requireUser();
    const ngos = await prisma.nGO.findMany({
      include: {
        projectHistory: true,
        _count: { select: { projects: true, matches: true } },
      },
      orderBy: { overallPartnerScore: "desc" },
    });
    return NextResponse.json({ ngos });
  } catch {
    return NextResponse.json({ error: "Unable to load NGOs." }, { status: 500 });
  }
}
