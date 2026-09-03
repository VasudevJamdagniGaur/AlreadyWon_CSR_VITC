import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, logAudit } from "@/lib/auth";
import { parseJsonArray, parseJsonObject, toJson } from "@/lib/utils";
import { getAIProvider, getAIModeLabel } from "@/services/ai";
import { getCompanyProfile, getScoringWeights } from "@/services/dashboard/service";
import { scoreProject } from "@/services/scoring/projectScoring";
import {
  extractTextFromBuffer,
  validateUpload,
  chunkText,
  simpleEmbed,
} from "@/services/documents/extraction";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!user?.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const validation = validateUpload(file.name, file.type);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = process.env.UPLOAD_DIR || "./uploads";
    await mkdir(uploadDir, { recursive: true });
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(uploadDir, safeName);
    await writeFile(filePath, buffer);

    const text = await extractTextFromBuffer(buffer, file.type, file.name);
    if (!text || text.trim().length < 20) {
      return NextResponse.json(
        { error: "Unable to process document. Could not extract readable text." },
        { status: 400 }
      );
    }

    const ai = getAIProvider();
    const extracted = await ai.extractProject(text, file.name);
    const company = await getCompanyProfile(user.companyId);
    const weights = await getScoringWeights(user.companyId);

    if (!company) {
      return NextResponse.json({ error: "Company profile missing." }, { status: 400 });
    }

    const scored = scoreProject(
      {
        name: extracted.projectName,
        category: extracted.category,
        description: extracted.description,
        geography: extracted.geography,
        beneficiaryCount: extracted.beneficiaries.count,
        beneficiaryGroups: extracted.beneficiaries.groups,
        requestedBudget: extracted.requestedBudget,
        durationMonths: extracted.durationMonths,
        outcomes: extracted.outcomes,
        risks: extracted.risks,
        requiredExpertise: extracted.requiredExpertise,
        pastExperience: extracted.pastExperience,
        evidenceCount: extracted.evidence.length,
        dataCompleteness: extracted.evidence.length > 2 ? 0.8 : 0.5,
      },
      company,
      undefined,
      weights
    );

    const project = await prisma.project.create({
      data: {
        companyId: user.companyId,
        name: extracted.projectName,
        organization: extracted.organization,
        category: extracted.category,
        description: extracted.description,
        geography: toJson(extracted.geography),
        beneficiaries: toJson(extracted.beneficiaries),
        targetOutcomes: toJson(extracted.outcomes),
        requestedBudget: extracted.requestedBudget,
        durationMonths: extracted.durationMonths,
        requiredExpertise: toJson(extracted.requiredExpertise),
        dependencies: toJson(extracted.dependencies),
        implementationModel: extracted.implementationModel,
        pastExperience: extracted.pastExperience,
        status: "SUBMITTED",
        overallScore: scored.overallScore,
        recommendationLevel: scored.recommendationLevel,
        riskLevel: extracted.risks.length > 3 ? "MEDIUM" : "LOW",
        isDemo: true,
      },
    });

    await prisma.projectDocument.create({
      data: {
        projectId: project.id,
        name: file.name,
        filePath,
        documentType: "PROJECT_PROPOSAL",
        mimeType: file.type,
        extractedText: text,
        structuredData: toJson(extracted),
        processingStatus: "COMPLETE",
      },
    });

    const chunks = chunkText(text);
    for (const chunk of chunks.slice(0, 20)) {
      await prisma.documentChunk.create({
        data: {
          documentId: project.id,
          content: chunk.content,
          section: chunk.section,
          chunkIndex: chunk.chunkIndex,
          embedding: toJson(simpleEmbed(chunk.content)),
        },
      });
    }

    await prisma.projectScore.create({
      data: {
        projectId: project.id,
        overallScore: scored.overallScore,
        socialImpact: scored.dimensions.socialImpact.score,
        executionReliability: scored.dimensions.executionReliability.score,
        companyAlignment: scored.dimensions.companyAlignment.score,
        communityBrandResonance: scored.dimensions.communityBrandResonance.score,
        costRiskEfficiency: scored.dimensions.costRiskEfficiency.score,
        socialImpactConfidence: scored.dimensions.socialImpact.confidence,
        executionConfidence: scored.dimensions.executionReliability.confidence,
        alignmentConfidence: scored.dimensions.companyAlignment.confidence,
        resonanceConfidence: scored.dimensions.communityBrandResonance.confidence,
        efficiencyConfidence: scored.dimensions.costRiskEfficiency.confidence,
        overallConfidence: scored.confidence,
        explanation: toJson({
          overall: scored.explanation,
          dimensions: scored.dimensions,
          contributions: scored.contributions,
          recommendationLevel: scored.recommendationLevel,
        }),
        weights: toJson(weights),
      },
    });

    for (const [dim, result] of Object.entries(scored.dimensions)) {
      for (const ev of result.evidence) {
        await prisma.projectEvidence.create({
          data: {
            projectId: project.id,
            dimension: dim,
            claim: ev,
            source: getAIModeLabel(),
            confidence: result.confidence,
          },
        });
      }
    }

    for (const m of extracted.milestones.slice(0, 5)) {
      await prisma.milestone.create({
        data: {
          projectId: project.id,
          name: m.name,
          description: m.description,
          status: "NOT_STARTED",
          expectedProgress: (m.month ?? 3) * 5,
          sortOrder: extracted.milestones.indexOf(m),
        },
      });
    }

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "DOCUMENT_PROCESSED",
        title: "Document processed",
        message: `${file.name} analyzed via ${getAIModeLabel()}.`,
        entityType: "Project",
        entityId: project.id,
      },
    });

    await logAudit({
      userId: user.id,
      actor: user.name,
      action: "PROPOSAL_UPLOADED",
      entity: "Project",
      entityId: project.id,
      details: { file: file.name, score: scored.overallScore, mode: getAIModeLabel() },
    });

    const explanation = await ai.explainRecommendation({
      projectName: project.name,
      score: scored,
      companyPriorities: company.csrFocus,
    });

    return NextResponse.json({
      project,
      score: scored,
      extraction: extracted,
      explanation,
      analysisMode: getAIModeLabel(),
      stages: [
        "Uploading",
        "Extracting",
        "Structuring",
        "Scoring",
        "Complete",
      ],
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        error:
          "Unable to process document. AI analysis is temporarily unavailable. Demo analysis may be used on retry.",
      },
      { status: 500 }
    );
  }
}
