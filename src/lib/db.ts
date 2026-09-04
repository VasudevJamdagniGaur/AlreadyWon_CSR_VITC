import { randomBytes } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { isDemoFirestoreMode } from "@/lib/firebase";
import { getLocalDemoKellyProjects, isLocalDemoMode } from "@/lib/localDemoStore";

export type Doc = Record<string, any> & { id: string };

type StoreData = Record<string, Doc[]>;

const DATE_FIELDS = new Set([
  "createdAt",
  "updatedAt",
  "timestamp",
  "date",
  "dueDate",
  "startDate",
  "completedDate",
  "completedAt",
  "resolvedAt",
]);

function cuid(): string {
  return `c${randomBytes(12).toString("hex")}`;
}

function reviveDates(doc: Doc): Doc {
  const out: Doc = { ...doc };
  for (const [k, v] of Object.entries(out)) {
    if (typeof v === "string" && DATE_FIELDS.has(k) && !Number.isNaN(Date.parse(v))) {
      out[k] = new Date(v);
    }
  }
  return out;
}

function serializeDoc(doc: Doc): Doc {
  const out: Doc = { ...doc };
  for (const [k, v] of Object.entries(out)) {
    if (v instanceof Date) out[k] = v.toISOString();
  }
  return out;
}

function matchesWhere(doc: Doc, where?: Record<string, unknown>): boolean {
  if (!where) return true;
  for (const [key, value] of Object.entries(where)) {
    if (key === "OR" && Array.isArray(value)) {
      if (!value.some((clause) => matchesWhere(doc, clause as Record<string, unknown>))) {
        return false;
      }
      continue;
    }
    if (key === "AND" && Array.isArray(value)) {
      if (!value.every((clause) => matchesWhere(doc, clause as Record<string, unknown>))) {
        return false;
      }
      continue;
    }
    if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      const ops = value as Record<string, unknown>;
      if ("in" in ops) {
        const list = ops.in as unknown[];
        if (!list.includes(doc[key])) return false;
        continue;
      }
      if ("equals" in ops) {
        if (doc[key] !== ops.equals) return false;
        continue;
      }
    }
    if (doc[key] !== value) return false;
  }
  return true;
}

function sortDocs(docs: Doc[], orderBy?: Record<string, "asc" | "desc"> | Record<string, "asc" | "desc">[]): Doc[] {
  if (!orderBy) return docs;
  const orders = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...docs].sort((a, b) => {
    for (const order of orders) {
      const [field, dir] = Object.entries(order)[0] ?? [];
      if (!field) continue;
      const av = a[field] as string | number | Date | null | undefined;
      const bv = b[field] as string | number | Date | null | undefined;
      if (av == null && bv == null) continue;
      if (av == null) return 1;
      if (bv == null) return -1;
      const aVal = av instanceof Date ? av.getTime() : av;
      const bVal = bv instanceof Date ? bv.getTime() : bv;
      if (aVal < bVal) return dir === "asc" ? -1 : 1;
      if (aVal > bVal) return dir === "asc" ? 1 : -1;
    }
    return 0;
  });
}

/** Relation config: field -> { collection, localKey?, foreignKey, many? } */
type Rel =
  | { type: "one"; collection: string; localKey: string }
  | { type: "many"; collection: string; foreignKey: string; orderBy?: Record<string, "asc" | "desc"> };

