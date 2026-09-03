import {
  ProjectExtractionSchema,
  NGOExtractionSchema,
  type ProjectExtraction,
  type NGOExtraction,
} from "@/lib/validation";
import type { AIProvider } from "./provider";
import type { ProjectScoreResult, RiskAssessment } from "@/types";

/** Deterministic demo AI — extracts from known patterns / heuristics, never invents silently. */
export class DemoAIProvider implements AIProvider {
  name = "Demo Analysis";
  isDemo = true;

  async extractProject(text: string, fileName?: string): Promise<ProjectExtraction> {
    const lower = text.toLowerCase();
    const name =
      extractField(text, /(?:project\s+name|title)\s*[:\-–]\s*(.+)/i) ||
      inferProjectName(fileName, text) ||
      "Untitled Proposal";

    const organization =
      extractField(text, /(?:organization|implementing\s+partner|ngo)\s*[:\-–]\s*(.+)/i) ||
      undefined;

    const category = inferCategory(lower);
    const geography = extractList(
      text,
      /(?:geography|location|region|states?)\s*[:\-–]\s*(.+)/i
    );
    const beneficiaryCount =
      extractNumber(
        text,
        /(?:beneficiar(?:y|ies)|target\s+reach|students?|women|patients?)\s*(?:count|reached|targeted)?[^\d]{0,20}([\d,]+)/i
      ) || 0;

    const groups = inferBeneficiaryGroups(lower);
    const budget =
      extractBudget(text) ||
      extractNumber(text, /(?:requested\s+budget|total\s+budget|budget)\s*[:\-–]?\s*(?:₹|rs\.?|inr)?\s*([\d,.]+)\s*(lakh|lac|crore|cr|l)?/i) ||
      0;

    const duration =
      extractNumber(text, /(?:duration|timeline)\s*[:\-–]?\s*(\d+)\s*(?:months?|yrs?|years?)/i) ||
      18;

    const objectives = extractBulletSection(text, /objectives?/i);
    const outcomes = extractBulletSection(text, /(?:outcomes?|target\s+outcomes?)/i);
    const risks = extractBulletSection(text, /risks?/i);
    const milestones = extractBulletSection(text, /milestones?/i).map((m, i) => ({
      name: m,
      description: m,
      month: (i + 1) * 3,
    }));

    const evidence: {
      field: string;
      value: string;
      source: string;
      sourceExcerpt?: string;
      confidence: number;
    }[] = [];
    if (beneficiaryCount > 0) {
      evidence.push({
        field: "beneficiary_count",
        value: String(beneficiaryCount),
        source: "Proposal text",
        sourceExcerpt: excerptAround(text, String(beneficiaryCount)),
        confidence: 0.85,
      });
    }
    if (budget > 0) {
      evidence.push({
        field: "requested_budget",
        value: String(budget),
        source: "Budget section",
        sourceExcerpt: excerptAround(text, "budget"),
        confidence: 0.8,
      });
    }
    if (geography.length === 0 && !beneficiaryCount && budget === 0) {
      // Explicit: not enough evidence rather than inventing
      evidence.push({
        field: "completeness",
        value: "Not enough evidence for full extraction",
        source: "Demo Analysis",
        confidence: 0.4,
      });
    }

    const raw = {
      projectName: name,
      organization,
      category,
      description: text.slice(0, 500),
      geography: geography.length > 0 ? geography : inferGeography(lower),
      beneficiaries: { count: beneficiaryCount, groups },
      requestedBudget: normalizeBudget(budget, text),
      durationMonths: duration > 30 ? duration : duration, // months
      objectives: objectives.length > 0 ? objectives : ["Improve community outcomes as described in proposal"],
      outcomes: outcomes.length > 0 ? outcomes : [],
      milestones,
      risks: risks.length > 0 ? risks : [],
      requiredExpertise: inferExpertise(category),
      dependencies: extractBulletSection(text, /dependencies?/i),
      implementationModel: extractField(text, /(?:implementation\s+model|delivery\s+model)\s*[:\-–]\s*(.+)/i),
      pastExperience: extractField(text, /(?:past\s+experience|prior\s+work)\s*[:\-–]\s*(.+)/i),
      evidence,
    };

    return ProjectExtractionSchema.parse(raw);
  }

