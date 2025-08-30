// /lib/firebase-admin.ts
import * as admin from "firebase-admin";

// Keep a single app instance across hot reloads (important for Next.js dev)
declare global {
  // eslint-disable-next-line no-var
  var __fb_admin__: admin.app.App | undefined;
}

// Initialize Firebase Admin only once
if (!global.__fb_admin__) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT is missing in your environment variables");
  }

  const creds = JSON.parse(raw);

  global.__fb_admin__ = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: creds.project_id,
      clientEmail: creds.client_email,
      privateKey: creds.private_key?.replace(/\\n/g, "\n"), // fix escaped newlines
    }),
  });
}

const app = global.__fb_admin__!;

// Export the Admin SDK, Auth, and Firestore
export const adminAuth = admin.auth(app);
export const adminDb = admin.firestore(app);
export { admin };