const RELATIONS: Record<string, Record<string, Rel>> = {
  User: {
    company: { type: "one", collection: "Company", localKey: "companyId" },
    auditLogs: { type: "many", collection: "AuditLog", foreignKey: "userId" },
    notifications: { type: "many", collection: "Notification", foreignKey: "userId" },
  },
  Company: {
    users: { type: "many", collection: "User", foreignKey: "companyId" },
    priorities: { type: "many", collection: "CompanyPriority", foreignKey: "companyId" },
    projects: { type: "many", collection: "Project", foreignKey: "companyId" },
    systemSettings: { type: "many", collection: "SystemSetting", foreignKey: "companyId" },
  },
  Project: {
    company: { type: "one", collection: "Company", localKey: "companyId" },
    ngo: { type: "one", collection: "NGO", localKey: "ngoId" },
    documents: { type: "many", collection: "ProjectDocument", foreignKey: "projectId" },
    scores: { type: "many", collection: "ProjectScore", foreignKey: "projectId", orderBy: { createdAt: "desc" } },
    evidence: { type: "many", collection: "ProjectEvidence", foreignKey: "projectId" },
    milestones: { type: "many", collection: "Milestone", foreignKey: "projectId", orderBy: { sortOrder: "asc" } },
    budgets: { type: "many", collection: "Budget", foreignKey: "projectId" },
    transactions: { type: "many", collection: "BudgetTransaction", foreignKey: "projectId", orderBy: { date: "desc" } },
    risks: { type: "many", collection: "Risk", foreignKey: "projectId" },
    matches: { type: "many", collection: "NGOMatch", foreignKey: "projectId", orderBy: { matchScore: "desc" } },
    fundingRecommendations: {
      type: "many",
      collection: "FundingRecommendation",
      foreignKey: "projectId",
      orderBy: { createdAt: "desc" },
    },
    allocations: { type: "many", collection: "Allocation", foreignKey: "projectId" },
    impactMetrics: { type: "many", collection: "ImpactMetric", foreignKey: "projectId" },
    recommendations: { type: "many", collection: "Recommendation", foreignKey: "projectId" },
    progressSnapshots: {
      type: "many",
      collection: "ProgressSnapshot",
      foreignKey: "projectId",
      orderBy: { createdAt: "asc" },
    },
  },
  NGO: {
    documents: { type: "many", collection: "NGODocument", foreignKey: "ngoId" },
    projectHistory: { type: "many", collection: "NGOProjectHistory", foreignKey: "ngoId" },
    matches: { type: "many", collection: "NGOMatch", foreignKey: "ngoId" },
    projects: { type: "many", collection: "Project", foreignKey: "ngoId" },
  },
  NGOMatch: {
    project: { type: "one", collection: "Project", localKey: "projectId" },
    ngo: { type: "one", collection: "NGO", localKey: "ngoId" },
  },
  FundingRecommendation: {
    project: { type: "one", collection: "Project", localKey: "projectId" },
  },
  AuditLog: {
    user: { type: "one", collection: "User", localKey: "userId" },
  },
  Notification: {
    user: { type: "one", collection: "User", localKey: "userId" },
  },
  SystemSetting: {
    company: { type: "one", collection: "Company", localKey: "companyId" },
  },
};

class DocumentBackend {
  private data: StoreData = {};
  private filePath: string;
  private firestore: FirebaseFirestore | null = null;
  private mode: "demo" | "firestore";
  /** Short TTL cache to stop repeated full-collection reads. */
  private listCache = new Map<string, { at: number; rows: Doc[] }>();
  private readonly listTtlMs = Number(process.env.FIRESTORE_LIST_CACHE_MS || 45_000);
  /** After quota errors, prefer local/demo until this timestamp. */
  private quotaCooldownUntil = 0;

  constructor() {
    this.filePath = path.join(process.cwd(), "data", "kellyos-store.json");
    this.mode = isDemoFirestoreMode() ? "demo" : "firestore";
    if (this.mode === "demo") {
      this.loadFile();
    }
  }

  private loadFile() {
    try {
      if (existsSync(this.filePath)) {
        this.data = JSON.parse(readFileSync(this.filePath, "utf-8")) as StoreData;
      }
    } catch {
      this.data = {};
    }
  }

