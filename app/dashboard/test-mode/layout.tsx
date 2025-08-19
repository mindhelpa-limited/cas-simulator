"use client";
import { ReactNode } from "react";
import { useEntitlements } from "@/hooks/useEntitlements";

export default function TestModeGate({ children }: { children: ReactNode }) {
  const { loading, hasTest } = useEntitlements();

  if (loading) return <main className="p-8 text-white">Checking access…</main>;
  if (!hasTest) return <Paywall kind="test" />;
  return <>{children}</>;
}

function Paywall({ kind }: { kind: "test" | "live" }) {
  const title = kind === "test" ? "Practice Mode is locked" : "Live Mode is locked";
  const copy  = kind === "test"
    ? "Your account doesn’t include Practice Mode. Purchase a Practice plan to continue."
    : "Your account doesn’t include Live Mode. Purchase a Live plan to continue.";
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-lg mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-gray-300">{copy}</p>
        <a href="/pricing" className="mt-6 inline-block px-4 py-2 rounded bg-blue-600 hover:bg-blue-700">
          Go to pricing
        </a>
      </div>
    </main>
  );
}
