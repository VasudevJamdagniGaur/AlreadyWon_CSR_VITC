import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ProfileClient } from "@/components/profile/ProfileClient";
import { loadCsrIntelligenceProfile } from "@/services/profile/csrIntelligenceProfile";

export default async function ProfilePage() {
  const user = await requireUser();
  if (!user) redirect("/login");
  if (!user.companyId) redirect("/onboarding");

  const { profile } = await loadCsrIntelligenceProfile(user.companyId);

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
