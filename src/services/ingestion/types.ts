import { z } from "zod";

/**
 * Normalized NGO record for ingestion pipelines.
 * Only include fields that came from a real source — never invent values.
 */
export const NormalizedNgoRecordSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  description: z.string().optional(),
  areasOfWork: z.array(z.string()).optional(),
  beneficiaryGroups: z.array(z.string()).optional(),
  states: z.array(z.string()).optional(),
  districts: z.array(z.string()).optional(),
  website: z.string().optional(),
  sourceName: z.string().optional(),
  /** Exact original source URL — do not rewrite. */
  sourceUrl: z.string().optional(),
  sourceType: z.string().optional(),
  sourceDate: z.string().optional(),
  externalId: z.string().optional(),
  verificationStatus: z
    .enum(["unverified", "pending", "verified", "rejected"])
    .optional(),
  lastVerifiedAt: z.string().optional(),
});

export type NormalizedNgoRecord = z.infer<typeof NormalizedNgoRecordSchema>;

export type NgoImportAction = "create" | "update" | "skip" | "invalid";

export type NgoImportPreviewItem = {
  action: NgoImportAction;
  name: string;
  externalId?: string;
  existingId?: string;
  dedupeKey: string;
  reason?: string;
  record?: NormalizedNgoRecord;
  errors?: string[];
};

export type NgoImportResult = {
  dryRun: boolean;
  mode: "demo" | "firestore";
  total: number;
  created: number;
  updated: number;
  skipped: number;
  invalid: number;
  items: NgoImportPreviewItem[];
};
