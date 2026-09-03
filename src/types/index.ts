export const PROJECT_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "FUNDED",
  "IN_PROGRESS",
  "MONITORING",
  "COMPLETED",
  "CLOSED",
  "AT_RISK",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const MILESTONE_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "DELAYED",
  "AT_RISK",
] as const;

export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const RECOMMENDATION_LEVELS = [
  "LOW_PRIORITY",
  "CONSIDER",
  "HIGH_PRIORITY",
  "STRATEGIC",
] as const;

export type RecommendationLevel = (typeof RECOMMENDATION_LEVELS)[number];

export const DOCUMENT_TYPES = [
  "PROJECT_PROPOSAL",
  "ANNUAL_REPORT",
  "IMPACT_REPORT",
  "FINANCIAL_REPORT",
  "PROJECT_REPORT",
  "ORGANIZATION_PROFILE",
  "OTHER",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const NOTIFICATION_TYPES = [
  "PROJECT_AT_RISK",
  "MILESTONE_OVERDUE",
  "BUDGET_VARIANCE",
  "MISSING_REPORT",
  "NEW_RECOMMENDATION",
  "DOCUMENT_PROCESSED",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const SCORING_DIMENSIONS = [
  "socialImpact",
  "executionReliability",
  "companyAlignment",
  "communityBrandResonance",
  "costRiskEfficiency",
] as const;

export type ScoringDimension = (typeof SCORING_DIMENSIONS)[number];

export const DIMENSION_LABELS: Record<ScoringDimension, string> = {
  socialImpact: "Social Impact",
  executionReliability: "Execution Reliability",
  companyAlignment: "Company Alignment",
  communityBrandResonance: "Community & Brand Resonance",
  costRiskEfficiency: "Cost & Risk Efficiency",
};

export const LIFECYCLE_STAGES = [
  { key: "SUBMITTED", label: "Proposal" },
  { key: "UNDER_REVIEW", label: "Evaluation" },
  { key: "APPROVED", label: "Approval" },
  { key: "FUNDED", label: "Funding" },
  { key: "IN_PROGRESS", label: "Implementation" },
  { key: "MONITORING", label: "Monitoring" },
  { key: "COMPLETED", label: "Closure" },
] as const;

export interface ScoreDimensionResult {
  score: number;
  confidence: number;
  explanation: string;
  evidence: string[];
}

export interface ProjectScoreResult {
  overallScore: number;
  dimensions: {
    socialImpact: ScoreDimensionResult;
    executionReliability: ScoreDimensionResult;
    companyAlignment: ScoreDimensionResult;
    communityBrandResonance: ScoreDimensionResult;
    costRiskEfficiency: ScoreDimensionResult;
  };
  confidence: number;
  explanation: string;
  recommendationLevel: RecommendationLevel;
  contributions: Record<ScoringDimension, number>;
}

export interface MatchResult {
  ngoId: string;
  ngoName: string;
  matchScore: number;
  expertiseMatch: number;
  geographicMatch: number;
  beneficiaryMatch: number;
  executionReliability: number;
  relevantExperience: number;
  riskScore: number;
  confidence: number;
  reasons: string[];
  risks: string[];
  limitedHistory: boolean;
}

export interface AllocationItem {
  projectId: string;
  projectName: string;
  score: number;
  requested: number;
  recommended: number;
  coverage: number;
  expectedImpact: number;
  riskLevel: string;
  explanation: string;
  efficiency: number;
}

export interface RiskAssessment {
  level: RiskLevel;
  title: string;
  reason: string;
  affectedArea: string;
  recommendedAction: string;
}

export interface CompanyProfile {
  name: string;
  industries: string[];
  csrFocus: string[];
  targetRegions: string[];
  beneficiaryGroups: string[];
  strategicThemes: string[];
  annualBudget: number;
}
