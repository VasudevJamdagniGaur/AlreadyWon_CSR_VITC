import { clamp, round1 } from "@/lib/utils";
import { DEFAULT_WEIGHTS, type ScoringWeights } from "@/lib/validation";
import type {
  CompanyProfile,
  ProjectScoreResult,
  RecommendationLevel,
  ScoreDimensionResult,
  ScoringDimension,
} from "@/types";

export interface ScoringProjectInput {
  name: string;
  category?: string | null;
  description?: string | null;
  geography?: string[];
  beneficiaryCount?: number;
  beneficiaryGroups?: string[];
  requestedBudget?: number;
  durationMonths?: number;
  outcomes?: string[];
  risks?: string[];
  requiredExpertise?: string[];
  pastExperience?: string | null;
  evidenceCount?: number;
  dataCompleteness?: number; // 0-1
}

export interface NGOHistoryInput {
  completionRate?: number;
  milestonePerformance?: number;
  avgBudgetVariance?: number;
  avgDelayMonths?: number;
  projectCount?: number;
  executionReliability?: number;
}

function recommendationFromScore(score: number): RecommendationLevel {
  if (score >= 85) return "STRATEGIC";
  if (score >= 75) return "HIGH_PRIORITY";
  if (score >= 60) return "CONSIDER";
  return "LOW_PRIORITY";
}

function socialImpactScore(project: ScoringProjectInput): ScoreDimensionResult {
  const evidence: string[] = [];
  let score = 50;

  const count = project.beneficiaryCount ?? 0;
  if (count > 0) {
    // Non-linear: diminishing returns — not pure count scoring
    const reachScore = clamp(20 + Math.log10(count + 1) * 18, 20, 45);
    score += reachScore - 20;
    evidence.push(`${count.toLocaleString("en-IN")} projected beneficiaries`);
  } else {
    evidence.push("Beneficiary count not evidenced in proposal");
  }

  if ((project.outcomes?.length ?? 0) >= 2) {
    score += 12;
    evidence.push("Measurable target outcomes specified");
  } else if ((project.outcomes?.length ?? 0) === 1) {
    score += 6;
    evidence.push("Limited outcome definition");
  }

  if (project.durationMonths && project.durationMonths >= 12) {
    score += 8;
    evidence.push(`${project.durationMonths}-month sustainability horizon`);
  }

  if ((project.beneficiaryGroups?.length ?? 0) > 0) {
    score += 5;
    evidence.push(`Focus groups: ${project.beneficiaryGroups!.slice(0, 3).join(", ")}`);
  }

  // Urgency proxy via category
  const urgentCategories = ["healthcare", "water", "maternal", "education"];
  if (
    project.category &&
    urgentCategories.some((c) => project.category!.toLowerCase().includes(c))
  ) {
    score += 7;
    evidence.push("Addresses high-urgency social need category");
  }

  score = clamp(score, 0, 100);
  const confidence = clamp(
    0.4 +
      (count > 0 ? 0.2 : 0) +
      ((project.outcomes?.length ?? 0) > 0 ? 0.15 : 0) +
      (project.dataCompleteness ?? 0.3) * 0.25,
    0,
    1
  );

  return {
    score: round1(score),
    confidence: round1(confidence * 100) / 100,
    explanation:
      count > 0
        ? "Expected reach and outcome quality support a meaningful social impact profile."
        : "Not enough evidence on beneficiary reach to fully assess social impact.",
    evidence,
  };
}

