// lib/firebaseAdmin.ts
import { getApps, initializeApp, cert, AppOptions } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Build Firebase Admin options from env.
 * Supports:
 *  - FIREBASE_SERVICE_ACCOUNT_KEY (base64 of the full JSON or raw JSON string)
 *  - or FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
 *    (PRIVATE_KEY may contain \n and will be fixed)
 */
function buildAdminOptions(): AppOptions | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (raw) {
    // Accept base64 or raw JSON
    const jsonStr = raw.trim().startsWith("{")
      ? raw
      : Buffer.from(raw, "base64").toString("utf8");

    try {
      const json = JSON.parse(jsonStr);
      return { credential: cert(json) };
    } catch {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY is set but not valid JSON (base64 or raw)."
      );
    }
  }

  // Fallback to individual fields
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return {
      credential: cert({ projectId, clientEmail, privateKey }),
    };
  }

  // Let caller decide what to do (don’t throw at import/build)
  return null;
}

/**
 * Ensure Admin is initialized. Call at runtime (inside handlers),
 * not at module top-level, so builds don’t crash when envs are missing.
 */
export function ensureAdmin(): void {
  if (getApps().length) return;
  const opts = buildAdminOptions();
  if (!opts) {
    throw new Error(
      "Firebase Admin credentials are missing. Provide FIREBASE_SERVICE_ACCOUNT_KEY (base64/raw) OR FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY."
    );
  }
  initializeApp(opts);
}

// Convenience getters (call ensureAdmin() first in your handler)
export function adminAuth() {
  ensureAdmin();
  return getAuth();
}

export function adminDb() {
  ensureAdmin();
  return getFirestore();
}
