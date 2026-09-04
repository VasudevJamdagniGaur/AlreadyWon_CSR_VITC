/**
 * Hackathon demo: account-specific KellyOS CSR score matrices.
 * Weights remain Social Impact 30%, Execution 20%, Alignment 20%,
 * Community & Brand 15%, Cost & Risk 15%.
 */

export type DimensionScores = {
  socialImpact: number;
  executionReliability: number;
  companyAlignment: number;
  communityBrandResonance: number;
  costRiskEfficiency: number;
  overallScore: number;
};

export type DemoAccountPersona = "jindal" | "adani" | "zerodha";

const WEIGHTS = {
  socialImpact: 0.3,
  executionReliability: 0.2,
  companyAlignment: 0.2,
  communityBrandResonance: 0.15,
  costRiskEfficiency: 0.15,
} as const;

function row(
  socialImpact: number,
  executionReliability: number,
  companyAlignment: number,
  communityBrandResonance: number,
  costRiskEfficiency: number,
  overallScore: number
): DimensionScores {
  return {
    socialImpact,
    executionReliability,
    companyAlignment,
    communityBrandResonance,
    costRiskEfficiency,
    overallScore,
  };
}

/** CSR lookup key → dimension scores */
type ScoreMatrix = Record<string, DimensionScores>;

const JINDAL_SCORES: ScoreMatrix = {
  saahas: row(88, 84, 82, 84, 86, 85.1),
  kaydee: row(91, 84, 90, 89, 84, 88.0),
  amar: row(94, 87, 88, 92, 82, 89.3),
  karwaan: row(78, 80, 91, 94, 88, 84.9),
  bml: row(82, 88, 96, 95, 85, 88.4),
  hwf: row(96, 86, 97, 96, 87, 92.9),
  ashoka: row(89, 84, 88, 92, 84, 87.5),
  idream: row(87, 87, 92, 89, 86, 88.2),
  aarine_ganga: row(84, 78, 80, 84, 83, 81.8),
  aarine_shakti: row(86, 79, 89, 93, 84, 86.0),
  ajay_shakti: row(89, 83, 91, 92, 86, 88.2),
};

const ADANI_SCORES: ScoreMatrix = {
  saahas: row(88, 84, 95, 91, 92, 89.7),
  kaydee: row(91, 84, 88, 89, 85, 87.8),
  amar: row(94, 87, 94, 94, 84, 91.1),
  karwaan: row(78, 80, 92, 93, 89, 85.1),
  bml: row(82, 88, 91, 90, 88, 87.1),
  hwf: row(96, 86, 96, 95, 90, 93.0),
  ashoka: row(89, 84, 95, 94, 86, 89.5),
  idream: row(87, 87, 94, 92, 90, 89.6),
  aarine_ganga: row(84, 78, 86, 86, 84, 83.5),
  aarine_shakti: row(86, 79, 90, 88, 86, 85.7),
  ajay_shakti: row(89, 83, 88, 87, 88, 87.2),
};

const ZERODHA_SCORES: ScoreMatrix = {
  saahas: row(88, 84, 97, 96, 95, 91.2),
  kaydee: row(91, 84, 77, 79, 82, 83.6),
  amar: row(94, 87, 84, 85, 84, 87.8),
  karwaan: row(78, 80, 82, 84, 88, 81.6),
  bml: row(82, 88, 83, 86, 87, 84.8),
  hwf: row(96, 86, 86, 88, 84, 89.0),
  ashoka: row(89, 84, 93, 94, 85, 89.0),
  idream: row(87, 87, 97, 96, 93, 91.3),
  aarine_ganga: row(84, 78, 78, 80, 82, 80.7),
  aarine_shakti: row(86, 79, 84, 84, 85, 83.8),
  ajay_shakti: row(89, 83, 82, 81, 86, 84.8),
};

const PERSONA_SCORES: Record<DemoAccountPersona, ScoreMatrix> = {
  jindal: JINDAL_SCORES,
  adani: ADANI_SCORES,
  zerodha: ZERODHA_SCORES,
};

