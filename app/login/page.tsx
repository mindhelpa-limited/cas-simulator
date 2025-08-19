"use client";
import { useState } from "react";
import { auth } from "@/lib/firebaseClient";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null); const [loading, setLoading] = useState(false);

  const login = async () => {
    try {
      setLoading(true); setErr(null);
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/dashboard";
    } catch (e:any) {
      setErr(e.message);
    } finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-md mx-auto bg-gray-900 p-6 rounded-xl border border-gray-800">
        <h1 className="text-2xl font-bold">Log in</h1>
        <input className="mt-4 w-full p-3 bg-gray-800 border border-gray-700 rounded" placeholder="Email"
               value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="mt-3 w-full p-3 bg-gray-800 border border-gray-700 rounded" type="password" placeholder="Password"
               value={password} onChange={e=>setPassword(e.target.value)} />
        <button onClick={login} disabled={loading}
                className="mt-4 w-full py-3 rounded bg-blue-600 hover:bg-blue-700">{loading ? "Signing in…" : "Sign in"}</button>
        {err && <p className="mt-3 text-red-300">{err}</p>}
      </div>
    </main>
  );
}
