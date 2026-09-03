/**
 * KellyOS Demo Seed — all data is SYNTHETIC.
 * Label clearly as Demo Data. Do not claim real-world NGO/CSR figures.
 */
import { PrismaClient } from "@prisma/client";
import { scoreProject } from "../src/services/scoring/projectScoring";
import { matchNGOsToProject } from "../src/services/matching/ngoMatching";
import { allocateBudget } from "../src/services/allocation/allocationEngine";
import { analyzeProjectRisks } from "../src/services/risk/riskEngine";
import { DEFAULT_WEIGHTS } from "../src/lib/validation";
import { toJson } from "../src/lib/utils";
import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return createHash("sha256").update(`kellyos:${password}`).digest("hex");
}

const COMPANY = {
  name: "Northstar Industries",
  industries: ["Manufacturing", "Automotive Components"],
  csrFocus: ["Education", "Healthcare", "Community Development", "Sports & Youth Development"],
  targetRegions: ["Haryana", "Delhi NCR", "Punjab", "Rajasthan"],
  beneficiaryGroups: ["Students", "Women", "Youth", "Rural Communities", "Teachers"],
  strategicThemes: ["Sports ecosystem", "Rural education", "Community health", "Youth development"],
  annualBudget: 50000000, // ₹5 Cr
};

type SeedProject = {
  name: string;
  organization: string;
  category: string;
  description: string;
  geography: string[];
  beneficiaries: { count: number; groups: string[] };
  requestedBudget: number;
  durationMonths: number;
  outcomes: string[];
  risks: string[];
  requiredExpertise: string[];
  status: string;
  progress: number;
  expectedProgress: number;
  spentBudget: number;
  approvedBudget?: number;
  docFile?: string;
};

