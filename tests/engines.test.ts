import { describe, it, expect } from "vitest";
import {
  scoreProject,
  validateWeights,
} from "@/services/scoring/projectScoring";
import { DEFAULT_WEIGHTS } from "@/lib/validation";
import { calculateConfidence, estimateProjectCompleteness } from "@/services/scoring/confidence";
import {
  allocateBudget,
  allocationWithinBudget,
  knapsackAllocate,
} from "@/services/allocation/allocationEngine";
import { matchNGOsToProject, textSimilarity } from "@/services/matching/ngoMatching";
import {
  analyzeProjectRisks,
  highestRiskLevel,
  budgetHealthStatus,
  calculateBudgetVariance,
} from "@/services/risk/riskEngine";
import { ScoringWeightsSchema } from "@/lib/validation";
import { cosineSimilarity, simpleEmbed, chunkText, validateUpload } from "@/services/documents/extraction";
import type { CompanyProfile } from "@/types";

const company: CompanyProfile = {
  name: "Northstar Industries",
  industries: ["Manufacturing"],
  csrFocus: ["Education", "Healthcare", "Sports & Youth Development"],
  targetRegions: ["Haryana", "Delhi NCR", "Punjab", "Rajasthan"],
  beneficiaryGroups: ["Students", "Women", "Youth", "Rural Communities"],
  strategicThemes: ["Sports ecosystem", "Rural education"],
  annualBudget: 50000000,
};

const sunrise = {
  name: "Project Sunrise",
  category: "Education",
  description: "Digital learning for rural students in Haryana sports-adjacent communities",
  geography: ["Haryana", "Punjab"],
  beneficiaryCount: 2400,
  beneficiaryGroups: ["Students", "Teachers", "Rural Communities"],
  requestedBudget: 8000000,
  durationMonths: 18,
  outcomes: ["Improved reading", "Teacher competency", "Lab sustainability"],
  risks: ["Device maintenance", "Teacher attrition"],
  requiredExpertise: ["Education", "Digital Learning"],
  dataCompleteness: 0.9,
  evidenceCount: 5,
};

describe("project scoring", () => {
  it("returns deterministic scores for same inputs", () => {
    const a = scoreProject(sunrise, company);
    const b = scoreProject(sunrise, company);
    expect(a.overallScore).toBe(b.overallScore);
    expect(a.dimensions.socialImpact.score).toBe(b.dimensions.socialImpact.score);
  });

  it("includes all five KellyOS dimensions", () => {
    const result = scoreProject(sunrise, company);
    expect(result.dimensions.socialImpact).toBeDefined();
    expect(result.dimensions.executionReliability).toBeDefined();
    expect(result.dimensions.companyAlignment).toBeDefined();
    expect(result.dimensions.communityBrandResonance).toBeDefined();
    expect(result.dimensions.costRiskEfficiency).toBeDefined();
  });

  it("contributions sum to overall score within rounding", () => {
    const result = scoreProject(sunrise, company, undefined, DEFAULT_WEIGHTS);
    const sum = Object.values(result.contributions).reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - result.overallScore)).toBeLessThan(0.2);
  });

  it("ranks education+geography aligned project highly on alignment", () => {
    const result = scoreProject(sunrise, company);
    expect(result.dimensions.companyAlignment.score).toBeGreaterThan(60);
  });

  it("does not invent high social impact without beneficiaries", () => {
    const result = scoreProject(
      { ...sunrise, beneficiaryCount: 0, outcomes: [], dataCompleteness: 0.2 },
      company
    );
    expect(result.dimensions.socialImpact.confidence).toBeLessThan(0.7);
  });
});

describe("weight validation", () => {
  it("accepts default weights totaling 100", () => {
    expect(validateWeights(DEFAULT_WEIGHTS)).toBe(true);
    expect(ScoringWeightsSchema.safeParse(DEFAULT_WEIGHTS).success).toBe(true);
  });

  it("rejects weights that do not total 100", () => {
    expect(
      validateWeights({
        socialImpact: 50,
        executionReliability: 20,
        companyAlignment: 20,
        communityBrandResonance: 15,
        costRiskEfficiency: 15,
      })
    ).toBe(false);
    expect(
      ScoringWeightsSchema.safeParse({
        socialImpact: 50,
        executionReliability: 20,
        companyAlignment: 20,
        communityBrandResonance: 15,
        costRiskEfficiency: 15,
      }).success
    ).toBe(false);
  });
});

describe("confidence", () => {
  it("increases with evidence coverage and history", () => {
    const low = calculateConfidence({
      evidenceCoverage: 0.2,
      sourceQuality: 0.3,
      dataCompleteness: 0.2,
      historicalEvidence: 0,
    });
    const high = calculateConfidence({
      evidenceCoverage: 0.9,
      sourceQuality: 0.9,
      dataCompleteness: 0.9,
      historicalEvidence: 0.8,
    });
    expect(high).toBeGreaterThan(low);
  });

  it("estimates completeness from fields", () => {
    const c = estimateProjectCompleteness({
      name: true,
      category: true,
      geography: true,
      beneficiaries: true,
      budget: true,
      outcomes: false,
      milestones: false,
      risks: false,
      expertise: false,
    });
    expect(c).toBeCloseTo(5 / 9);
  });
});

