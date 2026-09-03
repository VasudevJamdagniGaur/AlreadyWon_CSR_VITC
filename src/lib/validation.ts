import { z } from "zod";

export const ScoringWeightsSchema = z
  .object({
    socialImpact: z.number().min(0).max(100),
    executionReliability: z.number().min(0).max(100),
    companyAlignment: z.number().min(0).max(100),
    communityBrandResonance: z.number().min(0).max(100),
    costRiskEfficiency: z.number().min(0).max(100),
  })
  .refine(
    (w) =>
      Math.abs(
        w.socialImpact +
          w.executionReliability +
          w.companyAlignment +
          w.communityBrandResonance +
          w.costRiskEfficiency -
          100
      ) < 0.01,
    { message: "All weights must total 100%" }
  );

export type ScoringWeights = z.infer<typeof ScoringWeightsSchema>;

export const DEFAULT_WEIGHTS: ScoringWeights = {
  socialImpact: 30,
  executionReliability: 20,
  companyAlignment: 20,
  communityBrandResonance: 15,
  costRiskEfficiency: 15,
};

export const ProjectExtractionSchema = z.object({
  projectName: z.string(),
  organization: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  geography: z.array(z.string()).default([]),
  beneficiaries: z
    .object({
      count: z.number().default(0),
      groups: z.array(z.string()).default([]),
    })
    .default({ count: 0, groups: [] }),
  requestedBudget: z.number().default(0),
  durationMonths: z.number().default(12),
  objectives: z.array(z.string()).default([]),
  outcomes: z.array(z.string()).default([]),
  milestones: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        month: z.number().optional(),
      })
    )
    .default([]),
  risks: z.array(z.string()).default([]),
  requiredExpertise: z.array(z.string()).default([]),
  dependencies: z.array(z.string()).default([]),
  implementationModel: z.string().optional(),
  pastExperience: z.string().optional(),
  evidence: z
    .array(
      z.object({
        field: z.string(),
        value: z.string(),
        source: z.string().optional(),
        sourceExcerpt: z.string().optional(),
        confidence: z.number().min(0).max(1).default(0.7),
      })
    )
    .default([]),
});

export type ProjectExtraction = z.infer<typeof ProjectExtractionSchema>;

export const NGOExtractionSchema = z.object({
  organization: z.string(),
  mission: z.string().optional(),
  expertise: z.array(z.string()).default([]),
  regions: z.array(z.string()).default([]),
  beneficiaries: z.array(z.string()).default([]),
  projects: z.array(z.string()).default([]),
  experience: z.number().optional(),
  operationalCapacity: z.string().optional(),
  reportedOutcomes: z.array(z.string()).default([]),
  budgetInformation: z.string().optional(),
  riskIndicators: z.array(z.string()).default([]),
  evidence: z
    .array(
      z.object({
        field: z.string(),
        value: z.string(),
        source: z.string().optional(),
        sourceExcerpt: z.string().optional(),
        confidence: z.number().min(0).max(1).default(0.7),
      })
    )
    .default([]),
});

export type NGOExtraction = z.infer<typeof NGOExtractionSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const OverrideSchema = z.object({
  reason: z.string().min(5, "Override reason is required (min 5 characters)"),
  value: z.union([z.number(), z.string()]),
});

export const MilestoneInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "DELAYED", "AT_RISK"]).optional(),
  expectedProgress: z.number().min(0).max(100).optional(),
  actualProgress: z.number().min(0).max(100).optional(),
  owner: z.string().optional(),
});

export const AllocationRequestSchema = z.object({
  totalBudget: z.number().positive(),
  projectIds: z.array(z.string()).min(1),
  minAllocationPct: z.number().min(0).max(100).optional(),
  maxAllocationPct: z.number().min(0).max(100).optional(),
});