const PROJECTS: SeedProject[] = [
  {
    name: "Project Sunrise",
    organization: "Seva Foundation",
    category: "Education",
    description: "Digital Learning for Rural Students — tablet labs and teacher enablement.",
    geography: ["Haryana", "Punjab"],
    beneficiaries: { count: 2400, groups: ["Students", "Teachers", "Rural Communities"] },
    requestedBudget: 8000000,
    durationMonths: 18,
    outcomes: ["Improved reading outcomes", "Teacher digital competency", "Lab sustainability"],
    risks: ["Device maintenance", "Teacher attrition"],
    requiredExpertise: ["Education", "Digital Learning", "Teacher Training"],
    status: "IN_PROGRESS",
    progress: 61,
    expectedProgress: 70,
    spentBudget: 4320000,
    approvedBudget: 8000000,
    docFile: "project-sunrise.md",
  },
  {
    name: "Project Asha",
    organization: "Aarogya Rural Foundation",
    category: "Healthcare",
    description: "Maternal Healthcare Outreach in underserved Rajasthan blocks.",
    geography: ["Rajasthan"],
    beneficiaries: { count: 1800, groups: ["Women", "Rural Communities"] },
    requestedBudget: 6000000,
    durationMonths: 24,
    outcomes: ["ANC coverage increase", "Faster high-risk referral"],
    risks: ["Local approval delays", "Seasonal access barriers"],
    requiredExpertise: ["Healthcare", "Community Health", "Outreach"],
    status: "UNDER_REVIEW",
    progress: 0,
    expectedProgress: 0,
    spentBudget: 0,
    docFile: "project-asha.md",
  },
  {
    name: "Project Udaan",
    organization: "Udaan Trust",
    category: "Sports & Youth Development",
    description: "Youth Sports Development with coaching and school tournaments.",
    geography: ["Haryana", "Delhi NCR"],
    beneficiaries: { count: 1200, groups: ["Youth", "Students"] },
    requestedBudget: 4500000,
    durationMonths: 12,
    outcomes: ["Training participation", "Tournament pathway"],
    risks: ["Facility scheduling", "Coach availability"],
    requiredExpertise: ["Sports Development", "Youth Engagement"],
    status: "APPROVED",
    progress: 0,
    expectedProgress: 0,
    spentBudget: 0,
    approvedBudget: 4500000,
    docFile: "project-udaan.md",
  },
  {
    name: "Project Jal",
    organization: "Jal Jeevan Initiative",
    category: "Community Development",
    description: "Community Water Access — safe drinking water points and maintenance committees.",
    geography: ["Rajasthan", "Haryana"],
    beneficiaries: { count: 3500, groups: ["Rural Communities"] },
    requestedBudget: 7000000,
    durationMonths: 20,
    outcomes: ["Functional water points", "Committee governance"],
    risks: ["Groundwater variability", "Permission delays"],
    requiredExpertise: ["Water & Sanitation", "Community Mobilization"],
    status: "FUNDED",
    progress: 15,
    expectedProgress: 20,
    spentBudget: 900000,
    approvedBudget: 6500000,
  },
  {
    name: "Project Saksham",
    organization: "Saksham Collective",
    category: "Women Empowerment",
    description: "Women Entrepreneurship — livelihood skilling and micro-enterprise support.",
    geography: ["Punjab", "Haryana"],
    beneficiaries: { count: 900, groups: ["Women"] },
    requestedBudget: 5500000,
    durationMonths: 18,
    outcomes: ["Enterprise formation", "Income uplift"],
    risks: ["Market linkage gaps"],
    requiredExpertise: ["Livelihoods", "Women Entrepreneurship"],
    status: "SUBMITTED",
    progress: 0,
    expectedProgress: 0,
    spentBudget: 0,
  },
  {
    name: "Project GreenStep",
    organization: "GreenStep Society",
    category: "Community Development",
    description: "Community Sustainability — waste segregation and green school clubs.",
    geography: ["Delhi NCR"],
    beneficiaries: { count: 2000, groups: ["Students", "Rural Communities"] },
    requestedBudget: 3500000,
    durationMonths: 12,
    outcomes: ["Segregation adoption", "Green clubs active"],
    risks: ["Municipal coordination"],
    requiredExpertise: ["Community Mobilization", "Environment"],
    status: "UNDER_REVIEW",
    progress: 0,
    expectedProgress: 0,
    spentBudget: 0,
  },
  {
    name: "Project Aarogya",
    organization: "Aarogya Rural Foundation",
    category: "Healthcare",
    description: "Rural Health Screening camps for NCDs across Haryana villages.",
    geography: ["Haryana"],
    beneficiaries: { count: 2800, groups: ["Rural Communities", "Women"] },
    requestedBudget: 5200000,
    durationMonths: 15,
    outcomes: ["Screening coverage", "Referral completion"],
    risks: ["Camp attendance variability"],
    requiredExpertise: ["Healthcare", "Outreach"],
    status: "MONITORING",
    progress: 78,
    expectedProgress: 75,
    spentBudget: 3900000,
    approvedBudget: 5000000,
  },
  {
    name: "Project Shiksha",
    organization: "Seva Foundation",
    category: "Education",
    description: "Teacher Capacity Development for foundational learning.",
    geography: ["Punjab", "Haryana"],
    beneficiaries: { count: 600, groups: ["Teachers", "Students"] },
    requestedBudget: 4000000,
    durationMonths: 14,
    outcomes: ["Teacher competency", "Classroom practice change"],
    risks: ["Training cascade quality"],
    requiredExpertise: ["Education", "Teacher Training"],
    status: "COMPLETED",
    progress: 100,
    expectedProgress: 100,
    spentBudget: 3850000,
    approvedBudget: 4000000,
  },
];

