"use client";
import { ReactNode, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"loading"|"authed"|"guest">("loading");

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setStatus(u ? "authed" : "guest"));
  }, []);

  if (status === "loading") return <main className="p-8 text-white">Checking session…</main>;
  if (status === "guest")
    return (
      <main className="min-h-screen bg-gray-950 text-gray-100 p-8">
        <div className="max-w-lg mx-auto bg-gray-900 p-6 rounded-xl border border-gray-800">
          <h1 className="text-2xl font-bold">Sign in required</h1>
          <p className="mt-2 text-gray-300">Please <Link className="underline" href="/login">log in</Link> to access your dashboard.</p>
        </div>
      </main>
    );

  return <>{children}</>;
}
