import { prisma, getDatabaseMode } from "@/lib/db";
import { toJson, round1, parseJsonArray } from "@/lib/utils";
import { DEFAULT_WEIGHTS } from "@/lib/validation";
import { scoreProject } from "@/services/scoring/projectScoring";
import type { CompanyProfile } from "@/types";

export type CsrboxRawProject = {
  projectName: string;
  ngoName: string;
  company?: string | null;
  description?: string | null;
  developmentSector?: string | null;
  subSector?: string | null;
  location?: string | { state?: string; district?: string } | null;
  district?: string | null;
  estimatedBudget?:
    | string
    | { min?: string; max?: string; currency?: string }
    | null;
  projectStatus?: string | null;
  primaryBeneficiary?: string | null;
  secondaryBeneficiary?: string | null;
  estimatedBeneficiaries?: string | null;
  baselineSurveyStatus?: string | null;
  keyProjectPartners?: string | null;
  projectDuration?: string | null;
  aboutNGO?: string | null;
  vision?: string | null;
  mission?: string[] | null;
  UNSDGs?: string[] | null;
  benefitsToDonor?: string[] | null;
  recognitions?: string[] | null;
  projectObjectives?: unknown[];
  projectActivities?: unknown[];
  sourceProjectId?: string | null;
  source: {
    name: string;
    url: string;
    projectId?: string;
  };
};

function isPresent(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") {
    const t = value.trim();
    return t.length > 0 && t !== "...";
  }
  return true;
}

export function resolveSourceProjectId(raw: CsrboxRawProject): string {
  if (raw.sourceProjectId && isPresent(raw.sourceProjectId)) {
    return String(raw.sourceProjectId).trim();
  }
  if (raw.source.projectId && isPresent(raw.source.projectId)) {
    return String(raw.source.projectId).trim();
  }
  const match = raw.source.url.match(/_(\d+)\s*$/);
  if (match?.[1]) return match[1];
  throw new Error(`Unable to resolve sourceProjectId for ${raw.projectName}`);
}

function formatBudgetDisplay(budget: CsrboxRawProject["estimatedBudget"]): string | null {
  if (budget == null) return null;
  if (typeof budget === "string") return isPresent(budget) ? budget : null;
  const currency = budget.currency ?? "INR";
  if (budget.min && budget.max && isPresent(budget.min) && isPresent(budget.max)) {
    return `${currency} ${budget.min} - ${budget.max}`;
  }
  if (budget.max && isPresent(budget.max)) return `${currency} ${budget.max}`;
  if (budget.min && isPresent(budget.min)) return `${currency} ${budget.min}`;
  return null;
}

/** Parse crore amounts only when explicitly present in the source text. */
function parseCroreToInr(text: string): number | null {
  const cleaned = text.replace(/,/g, "").trim();
  const m = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:cr|c)\b/i);
  if (!m) return null;
  return Math.round(parseFloat(m[1]) * 10000000);
}

function parseRequestedBudget(budget: CsrboxRawProject["estimatedBudget"]): number | null {
  if (budget == null) return null;
  if (typeof budget === "string") {
    if (!isPresent(budget)) return null;
    // Prefer the lower bound when a range is stated in the source string.
    const parts = budget.split(/\s*-\s*/);
    for (const part of parts) {
      const n = parseCroreToInr(part);
      if (n != null) return n;
    }
    return null;
  }
  if (budget.min && isPresent(budget.min)) {
    const n = parseCroreToInr(budget.min);
    if (n != null) return n;
  }
  if (budget.max && isPresent(budget.max)) {
    return parseCroreToInr(budget.max);
  }
  return null;
}

function geographyFromRaw(raw: CsrboxRawProject): string[] {
  const out: string[] = [];
  if (typeof raw.location === "string" && isPresent(raw.location)) {
    out.push(...raw.location.split(",").map((s) => s.trim()).filter(Boolean));
  } else if (raw.location && typeof raw.location === "object") {
    if (isPresent(raw.location.state)) {
      out.push(
        ...String(raw.location.state)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      );
    }
    if (isPresent(raw.location.district)) {
      out.push(String(raw.location.district).trim());
    }
  }
  if (isPresent(raw.district) && typeof raw.district === "string") {
    const d = raw.district.trim();
    if (!out.includes(d)) out.push(d);
  }
  return out;
}

function beneficiaryGroups(raw: CsrboxRawProject): string[] {
  const groups: string[] = [];
  if (isPresent(raw.primaryBeneficiary)) groups.push(String(raw.primaryBeneficiary).trim());
  if (
    isPresent(raw.secondaryBeneficiary) &&
    String(raw.secondaryBeneficiary).trim() !== String(raw.primaryBeneficiary ?? "").trim()
  ) {
    groups.push(String(raw.secondaryBeneficiary).trim());
  }
  return groups;
}

