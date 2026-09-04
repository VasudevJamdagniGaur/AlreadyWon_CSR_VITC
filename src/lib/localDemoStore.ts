/**
 * Browser localStorage helpers for CSRBOX source projects (hackathon local demo).
 * Server-safe: never touches window/localStorage during SSR.
 */
import {
  LOCAL_DEMO_PROJECTS,
  LOCAL_DEMO_STORAGE_KEY,
} from "@/data/localDemoProjects";
import type { CsrboxRawProject } from "@/services/ingestion/csrboxImporter";
import { toJson } from "@/lib/utils";

export { LOCAL_DEMO_STORAGE_KEY };

export function isLocalDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_LOCAL_DEMO_MODE === "true";
}

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function cloneProjects(rows: CsrboxRawProject[]): CsrboxRawProject[] {
  return JSON.parse(JSON.stringify(rows)) as CsrboxRawProject[];
}

function isPresent(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") {
    const t = value.trim();
    return t.length > 0 && t !== "...";
  }
  return true;
}

/** Technical route id from source document fields / source.url only. */
function resolveTechnicalId(raw: CsrboxRawProject): string {
  if (raw.sourceProjectId != null && isPresent(raw.sourceProjectId)) {
    return String(raw.sourceProjectId).trim();
  }
  if (raw.source.projectId != null && isPresent(raw.source.projectId)) {
    return String(raw.source.projectId).trim();
  }
  const match = raw.source.url.match(/_(\d+)\s*$/);
  if (match?.[1]) return match[1];
  throw new Error(`Unable to resolve technical id for ${raw.projectName}`);
}

/** Seed from module source records into localStorage. */
export function seedLocalDemoProjects(): CsrboxRawProject[] {
  const rows = cloneProjects(LOCAL_DEMO_PROJECTS);
  if (canUseLocalStorage()) {
    window.localStorage.setItem(LOCAL_DEMO_STORAGE_KEY, JSON.stringify(rows));
  }
  return rows;
}

/** Remove and re-seed from the uploaded source document records. */
export function resetLocalDemoProjects(): CsrboxRawProject[] {
  if (canUseLocalStorage()) {
    window.localStorage.removeItem(LOCAL_DEMO_STORAGE_KEY);
  }
  return seedLocalDemoProjects();
}

/**
 * Read local demo projects.
 * - Browser: seed once if missing, otherwise return existing localStorage (no overwrite on refresh).
 * - Server/SSR: return the module source records (same document; no localStorage).
 */
