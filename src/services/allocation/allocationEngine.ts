import { clamp, round1 } from "@/lib/utils";
import type { AllocationItem } from "@/types";

export interface AllocationProjectInput {
  projectId: string;
  projectName: string;
  score: number;
  requestedBudget: number;
  riskLevel: string;
  confidence?: number;
}

export interface AllocationOptions {
  totalBudget: number;
  projects: AllocationProjectInput[];
  minAllocationPct?: number;
  maxAllocationPct?: number;
  diversify?: boolean;
}

/**
 * Transparent baseline allocation engine.
 * Higher score + better efficiency + strong confidence → higher recommendation.
 * Does NOT claim mathematical optimality.
 */
export function allocateBudget(options: AllocationOptions): AllocationItem[] {
  const { totalBudget, projects, minAllocationPct = 0, maxAllocationPct = 100 } = options;

  if (projects.length === 0 || totalBudget <= 0) return [];

  const withEfficiency = projects.map((p) => {
    const efficiency = p.requestedBudget > 0 ? p.score / (p.requestedBudget / 100000) : 0;
    const confidenceBoost = p.confidence ?? 0.7;
    const priorityWeight = p.score * 0.6 + efficiency * 0.25 + confidenceBoost * 100 * 0.15;
    return { ...p, efficiency: round1(efficiency), priorityWeight };
  });

  const totalWeight = withEfficiency.reduce((s, p) => s + p.priorityWeight, 0);

  // Initial proportional allocation by priority weight, capped by requested
  let remaining = totalBudget;
  const preliminary = withEfficiency.map((p) => {
    const share = totalWeight > 0 ? p.priorityWeight / totalWeight : 1 / projects.length;
    let recommended = Math.min(p.requestedBudget, totalBudget * share);

    const minAmt = (minAllocationPct / 100) * p.requestedBudget;
    const maxAmt = (maxAllocationPct / 100) * p.requestedBudget;
    recommended = clamp(recommended, minAmt, Math.min(maxAmt, p.requestedBudget));

    return { ...p, recommended: round1(recommended) };
  });

  // Scale down if over budget
  let sumRec = preliminary.reduce((s, p) => s + p.recommended, 0);
  if (sumRec > totalBudget && sumRec > 0) {
    const scale = totalBudget / sumRec;
    for (const p of preliminary) {
      p.recommended = round1(p.recommended * scale);
    }
    sumRec = preliminary.reduce((s, p) => s + p.recommended, 0);
  }

  // Distribute leftover to highest priority projects (up to requested)
  remaining = totalBudget - sumRec;
  const sorted = [...preliminary].sort((a, b) => b.priorityWeight - a.priorityWeight);
  for (const p of sorted) {
    if (remaining <= 0) break;
    const room = p.requestedBudget - p.recommended;
    if (room > 0) {
      const add = Math.min(room, remaining);
      p.recommended = round1(p.recommended + add);
      remaining -= add;
    }
  }

  return preliminary.map((p) => {
    const coverage = p.requestedBudget > 0 ? round1((p.recommended / p.requestedBudget) * 100) : 0;
    const expectedImpact = round1(p.score * (coverage / 100));
    return {
      projectId: p.projectId,
      projectName: p.projectName,
      score: p.score,
      requested: p.requestedBudget,
      recommended: p.recommended,
      coverage,
      expectedImpact,
      riskLevel: p.riskLevel,
      efficiency: p.efficiency,
      explanation: buildExplanation(p.projectName, p.recommended, p.score, p.efficiency, p.riskLevel),
    };
  });
}

function buildExplanation(
  name: string,
  recommended: number,
  score: number,
  efficiency: number,
  risk: string
): string {
  const amount =
    recommended >= 10000000
      ? `₹${(recommended / 10000000).toFixed(2)} Cr`
      : `₹${(recommended / 100000).toFixed(1)} L`;

  const reasons: string[] = [];
  if (score >= 80) reasons.push("high impact score");
  else if (score >= 65) reasons.push("solid impact profile");
  else reasons.push("moderate score relative to portfolio");

  if (efficiency >= 1) reasons.push("favorable impact-per-rupee efficiency");
  if (risk === "LOW") reasons.push("favorable risk-adjusted profile");
  else if (risk === "HIGH" || risk === "CRITICAL")
    reasons.push("elevated risk warrants cautious coverage");

  return `${amount} recommended for ${name} because this project has ${reasons.join(", ")}.`;
}

/** Knapsack-style abstraction for future optimization (baseline greedy). */
export function knapsackAllocate(
  totalBudget: number,
  projects: AllocationProjectInput[]
): AllocationItem[] {
  return allocateBudget({ totalBudget, projects });
}

export function allocationWithinBudget(
  items: AllocationItem[],
  totalBudget: number,
  tolerance = 1
): boolean {
  const sum = items.reduce((s, i) => s + i.recommended, 0);
  return sum <= totalBudget + tolerance;
}