  private persistFile() {
    const dir = path.dirname(this.filePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const serializable: StoreData = {};
    for (const [k, rows] of Object.entries(this.data)) {
      serializable[k] = rows.map(serializeDoc);
    }
    writeFileSync(this.filePath, JSON.stringify(serializable, null, 2), "utf-8");
  }

  private useLocalFallback(): boolean {
    return this.mode === "demo" || Date.now() < this.quotaCooldownUntil;
  }

  private enterQuotaCooldown(err: unknown): boolean {
    const msg = err instanceof Error ? err.message : String(err);
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code: unknown }).code)
        : "";
    const quota =
      msg.includes("RESOURCE_EXHAUSTED") ||
      msg.includes("Quota exceeded") ||
      code.includes("resource-exhausted") ||
      code === "8";
    if (!quota) return false;
    this.quotaCooldownUntil = Date.now() + 10 * 60 * 1000;
    this.loadFile();
    console.warn(
      "[KellyOS] Firestore quota exceeded. Falling back to local/cached store for 10 minutes."
    );
    return true;
  }

  private cacheList(collection: string, rows: Doc[]) {
    this.listCache.set(collection, {
      at: Date.now(),
      rows: rows.map((r) => ({ ...r })),
    });
    this.data[collection] = rows.map(serializeDoc);
  }

  private getCachedList(collection: string): Doc[] | null {
    const hit = this.listCache.get(collection);
    if (!hit) return null;
    if (Date.now() - hit.at > this.listTtlMs) return null;
    return hit.rows.map(reviveDates);
  }

  private async getFirestore(): Promise<FirebaseFirestore> {
    if (this.firestore) return this.firestore;

    const { getApps, initializeApp, cert, applicationDefault } = await import(
      "firebase-admin/app"
    );
    const { getFirestore } = await import("firebase-admin/firestore");

    if (!getApps().length) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        initializeApp({
          credential: cert(sa),
          projectId: sa.project_id || process.env.FIREBASE_PROJECT_ID,
        });
      } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        const resolved = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
        if (!existsSync(resolved)) {
          throw new Error(`FIREBASE_SERVICE_ACCOUNT_PATH not found: ${resolved}`);
        }
        const sa = JSON.parse(readFileSync(resolved, "utf-8"));
        initializeApp({
          credential: cert(sa),
          projectId: sa.project_id || process.env.FIREBASE_PROJECT_ID,
        });
      } else if (process.env.FIRESTORE_EMULATOR_HOST) {
        initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || "kellyos-demo",
        });
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        initializeApp({
          credential: applicationDefault(),
          projectId: process.env.FIREBASE_PROJECT_ID,
        });
      } else {
        throw new Error(
          "Live Firestore requires FIREBASE_SERVICE_ACCOUNT_PATH, FIREBASE_SERVICE_ACCOUNT_JSON, or GOOGLE_APPLICATION_CREDENTIALS."
        );
      }
    }

    this.firestore = getFirestore() as FirebaseFirestore;
    return this.firestore!;
  }

  col(name: string): Doc[] {
    if (!this.data[name]) this.data[name] = [];
    return this.data[name];
  }

  async getById(collection: string, id: string): Promise<Doc | null> {
    if (!id) return null;

    const cached = this.getCachedList(collection);
    if (cached) {
      const hit = cached.find((r) => r.id === id);
      if (hit) return hit;
    }
    if (this.useLocalFallback()) {
      return this.col(collection).map(reviveDates).find((r) => r.id === id) ?? null;
    }

    try {
      const fs = await this.getFirestore();
      const snap = await fs.collection(collection).doc(id).get();
      if (!snap.exists) return null;
      const doc = reviveDates({ id: snap.id, ...(snap.data() || {}) } as Doc);
      const existing = this.listCache.get(collection);
      if (existing) {
        const idx = existing.rows.findIndex((r) => r.id === id);
        if (idx >= 0) existing.rows[idx] = doc;
        else existing.rows.push(doc);
      }
      return doc;
    } catch (err) {
      if (this.enterQuotaCooldown(err)) {
        return this.col(collection).map(reviveDates).find((r) => r.id === id) ?? null;
      }
      throw err;
    }
  }

  async queryEq(
    collection: string,
    field: string,
    value: unknown,
    limit?: number
  ): Promise<Doc[]> {
    if (value == null) return [];

    const cached = this.getCachedList(collection);
    if (cached) {
      let rows = cached.filter((r) => r[field] === value);
      if (limit != null) rows = rows.slice(0, limit);
      return rows;
    }
    if (this.useLocalFallback()) {
      let rows = this.col(collection).map(reviveDates).filter((r) => r[field] === value);
      if (limit != null) rows = rows.slice(0, limit);
      return rows;
    }

    try {
      const fs = await this.getFirestore();
      const base = fs.collection(collection).where(field, "==", value);
      const snap = limit != null ? await base.limit(limit).get() : await base.get();
      return snap.docs.map((d) => reviveDates({ id: d.id, ...d.data() } as Doc));
    } catch (err) {
      if (this.enterQuotaCooldown(err)) {
        let rows = this.col(collection).map(reviveDates).filter((r) => r[field] === value);
        if (limit != null) rows = rows.slice(0, limit);
        return rows;
      }
      // Missing indexes / unsupported ops → fall back to list filter once (cached).
      let rows = (await this.list(collection)).filter((r) => r[field] === value);
      if (limit != null) rows = rows.slice(0, limit);
      return rows;
    }
  }

  async list(collection: string): Promise<Doc[]> {
    const cached = this.getCachedList(collection);
    if (cached) return cached;

    if (this.useLocalFallback()) {
      return this.col(collection).map(reviveDates);
    }

    try {
      const fs = await this.getFirestore();
      const snap = await fs.collection(collection).get();
      const rows = snap.docs.map((d) => reviveDates({ id: d.id, ...d.data() } as Doc));
      this.cacheList(collection, rows);
      return rows;
    } catch (err) {
      if (this.enterQuotaCooldown(err)) {
        const stale = this.listCache.get(collection);
        if (stale) return stale.rows.map(reviveDates);
        return this.col(collection).map(reviveDates);
      }
      throw err;
    }
  }

  async save(collection: string, doc: Doc): Promise<Doc> {
    const now = new Date();
    const payload: Doc = {
      ...doc,
      id: doc.id || cuid(),
      updatedAt: now,
      createdAt:
        doc.createdAt instanceof Date
          ? doc.createdAt
          : doc.createdAt
            ? new Date(String(doc.createdAt))
            : now,
    };

    if (this.useLocalFallback()) {
      const rows = this.col(collection);
      const idx = rows.findIndex((r) => r.id === payload.id);
      if (idx >= 0) rows[idx] = serializeDoc(payload);
      else rows.push(serializeDoc(payload));
      this.persistFile();
      this.listCache.delete(collection);
      return reviveDates(payload);
    }

    try {
      const fs = await this.getFirestore();
      const { id, ...rest } = serializeDoc(payload);
      await fs.collection(collection).doc(id).set(rest, { merge: true });
      this.listCache.delete(collection);
      return reviveDates(payload);
    } catch (err) {
      if (this.enterQuotaCooldown(err)) {
        const rows = this.col(collection);
        const idx = rows.findIndex((r) => r.id === payload.id);
        if (idx >= 0) rows[idx] = serializeDoc(payload);
        else rows.push(serializeDoc(payload));
        this.persistFile();
        this.listCache.delete(collection);
        return reviveDates(payload);
      }
      throw err;
    }
  }

  async removeWhere(collection: string, where?: Record<string, unknown>): Promise<number> {
    if (this.useLocalFallback()) {
      const before = this.col(collection).length;
      this.data[collection] = this.col(collection).filter(
        (d) => !matchesWhere(reviveDates(d), where)
      );
      this.persistFile();
      this.listCache.delete(collection);
      return before - this.col(collection).length;
    }
    const toDelete = (await this.list(collection)).filter((d) => matchesWhere(d, where));
    const fs = await this.getFirestore();
    for (const d of toDelete) {
      await fs.collection(collection).doc(d.id).delete();
    }
    this.listCache.delete(collection);
    return toDelete.length;
  }

  async clearAll() {
    if (this.useLocalFallback()) {
      this.data = {};
      this.listCache.clear();
      this.persistFile();
      return;
    }
    const names = Object.keys(RELATIONS).concat([
      "CompanyPriority",
      "ProjectDocument",
      "ProjectScore",
      "ProjectEvidence",
      "Milestone",
      "Budget",
      "BudgetTransaction",
      "Risk",
      "ProgressSnapshot",
      "NGODocument",
      "NGOProjectHistory",
      "NGOMatch",
      "FundingRecommendation",
      "Allocation",
      "ImpactMetric",
      "Recommendation",
      "SystemSetting",
      "DocumentChunk",
      "User",
      "Company",
      "Project",
      "NGO",
      "AuditLog",
      "Notification",
    ]);
    for (const name of Array.from(new Set(names))) {
      await this.removeWhere(name);
    }
    this.listCache.clear();
  }

  getMode(): "demo" | "firestore" {
    return this.useLocalFallback() && this.mode !== "demo" ? "demo" : this.mode;
  }
}

