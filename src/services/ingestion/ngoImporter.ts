import { prisma, getDatabaseMode } from "@/lib/db";
import { toJson, parseJsonArray } from "@/lib/utils";
import {
  NormalizedNgoRecordSchema,
  type NormalizedNgoRecord,
  type NgoImportPreviewItem,
  type NgoImportResult,
} from "./types";

export type { NormalizedNgoRecord, NgoImportResult, NgoImportPreviewItem };

function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** Stable dedupe key: prefer externalId; else normalized name + primary state. */
export function buildNgoDedupeKey(record: {
  name: string;
  externalId?: string;
  states?: string[];
}): string {
  if (record.externalId?.trim()) {
    return `ext:${record.externalId.trim()}`;
  }
  const name = normalizeToken(record.name);
  const state = record.states?.[0] ? normalizeToken(record.states[0]) : "";
  return `name:${name}|state:${state}`;
}

function existingDedupeKey(existing: Record<string, unknown>): string {
  if (typeof existing.externalId === "string" && existing.externalId.trim()) {
    return `ext:${existing.externalId.trim()}`;
  }
  const regions = parseJsonArray(existing.regions as string | undefined);
  return buildNgoDedupeKey({
    name: String(existing.name ?? ""),
    states: regions.length ? [regions[0]] : [],
  });
}

function parseVerifiedAt(value?: string): Date | undefined {
  if (!value?.trim()) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * Map a normalized ingest record onto existing NGO document fields.
 * Omits any field that was not provided — never invents scores or capacity.
 */
export function mapNormalizedToNgoData(
  record: NormalizedNgoRecord,
  now = new Date()
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    name: record.name.trim(),
    lastImportedAt: now,
    isDemo: false,
  };

  if (record.description !== undefined) data.mission = record.description;
  if (record.areasOfWork !== undefined) {
    data.primaryExpertise = toJson(record.areasOfWork);
  }
  if (record.beneficiaryGroups !== undefined) {
    data.beneficiaryGroups = toJson(record.beneficiaryGroups);
  }
  if (record.states !== undefined) data.regions = toJson(record.states);
  if (record.districts !== undefined) data.districts = toJson(record.districts);
  if (record.website !== undefined) data.website = record.website;
  if (record.sourceName !== undefined) data.sourceName = record.sourceName;
  if (record.sourceUrl !== undefined) data.sourceUrl = record.sourceUrl;
  if (record.sourceType !== undefined) data.sourceType = record.sourceType;
  if (record.sourceDate !== undefined) data.sourceDate = record.sourceDate;
  if (record.externalId !== undefined) data.externalId = record.externalId.trim();
  if (record.verificationStatus !== undefined) {
    data.verificationStatus = record.verificationStatus;
  }

  const verifiedAt = parseVerifiedAt(record.lastVerifiedAt);
  if (record.lastVerifiedAt !== undefined) {
    data.lastVerifiedAt = verifiedAt ?? null;
  } else if (record.verificationStatus === "verified") {
    data.lastVerifiedAt = now;
  }

  return data;
}

async function loadExistingNgos(): Promise<Record<string, unknown>[]> {
  return prisma.nGO.findMany();
}

function findMatch(
  record: NormalizedNgoRecord,
  existing: Record<string, unknown>[]
): Record<string, unknown> | undefined {
  const key = buildNgoDedupeKey(record);
  if (record.externalId?.trim()) {
    const byExt = existing.find(
      (n) =>
        typeof n.externalId === "string" &&
        n.externalId.trim() === record.externalId!.trim()
    );
    if (byExt) return byExt;
  }
  return existing.find((n) => existingDedupeKey(n) === key);
}

function validateRecord(raw: unknown): {
  ok: boolean;
  record?: NormalizedNgoRecord;
  errors?: string[];
} {
  const parsed = NormalizedNgoRecordSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => `${i.path.join(".") || "record"}: ${i.message}`),
    };
  }
  return { ok: true, record: parsed.data };
}

export type ImportNgosOptions = {
  records: unknown[];
  /** When true, compute create/update plan without writing. */
  dryRun?: boolean;
};

/**
 * Reusable NGO importer over the existing Firestore/db NGO model.
 */
export async function importNgos(options: ImportNgosOptions): Promise<NgoImportResult> {
  const dryRun = Boolean(options.dryRun);
  const mode = getDatabaseMode();
  const existing = await loadExistingNgos();
  const items: NgoImportPreviewItem[] = [];
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let invalid = 0;

  // Track keys seen in this batch to avoid intra-batch duplicates
  const seenKeys = new Set<string>();

  for (const raw of options.records) {
    const validated = validateRecord(raw);
    if (!validated.ok || !validated.record) {
      invalid += 1;
      items.push({
        action: "invalid",
        name:
          raw && typeof raw === "object" && "name" in raw
            ? String((raw as { name: unknown }).name ?? "(missing)")
            : "(missing)",
        dedupeKey: "",
        errors: validated.errors,
        reason: "Failed validation",
      });
      continue;
    }

    const record = validated.record;
    const dedupeKey = buildNgoDedupeKey(record);

    if (seenKeys.has(dedupeKey)) {
      skipped += 1;
      items.push({
        action: "skip",
        name: record.name,
        externalId: record.externalId,
        dedupeKey,
        record,
        reason: "Duplicate within import batch",
      });
      continue;
    }
    seenKeys.add(dedupeKey);

    const match = findMatch(record, existing);
    const now = new Date();
    const payload = mapNormalizedToNgoData(record, now);

    if (match?.id) {
      if (dryRun) {
        updated += 1;
        items.push({
          action: "update",
          name: record.name,
          externalId: record.externalId,
          existingId: String(match.id),
          dedupeKey,
          record,
          reason: "Would update existing NGO",
        });
        continue;
      }

      await prisma.nGO.update({
        where: { id: match.id },
        data: payload,
      });
      // Keep in-memory index current for later rows
      Object.assign(match, payload);
      updated += 1;
      items.push({
        action: "update",
        name: record.name,
        externalId: record.externalId,
        existingId: String(match.id),
        dedupeKey,
        record,
        reason: "Updated existing NGO",
      });
      continue;
    }

    if (dryRun) {
      created += 1;
      items.push({
        action: "create",
        name: record.name,
        externalId: record.externalId,
        dedupeKey,
        record,
        reason: "Would create new NGO",
      });
      continue;
    }

    const createdDoc = await prisma.nGO.create({ data: payload });
    existing.push(createdDoc);
    created += 1;
    items.push({
      action: "create",
      name: record.name,
      externalId: record.externalId,
      existingId: createdDoc.id,
      dedupeKey,
      record,
      reason: "Created new NGO",
    });
  }

  return {
    dryRun,
    mode,
    total: options.records.length,
    created,
    updated,
    skipped,
    invalid,
    items,
  };
}
