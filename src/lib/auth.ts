import { cookies } from "next/headers";
import { createHash } from "crypto";
import { prisma } from "@/lib/db";

const SESSION_COOKIE = "kellyos_session";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role?: string;
  companyId?: string | null;
  company?: Record<string, unknown> | null;
};

export function hashPassword(password: string): string {
  return createHash("sha256").update(`kellyos:${password}`).digest("hex");
}

export async function createSession(userId: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const userId = jar.get(SESSION_COOKIE)?.value;
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { company: true },
  });
  return user as SessionUser | null;
}

export async function requireUser(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user) {
    const demo = await prisma.user.findUnique({
      where: { email: "demo@kellyos.ai" },
      include: { company: true },
    });
    return demo as SessionUser | null;
  }
  return user;
}

export async function logAudit(params: {
  userId?: string | null;
  actor: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId ?? undefined,
      actor: params.actor,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      details: params.details ? JSON.stringify(params.details) : undefined,
    },
  });
}
