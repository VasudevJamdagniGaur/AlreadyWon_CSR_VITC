import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(req.url);
    const entity = searchParams.get("entity");
    const entityId = searchParams.get("entityId");

    const logs = await prisma.auditLog.findMany({
      where: {
        ...(entity ? { entity } : {}),
        ...(entityId ? { entityId } : {}),
      },
      orderBy: { timestamp: "desc" },
      take: 100,
    });
    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ error: "Unable to load audit log." }, { status: 500 });
  }
}
