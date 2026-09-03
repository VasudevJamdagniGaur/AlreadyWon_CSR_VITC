import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCompanyProfile, getScoringWeights } from "@/services/dashboard/service";
import { prisma } from "@/lib/db";
import { SettingsClient } from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const user = await requireUser();
  if (!user?.companyId) redirect("/onboarding");

  const company = await prisma.company.findUnique({ where: { id: user.companyId } });
  const profile = await getCompanyProfile(user.companyId);
  const weights = await getScoringWeights(user.companyId);

  if (!company || !profile) redirect("/onboarding");

  return (
    <SettingsClient
      company={{
        name: profile.name,
        industries: profile.industries,
        csrFocus: profile.csrFocus,
        targetRegions: profile.targetRegions,
        beneficiaryGroups: profile.beneficiaryGroups,
        strategicThemes: profile.strategicThemes,
        annualBudget: profile.annualBudget,
        isDemo: company.isDemo,
      }}
      weights={weights}
    />
  );
}
