import OpenAI from "openai";
import {
  ProjectExtractionSchema,
  NGOExtractionSchema,
  type ProjectExtraction,
  type NGOExtraction,
} from "@/lib/validation";
import type { AIProvider } from "./provider";
import type { ProjectScoreResult, RiskAssessment } from "@/types";
import { DemoAIProvider } from "./demoProvider";

/**
 * OpenAI-compatible provider. Falls back to demo extraction on failure.
 */
export class OpenAIProvider implements AIProvider {
  name = "AI Analysis";
  isDemo = false;
  private client: OpenAI;
  private model: string;
  private fallback = new DemoAIProvider();

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = process.env.AI_MODEL || "gpt-4o-mini";
  }

  async extractProject(text: string, fileName?: string): Promise<ProjectExtraction> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are KellyOS document intelligence. Extract CSR project proposal fields as JSON.
Rules:
- Never invent facts not present in the document.
- If a field is missing, use null, 0, or empty arrays.
- Include evidence array with source excerpts from the text.
- Budget should be in INR absolute numbers (convert lakh/crore).
Schema keys: projectName, organization, category, description, geography, beneficiaries{count,groups}, requestedBudget, durationMonths, objectives, outcomes, milestones[{name,description,month}], risks, requiredExpertise, dependencies, implementationModel, pastExperience, evidence[{field,value,source,sourceExcerpt,confidence}]`,
          },
          {
            role: "user",
            content: `File: ${fileName ?? "unknown"}\n\nDocument:\n${text.slice(0, 12000)}`,
          },
        ],
        temperature: 0.1,
      });

      const raw = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
      return ProjectExtractionSchema.parse(raw);
    } catch {
      return this.fallback.extractProject(text, fileName);
    }
  }

  async extractNGO(text: string, fileName?: string): Promise<NGOExtraction> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Extract NGO profile fields as JSON. Never invent facts. Missing fields = empty/null.
Keys: organization, mission, expertise, regions, beneficiaries, projects, experience, operationalCapacity, reportedOutcomes, budgetInformation, riskIndicators, evidence`,
          },
          {
            role: "user",
            content: `File: ${fileName ?? "unknown"}\n\n${text.slice(0, 12000)}`,
          },
        ],
        temperature: 0.1,
      });
      const raw = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
      return NGOExtractionSchema.parse(raw);
    } catch {
      return this.fallback.extractNGO(text, fileName);
    }
  }

  async explainRecommendation(context: {
    projectName: string;
    score: ProjectScoreResult;
    companyPriorities: string[];
  }) {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You write cautious CSR decision-support explanations for KellyOS.
Avoid absolute language. Never say "fund this" or "trustworthy".
Return JSON: { recommendation, reasons: string[], watchOuts: string[], confidence: number }`,
          },
          {
            role: "user",
            content: JSON.stringify(context),
          },
        ],
        temperature: 0.2,
      });
      const raw = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
      return {
        recommendation: raw.recommendation ?? "Recommended for review",
        reasons: raw.reasons ?? [],
        watchOuts: raw.watchOuts ?? ["Human review required"],
        confidence: raw.confidence ?? context.score.confidence,
      };
    } catch {
      return this.fallback.explainRecommendation(context);
    }
  }

  async summarizeReport(context: Parameters<AIProvider["summarizeReport"]>[0]) {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "Write a structured CSR project summary for KellyOS. Cautious language. No fabricated impact claims.",
          },
          { role: "user", content: JSON.stringify(context) },
        ],
        temperature: 0.2,
      });
      return completion.choices[0]?.message?.content ?? this.fallback.summarizeReport(context);
    } catch {
      return this.fallback.summarizeReport(context);
    }
  }

  async analyzeRiskNarrative(risks: RiskAssessment[]) {
    return this.fallback.analyzeRiskNarrative(risks);
  }
}
