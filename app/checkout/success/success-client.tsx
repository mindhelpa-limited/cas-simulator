// app/checkout/success/success-client.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebaseClient";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

// ← helper that never throws when the body is empty / not JSON
const safeJson = async (res: Response): Promise<any> => {
  const text = await res.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { _raw: text }; }
};

export default function SuccessClient() {
  const params = useSearchParams();
  const sessionId = params.get("session_id") || "";

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!sessionId) throw new Error("Missing session_id");
        const r = await fetch(`/api/checkout/session/${encodeURIComponent(sessionId)}`);
        const data = await safeJson(r);
        if (!r.ok) throw new Error(data?.error || "Failed to load session");

        setEmail(
          data?.customer_details?.email ||
          data?.customer_email ||
          data?.email ||
          ""
        );

        const md = data?.metadata || {};
        setPlan(md.product ? `${md.product} • ${md.durationDays || "?"} days` : "");
      } catch (e: any) {
        setErr(e.message || "Could not load session");
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

      const token = await auth.currentUser!.getIdToken();
      const res = await fetch("/api/entitlements/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const d = await safeJson(res);
      if (!res.ok) throw new Error(d?.error || "Claim failed");

      window.location.href = "/dashboard";
    } catch (e: any) {
      setErr(e.message || "Unexpected error");
    }
  };

  if (loading) return <main className="p-8 text-white">Verifying payment…</main>;
  if (err) return <main className="p-8 text-red-300">Error: {err}</main>;

  return (
    <div className="max-w-lg mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-100">
      <h1 className="text-2xl font-bold">Payment successful ✅</h1>
      {plan && <p className="mt-2 text-gray-300">{plan}</p>}
      <div className="mt-6">
        <label className="text-sm text-gray-400">Email</label>
        <input value={email} disabled className="w-full mt-1 p-3 rounded bg-gray-800 border border-gray-700" />
      </div>
      <div className="mt-4">
        <label className="text-sm text-gray-400">Set password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mt-1 p-3 rounded bg-gray-800 border border-gray-700"
        />
      </div>
      <button
        onClick={finishSignup}
        className="mt-6 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold"
      >
        Create account & continue
      </button>
    </div>
  );
}