function executionReliabilityScore(
  project: ScoringProjectInput,
  ngoHistory?: NGOHistoryInput
): ScoreDimensionResult {
  const evidence: string[] = [];
  let score = 55;

  if (ngoHistory && (ngoHistory.projectCount ?? 0) > 0) {
    if (ngoHistory.executionReliability != null) {
      score = ngoHistory.executionReliability * 0.7 + 20;
      evidence.push(
        `Historical execution reliability: ${ngoHistory.executionReliability.toFixed(0)}/100`
      );
    }
    if (ngoHistory.milestonePerformance != null) {
      score = (score + ngoHistory.milestonePerformance) / 2 + 10;
      evidence.push(
        `Milestone completion performance: ${ngoHistory.milestonePerformance.toFixed(0)}%`
      );
    }
    if (ngoHistory.avgBudgetVariance != null) {
      if (Math.abs(ngoHistory.avgBudgetVariance) < 5) {
        score += 8;
        evidence.push("Low historical budget variance");
      } else if (Math.abs(ngoHistory.avgBudgetVariance) > 15) {
        score -= 10;
        evidence.push("Elevated historical budget variance");
      }
    }
    if ((ngoHistory.avgDelayMonths ?? 0) > 2) {
      score -= 8;
      evidence.push(`Average delay history: ${ngoHistory.avgDelayMonths} months`);
    }
  } else {
    // Cold start — do not punish; use proposal signals, reduce confidence
    evidence.push("Limited historical evidence — using proposal signals");
    if (project.pastExperience) {
      score += 10;
      evidence.push("Relevant past experience described in proposal");
    }
    if ((project.requiredExpertise?.length ?? 0) > 0) {
      score += 5;
      evidence.push("Implementation expertise requirements identified");
    }
  }

  if ((project.risks?.length ?? 0) > 3) {
    score -= 5;
    evidence.push("Multiple implementation risks disclosed");
  }

  score = clamp(score, 0, 100);
  const hasHistory = (ngoHistory?.projectCount ?? 0) > 0;
  const confidence = hasHistory
    ? clamp(0.75 + (project.dataCompleteness ?? 0.3) * 0.2, 0, 1)
    : clamp(0.45 + (project.pastExperience ? 0.15 : 0), 0, 1);

  return {
    score: round1(score),
    confidence: round1(confidence * 100) / 100,
    explanation: hasHistory
      ? "Available evidence indicates delivery consistency based on historical execution."
      : "Limited historical evidence; reliability estimated from proposal quality signals.",
    evidence,
  };
}

function companyAlignmentScore(
  project: ScoringProjectInput,
  company: CompanyProfile
): ScoreDimensionResult {
  const evidence: string[] = [];
  let score = 40;

  const category = (project.category ?? "").toLowerCase();
  const focusHits = company.csrFocus.filter(
    (f) =>
      category.includes(f.toLowerCase()) ||
      (project.description ?? "").toLowerCase().includes(f.toLowerCase()) ||
      (project.outcomes ?? []).some((o) => o.toLowerCase().includes(f.toLowerCase().split(" ")[0]))
  );
  if (focusHits.length > 0) {
    score += Math.min(25, focusHits.length * 10);
    evidence.push(`Aligns with CSR focus: ${focusHits.join(", ")}`);
  } else {
    evidence.push("Limited direct match to stated CSR focus areas");
  }

  const geo = project.geography ?? [];
  const geoHits = geo.filter((g) =>
    company.targetRegions.some(
      (r) =>
        g.toLowerCase().includes(r.toLowerCase()) ||
        r.toLowerCase().includes(g.toLowerCase())
    )
  );
  if (geoHits.length > 0) {
    score += Math.min(20, geoHits.length * 8);
    evidence.push(`Geography overlap: ${geoHits.join(", ")}`);
  } else if (geo.length > 0) {
    score += 5;
    evidence.push("Geography specified but outside primary target regions");
  }

  const benGroups = project.beneficiaryGroups ?? [];
  const benHits = benGroups.filter((b) =>
    company.beneficiaryGroups.some(
      (cb) =>
        b.toLowerCase().includes(cb.toLowerCase()) ||
        cb.toLowerCase().includes(b.toLowerCase())
    )
  );
  if (benHits.length > 0) {
    score += 10;
    evidence.push(`Beneficiary alignment: ${benHits.slice(0, 2).join(", ")}`);
  }

  const themeHits = company.strategicThemes.filter((t) =>
    category.includes(t.toLowerCase().split(" ")[0]) ||
    (project.description ?? "").toLowerCase().includes(t.toLowerCase())
  );
  if (themeHits.length > 0) {
    score += 8;
    evidence.push(`Strategic theme relevance: ${themeHits[0]}`);
  }

  score = clamp(score, 0, 100);
  return {
    score: round1(score),
    confidence: clamp(0.5 + (focusHits.length > 0 ? 0.2 : 0) + (geoHits.length > 0 ? 0.15 : 0), 0, 1),
    explanation:
      focusHits.length > 0
        ? "Project focus areas and geography show meaningful alignment with company CSR priorities."
        : "Alignment is moderate; limited overlap with primary company CSR priorities.",
    evidence,
  };
}