const NGOS = [
  {
    name: "Seva Foundation",
    mission: "Equitable education outcomes through teacher capacity and digital learning.",
    primaryExpertise: ["Education", "Digital Learning", "Teacher Training"],
    regions: ["Haryana", "Punjab", "Delhi NCR"],
    beneficiaryGroups: ["Students", "Teachers", "Rural Communities"],
    yearsOfExperience: 14,
    projectCount: 12,
    executionReliability: 87,
    overallPartnerScore: 88,
    confidence: 0.9,
    operationalCapacity: "85 field staff; school partnership model",
    riskFlags: ["Higher operational complexity in remote locations"],
    isNew: false,
    history: [
      { projectName: "Digital Classrooms Phase II", category: "Education", geography: "Haryana", completionStatus: "COMPLETED", plannedDurationMonths: 18, actualDurationMonths: 19, milestonePerformance: 92, budgetVariance: 3, reportedBeneficiaries: 2100, outcomeAchievement: 88, riskEvents: 1 },
      { projectName: "Teacher Fellowship", category: "Education", geography: "Punjab", completionStatus: "COMPLETED", plannedDurationMonths: 12, actualDurationMonths: 12, milestonePerformance: 95, budgetVariance: -2, reportedBeneficiaries: 400, outcomeAchievement: 90, riskEvents: 0 },
    ],
  },
  {
    name: "Udaan Trust",
    mission: "Youth development through sports and leadership.",
    primaryExpertise: ["Sports Development", "Youth Engagement"],
    regions: ["Haryana", "Delhi NCR"],
    beneficiaryGroups: ["Youth", "Students"],
    yearsOfExperience: 9,
    projectCount: 7,
    executionReliability: 81,
    overallPartnerScore: 82,
    confidence: 0.82,
    operationalCapacity: "Regional coaching network",
    riskFlags: [],
    isNew: false,
    history: [
      { projectName: "District Sports League", category: "Sports & Youth Development", geography: "Haryana", completionStatus: "COMPLETED", plannedDurationMonths: 10, actualDurationMonths: 11, milestonePerformance: 85, budgetVariance: 6, reportedBeneficiaries: 900, outcomeAchievement: 80, riskEvents: 1 },
    ],
  },
  {
    name: "Saksham Collective",
    mission: "Women-led livelihoods and enterprise support.",
    primaryExpertise: ["Livelihoods", "Women Entrepreneurship"],
    regions: ["Punjab", "Haryana", "Rajasthan"],
    beneficiaryGroups: ["Women"],
    yearsOfExperience: 6,
    projectCount: 4,
    executionReliability: 76,
    overallPartnerScore: 77,
    confidence: 0.75,
    operationalCapacity: "Livelihood mentors across 3 states",
    riskFlags: ["Market linkage dependency"],
    isNew: false,
    history: [
      { projectName: "Women Micro-Enterprise Hub", category: "Women Empowerment", geography: "Punjab", completionStatus: "COMPLETED", plannedDurationMonths: 16, actualDurationMonths: 18, milestonePerformance: 78, budgetVariance: 12, reportedBeneficiaries: 500, outcomeAchievement: 74, riskEvents: 2 },
    ],
  },
  {
    name: "Jal Jeevan Initiative",
    mission: "Community-managed water access and sanitation.",
    primaryExpertise: ["Water & Sanitation", "Community Mobilization"],
    regions: ["Rajasthan", "Haryana"],
    beneficiaryGroups: ["Rural Communities"],
    yearsOfExperience: 11,
    projectCount: 9,
    executionReliability: 79,
    overallPartnerScore: 80,
    confidence: 0.84,
    operationalCapacity: "Engineering + community facilitation teams",
    riskFlags: ["Permission-sensitive operations"],
    isNew: false,
    history: [
      { projectName: "Village Water Points", category: "Community Development", geography: "Rajasthan", completionStatus: "COMPLETED", plannedDurationMonths: 20, actualDurationMonths: 22, milestonePerformance: 80, budgetVariance: 8, reportedBeneficiaries: 4000, outcomeAchievement: 82, riskEvents: 2 },
    ],
  },
  {
    name: "Aarogya Rural Foundation",
    mission: "Last-mile rural healthcare and maternal outreach.",
    primaryExpertise: ["Healthcare", "Community Health", "Outreach"],
    regions: ["Rajasthan", "Haryana"],
    beneficiaryGroups: ["Women", "Rural Communities"],
    yearsOfExperience: 10,
    projectCount: 8,
    executionReliability: 83,
    overallPartnerScore: 84,
    confidence: 0.86,
    operationalCapacity: "Mobile clinic fleet and ASHA network",
    riskFlags: [],
    isNew: false,
    history: [
      { projectName: "Maternal Care Corridor", category: "Healthcare", geography: "Rajasthan", completionStatus: "COMPLETED", plannedDurationMonths: 24, actualDurationMonths: 24, milestonePerformance: 88, budgetVariance: 4, reportedBeneficiaries: 1600, outcomeAchievement: 85, riskEvents: 1 },
    ],
  },
  {
    name: "GreenStep Society",
    mission: "Community sustainability and environmental education.",
    primaryExpertise: ["Environment", "Community Mobilization"],
    regions: ["Delhi NCR"],
    beneficiaryGroups: ["Students", "Rural Communities"],
    yearsOfExperience: 3,
    projectCount: 0,
    executionReliability: null,
    overallPartnerScore: 68,
    confidence: 0.62,
    operationalCapacity: "Lean team; school club model",
    riskFlags: ["Limited historical evidence"],
    isNew: true,
    history: [],
  },
];

