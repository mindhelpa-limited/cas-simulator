"use client";
import { useState } from "react";
import { PLANS, TEST_PLAN_IDS, LIVE_PLAN_IDS, type PlanId } from "@/lib/plans";

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const checkout = async (planId: PlanId) => {
    setLoading(planId);
    const res = await fetch("/api/checkout/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId }),
    });
    const data = await res.json();
    setLoading(null);
    if (data?.url) window.location.href = data.url;
    else alert(data?.error || "Failed to start checkout");
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold">Choose your plan</h1>
        <p className="mt-2 text-gray-300">Secure checkout via Stripe. Access is tied to your email.</p>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <Card title="Practice Mode" desc="Unlimited practice with instant feedback">
            {TEST_PLAN_IDS.map((id) => {
              const p = PLANS[id];
              return (
                <PlanRow key={p.id} label={p.uiLabel}
                         onClick={() => checkout(p.id)} loading={loading === p.id} />
              );
            })}
          </Card>

          <Card title="Live Mode (Mock Exam)" desc="12 stations • 2 hours • AI scoring">
            {LIVE_PLAN_IDS.map((id) => {
              const p = PLANS[id];
              return (
                <PlanRow key={p.id} label={p.uiLabel}
                         onClick={() => checkout(p.id)} loading={loading === p.id} />
              );
            })}
          </Card>
        </div>
      </div>
    </main>
  );
}

function Card({ title, desc, children }:{title:string;desc:string;children:any}) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="text-gray-300 mt-1">{desc}</p>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}
function PlanRow({ label, onClick, loading }:{label:string;onClick:()=>void;loading:boolean}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-between rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-700 px-4 py-3"
    >
      <span>{label}</span>
      <span className="text-sm px-3 py-1 rounded bg-blue-600">
        {loading ? "Redirecting…" : "Buy"}
      </span>
    </button>
  );
}
