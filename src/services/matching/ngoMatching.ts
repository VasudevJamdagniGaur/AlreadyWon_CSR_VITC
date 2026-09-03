import { clamp, round1 } from "@/lib/utils";
import type { MatchResult } from "@/types";

export interface MatchingProject {
  id: string;
  name: string;
  category?: string | null;
  geography?: string[];
  beneficiaryGroups?: string[];
  requiredExpertise?: string[];
  description?: string | null;
}

export interface MatchingNGO {
  id: string;
  name: string;
  primaryExpertise: string[];
  regions: string[];
  beneficiaryGroups: string[];
  yearsOfExperience: number;
  projectCount: number;
  executionReliability?: number | null;
  overallPartnerScore?: number | null;
  isNew?: boolean;
  riskFlags?: string[];
  historyCategories?: string[];
  historyGeographies?: string[];
}

function overlapScore(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const aLower = a.map((x) => x.toLowerCase());
  const bLower = b.map((x) => x.toLowerCase());
  let hits = 0;
  for (const item of aLower) {
    if (
      bLower.some(
        (b) => b.includes(item) || item.includes(b) || tokenOverlap(item, b) > 0.5
      )
    ) {
      hits++;
    }
  }
  return clamp((hits / Math.max(a.length, 1)) * 100, 0, 100);
}

function tokenOverlap(a: string, b: string): number {
  const ta = new Set(a.split(/\s+/));
  const tb = new Set(b.split(/\s+/));
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / Math.max(ta.size, 1);
}

/** Simple semantic-ish similarity via token Jaccard (fallback without embeddings). */
export function textSimilarity(a: string, b: string): number {
  const tokensA = new Set(
    a
      .toLowerCase()
      .split(/\W+/)
      .filter((t) => t.length > 2)
  );
  const tokensB = new Set(
    b
      .toLowerCase()
      .split(/\W+/)
      .filter((t) => t.length > 2)
  );
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let inter = 0;
  for (const t of tokensA) if (tokensB.has(t)) inter++;
  const union = tokensA.size + tokensB.size - inter;
  return union > 0 ? inter / union : 0;
}

/**
 * NGO–project matching.
 * Cold start: do not punish missing history; reduce confidence instead.
 */
export function matchNGOsToProject(
  project: MatchingProject,
  ngos: MatchingNGO[]
): MatchResult[] {
  return ngos
    .map((ngo) => scoreMatch(project, ngo))
    .sort((a, b) => b.matchScore - a.matchScore);
}

function scoreMatch(project: MatchingProject, ngo: MatchingNGO): MatchResult {
  const reasons: string[] = [];
  const risks: string[] = [];

  const expertiseMatch = round1(
    Math.max(
      overlapScore(project.requiredExpertise ?? [], ngo.primaryExpertise),
      overlapScore(
        project.category ? [project.category] : [],
        ngo.primaryExpertise
      ),
      textSimilarity(
        `${project.category ?? ""} ${project.description ?? ""}`,
        ngo.primaryExpertise.join(" ")
      ) * 100
    )
  );

  const geographicMatch = round1(
    overlapScore(project.geography ?? [], ngo.regions)
  );

  const beneficiaryMatch = round1(
    overlapScore(project.beneficiaryGroups ?? [], ngo.beneficiaryGroups)
  );

  const limitedHistory = ngo.isNew || ngo.projectCount === 0;
  let executionReliability = ngo.executionReliability ?? 60;
  if (limitedHistory) {
    // Neutral baseline — do not treat missing history as poor performance
    executionReliability = 65;
  }

  let relevantExperience = 50;
  if (ngo.historyCategories && ngo.historyCategories.length > 0) {
    relevantExperience = round1(
      overlapScore(
        [project.category ?? "", ...(project.requiredExpertise ?? [])],
        ngo.historyCategories
      )
    );
  } else if (expertiseMatch > 60) {
    relevantExperience = round1(expertiseMatch * 0.85);
  }
  if (ngo.yearsOfExperience >= 10) relevantExperience = clamp(relevantExperience + 10, 0, 100);
  else if (ngo.yearsOfExperience >= 5) relevantExperience = clamp(relevantExperience + 5, 0, 100);

  const riskScore = round1(
    clamp(
      100 -
        (ngo.riskFlags?.length ?? 0) * 15 -
        (limitedHistory ? 5 : 0),
      20,
      100
    )
  );

  if (expertiseMatch >= 70) reasons.push(`${ngo.primaryExpertise[0] ?? "Domain"} expertise alignment`);
  if (geographicMatch >= 70) reasons.push("Operates in target geography");
  if (beneficiaryMatch >= 60) reasons.push("Relevant beneficiary experience");
  if (executionReliability >= 75 && !limitedHistory)
    reasons.push("Strong milestone / execution track record");
  if (relevantExperience >= 70) reasons.push("Similar project history");
  if (limitedHistory) reasons.push("Limited historical evidence — assessed on capacity signals");

  if ((ngo.riskFlags?.length ?? 0) > 0) {
    risks.push(...ngo.riskFlags!.slice(0, 2));
  }
  if (geographicMatch < 40 && (project.geography?.length ?? 0) > 0) {
    risks.push("Limited geographic overlap with project region");
  }
  if (limitedHistory) {
    risks.push("Limited historical evidence");
  }

  const matchScore = round1(
    expertiseMatch * 0.25 +
      geographicMatch * 0.2 +
      beneficiaryMatch * 0.15 +
      executionReliability * 0.2 +
      relevantExperience * 0.15 +
      riskScore * 0.05
  );

  const confidence = limitedHistory
    ? clamp(0.5 + expertiseMatch / 500 + geographicMatch / 500, 0, 0.75)
    : clamp(0.65 + ngo.projectCount * 0.02 + (ngo.executionReliability ?? 70) / 500, 0, 0.95);

  return {
    ngoId: ngo.id,
    ngoName: ngo.name,
    matchScore,
    expertiseMatch,
    geographicMatch,
    beneficiaryMatch,
    executionReliability: round1(executionReliability),
    relevantExperience,
    riskScore,
    confidence: round1(confidence * 100) / 100,
    reasons: reasons.length > 0 ? reasons : ["Partial profile match based on available signals"],
    risks,
    limitedHistory,
  };
}
