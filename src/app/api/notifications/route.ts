import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    const notifications = await prisma.notification.findMany({
      where: user ? { OR: [{ userId: user.id }, { userId: null }] } : undefined,
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ notifications });
  } catch {
    return NextResponse.json({ error: "Unable to load notifications." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    if (body.id) {
      await prisma.notification.update({
        where: { id: body.id },
        data: { isRead: true },
      });
    } else if (body.markAll) {
      const user = await requireUser();
      await prisma.notification.updateMany({
        where: { userId: user?.id, isRead: false },
        data: { isRead: true },
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to update notifications." }, { status: 500 });
  }
}
