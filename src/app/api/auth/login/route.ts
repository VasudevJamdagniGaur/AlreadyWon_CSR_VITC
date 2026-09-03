import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, destroySession, hashPassword, logAudit } from "@/lib/auth";
import { LoginSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid credentials format." }, { status: 400 });
    }

    const { email, password } = parsed.data;
    let user = await prisma.user.findUnique({ where: { email } });

    // Bootstrap demo user if DB seeded but lookup fails edge-case
    if (!user && email === "demo@kellyos.ai" && password === "demo123") {
      const company = await prisma.company.findFirst();
      if (company) {
        user = await prisma.user.create({
          data: {
            email,
            name: "CSR Manager",
            passwordHash: hashPassword(password),
            companyId: company.id,
          },
        });
      }
    }

    if (!user || user.passwordHash !== hashPassword(password)) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    await createSession(user.id);
    await logAudit({
      userId: user.id,
      actor: user.name,
      action: "USER_LOGIN",
      entity: "User",
      entityId: user.id,
    });

    return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
  } catch {
    return NextResponse.json({ error: "Unable to sign in." }, { status: 500 });
  }
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
