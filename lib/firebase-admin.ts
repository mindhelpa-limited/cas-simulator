// /lib/firebase-admin.ts
import * as admin from "firebase-admin";

// Keep a single app instance across hot reloads
declare global {
  // eslint-disable-next-line no-var
  var __fb_admin__: admin.app.App | undefined;
}

// Check if a Firebase Admin app instance already exists, otherwise initialize a new one.
if (!global.__fb_admin__) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is missing in your .env file");
  }

  const creds = JSON.parse(raw);
  global.__fb_admin__ = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: creds.project_id,
      clientEmail: creds.client_email,
      privateKey: creds.private_key?.replace(/\\n/g, "\n"),
    }),
  });
}

const app = global.__fb_admin__!;

// Export the top-level 'admin' namespace, as well as the Auth and Firestore instances.
export const adminAuth = admin.auth(app);
export const adminDb = admin.firestore(app);
export { admin }; // <— Add this line to export the 'admin' namespace.