type FirebaseFirestore = {
  collection: (name: string) => {
    get: () => Promise<{ docs: { id: string; data: () => Record<string, unknown> }[] }>;
    where: (
      field: string,
      op: "==",
      value: unknown
    ) => {
      get: () => Promise<{ docs: { id: string; data: () => Record<string, unknown> }[] }>;
      limit: (n: number) => {
        get: () => Promise<{ docs: { id: string; data: () => Record<string, unknown> }[] }>;
      };
    };
    doc: (id: string) => {
      get: () => Promise<{
        exists: boolean;
        id: string;
        data: () => Record<string, unknown> | undefined;
      }>;
      set: (data: unknown, opts?: { merge?: boolean }) => Promise<void>;
      delete: () => Promise<void>;
    };
  };
};

const backend = new DocumentBackend();

async function resolveIncludes(
  collection: string,
  docs: Doc[],
  include?: Record<string, unknown>
): Promise<Doc[]> {
  if (!include || docs.length === 0) return docs;
  const rels = RELATIONS[collection] || {};
  const result: Doc[] = [];

  for (const doc of docs) {
    const enriched: Doc = { ...doc };
    for (const [key, inc] of Object.entries(include)) {
      if (!inc) continue;
      const rel = rels[key];
      if (!rel) continue;

      const incObj = typeof inc === "object" ? (inc as Record<string, unknown>) : {};
      const whereExtra =
        incObj.where && typeof incObj.where === "object"
          ? (incObj.where as Record<string, unknown>)
          : undefined;
      const orderBy =
        (incObj.orderBy as Record<string, "asc" | "desc"> | undefined) ||
        (rel.type === "many" ? rel.orderBy : undefined);
      const take = typeof incObj.take === "number" ? incObj.take : undefined;
      const nestedInclude = incObj.include as Record<string, unknown> | undefined;

      if (rel.type === "one") {
        const fk = doc[rel.localKey];
        if (!fk) {
          enriched[key] = null;
        } else {
          let related = await backend.getById(rel.collection, String(fk));
          if (related && nestedInclude) {
            related = (await resolveIncludes(rel.collection, [related], nestedInclude))[0];
          }
          // select support (shallow)
          if (related && incObj.select) {
            const sel = incObj.select as Record<string, boolean>;
            const picked: Doc = { id: related.id };
            for (const [s, on] of Object.entries(sel)) {
              if (on) picked[s] = related[s];
            }
            related = picked;
          }
          enriched[key] = related;
        }
      } else {
        let related = await backend.queryEq(rel.collection, rel.foreignKey, doc.id);
        if (whereExtra) {
          related = related.filter((r) => matchesWhere(r, whereExtra));
        }
        related = sortDocs(related, orderBy);
        if (take != null) related = related.slice(0, take);
        if (nestedInclude) {
          related = await resolveIncludes(rel.collection, related, nestedInclude);
        }
        if (incObj.select) {
          const sel = incObj.select as Record<string, boolean>;
          related = related.map((r) => {
            const picked: Doc = { id: r.id };
            for (const [s, on] of Object.entries(sel)) {
              if (on) picked[s] = r[s];
            }
            return picked;
          });
        }
        enriched[key] = related;
      }
    }

    // _count support
    if (include._count) {
      const countSelect =
        typeof include._count === "object" &&
        include._count &&
        "select" in (include._count as object)
          ? ((include._count as { select: Record<string, boolean> }).select ?? {})
          : {};
      const counts: Record<string, number> = {};
      for (const [k, on] of Object.entries(countSelect)) {
        if (!on) continue;
        const rel = rels[k];
        if (rel?.type === "many") {
          const related = await backend.queryEq(rel.collection, rel.foreignKey, doc.id);
          counts[k] = related.length;
        }
      }
      enriched._count = counts;
    }

    result.push(enriched);
  }
  return result;
}

