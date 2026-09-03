/**
 * Import CSRBOX opportunity projects into KellyOS Firestore (idempotent).
 *
 * Usage:
 *   npm run import:csrbox
 */
import { readFileSync } from "fs";
import path from "path";
import {
  importCsrboxProjects,
  type CsrboxRawProject,
} from "../src/services/ingestion/csrboxImporter";

async function main() {
  const file = path.join(process.cwd(), "fixtures", "csrbox-projects.json");
  const records = JSON.parse(readFileSync(file, "utf-8")) as CsrboxRawProject[];

  console.log("KellyOS CSRBOX project import");
  console.log("-----------------------------");
  console.log(`Input: ${file}`);
  console.log(`Records: ${records.length}`);
  console.log("");

  const result = await importCsrboxProjects(records);

  console.log(`DB mode: ${result.mode}`);
  console.log(`created=${result.created} updated=${result.updated}`);
  console.log("");
  for (const item of result.items) {
    console.log(
      `[${item.action}] ${item.name} sourceProjectId=${item.sourceProjectId} id=${item.id}`
    );
  }
  console.log("");
  console.log("Import complete.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
