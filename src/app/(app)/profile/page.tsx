import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProfileClient } from "@/components/profile/ProfileClient";
import { loadCsrIntelligenceProfile } from "@/services/profile/csrIntelligenceProfile";
import type { CsrIntelligenceProfile } from "@/types/csrIntelligenceProfile";

export default async function ProfilePage() {
  const user = await requireUser();
  if (!user) redirect("/login");
  if (!user.companyId) redirect("/onboarding");

  const company = await prisma.company.findUnique({ where: { id: user.companyId } });
  if (!company) redirect("/onboarding");

  let profile: CsrIntelligenceProfile;
  try {
    const loaded = await loadCsrIntelligenceProfile(user.companyId);
    // Ensure a plain JSON-serializable payload crosses the server→client boundary.
    profile = JSON.parse(JSON.stringify(loaded.profile)) as CsrIntelligenceProfile;
  } catch (e) {
    console.error("Failed to load CSR Intelligence Profile:", e);
    redirect("/onboarding");
  }

  return (
    <ProfileClient
      initialProfile={profile}
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || "CSR_MANAGER",
      }}
    />
  );
}
