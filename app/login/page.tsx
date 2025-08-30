// app/login/page.tsx
"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Firebase client
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";

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

// Outer page only provides Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams(); // ✅ now safely inside Suspense
  const nextUrl = sp.get("next") || "/dashboard/live-mode";

  const [email, setEmail] = React.useState("");
  const [pw, setPw] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [mode, setMode] = React.useState<"login" | "reset">("login");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const auth = getAuth();
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pw);
      const idToken = await cred.user.getIdToken();

      // Exchange for secure HttpOnly cookie
      const res = await fetch("/set-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to set session");
      }

      // small delay to let the browser persist cookie
      await new Promise((r) => setTimeout(r, 150));

      router.push(nextUrl);
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email.trim());
      setInfo("Password reset email sent. Check your inbox.");
    } catch (err: any) {
      setError(err?.message || "Could not send reset email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl shadow-lg border overflow-hidden">
          {/* Header with brand gradient */}
          <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <h1 className="text-2xl font-semibold">
              {mode === "login" ? "Welcome back" : "Reset your password"}
            </h1>
            <p className="text-sm opacity-90 mt-1">
              {mode === "login"
                ? "Sign in to access your purchased content."
                : "Enter your email to receive a reset link."}
            </p>
          </div>

          {/* Body */}
          <div className="p-6">
            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
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
                    {/* Eye toggle */}
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100"
                      aria-label={showPw ? "Hide password" : "Show password"}
                      title={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? (
                        // Eye-off icon (SVG)
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                             fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M3 3l18 18M10.58 10.58A3 3 0 0012 15a3 3 0 002.42-4.42M9.88 5.09A9.52 9.52 0 0112 5c5.523 0 10 4.477 10 10 0 1.18-.203 2.31-.576 3.36M6.61 6.61C4.357 8.11 3 10.4 3 13c0 5.523 4.477 10 10 10 2.6 0 4.89-1.357 6.39-3.61" />
                        </svg>
                      ) : (
                        // Eye icon (SVG)
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
                  disabled={loading}
                  className="w-full rounded-lg py-2.5 text-white font-medium
                             bg-gradient-to-r from-blue-600 to-purple-600
                             hover:from-blue-700 hover:to-purple-700
                             disabled:opacity-60"
                >
                  {loading ? "Signing in…" : "Sign in"}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => { setMode("reset"); setError(null); setInfo(null); }}
                    className="text-purple-600 hover:text-purple-700"
                  >
                    Forgot password?
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/pricing")}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Back to pricing
                  </button>
                </div>
              </form>
            ) : (
              // Forgot password form
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
                {info && <p className="text-sm text-green-600">{info}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg py-2.5 text-white font-medium
                             bg-gradient-to-r from-blue-600 to-purple-600
                             hover:from-blue-700 hover:to-purple-700
                             disabled:opacity-60"
                >
                  {loading ? "Sending…" : "Send reset link"}
                </button>

                <div className="text-sm">
                  <button
                    type="button"
                    onClick={() => { setMode("login"); setError(null); setInfo(null); }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    ← Back to sign in
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Helpful note */}
        <p className="text-xs text-neutral-500 mt-4 text-center">
          After signing in, we’ll set a secure session and redirect you to{" "}
          <code>{nextUrl}</code>.
        </p>
      </div>
    </main>
  );
}
