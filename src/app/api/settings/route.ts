import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, logAudit } from "@/lib/auth";
import { ScoringWeightsSchema, DEFAULT_WEIGHTS } from "@/lib/validation";
import { toJson, parseJsonObject } from "@/lib/utils";

export async function GET() {
  try {
    const user = await requireUser();
    if (!user?.companyId) {
      return NextResponse.json({ error: "No company" }, { status: 404 });
    }
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      include: { priorities: true, systemSettings: true },
    });
    const weightsSetting = company?.systemSettings.find((s) => s.key === "scoring_weights");
    return NextResponse.json({
      company,
      weights: weightsSetting
        ? parseJsonObject(weightsSetting.value, DEFAULT_WEIGHTS)
        : DEFAULT_WEIGHTS,
      demoMode: true,
    });
  } catch {
    return NextResponse.json({ error: "Unable to load settings." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    if (!user?.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();

    if (body.weights) {
      const parsed = ScoringWeightsSchema.safeParse(body.weights);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "All weights must total 100%." },
          { status: 400 }
        );
      }
      await prisma.systemSetting.upsert({
        where: {
          companyId_key: { companyId: user.companyId, key: "scoring_weights" },
        },
        create: {
          companyId: user.companyId,
          key: "scoring_weights",
          value: toJson(parsed.data),
        },
        update: { value: toJson(parsed.data) },
      });
      await logAudit({
        userId: user.id,
        actor: user.name,
        action: "WEIGHTS_UPDATED",
        entity: "SystemSetting",
        details: parsed.data,
      });
    }

    if (body.company) {
      const c = body.company;
      await prisma.company.update({
        where: { id: user.companyId },
        data: {
          ...(c.name ? { name: c.name } : {}),
          ...(c.annualBudget != null ? { annualBudget: Number(c.annualBudget) } : {}),
          ...(c.csrFocus ? { csrFocus: toJson(c.csrFocus) } : {}),
          ...(c.targetRegions ? { targetRegions: toJson(c.targetRegions) } : {}),
          ...(c.beneficiaryGroups ? { beneficiaryGroups: toJson(c.beneficiaryGroups) } : {}),
          ...(c.strategicThemes ? { strategicThemes: toJson(c.strategicThemes) } : {}),
        },
      });
      await logAudit({
        userId: user.id,
        actor: user.name,
        action: "COMPANY_UPDATED",
        entity: "Company",
        entityId: user.companyId,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to save settings." }, { status: 500 });
  }
}
