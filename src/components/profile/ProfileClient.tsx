"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MultiSelectChips, RankedFocusSelect } from "@/components/profile/MultiSelectChips";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { DIMENSION_LABELS, type ScoringDimension } from "@/types";
import {
  APPROVAL_PROCESS_OPTIONS,
  BENEFICIARY_OPTIONS,
  calculateProfileCompleteness,
  COMPLIANCE_OPTIONS,
  CSR_DOCUMENT_TYPE_OPTIONS,
  CSR_FOCUS_OPTIONS,
  deriveIntelligenceSummary,
  EXPANSION_OPTIONS,
  FUNDING_HORIZON_OPTIONS,
  FUNDING_MODEL_OPTIONS,
  GEOGRAPHIC_PREFERENCE_OPTIONS,
  GOAL_STATUS_OPTIONS,
  IMPACT_METRIC_OPTIONS,
  IMPACT_SCALE_OPTIONS,
  INDIAN_STATES,
  NGO_CAPABILITY_OPTIONS,
  PRIMARY_CSR_OBJECTIVES,
  PROJECT_PREFERENCE_OPTIONS,
  PROJECT_RISK_OPTIONS,
  REVIEW_FREQUENCY_OPTIONS,
  RISK_APPETITE_OPTIONS,
  RISK_PREFERENCE_OPTIONS,
  type CsrFutureGoal,
  type CsrIntelligenceProfile,
  type CsrProfileDocument,
} from "@/types/csrIntelligenceProfile";