function communityBrandResonanceScore(
  project: ScoringProjectInput,
  company: CompanyProfile
): ScoreDimensionResult {
  // NOT a publicity score — genuine community/ecosystem relevance
  const evidence: string[] = [];
  let score = 45;

  const geo = project.geography ?? [];
  const localPresence = geo.filter((g) =>
    company.targetRegions.some(
      (r) =>
        g.toLowerCase().includes(r.toLowerCase()) ||
        r.toLowerCase().includes(g.toLowerCase())
    )
  );
  if (localPresence.length > 0) {
    score += 18;
    evidence.push(
      `Genuine relevance to company communities in ${localPresence.join(", ")}`
    );
  }

  const themes = company.strategicThemes.map((t) => t.toLowerCase());
  const desc = `${project.category ?? ""} ${project.description ?? ""}`.toLowerCase();
  const themeMatch = themes.filter((t) => desc.includes(t.split(" ")[0]));
  if (themeMatch.length > 0) {
    score += 15;
    evidence.push(
      `Connects to company strategic identity: ${company.strategicThemes.filter((t) => themeMatch.some((m) => t.toLowerCase().startsWith(m.split(" ")[0]))).slice(0, 2).join(", ")}`
    );
  }

  const ecosystemKeywords = ["employee", "youth", "sports", "local", "community", "customer"];
  const ecoHits = ecosystemKeywords.filter((k) => desc.includes(k));
  if (ecoHits.length > 0) {
    score += 10;
    evidence.push("Relevant to local ecosystem and community stakeholders");
  }

  if ((project.beneficiaryGroups?.length ?? 0) > 0) {
    score += 5;
    evidence.push("Clear community beneficiary definition");
  }

  score = clamp(score, 0, 100);
  return {
    score: round1(score),
    confidence: clamp(0.55 + (localPresence.length > 0 ? 0.2 : 0), 0, 1),
    explanation:
      "Assessed for genuine relevance to the company's communities, employees, local ecosystem, and strategic identity — not as a publicity metric.",
    evidence,
  };
}