async function main() {
  console.log("🌱 Seeding KellyOS demo data (synthetic)...");

  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.impactMetric.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.fundingRecommendation.deleteMany();
  await prisma.nGOMatch.deleteMany();
  await prisma.nGOProjectHistory.deleteMany();
  await prisma.nGODocument.deleteMany();
  await prisma.progressSnapshot.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.budgetTransaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.projectEvidence.deleteMany();
  await prisma.projectScore.deleteMany();
  await prisma.projectDocument.deleteMany();
  await prisma.documentChunk.deleteMany();
  await prisma.project.deleteMany();
  await prisma.nGO.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.companyPriority.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  const company = await prisma.company.create({
    data: {
      name: COMPANY.name,
      industries: toJson(COMPANY.industries),
      csrFocus: toJson(COMPANY.csrFocus),
      targetRegions: toJson(COMPANY.targetRegions),
      beneficiaryGroups: toJson(COMPANY.beneficiaryGroups),
      strategicThemes: toJson(COMPANY.strategicThemes),
      annualBudget: COMPANY.annualBudget,
      allocatedBudget: 32500000,
      isDemo: true,
      priorities: {
        create: COMPANY.csrFocus.map((name) => ({ name, weight: 1 })),
      },
      systemSettings: {
        create: [
          { key: "scoring_weights", value: toJson(DEFAULT_WEIGHTS) },
          { key: "demo_mode", value: "true" },
          { key: "ai_mode", value: process.env.USE_DEMO_AI !== "false" ? "demo" : "live" },
        ],
      },
    },
  });

  const user = await prisma.user.create({
    data: {
      email: "demo@kellyos.ai",
      name: "CSR Manager",
      passwordHash: hashPassword("demo123"),
      role: "CSR_MANAGER",
      companyId: company.id,
    },
  });

  const ngoMap = new Map<string, string>();
  for (const n of NGOS) {
    const ngo = await prisma.nGO.create({
      data: {
        name: n.name,
        mission: n.mission,
        primaryExpertise: toJson(n.primaryExpertise),
        regions: toJson(n.regions),
        beneficiaryGroups: toJson(n.beneficiaryGroups),
        yearsOfExperience: n.yearsOfExperience,
        projectCount: n.projectCount,
        executionReliability: n.executionReliability,
        overallPartnerScore: n.overallPartnerScore,
        confidence: n.confidence,
        operationalCapacity: n.operationalCapacity,
        riskFlags: toJson(n.riskFlags),
        isNew: n.isNew,
        isDemo: true,
        financialSignals: toJson({ note: "Synthetic demo signals — not verified financials" }),
      },
    });
    ngoMap.set(n.name, ngo.id);

    for (const h of n.history) {
      await prisma.nGOProjectHistory.create({
        data: {
          ngoId: ngo.id,
          ...h,
          completedAt: new Date("2025-06-01"),
        },
      });
    }

    if (n.name === "Seva Foundation") {
      const docPath = path.join(process.cwd(), "demo-data/documents/ngo-seva-foundation.md");
      const text = fs.existsSync(docPath) ? fs.readFileSync(docPath, "utf-8") : n.mission;
      await prisma.nGODocument.create({
        data: {
          ngoId: ngo.id,
          name: "Seva Foundation Profile",
          documentType: "ORGANIZATION_PROFILE",
          mimeType: "text/markdown",
          filePath: "demo-data/documents/ngo-seva-foundation.md",
          extractedText: text,
          processingStatus: "COMPLETE",
          structuredData: toJson({ organization: n.name, expertise: n.primaryExpertise }),
        },
      });
    }
  }

  const companyProfile = {
    name: COMPANY.name,
    industries: COMPANY.industries,
    csrFocus: COMPANY.csrFocus,
    targetRegions: COMPANY.targetRegions,
    beneficiaryGroups: COMPANY.beneficiaryGroups,
    strategicThemes: COMPANY.strategicThemes,
    annualBudget: COMPANY.annualBudget,
  };

  const createdProjects: { id: string; name: string; score: number; requested: number; risk: string; confidence: number }[] = [];

  for (const p of PROJECTS) {
    const ngoId = ngoMap.get(p.organization) ?? null;
    const ngoData = NGOS.find((n) => n.name === p.organization);
    const history = ngoData?.history ?? [];
    const ngoHistory =
      history.length > 0
        ? {
            completionRate: 100,
            milestonePerformance:
              history.reduce((s, h) => s + (h.milestonePerformance ?? 0), 0) / history.length,
            avgBudgetVariance:
              history.reduce((s, h) => s + Math.abs(h.budgetVariance ?? 0), 0) / history.length,
            avgDelayMonths:
              history.reduce(
                (s, h) => s + Math.max(0, (h.actualDurationMonths ?? 0) - (h.plannedDurationMonths ?? 0)),
                0
              ) / history.length,
            projectCount: ngoData?.projectCount ?? history.length,
            executionReliability: ngoData?.executionReliability ?? undefined,
          }
        : undefined;

    const scored = scoreProject(
      {
        name: p.name,
        category: p.category,
        description: p.description,
        geography: p.geography,
        beneficiaryCount: p.beneficiaries.count,
        beneficiaryGroups: p.beneficiaries.groups,
        requestedBudget: p.requestedBudget,
        durationMonths: p.durationMonths,
        outcomes: p.outcomes,
        risks: p.risks,
        requiredExpertise: p.requiredExpertise,
        evidenceCount: 4,
        dataCompleteness: 0.85,
      },
      companyProfile,
      ngoHistory,
      DEFAULT_WEIGHTS
    );

    const project = await prisma.project.create({
      data: {
        companyId: company.id,
        ngoId: ["IN_PROGRESS", "MONITORING", "COMPLETED", "FUNDED"].includes(p.status) ? ngoId : ngoId,
        name: p.name,
        organization: p.organization,
        category: p.category,
        description: p.description,
        geography: toJson(p.geography),
        beneficiaries: toJson(p.beneficiaries),
        targetOutcomes: toJson(p.outcomes),
        requestedBudget: p.requestedBudget,
        approvedBudget: p.approvedBudget ?? null,
        spentBudget: p.spentBudget,
        durationMonths: p.durationMonths,
        requiredExpertise: toJson(p.requiredExpertise),
        status: p.status,
        progress: p.progress,
        expectedProgress: p.expectedProgress,
        overallScore: scored.overallScore,
        recommendationLevel: scored.recommendationLevel,
        riskLevel: p.progress < p.expectedProgress - 15 ? "HIGH" : p.progress < p.expectedProgress - 5 ? "MEDIUM" : "LOW",
        isDemo: true,
      },
    });

    createdProjects.push({
      id: project.id,
      name: project.name,
      score: scored.overallScore,
      requested: p.requestedBudget,
      risk: project.riskLevel,
      confidence: scored.confidence,
    });

    await prisma.projectScore.create({
      data: {
        projectId: project.id,
        overallScore: scored.overallScore,
        socialImpact: scored.dimensions.socialImpact.score,
        executionReliability: scored.dimensions.executionReliability.score,
        companyAlignment: scored.dimensions.companyAlignment.score,
        communityBrandResonance: scored.dimensions.communityBrandResonance.score,
        costRiskEfficiency: scored.dimensions.costRiskEfficiency.score,
        socialImpactConfidence: scored.dimensions.socialImpact.confidence,
        executionConfidence: scored.dimensions.executionReliability.confidence,
        alignmentConfidence: scored.dimensions.companyAlignment.confidence,
        resonanceConfidence: scored.dimensions.communityBrandResonance.confidence,
        efficiencyConfidence: scored.dimensions.costRiskEfficiency.confidence,
        overallConfidence: scored.confidence,
        explanation: toJson({
          overall: scored.explanation,
          dimensions: scored.dimensions,
          contributions: scored.contributions,
          recommendationLevel: scored.recommendationLevel,
        }),
        weights: toJson(DEFAULT_WEIGHTS),
      },
    });

    for (const [dim, result] of Object.entries(scored.dimensions)) {
      for (const ev of result.evidence) {
        await prisma.projectEvidence.create({
          data: {
            projectId: project.id,
            dimension: dim,
            claim: ev,
            source: "Demo proposal analysis",
            confidence: result.confidence,
          },
        });
      }
    }

    if (p.docFile) {
      const docPath = path.join(process.cwd(), "demo-data/documents", p.docFile);
      const text = fs.existsSync(docPath) ? fs.readFileSync(docPath, "utf-8") : p.description;
      await prisma.projectDocument.create({
        data: {
          projectId: project.id,
          name: p.docFile,
          filePath: `demo-data/documents/${p.docFile}`,
          documentType: "PROJECT_PROPOSAL",
          mimeType: "text/markdown",
          extractedText: text,
          processingStatus: "COMPLETE",
          structuredData: toJson({
            projectName: p.name,
            requestedBudget: p.requestedBudget,
            beneficiaries: p.beneficiaries,
          }),
        },
      });
    }

    // Milestones (varied)
    const milestoneDefs = [
      { name: "Kickoff & baseline", pct: 15, monthOffset: -4 },
      { name: "Implementation wave 1", pct: 40, monthOffset: -2 },
      { name: "Midline review", pct: 65, monthOffset: 0 },
      { name: "Scale & consolidation", pct: 85, monthOffset: 2 },
      { name: "Endline & closure report", pct: 100, monthOffset: 4 },
    ];

    for (let i = 0; i < milestoneDefs.length; i++) {
      const m = milestoneDefs[i];
      const due = new Date();
      due.setMonth(due.getMonth() + m.monthOffset);
      let status = "NOT_STARTED";
      let actual = 0;
      if (p.progress >= m.pct) {
        status = "COMPLETED";
        actual = 100;
      } else if (p.progress >= m.pct - 25) {
        status = p.name === "Project Sunrise" && i === 2 ? "DELAYED" : "IN_PROGRESS";
        actual = Math.max(0, 100 - (m.pct - p.progress));
      } else if (due < new Date() && p.progress > 0) {
        status = "AT_RISK";
      }

      await prisma.milestone.create({
        data: {
          projectId: project.id,
          name: m.name,
          description: `${m.name} for ${p.name}`,
          dueDate: due,
          startDate: new Date(due.getTime() - 30 * 86400000),
          status,
          expectedProgress: m.pct,
          actualProgress: actual,
          owner: p.organization,
          sortOrder: i,
        },
      });
    }

    if (p.approvedBudget) {
      await prisma.budget.create({
        data: {
          projectId: project.id,
          approvedAmount: p.approvedBudget,
          spentAmount: p.spentBudget,
          remainingAmount: p.approvedBudget - p.spentBudget,
          expectedSpend: (p.expectedProgress / 100) * p.approvedBudget,
          variance: p.spentBudget - (p.expectedProgress / 100) * p.approvedBudget,
          burnRate: p.approvedBudget > 0 ? (p.spentBudget / p.approvedBudget) * 100 : 0,
          status:
            p.spentBudget / p.approvedBudget > p.expectedProgress / 100 + 0.15
              ? "RED"
              : p.spentBudget / p.approvedBudget > p.expectedProgress / 100 + 0.08
                ? "AMBER"
                : "HEALTHY",
        },
      });

      if (p.spentBudget > 0) {
        await prisma.budgetTransaction.create({
          data: {
            projectId: project.id,
            amount: p.spentBudget * 0.4,
            description: "Implementation tranche 1",
            category: "Program",
            date: new Date("2025-11-01"),
          },
        });
        await prisma.budgetTransaction.create({
          data: {
            projectId: project.id,
            amount: p.spentBudget * 0.6,
            description: "Implementation tranche 2",
            category: "Program",
            date: new Date("2026-02-01"),
          },
        });
      }
    }

    // Progress snapshots for active projects
    if (p.progress > 0) {
      const snaps = [
        { monthLabel: "Month 1", expectedProgress: 10, actualProgress: Math.min(p.progress, 9) },
        { monthLabel: "Month 2", expectedProgress: 25, actualProgress: Math.min(p.progress, 20) },
        { monthLabel: "Month 3", expectedProgress: 40, actualProgress: Math.min(p.progress, 31) },
        { monthLabel: "Month 4", expectedProgress: 55, actualProgress: Math.min(p.progress, 48) },
        { monthLabel: "Month 5", expectedProgress: p.expectedProgress, actualProgress: p.progress },
      ];
      for (const s of snaps) {
        await prisma.progressSnapshot.create({ data: { projectId: project.id, ...s } });
      }
    }

    const risks = analyzeProjectRisks({
      projectName: p.name,
      expectedProgress: p.expectedProgress,
      actualProgress: p.progress,
      overdueMilestones: p.name === "Project Sunrise" ? 1 : 0,
      delayedMilestones: p.name === "Project Sunrise" ? 1 : 0,
      budgetApproved: p.approvedBudget ?? 0,
      budgetSpent: p.spentBudget,
      expectedSpendPct: p.expectedProgress,
      repeatedDelays: p.name === "Project Sunrise" ? 1 : 0,
    });

    for (const r of risks) {
      await prisma.risk.create({
        data: {
          projectId: project.id,
          level: r.level,
          title: r.title,
          reason: r.reason,
          affectedArea: r.affectedArea,
          recommendedAction: r.recommendedAction,
        },
      });
    }

    await prisma.impactMetric.create({
      data: {
        projectId: project.id,
        name: "Target Beneficiaries",
        value: p.beneficiaries.count,
        unit: "people",
        targetValue: p.beneficiaries.count,
      },
    });

    await prisma.recommendation.create({
      data: {
        projectId: project.id,
        title: `${p.name} — ${scored.recommendationLevel.replace(/_/g, " ")}`,
        type: scored.recommendationLevel,
        score: scored.overallScore,
        confidence: scored.confidence,
        reason: scored.explanation,
        risks: toJson(p.risks),
        actions: toJson(["Review score breakdown", "Find NGO match", "Consider allocation"]),
      },
    });

    // Matches for reviewable projects
    const matchNgos = NGOS.map((n) => ({
      id: ngoMap.get(n.name)!,
      name: n.name,
      primaryExpertise: n.primaryExpertise,
      regions: n.regions,
      beneficiaryGroups: n.beneficiaryGroups,
      yearsOfExperience: n.yearsOfExperience,
      projectCount: n.projectCount,
      executionReliability: n.executionReliability,
      overallPartnerScore: n.overallPartnerScore,
      isNew: n.isNew,
      riskFlags: n.riskFlags,
      historyCategories: n.history.map((h) => h.category),
      historyGeographies: n.history.map((h) => h.geography),
    }));

    const matches = matchNGOsToProject(
      {
        id: project.id,
        name: p.name,
        category: p.category,
        geography: p.geography,
        beneficiaryGroups: p.beneficiaries.groups,
        requiredExpertise: p.requiredExpertise,
        description: p.description,
      },
      matchNgos
    );

    for (const m of matches.slice(0, 4)) {
      await prisma.nGOMatch.create({
        data: {
          projectId: project.id,
          ngoId: m.ngoId,
          matchScore: m.matchScore,
          expertiseMatch: m.expertiseMatch,
          geographicMatch: m.geographicMatch,
          beneficiaryMatch: m.beneficiaryMatch,
          executionReliability: m.executionReliability,
          relevantExperience: m.relevantExperience,
          riskScore: m.riskScore,
          confidence: m.confidence,
          explanation: toJson({ reasons: m.reasons, risks: m.risks, limitedHistory: m.limitedHistory }),
          isSelected: m.ngoName === p.organization,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        actor: user.name,
        action: "PROJECT_SEEDED",
        entity: "Project",
        entityId: project.id,
        details: toJson({ name: p.name, score: scored.overallScore }),
      },
    });
  }

  // Allocations
  const allocation = allocateBudget({
    totalBudget: 17500000, // remaining demo budget slice
    projects: createdProjects
      .filter((p) => !["COMPLETED", "CLOSED"].includes(PROJECTS.find((x) => x.name === p.name)?.status ?? ""))
      .map((p) => ({
        projectId: p.id,
        projectName: p.name,
        score: p.score,
        requestedBudget: p.requested,
        riskLevel: p.risk,
        confidence: p.confidence,
      })),
  });

  for (const a of allocation) {
    await prisma.fundingRecommendation.create({
      data: {
        projectId: a.projectId,
        requestedBudget: a.requested,
        recommendedBudget: a.recommended,
        coverage: a.coverage,
        expectedImpact: a.expectedImpact,
        riskLevel: a.riskLevel,
        explanation: a.explanation,
      },
    });
    await prisma.allocation.create({
      data: {
        projectId: a.projectId,
        totalBudget: 17500000,
        allocatedAmount: a.recommended,
        coverage: a.coverage,
        efficiencyScore: a.efficiency,
        explanation: a.explanation,
      },
    });
  }

  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        type: "PROJECT_AT_RISK",
        title: "Project Sunrise — Medium delay risk",
        message: "One milestone is behind schedule. Review recovery plan.",
        entityType: "Project",
        entityId: createdProjects.find((p) => p.name === "Project Sunrise")?.id,
      },
      {
        userId: user.id,
        type: "NEW_RECOMMENDATION",
        title: "High-priority funding review ready",
        message: "KellyOS generated recommended allocation for the active portfolio.",
        entityType: "Allocation",
      },
      {
        userId: user.id,
        type: "DOCUMENT_PROCESSED",
        title: "Proposal analysis complete",
        message: "Project Sunrise document extraction and scoring finished.",
        entityType: "Project",
      },
    ],
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      actor: user.name,
      action: "DEMO_SEEDED",
      entity: "System",
      details: toJson({ projects: PROJECTS.length, ngos: NGOS.length, note: "Synthetic demo data" }),
    },
  });

  console.log("✅ Seed complete");
  console.log(`   Company: ${company.name}`);
  console.log(`   Projects: ${PROJECTS.length}`);
  console.log(`   NGOs: ${NGOS.length}`);
  console.log(`   User: demo@kellyos.ai / demo123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