const EMAIL_TO_PERSONA: Record<string, DemoAccountPersona> = {
  "naveen@jindal.com": "jindal",
  "gautam@adani.com": "adani",
  "nikhil@zerodha.com": "zerodha",
};

export function resolveDemoPersona(email?: string | null): DemoAccountPersona | null {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  if (EMAIL_TO_PERSONA[normalized]) return EMAIL_TO_PERSONA[normalized];
  if (normalized.endsWith("@jindal.com")) return "jindal";
  if (normalized.endsWith("@adani.com")) return "adani";
  if (normalized.endsWith("@zerodha.com")) return "zerodha";
  return null;
}

function normalize(value: string | null | undefined): string {
  return (value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Map a CSR project to a stable demo score key using organisation + project name.
 */
export function resolveCsrScoreKey(params: {
  organization?: string | null;
  name?: string | null;
  ngoName?: string | null;
}): string | null {
  const org = normalize(params.organization || params.ngoName);
  const name = normalize(params.name);

  if (org.includes("ajay industrial")) return "ajay_shakti";
  if (org.includes("aarine")) {
    if (name.includes("ganga")) return "aarine_ganga";
    if (name.includes("shakti")) return "aarine_shakti";
  }
  if (org.includes("saahas")) return "saahas";
  if (org.includes("kaydee")) return "kaydee";
  if (org.includes("amar seva")) return "amar";
  if (org.includes("karwaan")) return "karwaan";
  if (org.includes("bml munjal") || org.includes("bml")) return "bml";
  if (org.includes("human welfare")) return "hwf";
  if (org.includes("ashoka tree")) return "ashoka";
  if (org.includes("idream")) return "idream";
  return null;
}

export function getAccountScoreForCsr(
  email: string | null | undefined,
  params: { organization?: string | null; name?: string | null; ngoName?: string | null }
): DimensionScores | null {
  const persona = resolveDemoPersona(email);
  if (!persona) return null;
  const key = resolveCsrScoreKey(params);
  if (!key) return null;
  return PERSONA_SCORES[persona][key] ?? null;
}

export function computeWeightedOverall(scores: Omit<DimensionScores, "overallScore">): number {
  const total =
    scores.socialImpact * WEIGHTS.socialImpact +
    scores.executionReliability * WEIGHTS.executionReliability +
    scores.companyAlignment * WEIGHTS.companyAlignment +
    scores.communityBrandResonance * WEIGHTS.communityBrandResonance +
    scores.costRiskEfficiency * WEIGHTS.costRiskEfficiency;
  return Math.round(total * 10) / 10;
}

/** Overlay demo account scores onto a CSR/project-shaped record when a match exists. */
export function applyDemoAccountScore<
  T extends {
    name?: string | null;
    organization?: string | null;
    overallScore?: number | null;
    socialImpact?: number | null;
    executionReliability?: number | null;
    companyAlignment?: number | null;
    communityBrandResonance?: number | null;
    costRiskEfficiency?: number | null;
  },
>(email: string | null | undefined, item: T): T {
  const demo = getAccountScoreForCsr(email, {
    name: item.name,
    organization: item.organization,
  });
  if (!demo) return item;
  return {
    ...item,
    overallScore: demo.overallScore,
    socialImpact: demo.socialImpact,
    executionReliability: demo.executionReliability,
    companyAlignment: demo.companyAlignment,
    communityBrandResonance: demo.communityBrandResonance,
    costRiskEfficiency: demo.costRiskEfficiency,
  };
}

export const SCORE_DIMENSION_LABELS = [
  { key: "socialImpact" as const, label: "Social Impact", weight: "30%" },
  { key: "executionReliability" as const, label: "Execution Reliability", weight: "20%" },
  { key: "companyAlignment" as const, label: "Company Alignment", weight: "20%" },
  { key: "communityBrandResonance" as const, label: "Community & Brand", weight: "15%" },
  { key: "costRiskEfficiency" as const, label: "Cost & Risk", weight: "15%" },
];