function costRiskEfficiencyScore(
  project: ScoringProjectInput,
  ngoHistory?: NGOHistoryInput
): ScoreDimensionResult {
  const evidence: string[] = [];
  let score = 55;

  const budget = project.requestedBudget ?? 0;
  const beneficiaries = project.beneficiaryCount ?? 0;

  if (budget > 0 && beneficiaries > 0) {
    const costPerBeneficiary = budget / beneficiaries;
    // Prefer realistic efficiency (not unrealistically low)
    if (costPerBeneficiary >= 500 && costPerBeneficiary <= 15000) {
      score += 15;
      evidence.push(
        `Impact efficiency: ₹${Math.round(costPerBeneficiary).toLocaleString("en-IN")} per beneficiary`
      );
    } else if (costPerBeneficiary < 500) {
      score += 5;
      evidence.push("Very low cost-per-beneficiary — budget realism should be reviewed");
    } else {
      score += 8;
      evidence.push("Higher investment intensity per beneficiary");
    }
  } else {
    evidence.push("Not enough evidence for impact-per-rupee calculation");
  }

  if ((project.risks?.length ?? 0) === 0) {
    score += 5;
    evidence.push("No major risks disclosed (verify completeness)");
  } else if ((project.risks?.length ?? 0) <= 2) {
    score += 8;
    evidence.push("Manageable risk profile disclosed");
  } else {
    score -= 5;
    evidence.push(`${project.risks!.length} risk factors identified`);
  }

  if (ngoHistory) {
    if ((ngoHistory.avgBudgetVariance ?? 0) < 5 && (ngoHistory.projectCount ?? 0) > 0) {
      score += 12;
      evidence.push("Strong financial delivery record");
    } else if ((ngoHistory.avgBudgetVariance ?? 0) > 15) {
      score -= 12;
      evidence.push("Previous overrun history reduces efficiency score");
    }
    if ((ngoHistory.avgDelayMonths ?? 0) > 2) {
      score -= 8;
      evidence.push("Elevated delay probability from history");
    }
  }

  if (project.durationMonths && budget > 0) {
    const monthlyBurn = budget / project.durationMonths;
    if (monthlyBurn < 500000) {
      score += 5;
      evidence.push("Phased budget profile appears manageable");
    }
  }

  score = clamp(score, 0, 100);
  return {
    score: round1(score),
    confidence: clamp(
      0.5 + (budget > 0 ? 0.15 : 0) + (beneficiaries > 0 ? 0.15 : 0) + ((ngoHistory?.projectCount ?? 0) > 0 ? 0.1 : 0),
      0,
      1
    ),
    explanation:
      "Evaluates impact per rupee, budget realism, overrun risk, and operational uncertainty.",
    evidence,
  };
}

/**
 * Deterministic weighted scoring engine.
 * AI extracts information; this engine decides numerical scores.
 * Formula: S = 0.30(I) + 0.20(R) + 0.20(A) + 0.15(C) + 0.15(E)
 */
export function scoreProject(
  project: ScoringProjectInput,
  company: CompanyProfile,
  ngoHistory?: NGOHistoryInput,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): ProjectScoreResult {
  const socialImpact = socialImpactScore(project);
  const executionReliability = executionReliabilityScore(project, ngoHistory);
  const companyAlignment = companyAlignmentScore(project, company);
  const communityBrandResonance = communityBrandResonanceScore(project, company);
  const costRiskEfficiency = costRiskEfficiencyScore(project, ngoHistory);

  const contributions: Record<ScoringDimension, number> = {
    socialImpact: round1(socialImpact.score * (weights.socialImpact / 100)),
    executionReliability: round1(
      executionReliability.score * (weights.executionReliability / 100)
    ),
    companyAlignment: round1(companyAlignment.score * (weights.companyAlignment / 100)),
    communityBrandResonance: round1(
      communityBrandResonance.score * (weights.communityBrandResonance / 100)
    ),
    costRiskEfficiency: round1(
      costRiskEfficiency.score * (weights.costRiskEfficiency / 100)
    ),
  };

  const overallScore = round1(
    Object.values(contributions).reduce((a, b) => a + b, 0)
  );

  const confidence = round1(
    ((socialImpact.confidence +
      executionReliability.confidence +
      companyAlignment.confidence +
      communityBrandResonance.confidence +
      costRiskEfficiency.confidence) /
      5) *
      100
  ) / 100;

  const recommendationLevel = recommendationFromScore(overallScore);

  return {
    overallScore,
    dimensions: {
      socialImpact,
      executionReliability,
      companyAlignment,
      communityBrandResonance,
      costRiskEfficiency,
    },
    confidence,
    explanation: `Weighted decision score of ${overallScore}/100 using configurable criteria. Recommended for ${recommendationLevel.replace(/_/g, " ").toLowerCase()} review.`,
    recommendationLevel,
    contributions,
  };
}

export function validateWeights(weights: ScoringWeights): boolean {
  const total =
    weights.socialImpact +
    weights.executionReliability +
    weights.companyAlignment +
    weights.communityBrandResonance +
    weights.costRiskEfficiency;
  return Math.abs(total - 100) < 0.01;
}
