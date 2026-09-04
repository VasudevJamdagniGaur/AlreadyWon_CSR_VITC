import type { ScoringWeights } from "@/lib/validation";

/** Local copy for client-safe defaults — matches KellyOS DEFAULT_WEIGHTS (do not diverge). */
const PROFILE_DEFAULT_WEIGHTS: ScoringWeights = {
  socialImpact: 30,
  executionReliability: 20,
  companyAlignment: 20,
  communityBrandResonance: 15,
  costRiskEfficiency: 15,
};

export const CSR_FOCUS_OPTIONS = [
  "Education",
  "Healthcare",
  "Women Empowerment",
  "Skill Development",
  "Environment",
  "Rural Development",
  "Water & Sanitation",
  "Livelihood",
  "Disability Inclusion",
  "Child Welfare",
  "Community Development",
  "Other",
] as const;

export const PRIMARY_CSR_OBJECTIVES = [
  "Maximum Social Impact",
  "Sustainable Community Development",
  "Long-term Capacity Building",
  "Inclusive Growth",
  "Environmental Sustainability",
  "Other",
] as const;

export const BENEFICIARY_OPTIONS = [
  "Children",
  "Adolescents",
  "Women",
  "Students",
  "Persons with Disabilities",
  "Senior Citizens",
  "Rural Communities",
  "Urban Communities",
  "Low-income Families",
  "General Community",
  "Other",
] as const;

export const IMPACT_SCALE_OPTIONS = [
  "Small Community",
  "Regional",
  "Large-scale",
  "Pan-India",
] as const;

export const GEOGRAPHIC_PREFERENCE_OPTIONS = [
  "Local Communities",
  "States Where We Operate",
  "Rural India",
  "Urban India",
  "Aspirational Districts",
  "Pan-India",
] as const;

export const FUNDING_HORIZON_OPTIONS = [
  "1 Year",
  "2–3 Years",
  "3–5 Years",
  "Long-term",
] as const;

export const FUNDING_MODEL_OPTIONS = [
  "Full Funding",
  "Co-funding",
  "Matching Grants",
  "Milestone-based Funding",
  "Other",
] as const;

export const PROJECT_PREFERENCE_OPTIONS = [
  "Pilot Projects",
  "Proven Projects",
  "Large-scale Programs",
  "Multi-year Programs",
] as const;

export const IMPACT_METRIC_OPTIONS = [
  "Beneficiaries Reached",
  "Cost per Beneficiary",
  "Employment Generated",
  "Students Supported",
  "Women Trained",
  "Healthcare Outcomes",
  "School Attendance",
  "Waste Diverted",
  "Water Access",
  "Livelihoods Created",
  "Carbon/Environmental Impact",
  "Project Completion Rate",
] as const;

export const NGO_CAPABILITY_OPTIONS = [
  "Relevant Domain Expertise",
  "Local Presence",
  "Previous Similar Projects",
  "Government Partnerships",
  "Strong Monitoring & Reporting",
  "Financial Transparency",
  "Proven Execution History",
  "Community Relationships",
] as const;

export const COMPLIANCE_OPTIONS = [
  "CSR-1",
  "12A",
  "80G",
  "FCRA (where applicable)",
  "Audited Financial Statements",
  "Previous Project Evidence",
  "Governance Documentation",
] as const;

export const RISK_APPETITE_OPTIONS = [
  "Conservative",
  "Moderate",
  "Growth-oriented",
] as const;

export const RISK_PREFERENCE_OPTIONS = [
  "New NGOs",
  "Pilot Projects",
  "New Geographies",
  "Unproven Approaches",
  "Large-scale Projects",
  "Multi-year Commitments",
] as const;

export const PROJECT_RISK_OPTIONS = ["Low", "Medium", "High"] as const;

export const REVIEW_FREQUENCY_OPTIONS = [
  "Monthly",
  "Quarterly",
  "Half-yearly",
  "Annually",
] as const;

export const APPROVAL_PROCESS_OPTIONS = [
  "Single-level",
  "Multi-level",
  "CSR Committee Approval",
  "Board Approval",
  "Custom",
] as const;

export const EXPANSION_OPTIONS = [
  "New States",
  "New CSR Focus Areas",
  "New Beneficiary Groups",
  "Expected Budget Growth",
  "Planned Partnerships",
] as const;

export const GOAL_STATUS_OPTIONS = ["Planned", "In Progress", "Achieved"] as const;

export const CSR_DOCUMENT_TYPE_OPTIONS = [
  "CSR Policy",
  "Annual Report",
  "ESG / BRSR Report",
  "CSR Reports",
  "Impact Reports",
  "CSR Strategy Documents",
] as const;

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

export type CsrFutureGoal = {
  id: string;
  name: string;
  description: string;
  targetYear: string;
  targetValue: string;
  status: (typeof GOAL_STATUS_OPTIONS)[number] | "";
};

export type CsrProfileDocument = {
  id: string;
  documentType: (typeof CSR_DOCUMENT_TYPE_OPTIONS)[number] | "";
  title: string;
  notes: string;
  reference: string;
};

