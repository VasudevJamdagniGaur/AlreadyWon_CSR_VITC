import { round1 } from "@/lib/utils";
import type { RiskAssessment, RiskLevel } from "@/types";

export interface RiskEngineInput {
  projectName: string;
  expectedProgress: number;
  actualProgress: number;
  overdueMilestones: number;
  delayedMilestones: number;
  budgetApproved: number;
  budgetSpent: number;
  expectedSpendPct?: number;
  missingProgressReport?: boolean;
  repeatedDelays?: number;
  dependencyOverdue?: boolean;
  implementationIssues?: string[];
}

/**
 * Deterministic risk analysis engine.
 */
export function analyzeProjectRisks(input: RiskEngineInput): RiskAssessment[] {
  const risks: RiskAssessment[] = [];
  const progressGap = input.expectedProgress - input.actualProgress;

  if (progressGap >= 20) {
    risks.push({
      level: "HIGH",
      title: "High Delay Risk",
      reason: `Project is ${round1(progressGap)}% behind expected milestone trajectory.`,
      affectedArea: "Schedule",
      recommendedAction:
        "Request updated implementation plan and milestone recovery timeline.",
    });
  } else if (progressGap >= 10) {
    risks.push({
      level: "MEDIUM",
      title: "Progress Gap Detected",
      reason: `Project is ${round1(progressGap)}% behind expected progress.`,
      affectedArea: "Schedule",
      recommendedAction: "Review milestone owners and remove blockers.",
    });
  } else if (progressGap >= 5) {
    risks.push({
      level: "LOW",
      title: "Minor Progress Variance",
      reason: `Project is ${round1(progressGap)}% behind expected trajectory.`,
      affectedArea: "Schedule",
      recommendedAction: "Monitor next reporting cycle closely.",
    });
  }

  if (input.overdueMilestones > 0) {
    risks.push({
      level: input.overdueMilestones >= 2 ? "HIGH" : "MEDIUM",
      title: "Overdue Milestone",
      reason: `${input.overdueMilestones} milestone(s) past due date.`,
      affectedArea: "Milestones",
      recommendedAction: "Escalate overdue milestones and rebaseline dates if needed.",
    });
  }

  if (input.delayedMilestones > 0 && input.overdueMilestones === 0) {
    risks.push({
      level: "MEDIUM",
      title: "Milestone Delay",
      reason: `${input.delayedMilestones} milestone(s) marked delayed.`,
      affectedArea: "Milestones",
      recommendedAction: "Identify root cause and adjust dependent activities.",
    });
  }

  if (input.budgetApproved > 0) {
    const spentPct = (input.budgetSpent / input.budgetApproved) * 100;
    const expectedSpend = input.expectedSpendPct ?? input.expectedProgress;
    const burnGap = spentPct - expectedSpend;

    if (burnGap >= 20) {
      risks.push({
        level: "HIGH",
        title: "Budget Overrun Risk",
        reason: `Expenditure (${round1(spentPct)}%) significantly exceeds expected spend (${round1(expectedSpend)}%).`,
        affectedArea: "Budget",
        recommendedAction: "Freeze non-critical spend and request financial reconciliation.",
      });
    } else if (burnGap >= 10) {
      risks.push({
        level: "MEDIUM",
        title: "Budget Variance",
        reason: `Spend variance of ${round1(burnGap)}% above expected burn.`,
        affectedArea: "Budget",
        recommendedAction: "Review cost centers and forecast remaining spend.",
      });
    }
  }

  if (input.missingProgressReport) {
    risks.push({
      level: "MEDIUM",
      title: "Missing Progress Report",
      reason: "Expected progress report has not been submitted.",
      affectedArea: "Reporting",
      recommendedAction: "Request immediate status update from implementation partner.",
    });
  }

  if ((input.repeatedDelays ?? 0) >= 2) {
    risks.push({
      level: "HIGH",
      title: "Repeated Delays",
      reason: `${input.repeatedDelays} repeated delay events recorded.`,
      affectedArea: "Execution",
      recommendedAction: "Conduct delivery review with partner leadership.",
    });
  }

  if (input.dependencyOverdue) {
    risks.push({
      level: "MEDIUM",
      title: "Dependency Overdue",
      reason: "A critical dependency is overdue.",
      affectedArea: "Dependencies",
      recommendedAction: "Resolve dependency blockers before continuing dependent workstreams.",
    });
  }

  if (input.implementationIssues && input.implementationIssues.length > 0) {
    risks.push({
      level: "MEDIUM",
      title: "Implementation Issue",
      reason: input.implementationIssues[0],
      affectedArea: "Operations",
      recommendedAction: "Document issue and assign owner with target resolution date.",
    });
  }

  return risks;
}

export function highestRiskLevel(risks: RiskAssessment[]): RiskLevel {
  const order: RiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  let max: RiskLevel = "LOW";
  for (const r of risks) {
    if (order.indexOf(r.level) > order.indexOf(max)) max = r.level;
  }
  return max;
}

export function budgetHealthStatus(
  approved: number,
  spent: number,
  expectedProgress: number
): "HEALTHY" | "AMBER" | "RED" {
  if (approved <= 0) return "HEALTHY";
  const spentPct = (spent / approved) * 100;
  const variance = spentPct - expectedProgress;
  if (variance >= 20) return "RED";
  if (variance >= 10) return "AMBER";
  return "HEALTHY";
}

export function calculateBudgetVariance(
  approved: number,
  spent: number,
  expectedSpend: number
): { spentPct: number; variance: number; remaining: number; burnRateHint: number } {
  const spentPct = approved > 0 ? round1((spent / approved) * 100) : 0;
  const variance = round1(spent - expectedSpend);
  const remaining = round1(approved - spent);
  return { spentPct, variance, remaining, burnRateHint: spentPct };
}