/** Extract a stated floor count when the source text includes one; otherwise null. */
function beneficiaryCountFromLabel(label: string | null | undefined): number | null {
  if (!isPresent(label)) return null;
  const text = String(label);
  const range = text.match(/(\d+)\s*[-–to]+\s*(\d+)/i);
  if (range) return parseInt(range[1], 10);
  const floor = text.match(/(\d+)\s+and\s+above/i);
  if (floor) return parseInt(floor[1], 10);
  const upto = text.match(/upto\s+(\d+)/i);
  if (upto) return parseInt(upto[1], 10);
  const single = text.match(/(\d{3,})/);
  if (single) return parseInt(single[1], 10);
  return null;
}

function mapStatus(sourceStatus: string | null | undefined): string {
  const s = (sourceStatus ?? "").trim().toLowerCase();
  if (s === "active") return "IN_PROGRESS";
  if (s === "already implemented") return "COMPLETED";
  if (s === "proposed") return "SUBMITTED";
  return "SUBMITTED";
}

function categoryFromRaw(raw: CsrboxRawProject): string | null {
  if (isPresent(raw.developmentSector)) return String(raw.developmentSector);
  if (isPresent(raw.subSector)) return String(raw.subSector);
  return null;
}

async function ensureImportCompany(): Promise<{ id: string; profile: CompanyProfile }> {
  let company = await prisma.company.findFirst({
    where: { name: "Northstar Industries" },
  });
  if (!company) {
    company = await prisma.company.findFirst();
  }
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "Northstar Industries",
        industries: toJson(["Manufacturing"]),
        csrFocus: toJson([
          "Education",
          "Healthcare",
          "Community Development",
          "Environment",
        ]),
        targetRegions: toJson(["Haryana", "Delhi NCR", "Karnataka", "Maharashtra"]),
        beneficiaryGroups: toJson(["Students", "Women", "Youth", "Children", "PWDs"]),
        strategicThemes: toJson(["CSR opportunities", "Partner NGOs"]),
        annualBudget: 50000000,
        isDemo: false,
      },
    });
  }

  const profile: CompanyProfile = {
    name: company.name,
    industries: parseJsonArray(company.industries),
    csrFocus: parseJsonArray(company.csrFocus),
    targetRegions: parseJsonArray(company.targetRegions),
    beneficiaryGroups: parseJsonArray(company.beneficiaryGroups),
    strategicThemes: parseJsonArray(company.strategicThemes),
    annualBudget: company.annualBudget ?? 50000000,
  };

  return { id: company.id, profile };
}

async function findExistingProject(sourceProjectId: string, sourceUrl: string) {
  const byId = await prisma.project.findFirst({
    where: { sourceName: "CSRBOX", sourceProjectId },
  });
  if (byId) return byId;
  return prisma.project.findFirst({
    where: { sourceName: "CSRBOX", sourceUrl },
  });
}

export type ImportCsrboxResult = {
  mode: "demo" | "firestore";
  created: number;
  updated: number;
  items: { action: "create" | "update"; name: string; sourceProjectId: string; id: string }[];
};

/**
 * Idempotent CSRBOX project import into the existing Project / ProjectScore collections.
 */