export type ProfileClientProps = {
  initialProfile: CsrIntelligenceProfile;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

function newId() {
  return `g_${Math.random().toString(36).slice(2, 10)}`;
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function ProfileClient({ initialProfile, user }: ProfileClientProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<CsrIntelligenceProfile>(initialProfile);
  const [cityDraft, setCityDraft] = useState("");
  const [regionDraft, setRegionDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const completeness = useMemo(() => calculateProfileCompleteness(profile), [profile]);
  const summary = useMemo(() => deriveIntelligenceSummary(profile), [profile]);

  function update<K extends keyof CsrIntelligenceProfile>(
    section: K,
    patch: Partial<CsrIntelligenceProfile[K]>
  ) {
    setProfile((p) => ({
      ...p,
      [section]: { ...(p[section] as object), ...patch },
    }));
    setMessage(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to save profile.");
        return;
      }
      if (data.profile) setProfile(data.profile);
      setMessage(data.message || "Profile updated successfully.");
      router.refresh();
    } catch {
      setError("Unable to save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/login", { method: "DELETE" });
      router.push("/login");
      router.refresh();
    } catch {
      setError("Unable to sign out.");
      setSigningOut(false);
    }
  }

  function addGoal() {
    const goal: CsrFutureGoal = {
      id: newId(),
      name: "",
      description: "",
      targetYear: "",
      targetValue: "",
      status: "Planned",
    };
    update("futureRoadmap", {
      goals: [...profile.futureRoadmap.goals, goal],
    });
  }

  function updateGoal(id: string, patch: Partial<CsrFutureGoal>) {
    update("futureRoadmap", {
      goals: profile.futureRoadmap.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    });
  }

  function removeGoal(id: string) {
    update("futureRoadmap", {
      goals: profile.futureRoadmap.goals.filter((g) => g.id !== id),
    });
  }

  function addDocument() {
    const doc: CsrProfileDocument = {
      id: newId(),
      documentType: "",
      title: "",
      notes: "",
      reference: "",
    };
    setProfile((p) => ({ ...p, documents: [...p.documents, doc] }));
    setMessage(null);
  }

  function updateDocument(id: string, patch: Partial<CsrProfileDocument>) {
    setProfile((p) => ({
      ...p,
      documents: p.documents.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }));
    setMessage(null);
  }

  function removeDocument(id: string) {
    setProfile((p) => ({
      ...p,
      documents: p.documents.filter((d) => d.id !== id),
    }));
    setMessage(null);
  }

  function addCity() {
    const next = cityDraft.trim();
    if (!next) return;
    if (profile.geography.preferredCitiesDistricts.includes(next)) {
      setCityDraft("");
      return;
    }
    update("geography", {
      preferredCitiesDistricts: [...profile.geography.preferredCitiesDistricts, next],
    });
    setCityDraft("");
  }

  function addRegion() {
    const next = regionDraft.trim();
    if (!next) return;
    if (profile.companyOverview.operatingRegions.includes(next)) {
      setRegionDraft("");
      return;
    }
    update("companyOverview", {
      operatingRegions: [...profile.companyOverview.operatingRegions, next],
    });
    setRegionDraft("");
  }

  const weightEntries = (
    Object.keys(profile.decisionProfile.weights) as ScoringDimension[]
  ).map((key) => ({
    key,
    label: DIMENSION_LABELS[key],
    value: profile.decisionProfile.weights[key],
  }));

  return (
    <AppShell breadcrumbs={[{ label: "Profile" }]}>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-cyan-50">
            CSR Intelligence Profile
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Define your organization&apos;s CSR strategy, priorities and goals so KellyOS can
            make more relevant project and NGO recommendations.
          </p>
        </div>
        <div className="min-w-[200px]">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Profile completeness</span>
            <span className="font-semibold text-cyan-50">{completeness}%</span>
          </div>
          <Progress value={completeness} className="h-2" />
        </div>
      </div>

      <Card className="glass-panel-strong mb-6 text-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">KellyOS CSR Intelligence</CardTitle>
          <CardDescription className="text-cyan-100/75">
            Derived from your saved profile — used as organisational context for
            recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Primary Focus", value: summary.primaryFocus },
              { label: "Preferred Geography", value: summary.preferredGeography },
              { label: "Target Beneficiaries", value: summary.targetBeneficiaries },
              { label: "Typical Investment", value: summary.fundingRange },
              { label: "Risk Appetite", value: summary.riskAppetite },
              { label: "Future Priority", value: summary.futurePriority },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-[11px] uppercase tracking-wide text-cyan-300/70">{item.label}</p>
                <p className="mt-1 text-sm font-medium text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="space-y-6">
        <Section
          title="Company Overview"
          description="Core organisational identity used for alignment and context."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Company Name">
              <Input
                value={profile.companyOverview.companyName}
                onChange={(e) => update("companyOverview", { companyName: e.target.value })}
                placeholder="Organisation legal / brand name"
              />
            </Field>
            <Field label="Industry">
              <Input
                value={profile.companyOverview.industry}
                onChange={(e) => update("companyOverview", { industry: e.target.value })}
                placeholder="e.g. Manufacturing, BFSI, Technology"
              />
            </Field>
            <Field label="Headquarters">
              <Input
                value={profile.companyOverview.headquarters}
                onChange={(e) => update("companyOverview", { headquarters: e.target.value })}
                placeholder="City / state"
              />
            </Field>
            <Field label="Founded Year">
              <Input
                value={profile.companyOverview.foundedYear}
                onChange={(e) => update("companyOverview", { foundedYear: e.target.value })}
                placeholder="e.g. 1998"
              />
            </Field>
            <Field label="Company Website">
              <Input
                value={profile.companyOverview.website}
                onChange={(e) => update("companyOverview", { website: e.target.value })}
                placeholder="https://"
              />
            </Field>
          </div>
          <Field
            label="Operating Regions"
            hint="Add states or regions where the company operates."
          >
            <div className="flex flex-wrap gap-2">
              <Input
                className="max-w-xs"
                value={regionDraft}
                onChange={(e) => setRegionDraft(e.target.value)}
                placeholder="Add a region / state"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addRegion();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addRegion}>
                Add
              </Button>
            </div>
            <MultiSelectChips
              className="mt-2"
              options={INDIAN_STATES}
              value={profile.companyOverview.operatingRegions}
              onChange={(operatingRegions) => update("companyOverview", { operatingRegions })}
            />
          </Field>
          <Field label="Company Mission">
            <Textarea
              value={profile.companyOverview.mission}
              onChange={(e) => update("companyOverview", { mission: e.target.value })}
              placeholder="Describe the company's mission"
              rows={3}
            />
          </Field>
          <Field label="Company Vision">
            <Textarea
              value={profile.companyOverview.vision}
              onChange={(e) => update("companyOverview", { vision: e.target.value })}
              placeholder="Describe the company's vision"
              rows={3}
            />
          </Field>
        </Section>

        <Section title="CSR Strategy" description="Strategic intent that guides project selection.">
          <Field label="CSR Vision">
            <Textarea
              value={profile.csrStrategy.csrVision}
              onChange={(e) => update("csrStrategy", { csrVision: e.target.value })}
              placeholder="Long-term CSR vision for the organisation"
              rows={3}
            />
          </Field>
          <Field label="CSR Mission">
            <Textarea
              value={profile.csrStrategy.csrMission}
              onChange={(e) => update("csrStrategy", { csrMission: e.target.value })}
              placeholder="How CSR is delivered day to day"
              rows={3}
            />
          </Field>
          <Field label="CSR Focus Areas">
            <MultiSelectChips
              options={CSR_FOCUS_OPTIONS}
              value={profile.csrStrategy.focusAreas}
              onChange={(focusAreas) => update("csrStrategy", { focusAreas })}
            />
          </Field>
          <Field
            label="Priority Focus Areas"
            hint="Select in order of importance (up to 5)."
          >
            <RankedFocusSelect
              options={
                profile.csrStrategy.focusAreas.length
                  ? profile.csrStrategy.focusAreas
                  : [...CSR_FOCUS_OPTIONS]
              }
              value={profile.csrStrategy.priorityFocusAreas}
              onChange={(priorityFocusAreas) =>
                update("csrStrategy", { priorityFocusAreas })
              }
            />
          </Field>
          <Field label="Primary CSR Objective">
            <Select
              value={profile.csrStrategy.primaryObjective || undefined}
              onValueChange={(primaryObjective) =>
                update("csrStrategy", { primaryObjective })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select primary objective" />
              </SelectTrigger>
              <SelectContent>
                {PRIMARY_CSR_OBJECTIVES.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </Section>

        <Section title="Target Beneficiaries">
          <Field label="Beneficiary Groups">
            <MultiSelectChips
              options={BENEFICIARY_OPTIONS}
              value={profile.beneficiaries.groups}
              onChange={(groups) => update("beneficiaries", { groups })}
            />
          </Field>
          <Field label="Preferred Impact Scale">
            <Select
              value={profile.beneficiaries.preferredImpactScale || undefined}
              onValueChange={(preferredImpactScale) =>
                update("beneficiaries", { preferredImpactScale })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select impact scale" />
              </SelectTrigger>
              <SelectContent>
                {IMPACT_SCALE_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </Section>

        <Section
          title="Geographic Strategy"
          description="Used later for NGO matching and project prioritisation geography fit."
        >
          <Field label="Preferred States">
            <MultiSelectChips
              options={INDIAN_STATES}
              value={profile.geography.preferredStates}
              onChange={(preferredStates) => update("geography", { preferredStates })}
            />
          </Field>
          <Field
            label="Preferred Cities / Districts"
            hint="Type a city or district and press Add."
          >
            <div className="flex flex-wrap gap-2">
              <Input
                className="max-w-xs"
                value={cityDraft}
                onChange={(e) => setCityDraft(e.target.value)}
                placeholder="e.g. Gurugram, Tenkasi"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCity();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addCity}>
                Add
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.geography.preferredCitiesDistricts.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="rounded-full border border-cyan-400/40 bg-cyan-400/20 px-3 py-1 text-xs text-white"
                  onClick={() =>
                    update("geography", {
                      preferredCitiesDistricts:
                        profile.geography.preferredCitiesDistricts.filter((x) => x !== c),
                    })
                  }
                >
                  {c} ×
                </button>
              ))}
            </div>
          </Field>
          <Field label="Geographic Preference">
            <MultiSelectChips
              options={GEOGRAPHIC_PREFERENCE_OPTIONS}
              value={profile.geography.geographicPreferences}
              onChange={(geographicPreferences) =>
                update("geography", { geographicPreferences })
              }
            />
          </Field>
        </Section>

        <Section title="Funding Strategy">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Annual CSR Budget (INR)">
              <Input
                type="number"
                min={0}
                value={profile.funding.annualCsrBudget ?? ""}
                onChange={(e) =>
                  update("funding", {
                    annualCsrBudget: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="e.g. 50000000"
              />
              {profile.funding.annualCsrBudget != null && (
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(profile.funding.annualCsrBudget, true)}
                </p>
              )}
            </Field>
            <Field label="Typical Project Investment — Min (INR)">
              <Input
                type="number"
                min={0}
                value={profile.funding.typicalInvestmentMin ?? ""}
                onChange={(e) =>
                  update("funding", {
                    typicalInvestmentMin:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </Field>
            <Field label="Typical Project Investment — Max (INR)">
              <Input
                type="number"
                min={0}
                value={profile.funding.typicalInvestmentMax ?? ""}
                onChange={(e) =>
                  update("funding", {
                    typicalInvestmentMax:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Funding Horizon">
              <Select
                value={profile.funding.fundingHorizon || undefined}
                onValueChange={(fundingHorizon) => update("funding", { fundingHorizon })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select horizon" />
                </SelectTrigger>
                <SelectContent>
                  {FUNDING_HORIZON_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Preferred Funding Model">
              <Select
                value={profile.funding.preferredFundingModel || undefined}
                onValueChange={(preferredFundingModel) =>
                  update("funding", { preferredFundingModel })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select funding model" />
                </SelectTrigger>
                <SelectContent>
                  {FUNDING_MODEL_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Project Preference">
            <MultiSelectChips
              options={PROJECT_PREFERENCE_OPTIONS}
              value={profile.funding.projectPreferences}
              onChange={(projectPreferences) => update("funding", { projectPreferences })}
            />
          </Field>
        </Section>

        <Section
          title="Impact Priorities"
          description="Outcome preferences for evaluation context. Does not override KellyOS scoring weights."
        >
          <Field label="Impact Metrics">
            <MultiSelectChips
              options={IMPACT_METRIC_OPTIONS}
              value={profile.impactPriorities.metrics}
              onChange={(metrics) => update("impactPriorities", { metrics })}
            />
          </Field>
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Impact Scale"
              hint="Depth of Impact ← → Scale of Impact"
            >
              <input
                type="range"
                min={0}
                max={100}
                value={profile.impactPriorities.impactScaleBalance}
                onChange={(e) =>
                  update("impactPriorities", {
                    impactScaleBalance: Number(e.target.value),
                  })
                }
                className="w-full accent-cyan-400"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Depth</span>
                <span>{profile.impactPriorities.impactScaleBalance}</span>
                <span>Scale</span>
              </div>
            </Field>
            <Field
              label="Time Horizon"
              hint="Immediate Results ← → Long-term Impact"
            >
              <input
                type="range"
                min={0}
                max={100}
                value={profile.impactPriorities.timeHorizonBalance}
                onChange={(e) =>
                  update("impactPriorities", {
                    timeHorizonBalance: Number(e.target.value),
                  })
                }
                className="w-full accent-cyan-400"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Immediate</span>
                <span>{profile.impactPriorities.timeHorizonBalance}</span>
                <span>Long-term</span>
              </div>
            </Field>
          </div>
        </Section>

        <Section
          title="NGO Partner Requirements"
          description="Capability and compliance preferences — not brand size or revenue as quality proxies."
        >
          <Field label="Preferred NGO Capabilities">
            <MultiSelectChips
              options={NGO_CAPABILITY_OPTIONS}
              value={profile.ngoPreferences.capabilities}
              onChange={(capabilities) => update("ngoPreferences", { capabilities })}
            />
          </Field>
          <Field label="Compliance Requirements">
            <MultiSelectChips
              options={COMPLIANCE_OPTIONS}
              value={profile.ngoPreferences.complianceRequirements}
              onChange={(complianceRequirements) =>
                update("ngoPreferences", { complianceRequirements })
              }
            />
          </Field>
        </Section>

        <Section
          title="Risk & Innovation"
          description="Supports Cost & Risk Efficiency context without changing scoring weights."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Risk Appetite">
              <Select
                value={profile.riskProfile.riskAppetite || undefined}
                onValueChange={(riskAppetite) => update("riskProfile", { riskAppetite })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select risk appetite" />
                </SelectTrigger>
                <SelectContent>
                  {RISK_APPETITE_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Preferred Project Risk">
              <Select
                value={profile.riskProfile.preferredProjectRisk || undefined}
                onValueChange={(preferredProjectRisk) =>
                  update("riskProfile", { preferredProjectRisk })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select preferred risk" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_RISK_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Comfort with">
            <MultiSelectChips
              options={RISK_PREFERENCE_OPTIONS}
              value={profile.riskProfile.preferences}
              onChange={(preferences) => update("riskProfile", { preferences })}
            />
          </Field>
        </Section>

        <Section title="KellyOS Decision Profile">
          <p className="text-sm text-muted-foreground">
            These parameters determine how KellyOS evaluates and prioritizes CSR
            opportunities. Weights are the existing system settings and are shown
            read-only here.
          </p>
          <div className="space-y-3">
            {weightEntries.map((w) => (
              <div key={w.key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{w.label}</span>
                  <span className="font-semibold">{w.value}%</span>
                </div>
                <Progress value={w.value} className="h-1.5" />
              </div>
            ))}
          </div>
        </Section>

        <Section title="CSR Governance">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="CSR Head / Responsible Team">
              <Input
                value={profile.governance.csrHeadOrTeam}
                onChange={(e) => update("governance", { csrHeadOrTeam: e.target.value })}
                placeholder="Name or team"
              />
            </Field>
            <Field label="CSR Committee">
              <Input
                value={profile.governance.csrCommittee}
                onChange={(e) => update("governance", { csrCommittee: e.target.value })}
                placeholder="Committee / board reference"
              />
            </Field>
            <Field label="Project Review Frequency">
              <Select
                value={profile.governance.projectReviewFrequency || undefined}
                onValueChange={(projectReviewFrequency) =>
                  update("governance", { projectReviewFrequency })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {REVIEW_FREQUENCY_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Impact Reporting Frequency">
              <Select
                value={profile.governance.impactReportingFrequency || undefined}
                onValueChange={(impactReportingFrequency) =>
                  update("governance", { impactReportingFrequency })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {REVIEW_FREQUENCY_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Financial Reporting Frequency">
              <Select
                value={profile.governance.financialReportingFrequency || undefined}
                onValueChange={(financialReportingFrequency) =>
                  update("governance", { financialReportingFrequency })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {REVIEW_FREQUENCY_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Approval Process">
              <Select
                value={profile.governance.approvalProcess || undefined}
                onValueChange={(approvalProcess) =>
                  update("governance", { approvalProcess })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select approval process" />
                </SelectTrigger>
                <SelectContent>
                  {APPROVAL_PROCESS_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </Section>

        <Section
          title="Future CSR Roadmap"
          description="Forward-looking goals for planning — leave blank until ready; nothing is auto-generated."
        >
          <Field label="2027 Goals">
            <Textarea
              value={profile.futureRoadmap.goals2027}
              onChange={(e) => update("futureRoadmap", { goals2027: e.target.value })}
              placeholder="e.g. Deepen education programmes in operating states"
              rows={3}
            />
          </Field>
          <Field label="2028 Goals">
            <Textarea
              value={profile.futureRoadmap.goals2028}
              onChange={(e) => update("futureRoadmap", { goals2028: e.target.value })}
              placeholder="e.g. Scale livelihood initiatives with verified partners"
              rows={3}
            />
          </Field>
          <Field label="2030 Vision">
            <Textarea
              value={profile.futureRoadmap.vision2030}
              onChange={(e) => update("futureRoadmap", { vision2030: e.target.value })}
              placeholder="Long-horizon CSR ambition"
              rows={3}
            />
          </Field>
          <Field label="Planned Expansion">
            <MultiSelectChips
              options={EXPANSION_OPTIONS}
              value={profile.futureRoadmap.plannedExpansion}
              onChange={(plannedExpansion) =>
                update("futureRoadmap", { plannedExpansion })
              }
            />
          </Field>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Structured Goals</Label>
              <Button type="button" variant="outline" size="sm" onClick={addGoal}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add goal
              </Button>
            </div>
            {profile.futureRoadmap.goals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No structured goals yet. Example only: “Expand women&apos;s skill development
                programs” · Target Year 2028 · Target “Reach 50,000 women”.
              </p>
            ) : (
              profile.futureRoadmap.goals.map((goal) => (
                <div
                  key={goal.id}
                  className="space-y-3 rounded-lg border border-border p-4"
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Goal Name">
                      <Input
                        value={goal.name}
                        onChange={(e) => updateGoal(goal.id, { name: e.target.value })}
                        placeholder="Goal name"
                      />
                    </Field>
                    <Field label="Target Year">
                      <Input
                        value={goal.targetYear}
                        onChange={(e) =>
                          updateGoal(goal.id, { targetYear: e.target.value })
                        }
                        placeholder="e.g. 2028"
                      />
                    </Field>
                    <Field label="Target Value (optional)">
                      <Input
                        value={goal.targetValue}
                        onChange={(e) =>
                          updateGoal(goal.id, { targetValue: e.target.value })
                        }
                        placeholder="e.g. Reach 50,000 women"
                      />
                    </Field>
                    <Field label="Status">
                      <Select
                        value={goal.status || undefined}
                        onValueChange={(status) =>
                          updateGoal(goal.id, {
                            status: status as CsrFutureGoal["status"],
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {GOAL_STATUS_OPTIONS.map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <Field label="Description">
                    <Textarea
                      value={goal.description}
                      onChange={(e) =>
                        updateGoal(goal.id, { description: e.target.value })
                      }
                      rows={2}
                    />
                  </Field>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => removeGoal(goal.id)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              ))
            )}
          </div>
        </Section>

        <Section
          title="CSR Documents"
          description="Register CSR policy and evidence documents. Metadata is stored on the company profile; use existing upload flows for binary files when available."
        >
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={addDocument}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add document
            </Button>
          </div>
          {profile.documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No documents linked yet. Add CSR Policy, Annual Report, ESG/BRSR, Impact Reports,
              or strategy documents as references.
            </p>
          ) : (
            profile.documents.map((doc) => (
              <div key={doc.id} className="space-y-3 rounded-lg border border-border p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Document Type">
                    <Select
                      value={doc.documentType || undefined}
                      onValueChange={(documentType) =>
                        updateDocument(doc.id, {
                          documentType: documentType as CsrProfileDocument["documentType"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {CSR_DOCUMENT_TYPE_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Title">
                    <Input
                      value={doc.title}
                      onChange={(e) => updateDocument(doc.id, { title: e.target.value })}
                      placeholder="Document title"
                    />
                  </Field>
                  <Field label="Reference / Link / Path">
                    <Input
                      value={doc.reference}
                      onChange={(e) =>
                        updateDocument(doc.id, { reference: e.target.value })
                      }
                      placeholder="URL or internal path"
                    />
                  </Field>
                  <Field label="Notes">
                    <Input
                      value={doc.notes}
                      onChange={(e) => updateDocument(doc.id, { notes: e.target.value })}
                      placeholder="Optional notes"
                    />
                  </Field>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-600"
                  onClick={() => removeDocument(doc.id)}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>
            ))
          )}
        </Section>

        <Card>
          <CardHeader>
            <CardTitle>Signed-in account</CardTitle>
            <CardDescription>
              Account credentials remain separate from the company CSR Intelligence Profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <Badge variant="secondary" className="mt-1">
                {(user.role || "CSR_MANAGER").replace(/_/g, " ")}
              </Badge>
            </div>
            <Button variant="outline" onClick={signOut} disabled={signingOut}>
              <LogOut className="mr-1.5 h-4 w-4" />
              {signingOut ? "Logging out…" : "Log out"}
            </Button>
          </CardContent>
        </Card>

        <div className="glass-panel-strong sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-2xl p-3">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
          <Button variant="outline" onClick={signOut} disabled={signingOut}>
            <LogOut className="mr-1.5 h-4 w-4" />
            {signingOut ? "Logging out…" : "Log out"}
          </Button>
          {message && <p className="text-sm text-emerald-700">{message}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <span className="ml-auto text-xs text-muted-foreground">
            Completeness: {completeness}%
          </span>
        </div>
      </div>
    </AppShell>
  );
}
