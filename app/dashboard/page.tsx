// app/dashboard/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";

// Firebase client SDKs
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// ---- Firebase init from env ----
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};
if (!getApps().length) initializeApp(firebaseConfig);

type EntitlementDoc = {
  page?: "live-mode" | "practice-mode";
  accessUntil?: { seconds: number; nanoseconds: number } | null;
};

export default function DashboardLanding() {
  const auth = getAuth();
  const db = getFirestore();

  // form
  const [email, setEmail] = React.useState("");
  const [pw, setPw] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [signing, setSigning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);

  // state
  const [loading, setLoading] = React.useState(true);
  const [uid, setUid] = React.useState<string | null>(null);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [entitlements, setEntitlements] = React.useState<
    { page: "live-mode" | "practice-mode"; untilMs?: number }[]
  >([]);

  // Watch auth state; when signed in, set server cookie & load entitlements
  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUid(null);
        setUserEmail(null);
        setEntitlements([]);
        setLoading(false);
        return;
      }
      setUid(user.uid);
      setUserEmail(user.email || null);

      // Ensure server cookie exists
      try {
        const idToken = await user.getIdToken();
        await fetch("/set-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
      } catch {}

      // Load entitlements
      try {
        const eLive = await getDoc(doc(db, "users", user.uid, "entitlements", "live-mode"));
        const ePractice = await getDoc(doc(db, "users", user.uid, "entitlements", "practice-mode"));

        const list: { page: "live-mode" | "practice-mode"; untilMs?: number }[] = [];
        if (eLive.exists()) {
          const d = eLive.data() as EntitlementDoc;
          const untilMs =
            d.accessUntil && typeof d.accessUntil.seconds === "number"
              ? d.accessUntil.seconds * 1000
              : undefined;
          list.push({ page: "live-mode", untilMs });
        }
        if (ePractice.exists()) {
          const d = ePractice.data() as EntitlementDoc;
          const untilMs =
            d.accessUntil && typeof d.accessUntil.seconds === "number"
              ? d.accessUntil.seconds * 1000
              : undefined;
          list.push({ page: "practice-mode", untilMs });
        }
        setEntitlements(list);
      } catch (e: any) {
        setError(e?.message || "Failed to load your plans");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSigning(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pw);
      const idToken = await cred.user.getIdToken();
      const res = await fetch("/set-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to set session");
      }
      await new Promise((r) => setTimeout(r, 150));
      setInfo("Signed in successfully.");
      setEmail("");
      setPw("");
      // UI automatically updates via onAuthStateChanged
    } catch (err: any) {
      setError(err?.message || "Sign in failed");
    } finally {
      setSigning(false);
    }
  }

  async function handleReset() {
    setError(null);
    setInfo(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo("Password reset email sent. Check your inbox.");
    } catch (err: any) {
      setError(err?.message || "Could not send reset email");
    }
  }

  async function handleLogout() {
    setError(null);
    setInfo(null);
    try {
      // Call server to clear HttpOnly cookie (we'll add this route next)
      await fetch("/logout", { method: "POST" }).catch(() => {});
      await signOut(auth);
      // Reset local state
      setUid(null);
      setUserEmail(null);
      setEntitlements([]);
      setInfo("Logged out.");
    } catch (err: any) {
      setError(err?.message || "Failed to log out");
    }
  }

  const now = Date.now();
  const signedIn = !!uid;

  return (
    <main className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="w-full max-w-3xl space-y-6">
        {/* Header / Greeting */}
        <div className="rounded-2xl shadow-lg border overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <h1 className="text-2xl font-semibold">
              {signedIn ? `Hello${userEmail ? `, ${userEmail}` : ""}!` : "Welcome"}
            </h1>
            <p className="text-sm opacity-90 mt-1">
              {signedIn
                ? "Here are your active plans."
                : "Sign in to reveal your plan and open it."}
            </p>
          </div>

          {/* Body */}
          <div className="p-6">
            {!signedIn ? (
              // Sign-in form ONLY when signed out
              <form onSubmit={handleLogin} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      className="w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      placeholder="••••••••"
                      value={pw}
                      onChange={(e) => setPw(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100"
                      aria-label={showPw ? "Hide password" : "Show password"}
                      title={showPw ? "Hide password" : "Show password"}
                    >
                      {/* eye toggle */}
                      {showPw ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                             fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M3 3l18 18M10.58 10.58A3 3 0 0012 15a3 3 0 002.42-4.42M9.88 5.09A9.52 9.52 0 0112 5c5.523 0 10 4.477 10 10 0 1.18-.203 2.31-.576 3.36M6.61 6.61C4.357 8.11 3 10.4 3 13c0 5.523 4.477 10 10 10 2.6 0 4.89-1.357 6.39-3.61" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                             fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 5 12 5c4.64 0 8.577 2.51 9.964 6.678.07.205.07.439 0 .644C20.577 16.49 16.64 19 12 19c-4.64 0-8.577-2.51-9.964-6.678z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
                {info && <p className="text-sm text-green-600">{info}</p>}

                <button
                  type="submit"
                  disabled={signing}
                  className="w-full rounded-lg py-2.5 text-white font-medium
                             bg-gradient-to-r from-blue-600 to-purple-600
                             hover:from-blue-700 hover:to-purple-700
                             disabled:opacity-60"
                >
                  {signing ? "Signing in…" : "Sign in"}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-purple-600 hover:text-purple-700"
                  >
                    Forgot password?
                  </button>
                  <Link href="/pricing" className="text-blue-600 hover:text-blue-700">
                    Back to pricing
                  </Link>
                </div>
              </form>
            ) : (
              // Signed-in state: greet + list plans + logout
              <div className="space-y-4">
                {loading ? (
                  <p className="text-sm">Loading your access…</p>
                ) : entitlements.length === 0 ? (
                  <p className="text-sm text-neutral-600">
                    No active plans found. If you just purchased, refresh in a few seconds or go to{" "}
                    <Link href="/pricing" className="text-blue-600 hover:text-blue-700 underline">
                      Pricing
                    </Link>.
                  </p>
                ) : (
                  entitlements.map((e) => {
                    const expired = e.untilMs ? e.untilMs <= now : false;
                    const label =
                      e.page === "live-mode" ? "Live Mode (Mock Exam)" : "Practice Mode";
                    const href = `/dashboard/${e.page}`;
                    return (
                      <div key={e.page} className="border rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{label}</h3>
                          <p className="text-xs text-neutral-600">
                            {e.untilMs
                              ? `Access until: ${new Date(e.untilMs).toLocaleString()}`
                              : "No expiry recorded"}
                          </p>
                          {expired && (
                            <p className="text-xs text-red-600 mt-1">
                              This access looks expired — you can rebuy on the Pricing page.
                            </p>
                          )}
                        </div>
                        <Link
                          href={href}
                          className={`rounded-lg px-4 py-2 text-white font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 ${
                            expired ? "opacity-50 pointer-events-none" : ""
                          }`}
                        >
                          Open
                        </Link>
                      </div>
                    );
                  })
                )}

                <div>
                  <button
                    onClick={handleLogout}
                    className="rounded-lg px-4 py-2 text-white font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
