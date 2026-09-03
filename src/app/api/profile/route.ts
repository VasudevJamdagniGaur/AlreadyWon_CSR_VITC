import { NextResponse } from "next/server";
import { requireUser, logAudit } from "@/lib/auth";
import {
  loadCsrIntelligenceProfile,
  saveCsrIntelligenceProfile,
} from "@/services/profile/csrIntelligenceProfile";
import {
  calculateProfileCompleteness,
  deriveIntelligenceSummary,
  normalizeCsrIntelligenceProfile,
  type CsrIntelligenceProfile,
} from "@/types/csrIntelligenceProfile";

export async function GET() {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.companyId) {
      return NextResponse.json({ error: "No company linked to this account." }, { status: 404 });
    }

    const { profile, exists } = await loadCsrIntelligenceProfile(user.companyId);

    return NextResponse.json({
      profile,
      exists,
      completeness: calculateProfileCompleteness(profile),
      summary: deriveIntelligenceSummary(profile),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role ?? "CSR_MANAGER",
      },
    });
  } catch (e) {
    console.error("Profile GET failed:", e);
    return NextResponse.json({ error: "Unable to load profile." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.companyId) {
      return NextResponse.json({ error: "No company linked to this account." }, { status: 404 });
    }

    const body = await req.json();
    const incoming = body.profile as CsrIntelligenceProfile | undefined;
    if (!incoming || typeof incoming !== "object") {
      return NextResponse.json({ error: "Profile payload is required." }, { status: 400 });
    }

    const normalized = normalizeCsrIntelligenceProfile(incoming);
    if (!normalized.companyOverview.companyName.trim()) {
      return NextResponse.json({ error: "Company Name is required." }, { status: 400 });
    }

    const saved = await saveCsrIntelligenceProfile(user.companyId, normalized);

    await logAudit({
      userId: user.id,
      actor: user.name,
      action: "CSR_INTELLIGENCE_PROFILE_UPDATED",
      entity: "Company",
      entityId: user.companyId,
      details: { completeness: calculateProfileCompleteness(saved) },
    });

    return NextResponse.json({
      ok: true,
      message: "Profile updated successfully.",
      profile: saved,
      completeness: calculateProfileCompleteness(saved),
      summary: deriveIntelligenceSummary(saved),
    });
  } catch (e) {
    console.error("Profile PUT failed:", e);
    return NextResponse.json({ error: "Unable to save profile." }, { status: 500 });
  }
}

/** Kept for sidebar account chip (name/email) without requiring full CSR payload. */
export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    if (body.profile) {
      // Allow PATCH with full profile as alias of PUT
      const putReq = new Request(req.url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: body.profile }),
      });
      return PUT(putReq);
    }
    return NextResponse.json(
      { error: "Use PUT with { profile } to update the CSR Intelligence Profile." },
      { status: 400 }
    );
  } catch {
    return NextResponse.json({ error: "Unable to update profile." }, { status: 500 });
  }
}
