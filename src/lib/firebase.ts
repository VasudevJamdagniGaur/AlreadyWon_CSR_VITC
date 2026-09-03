/**
 * KellyOS Firebase configuration helpers.
 * Client Auth uses NEXT_PUBLIC_FIREBASE_* keys.
 * Admin/Firestore uses service account when available; otherwise demo JSON store.
 */

/** True when server-side Admin credentials (or emulator) can reach Firestore. */
export function hasFirestoreAdminCredentials(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.FIRESTORE_EMULATOR_HOST
  );
}

/** Broad Firebase presence check (Auth web config and/or Admin credentials). */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    hasFirestoreAdminCredentials() || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}

/**
 * Demo JSON store when:
 * - USE_DEMO_FIRESTORE=true, or
 * - Admin credentials are missing (safe fallback).
 *
 * Live Cloud Firestore when:
 * - USE_DEMO_FIRESTORE=false AND Admin credentials are present
 *   (or USE_DEMO_FIRESTORE unset and Admin credentials are present).
 */
export function isDemoFirestoreMode(): boolean {
  if (process.env.USE_DEMO_FIRESTORE === "true") return true;
  if (!hasFirestoreAdminCredentials()) return true;
  if (process.env.USE_DEMO_FIRESTORE === "false") return false;
  // Credentials present and flag unset → live Firestore
  return false;
}

/** Verify a Firebase ID token via Identity Toolkit (works with web API key). */
export async function verifyFirebaseIdToken(idToken: string): Promise<{
  localId: string;
  email: string;
  displayName?: string;
} | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey || !idToken) return null;

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  );

  if (!res.ok) return null;
  const data = (await res.json()) as {
    users?: { localId: string; email?: string; displayName?: string }[];
  };
  const user = data.users?.[0];
  if (!user?.localId || !user.email) return null;
  return {
    localId: user.localId,
    email: user.email,
    displayName: user.displayName,
  };
}
