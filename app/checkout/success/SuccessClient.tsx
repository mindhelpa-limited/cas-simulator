// app/checkout/success/SuccessClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebaseClient";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

export default function SuccessClient() {
  const search = useSearchParams();
  const sessionId = search.get("session_id") || "";

  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<{ product?: string; durationDays?: number }>({});
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!sessionId) throw new Error("Missing session_id");
        const r = await fetch(`/api/checkout/session/${encodeURIComponent(sessionId)}`);
        const s = await r.json();
        if (!s.paid) throw new Error("Payment not completed");
        setEmail(s.email);
        setPlan({
          product: s.metadata?.product,
          durationDays: Number(s.metadata?.durationDays || 0),
        });
      } catch (e: any) {
        setErr(e.message ?? "Unable to verify payment.");
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  const finishSignup = async () => {
    try {
      setErr(null);
      if (!email) throw new Error("Missing email");
      if (!password) throw new Error("Please set a password");

      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (e: any) {
        if (e?.code === "auth/email-already-in-use") {
          await signInWithEmailAndPassword(auth, email, password);
        } else {
          throw e;
        }
      }

      const idToken = await auth.currentUser!.getIdToken();
      const res = await fetch("/api/entitlements/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Claim failed");

      window.location.href = "/dashboard";
    } catch (e: any) {
      setErr(e.message ?? "Could not finish sign up.");
    }
  };

  if (loading) return <main className="p-8 text-white">Verifying payment…</main>;
  if (err) return <main className="p-8 text-red-300">Error: {err}</main>;

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-lg mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h1 className="text-2xl font-bold">Payment successful ✅</h1>
        <p className="mt-2 text-gray-300">
          Plan: <b>{plan.product === "test" ? "Practice Mode" : "Live Mode"}</b> • Access for{" "}
          <b>{plan.durationDays} days</b>.
        </p>

        <div className="mt-6">
          <label className="text-sm text-gray-400">Email (from Stripe)</label>
          <input
            className="w-full mt-1 p-3 rounded bg-gray-800 border border-gray-700"
            value={email}
            disabled
          />
        </div>

        <div className="mt-4">
          <label className="text-sm text-gray-400">Set password</label>
          <input
            type="password"
            className="w-full mt-1 p-3 rounded bg-gray-800 border border-gray-700"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          onClick={finishSignup}
          className="mt-6 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold"
        >
          Create account & continue
        </button>
      </div>
    </main>
  );
}
