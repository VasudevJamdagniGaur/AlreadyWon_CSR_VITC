import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

/** Lightweight session payload for chrome (sidebar) — no profile load. */
export async function GET() {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role ?? "CSR_MANAGER",
      },
    });
  } catch (e) {
    console.error("Session GET failed:", e);
    return NextResponse.json({ error: "Unable to load session." }, { status: 500 });
  }
}
