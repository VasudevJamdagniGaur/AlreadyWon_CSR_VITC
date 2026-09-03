import { clamp, round1 } from "@/lib/utils";

export interface ConfidenceInput {
  evidenceCoverage: number; // 0-1 fraction of expected fields present
  sourceQuality: number; // 0-1
  dataCompleteness: number; // 0-1
  historicalEvidence: number; // 0-1
}

/**
 * Deterministic confidence model.
 * Score ≠ confidence. Missing info reduces confidence, not necessarily score.
 */
export function calculateConfidence(input: ConfidenceInput): number {
  const raw =
    input.evidenceCoverage * 0.35 +
    input.sourceQuality * 0.25 +
    input.dataCompleteness * 0.25 +
    input.historicalEvidence * 0.15;

  return round1(clamp(raw, 0, 1) * 100) / 100;
}

export function estimateProjectCompleteness(fields: {
  name?: boolean;
  category?: boolean;
  geography?: boolean;
  beneficiaries?: boolean;
  budget?: boolean;
  outcomes?: boolean;
  milestones?: boolean;
  risks?: boolean;
  expertise?: boolean;
}): number {
  const checks = [
    fields.name,
    fields.category,
    fields.geography,
    fields.beneficiaries,
    fields.budget,
    fields.outcomes,
    fields.milestones,
    fields.risks,
    fields.expertise,
  ];
  const present = checks.filter(Boolean).length;
  return present / checks.length;
}
