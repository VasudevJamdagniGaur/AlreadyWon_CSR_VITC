import type { ProjectExtraction, NGOExtraction } from "@/lib/validation";
import type { ProjectScoreResult, RiskAssessment } from "@/types";

export interface AIProvider {
  name: string;
  isDemo: boolean;
  extractProject(text: string, fileName?: string): Promise<ProjectExtraction>;
  extractNGO(text: string, fileName?: string): Promise<NGOExtraction>;
  explainRecommendation(context: {
    projectName: string;
    score: ProjectScoreResult;
    companyPriorities: string[];
  }): Promise<{
    recommendation: string;
    reasons: string[];
    watchOuts: string[];
    confidence: number;
  }>;
  summarizeReport(context: {
    projectName: string;
    partner?: string;
    objective?: string;
    budget?: number;
    progress?: number;
    milestones?: string[];
    beneficiaries?: number;
    risks?: string[];
  }): Promise<string>;
  analyzeRiskNarrative(risks: RiskAssessment[]): Promise<string>;
}

export function isDemoAI(): boolean {
  const useDemo = process.env.USE_DEMO_AI;
  if (useDemo === "true") return true;
  if (useDemo === "false" && process.env.OPENAI_API_KEY) return false;
  return !process.env.OPENAI_API_KEY;
}
