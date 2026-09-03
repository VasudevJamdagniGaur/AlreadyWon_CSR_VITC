import { NextResponse } from "next/server";
import {
  createSessionFromFirebaseToken,
  destroySession,
  logAudit,
} from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const idToken = body.idToken as string | undefined;

    if (!idToken) {
      return NextResponse.json(
        { error: "Firebase ID token is required." },
        { status: 400 }
      );
    }

    const user = await createSessionFromFirebaseToken(idToken);

    await logAudit({
      userId: user.id,
      actor: user.name,
      action: "USER_LOGIN",
      entity: "User",
      entityId: user.id,
      details: { provider: "firebase", email: user.email },
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (e) {
    console.error("Firebase login failed:", e);
    return NextResponse.json(
      { error: "Unable to sign in with Firebase. Check email/password and Auth settings." },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