function stripNestedCreates(data: Record<string, unknown>): {
  base: Record<string, unknown>;
  nested: { field: string; collection: string; foreignKey: string; rows: Record<string, unknown>[] }[];
} {
  // Handled explicitly in seed — create() only stores flat fields.
  const base: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date) && "create" in (v as object)) {
      continue;
    }
    base[k] = v;
  }
  return { base, nested: [] };
}

/** When LOCAL_DEMO_MODE is on, Project reads come from source document — not Firestore. */
async function listCollectionDocs(collection: string): Promise<Doc[]> {
  if (collection === "Project" && isLocalDemoMode()) {
    return getLocalDemoKellyProjects() as unknown as Doc[];
  }
  return backend.list(collection);
}

function createModel(collection: string) {
  return {
    async findMany(args: {
      where?: Record<string, unknown>;
      include?: Record<string, unknown>;
      select?: Record<string, unknown>;
      orderBy?: Record<string, "asc" | "desc"> | Record<string, "asc" | "desc">[];
      take?: number;
    } = {}): Promise<any[]> {
      let rows = (await listCollectionDocs(collection)).filter((d) =>
        matchesWhere(d, args.where)
      );
      rows = sortDocs(rows, args.orderBy);
      if (args.take != null) rows = rows.slice(0, args.take);

      // Local demo projects already carry relation stubs — skip N+1 store/Firestore reads.
      const enriched =
        collection === "Project" && isLocalDemoMode()
          ? rows.map((r) => ({
              ...r,
              scores: r.scores ?? [],
              risks: r.risks ?? [],
              milestones: r.milestones ?? [],
              budgets: r.budgets ?? [],
              ngo: r.ngo ?? null,
              recommendations: r.recommendations ?? [],
              matches: r.matches ?? [],
            }))
          : await resolveIncludes(collection, rows, args.include);
      if (args.select) {
        return enriched.map((r) => {
          const picked: Doc = { id: r.id };
          for (const [s, on] of Object.entries(args.select!)) {
            if (on) picked[s] = r[s];
          }
          return picked;
        });
      }
      return enriched;
    },

    async findUnique(args: {
      where: Record<string, unknown>;
      include?: Record<string, unknown>;
    }): Promise<any | null> {
      let doc: Doc | null | undefined;

      if (collection === "Project" && isLocalDemoMode()) {
        doc =
          (await listCollectionDocs(collection)).find((r) =>
            matchesWhere(r, args.where)
          ) ?? null;
      } else if (typeof args.where.id === "string") {
        doc = await backend.getById(collection, args.where.id);
      } else if (typeof args.where.email === "string") {
        doc = (await backend.queryEq(collection, "email", args.where.email, 1))[0] ?? null;
      } else if (args.where.firebaseUid) {
        doc =
          (await backend.queryEq(collection, "firebaseUid", args.where.firebaseUid, 1))[0] ??
          null;
      } else if (args.where.companyId_key) {
        const ck = args.where.companyId_key as { companyId: string; key: string };
        const candidates = await backend.queryEq(collection, "companyId", ck.companyId);
        doc = candidates.find((r) => r.key === ck.key) ?? null;
      } else {
        const keys = Object.keys(args.where);
        if (keys.length === 1) {
          const field = keys[0];
          doc = (await backend.queryEq(collection, field, args.where[field], 1))[0] ?? null;
        } else {
          doc = (await backend.list(collection)).find((r) => matchesWhere(r, args.where)) ?? null;
        }
      }
      if (!doc) return null;
      if (collection === "Project" && isLocalDemoMode()) {
        return {
          ...doc,
          scores: doc.scores ?? [],
          risks: doc.risks ?? [],
          milestones: doc.milestones ?? [],
          budgets: doc.budgets ?? [],
          ngo: doc.ngo ?? null,
          recommendations: doc.recommendations ?? [],
          matches: doc.matches ?? [],
        };
      }
      const [enriched] = await resolveIncludes(collection, [doc], args.include);
      return enriched;
    },

    async findFirst(args: {
      where?: Record<string, unknown>;
      include?: Record<string, unknown>;
      orderBy?: Record<string, "asc" | "desc"> | Record<string, "asc" | "desc">[];
    } = {}): Promise<any | null> {
      const rows = await this.findMany({ ...args, take: 1 });
      return rows[0] ?? null;
    },

    async create(args: { data: Record<string, any> }): Promise<any> {
      if (collection === "Project" && isLocalDemoMode()) {
        // Local demo projects are source-document only — do not write to Firestore.
        return { id: args.data.id || `local-${Date.now()}`, ...args.data };
      }
      const { base } = stripNestedCreates(args.data);
      // Expand nested create for common seed patterns
      const data = { ...args.data };
      const nestedCreates: { collection: string; foreignKey: string; items: Record<string, unknown>[] }[] = [];

      if (data.priorities && typeof data.priorities === "object" && "create" in (data.priorities as object)) {
        nestedCreates.push({
          collection: "CompanyPriority",
          foreignKey: "companyId",
          items: Array.isArray((data.priorities as { create: unknown }).create)
            ? ((data.priorities as { create: Record<string, unknown>[] }).create)
            : [(data.priorities as { create: Record<string, unknown> }).create],
        });
        delete data.priorities;
      }
      if (data.systemSettings && typeof data.systemSettings === "object" && "create" in (data.systemSettings as object)) {
        nestedCreates.push({
          collection: "SystemSetting",
          foreignKey: "companyId",
          items: Array.isArray((data.systemSettings as { create: unknown }).create)
            ? ((data.systemSettings as { create: Record<string, unknown>[] }).create)
            : [(data.systemSettings as { create: Record<string, unknown> }).create],
        });
        delete data.systemSettings;
      }

      const saved = await backend.save(collection, { id: (data.id as string) || cuid(), ...data } as Doc);
      for (const nest of nestedCreates) {
        for (const item of nest.items) {
          await backend.save(nest.collection, {
            id: cuid(),
            ...item,
            [nest.foreignKey]: saved.id,
          } as Doc);
        }
      }
      return saved;
    },

    async createMany(args: { data: Record<string, unknown>[] }) {
      for (const row of args.data) {
        await this.create({ data: row });
      }
      return { count: args.data.length };
    },

    async update(args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
      include?: Record<string, unknown>;
    }) {
      const existing = await this.findUnique({ where: args.where });
      if (!existing) throw new Error(`${collection} not found`);
      if (collection === "Project" && isLocalDemoMode()) {
        const merged = { ...existing, ...args.data, id: existing.id };
        const [enriched] = await resolveIncludes(collection, [merged as Doc], args.include);
        return enriched;
      }
      const saved = await backend.save(collection, {
        ...existing,
        ...args.data,
        id: existing.id,
      } as Doc);
      const [enriched] = await resolveIncludes(collection, [saved], args.include);
      return enriched;
    },

    async updateMany(args: { where: Record<string, unknown>; data: Record<string, unknown> }) {
      if (collection === "Project" && isLocalDemoMode()) {
        const rows = (await listCollectionDocs(collection)).filter((d) =>
          matchesWhere(d, args.where)
        );
        return { count: rows.length };
      }
      const rows = (await backend.list(collection)).filter((d) => matchesWhere(d, args.where));
      for (const row of rows) {
        await backend.save(collection, { ...row, ...args.data, id: row.id } as Doc);
      }
      return { count: rows.length };
    },

    async deleteMany(args: { where?: Record<string, unknown> } = {}) {
      if (collection === "Project" && isLocalDemoMode()) {
        return { count: 0 };
      }
      const count = await backend.removeWhere(collection, args.where);
      return { count };
    },

    async count(args: { where?: Record<string, unknown> } = {}) {
      const rows = (await listCollectionDocs(collection)).filter((d) =>
        matchesWhere(d, args.where)
      );
      return rows.length;
    },

    async upsert(args: {
      where: Record<string, unknown>;
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }) {
      const existing = await this.findUnique({ where: args.where });
      if (existing) {
        return this.update({ where: { id: existing.id }, data: args.update });
      }
      const whereFlat: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(args.where)) {
        if (k === "companyId_key" && v && typeof v === "object") {
          Object.assign(whereFlat, v);
        } else {
          whereFlat[k] = v;
        }
      }
      return this.create({ data: { ...whereFlat, ...args.create } });
    },
  };
}

