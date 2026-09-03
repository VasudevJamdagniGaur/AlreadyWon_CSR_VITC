import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MatchingClient } from "@/components/matching/MatchingClient";

export default async function MatchingPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const user = await requireUser();
  if (!user?.companyId) redirect("/onboarding");

  const { projectId: qProjectId } = await searchParams;

  const projects = await prisma.project.findMany({
    where: { companyId: user.companyId },
    select: { id: true, name: true, category: true },
    orderBy: { name: "asc" },
  });

  const initialProjectId = qProjectId ?? projects[0]?.id ?? null;

  const matches = initialProjectId
    ? await prisma.nGOMatch.findMany({
        where: { projectId: initialProjectId },
        include: { ngo: true },
        orderBy: { matchScore: "desc" },
      })
    : [];

  return (
    <MatchingClient
      projects={projects as { id: string; name: string; category: string | null }[]}
      initialProjectId={initialProjectId}
      initialMatches={matches.map((m: any) => ({
        id: m.id,
        projectId: m.projectId,
        ngoId: m.ngoId,
        ngoName: m.ngo?.name ?? "Unknown",
        matchScore: m.matchScore,
        expertiseMatch: m.expertiseMatch,
        geographicMatch: m.geographicMatch,
        beneficiaryMatch: m.beneficiaryMatch,
        executionReliability: m.executionReliability,
        relevantExperience: m.relevantExperience,
        riskScore: m.riskScore,
        confidence: m.confidence,
        isSelected: m.isSelected,
        explanation: m.explanation,
        isDemo: m.ngo?.isDemo,
      }))}
    />
  );
}