export type CsrIntelligenceProfile = {
  companyOverview: {
    companyName: string;
    industry: string;
    headquarters: string;
    foundedYear: string;
    website: string;
    operatingRegions: string[];
    mission: string;
    vision: string;
  };
  csrStrategy: {
    csrVision: string;
    csrMission: string;
    focusAreas: string[];
    priorityFocusAreas: string[];
    primaryObjective: string;
  };
  beneficiaries: {
    groups: string[];
    preferredImpactScale: string;
  };
  geography: {
    preferredStates: string[];
    preferredCitiesDistricts: string[];
    geographicPreferences: string[];
  };
  funding: {
    annualCsrBudget: number | null;
    typicalInvestmentMin: number | null;
    typicalInvestmentMax: number | null;
    fundingHorizon: string;
    preferredFundingModel: string;
    projectPreferences: string[];
  };
  impactPriorities: {
    metrics: string[];
    impactScaleBalance: number; // 0 = depth, 100 = scale
    timeHorizonBalance: number; // 0 = immediate, 100 = long-term
  };
  ngoPreferences: {
    capabilities: string[];
    complianceRequirements: string[];
  };
  riskProfile: {
    riskAppetite: string;
    preferences: string[];
    preferredProjectRisk: string;
  };
  decisionProfile: {
    weights: ScoringWeights;
  };
  governance: {
    csrHeadOrTeam: string;
    csrCommittee: string;
    projectReviewFrequency: string;
    impactReportingFrequency: string;
    financialReportingFrequency: string;
    approvalProcess: string;
  };
  futureRoadmap: {
    goals2027: string;
    goals2028: string;
    vision2030: string;
    plannedExpansion: string[];
    goals: CsrFutureGoal[];
  };
  documents: CsrProfileDocument[];
};

export type CsrIntelligenceSummary = {
  primaryFocus: string;
  preferredGeography: string;
  targetBeneficiaries: string;
  fundingRange: string;
  riskAppetite: string;
  futurePriority: string;
};

export function emptyCsrIntelligenceProfile(
  seed?: {
    companyName?: string;
    industries?: string[];
    csrFocus?: string[];
    targetRegions?: string[];
    beneficiaryGroups?: string[];
    annualBudget?: number;
  }
): CsrIntelligenceProfile {
  return {
    companyOverview: {
      companyName: seed?.companyName ?? "",
      industry: seed?.industries?.[0] ?? "",
      headquarters: "",
      foundedYear: "",
      website: "",
      operatingRegions: seed?.targetRegions ?? [],
      mission: "",
      vision: "",
    },
    csrStrategy: {
      csrVision: "",
      csrMission: "",
      focusAreas: seed?.csrFocus ?? [],
      priorityFocusAreas: (seed?.csrFocus ?? []).slice(0, 3),
      primaryObjective: "",
    },
    beneficiaries: {
      groups: seed?.beneficiaryGroups ?? [],
      preferredImpactScale: "",
    },
    geography: {
      preferredStates: seed?.targetRegions ?? [],
      preferredCitiesDistricts: [],
      geographicPreferences: [],
    },
    funding: {
      annualCsrBudget: seed?.annualBudget ?? null,
      typicalInvestmentMin: null,
      typicalInvestmentMax: null,
      fundingHorizon: "",
      preferredFundingModel: "",
      projectPreferences: [],
    },
    impactPriorities: {
      metrics: [],
      impactScaleBalance: 50,
      timeHorizonBalance: 50,
    },
    ngoPreferences: {
      capabilities: [],
      complianceRequirements: [],
    },
    riskProfile: {
      riskAppetite: "",
      preferences: [],
      preferredProjectRisk: "",
    },
    decisionProfile: {
      weights: { ...PROFILE_DEFAULT_WEIGHTS },
    },
    governance: {
      csrHeadOrTeam: "",
      csrCommittee: "",
      projectReviewFrequency: "",
      impactReportingFrequency: "",
      financialReportingFrequency: "",
      approvalProcess: "",
    },
    futureRoadmap: {
      goals2027: "",
      goals2028: "",
      vision2030: "",
      plannedExpansion: [],
      goals: [],
    },
    documents: [],
  };
}

function filled(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.length > 0;
  return false;
}