export async function importCsrboxProjects(
  records: CsrboxRawProject[]
): Promise<ImportCsrboxResult> {
  const { id: companyId, profile } = await ensureImportCompany();
  const items: ImportCsrboxResult["items"] = [];
  let created = 0;
  let updated = 0;

  for (const raw of records) {
    const sourceProjectId = resolveSourceProjectId(raw);
    const sourceUrl = raw.source.url;
    const sourceName = raw.source.name || "CSRBOX";
    const geography = geographyFromRaw(raw);
    const groups = beneficiaryGroups(raw);
    const beneficiaryCount = beneficiaryCountFromLabel(raw.estimatedBeneficiaries);
    const budgetDisplay = formatBudgetDisplay(raw.estimatedBudget);
    const requestedBudget = parseRequestedBudget(raw.estimatedBudget);
    const category = categoryFromRaw(raw);
    const status = mapStatus(raw.projectStatus);

    // Deterministic scoring from available fields only — no invented NGO history.
    const scored = scoreProject(
      {
        name: raw.projectName,
        category,
        description: raw.description ?? null,
        geography,
        beneficiaryCount: beneficiaryCount ?? undefined,
        beneficiaryGroups: groups,
        requestedBudget: requestedBudget ?? undefined,
        durationMonths: undefined,
        outcomes: [],
        risks: [],
        requiredExpertise: isPresent(raw.subSector) ? [String(raw.subSector)] : [],
        pastExperience: isPresent(raw.aboutNGO) ? String(raw.aboutNGO) : null,
        evidenceCount: [
          raw.description,
          raw.estimatedBeneficiaries,
          raw.developmentSector,
          raw.subSector,
          raw.aboutNGO,
        ].filter((v) => isPresent(v)).length,
        dataCompleteness: 0.55,
      },
      profile,
      undefined,
      DEFAULT_WEIGHTS
    );

    const overallScore = round1(
      scored.dimensions.socialImpact.score * 0.3 +
        scored.dimensions.executionReliability.score * 0.2 +
        scored.dimensions.companyAlignment.score * 0.2 +
        scored.dimensions.communityBrandResonance.score * 0.15 +
        scored.dimensions.costRiskEfficiency.score * 0.15
    );

    const projectData: Record<string, unknown> = {
      companyId,
      name: raw.projectName,
      organization: raw.ngoName,
      category,
      subSector: isPresent(raw.subSector) ? raw.subSector : null,
      developmentSector: isPresent(raw.developmentSector) ? raw.developmentSector : null,
      description: raw.description ?? null,
      geography: toJson(geography),
      beneficiaries: toJson({
        count: beneficiaryCount,
        groups,
        estimatedLabel: isPresent(raw.estimatedBeneficiaries)
          ? raw.estimatedBeneficiaries
          : null,
        primary: isPresent(raw.primaryBeneficiary) ? raw.primaryBeneficiary : null,
        secondary: isPresent(raw.secondaryBeneficiary) ? raw.secondaryBeneficiary : null,
      }),
      targetOutcomes: toJson(raw.projectObjectives ?? []),
      requestedBudget,
      budgetDisplay,
      durationMonths: null,
      status,
      sourceProjectStatus: isPresent(raw.projectStatus) ? raw.projectStatus : null,
      overallScore,
      recommendationLevel: scored.recommendationLevel,
      riskLevel: "MEDIUM",
      isDemo: false,
      isCsrOpportunity: true,
      sourceName,
      sourceProjectId,
      sourceUrl,
      baselineSurveyStatus: isPresent(raw.baselineSurveyStatus)
        ? raw.baselineSurveyStatus
        : null,
      keyProjectPartners: isPresent(raw.keyProjectPartners) ? raw.keyProjectPartners : null,
      aboutNgo: isPresent(raw.aboutNGO) ? raw.aboutNGO : null,
      sourcePayload: toJson(raw),
      progress: status === "COMPLETED" ? 100 : status === "IN_PROGRESS" ? 40 : 0,
      expectedProgress: status === "COMPLETED" ? 100 : status === "IN_PROGRESS" ? 50 : 0,
      spentBudget: 0,
    };

    const existing = await findExistingProject(sourceProjectId, sourceUrl);
    let projectId: string;

    if (existing) {
      await prisma.project.update({
        where: { id: existing.id },
        data: projectData,
      });
      projectId = existing.id;
      updated += 1;
      items.push({
        action: "update",
        name: raw.projectName,
        sourceProjectId,
        id: projectId,
      });

      // Replace latest score row for this project (keep history clean for CSRBOX re-import)
      await prisma.projectScore.deleteMany({ where: { projectId } });
      await prisma.projectEvidence.deleteMany({ where: { projectId } });
    } else {
      const createdDoc = await prisma.project.create({ data: projectData });
      projectId = createdDoc.id;
      created += 1;
      items.push({
        action: "create",
        name: raw.projectName,
        sourceProjectId,
        id: projectId,
      });
    }

    await prisma.projectScore.create({
      data: {
        projectId,
        overallScore,
        socialImpact: scored.dimensions.socialImpact.score,
        executionReliability: scored.dimensions.executionReliability.score,
        companyAlignment: scored.dimensions.companyAlignment.score,
        communityBrandResonance: scored.dimensions.communityBrandResonance.score,
        costRiskEfficiency: scored.dimensions.costRiskEfficiency.score,
        socialImpactConfidence: scored.dimensions.socialImpact.confidence,
        executionConfidence: scored.dimensions.executionReliability.confidence,
        alignmentConfidence: scored.dimensions.companyAlignment.confidence,
        resonanceConfidence: scored.dimensions.communityBrandResonance.confidence,
        efficiencyConfidence: scored.dimensions.costRiskEfficiency.confidence,
        overallConfidence: scored.confidence,
        explanation: toJson({
          overall: scored.explanation,
          dimensions: scored.dimensions,
          contributions: {
            socialImpact: round1(scored.dimensions.socialImpact.score * 0.3),
            executionReliability: round1(
              scored.dimensions.executionReliability.score * 0.2
            ),
            companyAlignment: round1(scored.dimensions.companyAlignment.score * 0.2),
            communityBrandResonance: round1(
              scored.dimensions.communityBrandResonance.score * 0.15
            ),
            costRiskEfficiency: round1(
              scored.dimensions.costRiskEfficiency.score * 0.15
            ),
          },
          recommendationLevel: scored.recommendationLevel,
          formula:
            "overallScore = socialImpact*0.30 + executionReliability*0.20 + companyAlignment*0.20 + communityBrandResonance*0.15 + costRiskEfficiency*0.15",
        }),
        weights: toJson(DEFAULT_WEIGHTS),
      },
    });

    for (const [dim, result] of Object.entries(scored.dimensions)) {
      for (const ev of result.evidence) {
        await prisma.projectEvidence.create({
          data: {
            projectId,
            dimension: dim,
            claim: ev,
            source: "KellyOS scoring engine",
            confidence: result.confidence,
          },
        });
      }
    }
  }

  return {
    mode: getDatabaseMode(),
    created,
    updated,
    items,
  };
}
