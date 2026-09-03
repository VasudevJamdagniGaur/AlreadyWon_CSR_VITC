"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function assertClientConfig() {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
    throw new Error(
      "Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* to .env"
    );
  }
}

export function getFirebaseApp(): FirebaseApp {
  assertClientConfig();
  if (getApps().length) return getApp();
  return initializeApp(firebaseConfig);
}

/** Lazy-load Auth to avoid Next.js/Webpack ESM interop crashes on login page. */
export async function getFirebaseAuth(): Promise<Auth> {
  const { getAuth } = await import("firebase/auth");
  return getAuth(getFirebaseApp());
}

export function isFirebaseClientConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  );
}
