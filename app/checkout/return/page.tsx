// app/checkout/return/page.tsx
"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// ✅ Firebase client (to sign in with the custom token returned by the API)
import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};
if (!getApps().length) initializeApp(firebaseConfig);

type PeekResponse = {
  email: string;
  productKey: "live-mode" | "practice-mode";
  accessUntil?: number;
  redirectPath: string;
};

// ✅ Outer component just wraps in Suspense
export default function CheckoutReturnPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading…</div>}>
      <CheckoutReturnInner />
    </Suspense>
  );
}

// ✅ Inner component can now safely use useSearchParams
function CheckoutReturnInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const sessionId = sp.get("cs");

  const [loading, setLoading] = React.useState(true);
  const [peek, setPeek] = React.useState<PeekResponse | null>(null);
  const [pw, setPw] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!sessionId) {
        router.replace("/pricing");
        return;
      }
      try {
        const res = await fetch(`/api/finish-signup?cs=${encodeURIComponent(sessionId)}`);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || "Could not verify payment session");
        }
        const j = (await res.json()) as PeekResponse;
        if (!cancelled) setPeek(j);
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [sessionId, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!peek || !sessionId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/finish-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          password: pw,
          productKey: peek.productKey,
          redirectPath: peek.redirectPath,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to finish signup");
      }
      const j = (await res.json()) as { redirectTo: string; customToken: string };

      const auth = getAuth();
      const userCred = await signInWithCustomToken(auth, j.customToken);
      const idToken = await userCred.user.getIdToken();

      const setRes = await fetch("/set-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!setRes.ok) {
        const e2 = await setRes.json().catch(() => ({}));
        throw new Error(e2.error || "Failed to set session");
      }

      window.location.href = j.redirectTo || peek.redirectPath;
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full border rounded-2xl p-6 shadow-sm">
          <p className="text-sm">Verifying your payment…</p>
        </div>
      </main>
    );
  }

  if (error || !peek) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full border rounded-2xl p-6 shadow-sm">
          <h1 className="text-xl font-semibold mb-2">We couldn’t verify the payment</h1>
          <p className="text-sm text-red-600">{error || "Unknown error"}</p>
          <button
            className="mt-4 rounded-lg py-2.5 px-4 bg-black text-white"
            onClick={() => router.push("/pricing")}
          >
            Back to Pricing
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full border rounded-2xl p-6 shadow-sm">
        <h1 className="text-xl font-semibold mb-2">Complete your account</h1>
        <p className="text-sm text-neutral-700 mb-4">
          Payment verified for <strong>{peek.productKey.replace("-", " ")}</strong>. Your email from
          checkout is shown below — set a password to activate access.
        </p>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input className="w-full border rounded p-2 bg-gray-100" value={peek.email} readOnly />
          </div>

          <div>
            <label className="block text-sm mb-1">Set a password</label>
            <input
              className="w-full border rounded p-2"
              type="password"
              placeholder="Choose a password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              required
            />
          </div>

          {peek.accessUntil && (
            <p className="text-xs text-neutral-500">
              Access will last until:{" "}
              <strong>{new Date(peek.accessUntil).toLocaleString()}</strong>
            </p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg py-2.5 px-4 bg-black text-white disabled:opacity-60"
          >
            {submitting ? "Creating account…" : "Finish & continue"}
          </button>
        </form>

        <p className="text-xs text-neutral-500 mt-4">
          You’ll be signed in and redirected to <code>{peek.redirectPath}</code> after finishing.
        </p>
      </div>
    </main>
  );
}