  async extractNGO(text: string, fileName?: string): Promise<NGOExtraction> {
    const organization =
      extractField(text, /(?:organization|ngo|foundation|trust)\s*name\s*[:\-–]\s*(.+)/i) ||
      fileName?.replace(/\.\w+$/, "").replace(/[-_]/g, " ") ||
      "Unknown Organization";

    const raw = {
      organization,
      mission: extractField(text, /mission\s*[:\-–]\s*(.+)/i),
      expertise: extractList(text, /(?:expertise|focus\s+areas?|sectors?)\s*[:\-–]\s*(.+)/i),
      regions: extractList(text, /(?:regions?|geography|states?)\s*[:\-–]\s*(.+)/i),
      beneficiaries: extractList(text, /(?:beneficiar(?:y|ies)\s+groups?)\s*[:\-–]\s*(.+)/i),
      projects: extractBulletSection(text, /projects?/i).slice(0, 5),
      experience: extractNumber(text, /(\d+)\s*years?\s*(?:of\s+)?experience/i),
      operationalCapacity: extractField(text, /(?:operational\s+capacity|team\s+size)\s*[:\-–]\s*(.+)/i),
      reportedOutcomes: extractBulletSection(text, /outcomes?/i).slice(0, 5),
      budgetInformation: extractField(text, /(?:annual\s+budget|financial)\s*[:\-–]\s*(.+)/i),
      riskIndicators: extractBulletSection(text, /risk/i).slice(0, 3),
      evidence: [
        {
          field: "organization",
          value: organization,
          source: "NGO document",
          sourceExcerpt: excerptAround(text, organization.slice(0, 20)),
          confidence: 0.8,
        },
      ],
    };

    return NGOExtractionSchema.parse(raw);
  }

  async explainRecommendation(context: {
    projectName: string;
    score: ProjectScoreResult;
    companyPriorities: string[];
  }) {
    const { score, projectName, companyPriorities } = context;
    const reasons: string[] = [];
    const watchOuts: string[] = [];

    const d = score.dimensions;
    if (d.socialImpact.score >= 75)
      reasons.push("Strong expected beneficiary outcomes");
    if (d.companyAlignment.score >= 75)
      reasons.push("High alignment with company CSR priorities");
    if (d.executionReliability.score >= 75)
      reasons.push("Available evidence indicates strong execution reliability");
    if (d.costRiskEfficiency.score >= 75)
      reasons.push("Favorable cost & risk efficiency profile");
    if (d.communityBrandResonance.score >= 70)
      reasons.push("Genuine relevance to company communities and strategic identity");

    if (reasons.length === 0) {
      reasons.push(`Composite score of ${score.overallScore} warrants structured review`);
    }

    if (d.executionReliability.confidence < 0.6)
      watchOuts.push("Limited historical execution evidence");
    if (d.socialImpact.evidence.some((e) => e.includes("not evidenced")))
      watchOuts.push("Outcome measurement evidence is limited");
    if (d.costRiskEfficiency.score < 65)
      watchOuts.push("Budget realism or risk profile needs human review");

    watchOuts.push("Human review required before funding decisions");

    return {
      recommendation: `${projectName} — Recommended for ${score.recommendationLevel.replace(/_/g, " ").toLowerCase()} review`,
      reasons,
      watchOuts,
      confidence: score.confidence,
    };
  }

  async summarizeReport(context: {
    projectName: string;
    partner?: string;
    objective?: string;
    budget?: number;
    progress?: number;
    milestones?: string[];
    beneficiaries?: number;
    risks?: string[];
  }): Promise<string> {
    return [
      `# Project Summary — ${context.projectName}`,
      "",
      `**Partner:** ${context.partner ?? "Not assigned"}`,
      `**Objective:** ${context.objective ?? "See project description"}`,
      `**Budget:** ${context.budget ? `₹${context.budget.toLocaleString("en-IN")}` : "N/A"}`,
      `**Progress:** ${context.progress ?? 0}%`,
      `**Beneficiaries (reported target):** ${context.beneficiaries?.toLocaleString("en-IN") ?? "Not enough evidence"}`,
      "",
      "## Milestones",
      ...(context.milestones?.map((m) => `- ${m}`) ?? ["- No milestones recorded"]),
      "",
      "## Risks",
      ...(context.risks?.map((r) => `- ${r}`) ?? ["- No active risks"]),
      "",
      "## Recommendations",
      "- Continue monitoring milestone trajectory",
      "- Require human review of any funding or partner changes",
      "",
      "_Generated by KellyOS Demo Analysis — synthetic/demo context may apply._",
    ].join("\n");
  }

  async analyzeRiskNarrative(risks: RiskAssessment[]): Promise<string> {
    if (risks.length === 0) {
      return "No significant risk signals detected from current progress and budget data.";
    }
    return risks.map((r) => `${r.level}: ${r.reason} → ${r.recommendedAction}`).join("\n");
  }
}

