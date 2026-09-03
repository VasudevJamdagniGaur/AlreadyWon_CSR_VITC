/**
 * Safe Cloud Firestore connectivity check for KellyOS.
 * Read-only: no writes, no NGO/CSR seeding.
 */
import { getDatabaseMode, testFirestoreConnectivity } from "../src/lib/db";
import { hasFirestoreAdminCredentials } from "../src/lib/firebase";

async function main() {
  console.log("KellyOS Firestore connectivity check");
  console.log("-----------------------------------");
  console.log(`USE_DEMO_FIRESTORE=${process.env.USE_DEMO_FIRESTORE ?? "(unset)"}`);
  console.log(`FIREBASE_PROJECT_ID=${process.env.FIREBASE_PROJECT_ID ?? "(unset)"}`);
  console.log(
    `FIREBASE_SERVICE_ACCOUNT_PATH=${
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ? "(set)" : "(unset)"
    }`
  );
  console.log(
    `FIREBASE_SERVICE_ACCOUNT_JSON=${
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? "(set)" : "(unset)"
    }`
  );
  console.log(
    `GOOGLE_APPLICATION_CREDENTIALS=${
      process.env.GOOGLE_APPLICATION_CREDENTIALS ? "(set)" : "(unset)"
    }`
  );
  console.log(`Admin credentials detected: ${hasFirestoreAdminCredentials()}`);
  console.log(`Resolved db mode at import: ${getDatabaseMode()}`);
  console.log("");

  const result = await testFirestoreConnectivity();
  console.log(`Mode: ${result.mode}`);
  console.log(`Project: ${result.projectId ?? "(none)"}`);
  console.log(`Credential source: ${result.credentialSource}`);
  console.log(`OK: ${result.ok}`);

  if (result.collectionsSampled.length) {
    console.log("Read-only collection counts:");
    for (const name of result.collectionsSampled) {
      console.log(`  - ${name}: ${result.documentCounts[name] ?? 0}`);
    }
  }

  if (result.error) {
    console.error(`Error: ${result.error}`);
  }

  if (!result.ok) {
    process.exitCode = 1;
    return;
  }

  console.log("");
  console.log("Cloud Firestore connection succeeded (read-only).");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
