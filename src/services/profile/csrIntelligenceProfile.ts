import { prisma } from "@/lib/db";
import { toJson, parseJsonArray } from "@/lib/utils";
import { getScoringWeights } from "@/services/dashboard/service";
import { DEFAULT_WEIGHTS } from "@/lib/validation";
import {
  emptyCsrIntelligenceProfile,
  normalizeCsrIntelligenceProfile,
  type CsrIntelligenceProfile,
} from "@/types/csrIntelligenceProfile";

export async function loadCsrIntelligenceProfile(companyId: string): Promise<{
  profile: CsrIntelligenceProfile;
  companyId: string;
  exists: boolean;
}> {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    throw new Error("Company not found");
  }

  const seed = {
    companyName: company.name,
    industries: parseJsonArray(company.industries),
    csrFocus: parseJsonArray(company.csrFocus),
    targetRegions: parseJsonArray(company.targetRegions),
    beneficiaryGroups: parseJsonArray(company.beneficiaryGroups),
    annualBudget: company.annualBudget,
  };

  const raw = (company as Record<string, unknown>).csrIntelligenceProfile;
  let parsed: unknown = null;
  if (typeof raw === "string" && raw.trim()) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
  } else if (raw && typeof raw === "object") {
    parsed = raw;
  }

  const exists = parsed != null;
  const profile = normalizeCsrIntelligenceProfile(parsed, seed);

  // Always reflect live KellyOS decision weights (do not invent alternate scoring).
  const weights = await getScoringWeights(companyId);
  profile.decisionProfile.weights = weights ?? { ...DEFAULT_WEIGHTS };

  if (!profile.companyOverview.companyName) {
    profile.companyOverview.companyName = company.name;
  }
  if (profile.funding.annualCsrBudget == null && company.annualBudget != null) {
    profile.funding.annualCsrBudget = company.annualBudget;
  }

  return { profile, companyId, exists };
}

/**
 * Persist CSR Intelligence Profile on the existing Company document (idempotent upsert field).
 * Also mirrors key arrays onto existing Company CSR fields for later matching/scoring consumers.
 */
export async function saveCsrIntelligenceProfile(
  companyId: string,
  profile: CsrIntelligenceProfile
): Promise<CsrIntelligenceProfile> {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new Error("Company not found");

  const weights = await getScoringWeights(companyId);
  const toSave: CsrIntelligenceProfile = {
    ...profile,
    decisionProfile: {
      weights: weights ?? { ...DEFAULT_WEIGHTS },
    },
  };

  const industries = toSave.companyOverview.industry
    ? [toSave.companyOverview.industry]
    : parseJsonArray(company.industries);

  await prisma.company.update({
    where: { id: companyId },
    data: {
      name: toSave.companyOverview.companyName || company.name,
      industries: toJson(industries),
      csrFocus: toJson(toSave.csrStrategy.focusAreas),
      targetRegions: toJson(
        toSave.geography.preferredStates.length
          ? toSave.geography.preferredStates
          : toSave.companyOverview.operatingRegions
      ),
      beneficiaryGroups: toJson(toSave.beneficiaries.groups),
      annualBudget:
        toSave.funding.annualCsrBudget != null
          ? toSave.funding.annualCsrBudget
          : company.annualBudget,
      csrIntelligenceProfile: toJson(toSave),
    },
  });

  return toSave;
}

export function createEmptyProfileForCompany(company: {
  name: string;
  industries?: string | null;
  csrFocus?: string | null;
  targetRegions?: string | null;
  beneficiaryGroups?: string | null;
  annualBudget?: number;
}): CsrIntelligenceProfile {
  return emptyCsrIntelligenceProfile({
    companyName: company.name,
    industries: parseJsonArray(company.industries),
    csrFocus: parseJsonArray(company.csrFocus),
    targetRegions: parseJsonArray(company.targetRegions),
    beneficiaryGroups: parseJsonArray(company.beneficiaryGroups),
    annualBudget: company.annualBudget,
  });
}