function extractField(text: string, re: RegExp): string | undefined {
  const m = text.match(re);
  return m?.[1]?.trim().split("\n")[0]?.trim();
}

function extractNumber(text: string, re: RegExp): number | undefined {
  const m = text.match(re);
  if (!m?.[1]) return undefined;
  return parseFloat(m[1].replace(/,/g, ""));
}

function extractBudget(text: string): number | undefined {
  const m = text.match(
    /(?:₹|rs\.?|inr)\s*([\d,.]+)\s*(lakh|lac|crore|cr|l)?/i
  );
  if (!m) return undefined;
  return normalizeBudget(parseFloat(m[1].replace(/,/g, "")), m[2] ?? "");
}

function normalizeBudget(value: number, context: string): number {
  const c = context.toLowerCase();
  if (/crore|\bcr\b/.test(c)) return value * 10000000;
  if (/lakh|lac|\bl\b/.test(c)) return value * 100000;
  // If value looks like lakhs already stated as absolute
  if (value > 0 && value < 1000 && /budget/i.test(context)) return value * 100000;
  return value;
}

function extractList(text: string, re: RegExp): string[] {
  const field = extractField(text, re);
  if (!field) return [];
  return field
    .split(/,|;|\||\band\b/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 60);
}

function extractBulletSection(text: string, header: RegExp): string[] {
  const lines = text.split(/\r?\n/);
  const items: string[] = [];
  let inSection = false;
  for (const line of lines) {
    if (header.test(line) && line.length < 80) {
      inSection = true;
      continue;
    }
    if (inSection) {
      if (/^[A-Z][A-Za-z\s]{2,40}$/.test(line.trim()) && !/^[-*•]/.test(line.trim())) {
        break;
      }
      const bullet = line.match(/^[-*•]\s*(.+)/) || line.match(/^\d+[.)]\s*(.+)/);
      if (bullet) items.push(bullet[1].trim());
      if (items.length >= 8) break;
    }
  }
  return items;
}

function excerptAround(text: string, needle: string): string {
  const idx = text.toLowerCase().indexOf(needle.toLowerCase());
  if (idx < 0) return text.slice(0, 120);
  return text.slice(Math.max(0, idx - 40), Math.min(text.length, idx + 80)).trim();
}

function inferCategory(lower: string): string {
  if (/educat|school|learning|teacher|shiksha/.test(lower)) return "Education";
  if (/health|maternal|aarogya|medical|screening/.test(lower)) return "Healthcare";
  if (/sport|youth|uda[a]?n/.test(lower)) return "Sports & Youth Development";
  if (/water|jal\b/.test(lower)) return "Community Development";
  if (/women|entrepren|saksham/.test(lower)) return "Women Empowerment";
  if (/sustainab|green|environment/.test(lower)) return "Community Development";
  return "Community Development";
}

function inferGeography(lower: string): string[] {
  const regions = ["Haryana", "Delhi NCR", "Punjab", "Rajasthan", "Uttar Pradesh"];
  return regions.filter((r) => lower.includes(r.toLowerCase()));
}

function inferBeneficiaryGroups(lower: string): string[] {
  const groups: string[] = [];
  if (/student|child|school/.test(lower)) groups.push("Students");
  if (/women|maternal/.test(lower)) groups.push("Women");
  if (/youth|sport/.test(lower)) groups.push("Youth");
  if (/rural|village/.test(lower)) groups.push("Rural Communities");
  if (/teacher/.test(lower)) groups.push("Teachers");
  return groups;
}

function inferExpertise(category: string): string[] {
  const map: Record<string, string[]> = {
    Education: ["Education", "Digital Learning", "Teacher Training"],
    Healthcare: ["Healthcare", "Community Health", "Outreach"],
    "Sports & Youth Development": ["Sports Development", "Youth Engagement"],
    "Community Development": ["Community Mobilization", "Water & Sanitation"],
    "Women Empowerment": ["Livelihoods", "Women Entrepreneurship"],
  };
  return map[category] ?? ["Community Development"];
}

function inferProjectName(fileName?: string, text?: string): string | undefined {
  if (fileName) {
    const base = fileName.replace(/\.\w+$/, "").replace(/[-_]/g, " ");
    if (base.length > 3) return base;
  }
  const m = text?.match(/Project\s+([A-Z][a-zA-Z]+)/);
  return m?.[1] ? `Project ${m[1]}` : undefined;
}
