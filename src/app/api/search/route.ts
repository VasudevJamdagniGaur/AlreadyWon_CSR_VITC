import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { simpleEmbed, cosineSimilarity } from "@/services/documents/extraction";

/**
 * Global search across projects, NGOs, documents, recommendations.
 * Uses token embedding cosine similarity as a semantic fallback (no pgvector required).
 */
export async function GET(req: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    if (!q) {
      return NextResponse.json({ results: [], query: q });
    }

    const qLower = q.toLowerCase();
    const qEmbed = simpleEmbed(q);

    const [projects, ngos, docs, recommendations, notifications] = await Promise.all([
      prisma.project.findMany({ take: 50 }),
      prisma.nGO.findMany({ take: 50 }),
      prisma.projectDocument.findMany({ take: 50 }),
      prisma.recommendation.findMany({ where: { isActive: true }, take: 30 }),
      prisma.notification.findMany({ take: 20 }),
    ]);

    type Hit = {
      type: string;
      id: string;
      title: string;
      subtitle?: string;
      href: string;
      score: number;
    };

    const results: Hit[] = [];

    for (const p of projects) {
      const hay = `${p.name} ${p.category ?? ""} ${p.description ?? ""} ${p.organization ?? ""}`;
      const lexical = hay.toLowerCase().includes(qLower) ? 1 : 0;
      const semantic = cosineSimilarity(qEmbed, simpleEmbed(hay));
      const score = lexical * 0.7 + semantic * 0.3;
      if (score > 0.15 || lexical) {
        results.push({
          type: "project",
          id: p.id,
          title: String(p.name),
          subtitle: String(p.category ?? "Project"),
          href: `/projects/${p.id}`,
          score,
        });
      }
    }

    for (const n of ngos) {
      const hay = `${n.name} ${n.mission ?? ""} ${n.primaryExpertise ?? ""}`;
      const lexical = hay.toLowerCase().includes(qLower) ? 1 : 0;
      const semantic = cosineSimilarity(qEmbed, simpleEmbed(hay));
      const score = lexical * 0.7 + semantic * 0.3;
      if (score > 0.15 || lexical) {
        results.push({
          type: "ngo",
          id: n.id,
          title: String(n.name),
          subtitle: "SYNTHETIC DEMO ORGANIZATION",
          href: `/ngos/${n.id}`,
          score,
        });
      }
    }

    for (const d of docs) {
      const hay = `${d.name} ${d.extractedText ?? ""}`.slice(0, 2000);
      const lexical = hay.toLowerCase().includes(qLower) ? 1 : 0;
      const semantic = cosineSimilarity(qEmbed, simpleEmbed(hay));
      const score = lexical * 0.6 + semantic * 0.4;
      if (score > 0.2 || lexical) {
        results.push({
          type: "document",
          id: d.id,
          title: String(d.name),
          subtitle: "Document",
          href: d.projectId ? `/projects/${d.projectId}` : "/projects",
          score,
        });
      }
    }

    for (const r of recommendations) {
      const hay = `${r.title} ${r.reason ?? ""}`;
      if (hay.toLowerCase().includes(qLower)) {
        results.push({
          type: "recommendation",
          id: r.id,
          title: String(r.title),
          subtitle: "Recommendation",
          href: r.projectId ? `/projects/${r.projectId}` : "/prioritization",
          score: 0.85,
        });
      }
    }

    for (const n of notifications) {
      const hay = `${n.title} ${n.message ?? ""}`;
      if (hay.toLowerCase().includes(qLower)) {
        results.push({
          type: "notification",
          id: n.id,
          title: String(n.title),
          subtitle: String(n.type),
          href: "/dashboard#notifications",
          score: 0.7,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      query: q,
      results: results.slice(0, 25),
      note: "Semantic similarity uses local embedding fallback (Firebase-compatible).",
    });
  } catch {
    return NextResponse.json({ error: "Unable to search." }, { status: 500 });
  }
}
