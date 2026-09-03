import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyPlaceholder } from "@/components/shared/EmptyPlaceholder";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatScore, parseJsonArray } from "@/lib/utils";

export default async function NGOsPage() {
  await requireUser();

  const ngos = await prisma.nGO.findMany({
    orderBy: [{ overallPartnerScore: "desc" }, { name: "asc" }],
  });

  return (
    <AppShell breadcrumbs={[{ label: "NGO Intelligence" }]}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
          NGO Intelligence
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Partner profiles with due-diligence signals for KellyOS.
        </p>
      </div>

      {ngos.length === 0 ? (
        <EmptyPlaceholder
          title="No NGO profiles"
          description="Seed the database to load synthetic partner organizations."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ngos.map((n) => {
            const expertise = parseJsonArray(n.primaryExpertise);
            const regions = parseJsonArray(n.regions);
            return (
              <Card key={n.id} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">
                      <Link href={`/ngos/${n.id}`} className="hover:underline">
                        {n.name}
                      </Link>
                    </CardTitle>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {n.mission || "Mission not provided."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Expertise</p>
                    <p>{expertise.join(", ") || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Regions</p>
                    <p>{regions.join(", ") || "—"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Reliability</p>
                      <p className="font-semibold">
                        {n.executionReliability != null
                          ? formatScore(n.executionReliability)
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Partner score</p>
                      <p className="font-semibold">
                        {n.overallPartnerScore != null
                          ? formatScore(n.overallPartnerScore)
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>Confidence</span>
                      <span>{(n.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={n.confidence * 100} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
