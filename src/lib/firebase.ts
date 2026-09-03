/**
 * KellyOS Firebase configuration helpers.
 * Client Auth uses NEXT_PUBLIC_FIREBASE_* keys.
 * Admin/Firestore uses service account when available; otherwise demo JSON store.
 */

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      (process.env.FIREBASE_PROJECT_ID && process.env.GOOGLE_APPLICATION_CREDENTIALS) ||
      process.env.FIRESTORE_EMULATOR_HOST ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}

export function isDemoFirestoreMode(): boolean {
  if (process.env.USE_DEMO_FIRESTORE === "true") return true;
  if (process.env.USE_DEMO_FIRESTORE === "false" && isFirebaseConfigured()) return false;
  // Prefer demo document store unless Admin credentials are present
  return !(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.FIRESTORE_EMULATOR_HOST
  );
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
