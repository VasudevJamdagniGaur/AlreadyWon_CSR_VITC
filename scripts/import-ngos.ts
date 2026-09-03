/**
 * NGO import CLI — dry-run by default for the local smoke fixture.
 *
 * Usage:
 *   npm run import:ngos -- --dry-run
 *   npm run import:ngos -- --dry-run --file path/to/records.json
 *   npm run import:ngos -- --file path/to/records.json
 *
 * The bundled smoke fixture is NEVER written to Firestore/demo store.
 * Production writes require an explicit --file path (not the smoke fixture).
 */
import { readFileSync } from "fs";
import path from "path";
import { importNgos } from "../src/services/ingestion/ngoImporter";

const SMOKE_FIXTURE = path.join(
  process.cwd(),
  "fixtures",
  "ngo-import-smoke.json"
);

function parseArgs(argv: string[]) {
  // Support both `tsx script --dry-run` and npm-forwarded forms
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const dryRun = flags.has("--dry-run") || flags.has("--dryRun");
  const fileIdx = argv.findIndex((a) => a === "--file" || a.startsWith("--file="));
  let file: string | undefined;
  if (fileIdx >= 0) {
    const token = argv[fileIdx];
    if (token.startsWith("--file=")) {
      file = token.slice("--file=".length);
    } else if (argv[fileIdx + 1] && !argv[fileIdx + 1].startsWith("--")) {
      file = argv[fileIdx + 1];
    }
  }
  return { dryRun, file };
}

function isSmokeFixture(filePath: string): boolean {
  return path.resolve(filePath) === path.resolve(SMOKE_FIXTURE);
}

function loadRecords(filePath: string): unknown[] {
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && Array.isArray((raw as { records?: unknown }).records)) {
    return (raw as { records: unknown[] }).records;
  }
  throw new Error("Import file must be a JSON array of NGO records (or { records: [...] }).");
}

async function main() {
  const { dryRun, file } = parseArgs(process.argv.slice(2));

  // Safe default: no args → dry-run against the local smoke fixture (never writes).
  const inputPath = file ? path.resolve(file) : SMOKE_FIXTURE;
  const effectiveDryRun = dryRun || !file;

  if (!effectiveDryRun && isSmokeFixture(inputPath)) {
    console.error(
      "Refusing to write the local smoke fixture to the database.\n" +
        "Use --dry-run for the smoke fixture, or pass a real --file."
    );
    process.exitCode = 1;
    return;
  }

  const records = loadRecords(inputPath);
  console.log("KellyOS NGO importer");
  console.log("--------------------");
  console.log(`Input: ${inputPath}`);
  console.log(`Dry run: ${effectiveDryRun}`);
  console.log(`Records: ${records.length}`);
  console.log("");

  const result = await importNgos({
    records,
    dryRun: effectiveDryRun,
  });

  console.log(`DB mode: ${result.mode}`);
  console.log(`Dry run: ${result.dryRun}`);
  console.log(
    `created=${result.created} updated=${result.updated} skipped=${result.skipped} invalid=${result.invalid}`
  );
  console.log("");

  for (const item of result.items) {
    const idPart = item.existingId ? ` id=${item.existingId}` : "";
    const errPart = item.errors?.length ? ` errors=${item.errors.join("; ")}` : "";
    console.log(
      `[${item.action}] ${item.name}${idPart} key=${item.dedupeKey || "-"}` +
        (item.reason ? ` — ${item.reason}` : "") +
        errPart
    );
    if (item.record?.sourceUrl) {
      console.log(`         sourceUrl=${item.record.sourceUrl}`);
    }
  }

  if (result.dryRun) {
    console.log("");
    console.log("Dry run complete — no NGO documents were written.");
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
