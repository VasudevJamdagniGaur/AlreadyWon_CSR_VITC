import { cookies } from "next/headers";
import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import { verifyFirebaseIdToken } from "@/lib/firebase";

const SESSION_COOKIE = "kellyos_session";
const SESSION_USER_TTL_MS = Number(process.env.SESSION_USER_CACHE_MS || 300_000);
const sessionUserCache = new Map<string, { at: number; user: SessionUser | null }>();

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  role?: string;
  companyId?: string | null;
  firebaseUid?: string | null;
  company?: Record<string, unknown> | null;
};

export function hashPassword(password: string): string {
  return createHash("sha256").update(`kellyos:${password}`).digest("hex");
}

export async function createSession(userId: string) {
  sessionUserCache.delete(userId);
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
  const userId = jar.get(SESSION_COOKIE)?.value;
  if (userId) sessionUserCache.delete(userId);
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const userId = jar.get(SESSION_COOKIE)?.value;
  if (!userId) return null;

  const cached = sessionUserCache.get(userId);
  if (cached && Date.now() - cached.at < SESSION_USER_TTL_MS) {
    return cached.user;
  }

  const user = (await prisma.user.findUnique({
    where: { id: userId },
    include: { company: true },
  })) as SessionUser | null;

  sessionUserCache.set(userId, { at: Date.now(), user });
  return user;
}

/**
 * Ensure a KellyOS app user exists for a Firebase Auth account,
 * linked to the demo company when present.
 */
export async function upsertFirebaseUser(params: {
  firebaseUid: string;
  email: string;
  name?: string;
}): Promise<SessionUser> {
  const existing =
    (await prisma.user.findUnique({
      where: { email: params.email },
      include: { company: true },
    })) ||
    (await prisma.user.findFirst({
      where: { firebaseUid: params.firebaseUid },
      include: { company: true },
    }));

  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        firebaseUid: params.firebaseUid,
        email: params.email,
        name: params.name || existing.name || "CSR Manager",
      },
      include: { company: true },
    });
    return updated as SessionUser;
  }

  const company = await prisma.company.findFirst();
  const created = await prisma.user.create({
    data: {
      email: params.email,
      name: params.name || params.email.split("@")[0] || "CSR Manager",
      passwordHash: hashPassword(`firebase:${params.firebaseUid}`),
      role: "CSR_MANAGER",
      firebaseUid: params.firebaseUid,
      companyId: company?.id ?? null,
    },
  });
  const withCompany = await prisma.user.findUnique({
    where: { id: created.id },
    include: { company: true },
  });
  return (withCompany ?? created) as SessionUser;
}

export async function createSessionFromFirebaseToken(idToken: string) {
  const verified = await verifyFirebaseIdToken(idToken);
  if (!verified) {
    throw new Error("Invalid Firebase session.");
  }
  const user = await upsertFirebaseUser({
    firebaseUid: verified.localId,
    email: verified.email,
    name: verified.displayName,
  });
  await createSession(user.id);
  return user;
}

export async function requireUser(): Promise<SessionUser | null> {
  return getSessionUser();
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
