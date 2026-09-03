import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ProfileClient } from "@/components/profile/ProfileClient";

export default async function ProfilePage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  return (
    <ProfileClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || "CSR_MANAGER",
        companyName: (user.company as { name?: string } | null | undefined)?.name ?? null,
      }}
    />
  );
}