export function getLocalDemoProjects(): CsrboxRawProject[] {
  if (!canUseLocalStorage()) {
    return cloneProjects(LOCAL_DEMO_PROJECTS);
  }

  const existing = window.localStorage.getItem(LOCAL_DEMO_STORAGE_KEY);
  if (existing == null) {
    return seedLocalDemoProjects();
  }

  try {
    const parsed = JSON.parse(existing) as CsrboxRawProject[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // fall through to re-seed from source document
  }
  return seedLocalDemoProjects();
}

function budgetDisplayFromSource(
  budget: CsrboxRawProject["estimatedBudget"]
): string | null {
  if (budget == null) return null;
  if (typeof budget === "string") return budget;
  const currency = budget.currency ?? "";
  if (budget.min != null && budget.max != null) {
    return `${currency} ${budget.min} - ${budget.max}`.trim();
  }
  if (budget.max != null) return `${currency} ${budget.max}`.trim();
  if (budget.min != null) return `${currency} ${budget.min}`.trim();
  return null;
}

function geographyFromSource(raw: CsrboxRawProject): string[] {
  const out: string[] = [];
  if (typeof raw.location === "string") {
    out.push(
      ...raw.location
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    );
  } else if (raw.location && typeof raw.location === "object") {
    if (raw.location.state != null && String(raw.location.state).length > 0) {
      out.push(
        ...String(raw.location.state)
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      );
    }
    if (raw.location.district != null && String(raw.location.district).length > 0) {
      out.push(String(raw.location.district).trim());
    }
  }
  if (raw.district != null && String(raw.district).length > 0) {
    const d = String(raw.district).trim();
    if (!out.includes(d)) out.push(d);
  }
  return out;
}

function beneficiaryGroupsFromSource(raw: CsrboxRawProject): string[] {
  const groups: string[] = [];
  if (raw.primaryBeneficiary != null && String(raw.primaryBeneficiary).length > 0) {
    groups.push(String(raw.primaryBeneficiary));
  }
  if (
    raw.secondaryBeneficiary != null &&
    String(raw.secondaryBeneficiary).length > 0 &&
    String(raw.secondaryBeneficiary) !== String(raw.primaryBeneficiary ?? "")
  ) {
    groups.push(String(raw.secondaryBeneficiary));
  }
  return groups;
}

function mapSourceStatus(sourceStatus: string | null | undefined): string {
  const s = (sourceStatus ?? "").trim().toLowerCase();
  if (s === "active") return "IN_PROGRESS";
  if (s === "already implemented") return "COMPLETED";
  if (s === "proposed") return "SUBMITTED";
  return "SUBMITTED";
}

function categoryFromSource(raw: CsrboxRawProject): string | null {
  if (raw.developmentSector != null && String(raw.developmentSector).length > 0) {
    return String(raw.developmentSector);
  }
  if (raw.subSector != null && String(raw.subSector).length > 0) {
    return String(raw.subSector);
  }
  return null;
}

export type LocalDemoKellyProject = {
  id: string;
  companyId: string;
  ngoId: null;
  name: string;
  organization: string;
  category: string | null;
  subSector: string | null;
  developmentSector: string | null;
  description: string | null;
  geography: string;
  beneficiaries: string;
  targetOutcomes: string;
  requestedBudget: null;
  approvedBudget: null;
  spentBudget: number;
  durationMonths: null;
  budgetDisplay: string | null;
  status: string;
  sourceProjectStatus: string | null;
  progress: number;
  expectedProgress: number;
  overallScore: null;
  recommendationLevel: null;
  riskLevel: string;
  isDemo: boolean;
  isCsrOpportunity: true;
  sourceName: string;
  sourceProjectId: string | null;
  sourceUrl: string;
  baselineSurveyStatus: string | null;
  keyProjectPartners: string | null;
  projectDuration: string | null;
  aboutNgo: string | null;
  sourcePayload: string;
  company: string | null | undefined;
  scores: never[];
  risks: never[];
  milestones: never[];
  budgets: never[];
  transactions: never[];
  documents: never[];
  evidence: never[];
  progressSnapshots: never[];
  impactMetrics: never[];
  ngo: null;
  recommendations: never[];
  matches: never[];
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Map source document records into the KellyOS Project shape used by existing pages.
 * Does not invent scores, budgets (numeric), dates, NGO entities, or evidence.
 */
export function mapLocalDemoToKellyProjects(
  raws: CsrboxRawProject[] = getLocalDemoProjects(),
  companyId = "local-demo-company"
): LocalDemoKellyProject[] {
  const now = new Date(0);
  return raws.map((raw) => {
    const technicalId = resolveTechnicalId(raw);
    // Preserve document fields only — do not invent sourceProjectId from the URL.
    const sourceProjectId =
      raw.sourceProjectId != null
        ? String(raw.sourceProjectId)
        : raw.source.projectId != null
          ? String(raw.source.projectId)
          : null;
    const geography = geographyFromSource(raw);
    const groups = beneficiaryGroupsFromSource(raw);
    const status = mapSourceStatus(raw.projectStatus);
    return {
      id: `csrbox-${technicalId}`,
      companyId,
      ngoId: null,
      name: raw.projectName,
      organization: raw.ngoName,
      category: categoryFromSource(raw),
      subSector: raw.subSector ?? null,
      developmentSector: raw.developmentSector ?? null,
      description: raw.description ?? null,
      geography: toJson(geography),
      beneficiaries: toJson({
        count: null,
        groups,
        estimatedLabel: raw.estimatedBeneficiaries ?? null,
        primary: raw.primaryBeneficiary ?? null,
        secondary: raw.secondaryBeneficiary ?? null,
      }),
      targetOutcomes: toJson(raw.projectObjectives ?? []),
      requestedBudget: null,
      approvedBudget: null,
      spentBudget: 0,
      durationMonths: null,
      budgetDisplay: budgetDisplayFromSource(raw.estimatedBudget),
      status,
      sourceProjectStatus: raw.projectStatus ?? null,
      progress: 0,
      expectedProgress: 0,
      overallScore: null,
      recommendationLevel: null,
      riskLevel: "LOW",
      isDemo: false,
      isCsrOpportunity: true as const,
      sourceName: raw.source.name,
      sourceProjectId,
      sourceUrl: raw.source.url,
      baselineSurveyStatus: raw.baselineSurveyStatus ?? null,
      keyProjectPartners: raw.keyProjectPartners ?? null,
      projectDuration: raw.projectDuration ?? null,
      aboutNgo: raw.aboutNGO ?? null,
      sourcePayload: toJson(raw),
      company: raw.company,
      scores: [],
      risks: [],
      milestones: [],
      budgets: [],
      transactions: [],
      documents: [],
      evidence: [],
      progressSnapshots: [],
      impactMetrics: [],
      ngo: null,
      recommendations: [],
      matches: [],
      createdAt: now,
      updatedAt: now,
    };
  });
}

/** KellyOS Project docs for the data layer when LOCAL_DEMO_MODE is on. */
export function getLocalDemoKellyProjects(companyId?: string): LocalDemoKellyProject[] {
  return mapLocalDemoToKellyProjects(getLocalDemoProjects(), companyId);
}