export const db = {
  user: createModel("User"),
  company: createModel("Company"),
  companyPriority: createModel("CompanyPriority"),
  project: createModel("Project"),
  projectDocument: createModel("ProjectDocument"),
  projectScore: createModel("ProjectScore"),
  projectEvidence: createModel("ProjectEvidence"),
  milestone: createModel("Milestone"),
  budget: createModel("Budget"),
  budgetTransaction: createModel("BudgetTransaction"),
  risk: createModel("Risk"),
  progressSnapshot: createModel("ProgressSnapshot"),
  nGO: createModel("NGO"),
  nGODocument: createModel("NGODocument"),
  nGOProjectHistory: createModel("NGOProjectHistory"),
  nGOMatch: createModel("NGOMatch"),
  fundingRecommendation: createModel("FundingRecommendation"),
  allocation: createModel("Allocation"),
  auditLog: createModel("AuditLog"),
  notification: createModel("Notification"),
  impactMetric: createModel("ImpactMetric"),
  recommendation: createModel("Recommendation"),
  systemSetting: createModel("SystemSetting"),
  documentChunk: createModel("DocumentChunk"),
  $backend: backend,
};

/** Back-compat alias while migrating from Prisma */
export const prisma = db;

export async function resetDatabase() {
  await backend.clearAll();
}

