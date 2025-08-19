// lib/firebaseAdmin.ts
import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let app: App | undefined;

export function initAdmin() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is missing");

    const json =
      raw.trim().startsWith("{")
        ? raw
        : Buffer.from(raw, "base64").toString("utf8");

    const serviceAccount = JSON.parse(json);
    app = initializeApp({ credential: cert(serviceAccount) });
  } else {
    app = getApps()[0]!;
  }
  return app!;
}

export function getDb() {
  return getFirestore(initAdmin());
}
