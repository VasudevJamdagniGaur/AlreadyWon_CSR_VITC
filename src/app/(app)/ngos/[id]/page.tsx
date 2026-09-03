import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { KpiCard } from "@/components/shared/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatScore, parseJsonArray, parseJsonObject, statusLabel } from "@/lib/utils";

export default async function NGODetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const ngo = await prisma.nGO.findUnique({
    where: { id },
    include: {
      documents: true,
      projectHistory: { orderBy: { completedAt: "desc" } },
      projects: { take: 10, orderBy: { updatedAt: "desc" } },
    },
  });

  if (!ngo) notFound();

  const expertise = parseJsonArray(ngo.primaryExpertise);
  const regions = parseJsonArray(ngo.regions);
  const beneficiaries = parseJsonArray(ngo.beneficiaryGroups);
  const certifications = parseJsonArray(ngo.certifications);
  const riskFlags = parseJsonArray(ngo.riskFlags);
  const financial = parseJsonObject(ngo.financialSignals, {} as Record<string, unknown>);

  return (
    <AppShell
      breadcrumbs={[
        { label: "NGO Intelligence", href: "/ngos" },
        { label: ngo.name },
      ]}
    >
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-navy-900">{ngo.name}</h1>
          <Badge variant="demo">SYNTHETIC DEMO ORGANIZATION</Badge>
          {ngo.isNew && <Badge variant="info">New partner</Badge>}
        </div>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          {ngo.mission || "No mission on file."}
        </p>
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          AI-assisted due diligence / Human review required. Figures are synthetic demo signals,
          not verified real-world credentials.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Partner score"
          value={
            ngo.overallPartnerScore != null ? formatScore(ngo.overallPartnerScore) : "—"
          }
          demo
        />
        <KpiCard
          title="Execution reliability"
          value={
            ngo.executionReliability != null ? formatScore(ngo.executionReliability) : "—"
          }
          demo
        />
        <KpiCard title="Projects delivered" value={String(ngo.projectCount)} demo />
        <KpiCard title="Years experience" value={String(ngo.yearsOfExperience)} demo />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Capabilities</CardTitle>
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
              <div>
                <p className="text-xs text-muted-foreground">Beneficiary groups</p>
                <p>{beneficiaries.join(", ") || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Operational capacity</p>
                <p>{ngo.operationalCapacity || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Certifications</p>
                <p>{certifications.join(", ") || "None listed"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Risk & confidence</CardTitle>
              <CardDescription>
                Confidence {(ngo.confidence * 100).toFixed(0)}%
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="mb-1 font-medium">Risk flags</p>
                {riskFlags.length ? (
                  <ul className="list-disc pl-4 text-muted-foreground">
                    {riskFlags.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No risk flags on synthetic profile.</p>
                )}
              </div>
              {Object.keys(financial).length > 0 && (
                <div>
                  <p className="mb-1 font-medium">Financial signals</p>
                  <ul className="space-y-1 text-muted-foreground">
                    {Object.entries(financial).map(([k, v]) => (
                      <li key={k}>
                        {k}: {String(v)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {ngo.projects.length > 0 && (
                <div>
                  <p className="mb-1 font-medium">Linked KellyOS projects</p>
                  <ul className="space-y-1">
                    {ngo.projects.map((p) => (
                      <li key={p.id}>
                        <Link href={`/projects/${p.id}`} className="hover:underline">
                          {p.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Project history</CardTitle>
              <CardDescription>Synthetic past delivery records</CardDescription>
            </CardHeader>
            <CardContent>
              {ngo.projectHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No history records.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground">
                        <th className="pb-2 pr-2 font-medium">Project</th>
                        <th className="pb-2 pr-2 font-medium">Category</th>
                        <th className="pb-2 pr-2 font-medium">Geography</th>
                        <th className="pb-2 pr-2 font-medium">Status</th>
                        <th className="pb-2 font-medium">Outcomes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ngo.projectHistory.map((h) => (
                        <tr key={h.id} className="border-b last:border-0">
                          <td className="py-2 pr-2 font-medium">{h.projectName}</td>
                          <td className="py-2 pr-2">{h.category ?? "—"}</td>
                          <td className="py-2 pr-2">{h.geography ?? "—"}</td>
                          <td className="py-2 pr-2">
                            <Badge variant="outline">
                              {statusLabel(h.completionStatus)}
                            </Badge>
                          </td>
                          <td className="py-2">
                            {h.outcomeAchievement != null
                              ? `${h.outcomeAchievement}%`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {ngo.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents on file.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {ngo.documents.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <span>{d.name}</span>
                      <Badge variant="secondary">{statusLabel(d.processingStatus)}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Avg milestone performance</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {ngo.projectHistory.length
                  ? `${(
                      ngo.projectHistory.reduce(
                        (s, h) => s + (h.milestonePerformance ?? 0),
                        0
                      ) / ngo.projectHistory.length
                    ).toFixed(0)}%`
                  : "—"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Avg budget variance</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {ngo.projectHistory.length
                  ? `${(
                      ngo.projectHistory.reduce((s, h) => s + (h.budgetVariance ?? 0), 0) /
                      ngo.projectHistory.length
                    ).toFixed(1)}%`
                  : "—"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Risk events</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {ngo.projectHistory.reduce((s, h) => s + h.riskEvents, 0)}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