export function getDatabaseMode(): "demo" | "firestore" {
  return backend.getMode();
}

/**
 * Read-only connectivity probe for live Cloud Firestore.
 * Does not write data and does not seed NGO/CSR collections.
 */
export async function testFirestoreConnectivity(): Promise<{
  ok: boolean;
  mode: "demo" | "firestore";
  projectId: string | null;
  credentialSource:
    | "FIREBASE_SERVICE_ACCOUNT_JSON"
    | "FIREBASE_SERVICE_ACCOUNT_PATH"
    | "GOOGLE_APPLICATION_CREDENTIALS"
    | "FIRESTORE_EMULATOR_HOST"
    | "none";
  collectionsSampled: string[];
  documentCounts: Record<string, number>;
  error?: string;
}> {
  const mode = getDatabaseMode();
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    null;

  let credentialSource:
    | "FIREBASE_SERVICE_ACCOUNT_JSON"
    | "FIREBASE_SERVICE_ACCOUNT_PATH"
    | "GOOGLE_APPLICATION_CREDENTIALS"
    | "FIRESTORE_EMULATOR_HOST"
    | "none" = "none";
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    credentialSource = "FIREBASE_SERVICE_ACCOUNT_JSON";
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    credentialSource = "FIREBASE_SERVICE_ACCOUNT_PATH";
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    credentialSource = "GOOGLE_APPLICATION_CREDENTIALS";
  } else if (process.env.FIRESTORE_EMULATOR_HOST) {
    credentialSource = "FIRESTORE_EMULATOR_HOST";
  }

  if (mode === "demo") {
    return {
      ok: false,
      mode,
      projectId,
      credentialSource,
      collectionsSampled: [],
      documentCounts: {},
      error:
        "Demo mode active (local JSON store). Set USE_DEMO_FIRESTORE=false and provide Admin credentials to use Cloud Firestore.",
    };
  }

  const collectionsSampled = ["Company", "Project", "NGO", "User"];
  const documentCounts: Record<string, number> = {};

  try {
    for (const name of collectionsSampled) {
      const rows = await backend.list(name);
      documentCounts[name] = rows.length;
    }
    return {
      ok: true,
      mode,
      projectId,
      credentialSource,
      collectionsSampled,
      documentCounts,
    };
  } catch (e) {
    return {
      ok: false,
      mode,
      projectId,
      credentialSource,
      collectionsSampled,
      documentCounts,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
