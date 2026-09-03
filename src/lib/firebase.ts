/**
 * KellyOS Firebase / Firestore configuration.
 * Uses Firebase Admin when credentials are present.
 * Falls back to a local JSON document store for DEMO MODE (no credentials required).
 */

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      (process.env.FIREBASE_PROJECT_ID && process.env.GOOGLE_APPLICATION_CREDENTIALS) ||
      process.env.FIRESTORE_EMULATOR_HOST
  );
}

export function isDemoFirestoreMode(): boolean {
  if (process.env.USE_DEMO_FIRESTORE === "true") return true;
  if (process.env.USE_DEMO_FIRESTORE === "false" && isFirebaseConfigured()) return false;
  return !isFirebaseConfigured();
}
