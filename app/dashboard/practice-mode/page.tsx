// app/dashboard/practice-mode/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import Link from "next/link";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

type Entitlement = {
  page?: string;
  accessUntil?: { seconds: number; nanoseconds: number } | null;
};

export default async function PracticeModePage() {
  // ✅ Replace getAdmin() with the actual imports
  const admin = adminAuth;
  const db = adminDb;

  // 1) Verify Firebase session cookie
  const fbCookie = (await cookies()).get("fb_session")?.value;
  if (!fbCookie) return notAllowed("You’re not signed in.");

  let decoded: any;
  try {
    decoded = await admin.verifySessionCookie(fbCookie, true);
  } catch {
    return notAllowed("Your session expired. Please sign in again.");
  }

  const uid: string = decoded.uid;

  // 2) Load entitlement: users/{uid}/entitlements/practice-mode
  const snap = await db
    .collection("users")
    .doc(uid)
    .collection("entitlements")
    .doc("practice-mode")
    .get();

  if (!snap.exists) return locked("No Practice Mode access found for this account.");

  const ent = snap.data() as Entitlement;

  // 3) Check expiry
  const nowMs = Date.now();
  const untilMs =
    ent.accessUntil && typeof ent.accessUntil.seconds === "number"
      ? ent.accessUntil.seconds * 1000
      : undefined;

  if (!untilMs || untilMs <= nowMs) {
    return locked("Your Practice Mode access has expired.");
  }

  // 4) ✅ Access granted
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Practice Mode</h1>
      <p className="text-green-700 font-medium mb-2">I now have access</p>
      <p className="text-sm text-neutral-600">
        Your access is valid until{" "}
        <strong>{new Date(untilMs).toLocaleString()}</strong>.
      </p>
      hello i have access
      {/* Put your real Practice Mode content here */}
    </main>
  );
}

function notAllowed(message: string) {
  return (
    <main className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full border rounded-2xl p-6 shadow-sm">
        <h1 className="text-xl font-semibold mb-2">Sign in required</h1>
        <p className="text-sm text-neutral-700 mb-4">{message}</p>
        <Link href="/pricing" className="inline-block rounded-lg py-2.5 px-4 bg-black text-white">
          Go to Pricing
        </Link>
      </div>
    </main>
  );
}

function locked(message: string) {
  return (
    <main className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full border rounded-2xl p-6 shadow-sm">
        <h1 className="text-xl font-semibold mb-2">Practice Mode is locked</h1>
        <p className="text-sm text-neutral-700 mb-4">{message}</p>
        <Link href="/pricing" className="inline-block rounded-lg py-2.5 px-4 bg-black text-white">
          Buy access
        </Link>
      </div>
    </main>
  );
}
