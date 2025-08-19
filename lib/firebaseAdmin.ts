import { getApps, initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getCred() {
  // Prefer full JSON in FIREBASE_SERVICE_ACCOUNT
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    try {
      return cert(JSON.parse(raw));
    } catch {
      // If someone pasted a base64 string or something else, fall back:
      try { return cert(JSON.parse(Buffer.from(raw, "base64").toString("utf8"))); }
      catch { /* ignore */ }
    }
  }
  // Fallback to ADC if running on GCP
  return applicationDefault();
}

const app = getApps().length ? getApps()[0] : initializeApp({ credential: getCred() });

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