/** Weighted completeness across important CSR Intelligence fields. */
export function calculateProfileCompleteness(profile: CsrIntelligenceProfile): number {
  const checks: boolean[] = [
    filled(profile.companyOverview.companyName),
    filled(profile.companyOverview.industry),
    filled(profile.companyOverview.headquarters),
    filled(profile.companyOverview.operatingRegions),
    filled(profile.companyOverview.mission),
    filled(profile.csrStrategy.csrVision),
    filled(profile.csrStrategy.csrMission),
    filled(profile.csrStrategy.focusAreas),
    filled(profile.csrStrategy.priorityFocusAreas),
    filled(profile.csrStrategy.primaryObjective),
    filled(profile.beneficiaries.groups),
    filled(profile.beneficiaries.preferredImpactScale),
    filled(profile.geography.preferredStates) ||
      filled(profile.geography.geographicPreferences),
    filled(profile.funding.annualCsrBudget),
    filled(profile.funding.typicalInvestmentMin) ||
      filled(profile.funding.typicalInvestmentMax),
    filled(profile.funding.fundingHorizon),
    filled(profile.funding.preferredFundingModel),
    filled(profile.impactPriorities.metrics),
    filled(profile.ngoPreferences.capabilities),
    filled(profile.ngoPreferences.complianceRequirements),
    filled(profile.riskProfile.riskAppetite),
    filled(profile.riskProfile.preferredProjectRisk),
    filled(profile.governance.csrHeadOrTeam) || filled(profile.governance.csrCommittee),
    filled(profile.governance.projectReviewFrequency),
    filled(profile.futureRoadmap.goals2027) ||
      filled(profile.futureRoadmap.goals2028) ||
      filled(profile.futureRoadmap.vision2030) ||
      filled(profile.futureRoadmap.goals),
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

function formatInr(amount: number | null): string | null {
  if (amount == null || !Number.isFinite(amount)) return null;
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function deriveIntelligenceSummary(
  profile: CsrIntelligenceProfile
): CsrIntelligenceSummary {
  const primaryFocus =
    profile.csrStrategy.priorityFocusAreas[0] ||
    profile.csrStrategy.focusAreas[0] ||
    "Not set";

  const preferredGeography =
    profile.geography.preferredStates[0] ||
    profile.geography.geographicPreferences[0] ||
    profile.companyOverview.operatingRegions[0] ||
    "Not set";

  const targetBeneficiaries =
    profile.beneficiaries.groups.length === 0
      ? "Not set"
      : profile.beneficiaries.groups.length <= 2
        ? profile.beneficiaries.groups.join(" & ")
        : `${profile.beneficiaries.groups.slice(0, 2).join(", ")} +${
            profile.beneficiaries.groups.length - 2
          }`;

  const min = formatInr(profile.funding.typicalInvestmentMin);
  const max = formatInr(profile.funding.typicalInvestmentMax);
  let fundingRange = "Not set";
  if (min && max) fundingRange = `${min} – ${max}`;
  else if (min) fundingRange = `From ${min}`;
  else if (max) fundingRange = `Up to ${max}`;
  else if (profile.funding.annualCsrBudget != null) {
    fundingRange = `Annual ${formatInr(profile.funding.annualCsrBudget)}`;
  }

  const riskAppetite = profile.riskProfile.riskAppetite || "Not set";

  const plannedGoal = profile.futureRoadmap.goals.find((g) => g.status === "Planned");
  const futurePriority =
    plannedGoal?.name ||
    profile.futureRoadmap.plannedExpansion[0] ||
    (profile.futureRoadmap.vision2030
      ? "2030 Vision defined"
      : profile.futureRoadmap.goals2028
        ? "2028 goals defined"
        : profile.futureRoadmap.goals2027
          ? "2027 goals defined"
          : "Not set");

  return {
    primaryFocus,
    preferredGeography,
    targetBeneficiaries,
    fundingRange,
    riskAppetite,
    futurePriority,
  };
}

/** Deep-merge saved JSON with defaults so older/partial docs stay editable. */
export function normalizeCsrIntelligenceProfile(
  raw: unknown,
  seed?: Parameters<typeof emptyCsrIntelligenceProfile>[0]
): CsrIntelligenceProfile {
  const base = emptyCsrIntelligenceProfile(seed);
  if (!raw || typeof raw !== "object") return base;
  const incoming = raw as Partial<CsrIntelligenceProfile>;

  return {
    companyOverview: { ...base.companyOverview, ...(incoming.companyOverview ?? {}) },
    csrStrategy: { ...base.csrStrategy, ...(incoming.csrStrategy ?? {}) },
    beneficiaries: { ...base.beneficiaries, ...(incoming.beneficiaries ?? {}) },
    geography: { ...base.geography, ...(incoming.geography ?? {}) },
    funding: { ...base.funding, ...(incoming.funding ?? {}) },
    impactPriorities: { ...base.impactPriorities, ...(incoming.impactPriorities ?? {}) },
    ngoPreferences: { ...base.ngoPreferences, ...(incoming.ngoPreferences ?? {}) },
    riskProfile: { ...base.riskProfile, ...(incoming.riskProfile ?? {}) },
    decisionProfile: {
      weights: {
        ...PROFILE_DEFAULT_WEIGHTS,
        ...(incoming.decisionProfile?.weights ?? {}),
      },
    },
    governance: { ...base.governance, ...(incoming.governance ?? {}) },
    futureRoadmap: {
      ...base.futureRoadmap,
      ...(incoming.futureRoadmap ?? {}),
      goals: Array.isArray(incoming.futureRoadmap?.goals)
        ? incoming.futureRoadmap!.goals
        : base.futureRoadmap.goals,
      plannedExpansion: Array.isArray(incoming.futureRoadmap?.plannedExpansion)
        ? incoming.futureRoadmap!.plannedExpansion
        : base.futureRoadmap.plannedExpansion,
    },
    documents: Array.isArray(incoming.documents) ? incoming.documents : base.documents,
  };
}