describe("allocation engine", () => {
  const projects = [
    {
      projectId: "1",
      projectName: "Sunrise",
      score: 88,
      requestedBudget: 8000000,
      riskLevel: "LOW",
      confidence: 0.85,
    },
    {
      projectId: "2",
      projectName: "Asha",
      score: 82,
      requestedBudget: 6000000,
      riskLevel: "MEDIUM",
      confidence: 0.8,
    },
    {
      projectId: "3",
      projectName: "GreenStep",
      score: 65,
      requestedBudget: 3500000,
      riskLevel: "LOW",
      confidence: 0.6,
    },
  ];

  it("stays within total budget", () => {
    const items = allocateBudget({ totalBudget: 10000000, projects });
    expect(allocationWithinBudget(items, 10000000)).toBe(true);
  });

  it("does not recommend more than requested", () => {
    const items = allocateBudget({ totalBudget: 50000000, projects });
    for (const item of items) {
      expect(item.recommended).toBeLessThanOrEqual(item.requested + 1);
    }
  });

  it("favors higher score projects with more coverage when budget limited", () => {
    const items = allocateBudget({ totalBudget: 8000000, projects });
    const sunrise = items.find((i) => i.projectId === "1")!;
    const green = items.find((i) => i.projectId === "3")!;
    expect(sunrise.recommended).toBeGreaterThanOrEqual(green.recommended);
  });

  it("knapsack abstraction returns allocations", () => {
    const items = knapsackAllocate(5000000, projects);
    expect(items.length).toBe(3);
    expect(allocationWithinBudget(items, 5000000)).toBe(true);
  });

  it("includes explanation for each recommendation", () => {
    const items = allocateBudget({ totalBudget: 10000000, projects });
    for (const item of items) {
      expect(item.explanation.length).toBeGreaterThan(10);
    }
  });
});

describe("NGO matching", () => {
  const project = {
    id: "p1",
    name: "Project Sunrise",
    category: "Education",
    geography: ["Haryana", "Punjab"],
    beneficiaryGroups: ["Students", "Teachers"],
    requiredExpertise: ["Education", "Digital Learning"],
    description: "Digital learning labs",
  };

  const ngos = [
    {
      id: "n1",
      name: "Seva Foundation",
      primaryExpertise: ["Education", "Digital Learning", "Teacher Training"],
      regions: ["Haryana", "Punjab", "Delhi NCR"],
      beneficiaryGroups: ["Students", "Teachers", "Rural Communities"],
      yearsOfExperience: 14,
      projectCount: 12,
      executionReliability: 87,
      isNew: false,
      riskFlags: [],
      historyCategories: ["Education"],
      historyGeographies: ["Haryana"],
    },
    {
      id: "n2",
      name: "GreenStep Society",
      primaryExpertise: ["Environment"],
      regions: ["Delhi NCR"],
      beneficiaryGroups: ["Students"],
      yearsOfExperience: 3,
      projectCount: 0,
      executionReliability: null,
      isNew: true,
      riskFlags: ["Limited historical evidence"],
      historyCategories: [],
      historyGeographies: [],
    },
  ];

  it("ranks Seva Foundation above GreenStep for education project", () => {
    const matches = matchNGOsToProject(project, ngos);
    expect(matches[0].ngoName).toBe("Seva Foundation");
    expect(matches[0].matchScore).toBeGreaterThan(matches[1].matchScore);
  });

  it("does not punish new NGOs with zero execution score", () => {
    const matches = matchNGOsToProject(project, ngos);
    const green = matches.find((m) => m.ngoName === "GreenStep Society")!;
    expect(green.limitedHistory).toBe(true);
    expect(green.executionReliability).toBeGreaterThanOrEqual(60);
    expect(green.confidence).toBeLessThan(0.8);
  });

  it("computes text similarity", () => {
    expect(textSimilarity("digital learning education", "education digital labs")).toBeGreaterThan(0.2);
  });
});

describe("risk engine", () => {
  it("flags high delay risk when progress gap >= 20", () => {
    const risks = analyzeProjectRisks({
      projectName: "Sunrise",
      expectedProgress: 70,
      actualProgress: 45,
      overdueMilestones: 0,
      delayedMilestones: 0,
      budgetApproved: 8000000,
      budgetSpent: 4000000,
    });
    expect(risks.some((r) => r.level === "HIGH")).toBe(true);
    expect(highestRiskLevel(risks)).toBe("HIGH");
  });

  it("flags overdue milestones", () => {
    const risks = analyzeProjectRisks({
      projectName: "Sunrise",
      expectedProgress: 50,
      actualProgress: 50,
      overdueMilestones: 2,
      delayedMilestones: 0,
      budgetApproved: 100,
      budgetSpent: 40,
    });
    expect(risks.some((r) => r.title.includes("Overdue"))).toBe(true);
  });

  it("computes budget health statuses", () => {
    expect(budgetHealthStatus(100, 50, 50)).toBe("HEALTHY");
    expect(budgetHealthStatus(100, 65, 50)).toBe("AMBER");
    expect(budgetHealthStatus(100, 80, 50)).toBe("RED");
  });

  it("calculates budget variance", () => {
    const v = calculateBudgetVariance(1000000, 600000, 500000);
    expect(v.spentPct).toBe(60);
    expect(v.remaining).toBe(400000);
    expect(v.variance).toBe(100000);
  });
});

describe("document extraction helpers", () => {
  it("validates allowed uploads", () => {
    expect(validateUpload("a.pdf", "application/pdf").valid).toBe(true);
    expect(validateUpload("a.exe", "application/octet-stream").valid).toBe(false);
  });

  it("chunks text", () => {
    const chunks = chunkText("Hello world. ".repeat(100), 50, 10);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("cosine similarity of identical vectors is 1", () => {
    const a = simpleEmbed("education digital learning haryana");
    expect(cosineSimilarity(a, a)).toBeCloseTo(1, 5);
  });
});
