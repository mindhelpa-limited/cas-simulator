"use client";

import React, { useState } from "react";
import { PLANS, TEST_PLAN_IDS, LIVE_PLAN_IDS, type PlanId } from "@/lib/plans";
import { Menu } from "lucide-react";

/* ----------------------------- Header ----------------------------- */
function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <a href="/" className="flex items-center gap-3">
          {/* Logo only (removed CASCSUCCESS text) */}
          <img src="/logocas.png" alt="CAS Prep" className="h-8 w-auto" />
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          <a className="text-gray-700 hover:text-indigo-600 transition" href="/">Home</a>
          <a className="text-gray-700 hover:text-indigo-600 transition" href="/about">About Us</a>
          <a className="text-indigo-600 font-medium" href="/pricing">Pricing</a>
          <a className="text-gray-700 hover:text-indigo-600 transition" href="/contact-us">Contact</a>
          <a
            href="/dashboard"
            className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-lg hover:opacity-90 transition"
          >
            Sign In
          </a>
        </nav>

        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {open && (
        <div className="border-t border-gray-200 bg-white md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-4">
            {[
              ["Home", "/"],
              ["About Us", "/about"],
              ["Pricing", "/pricing"],
              ["Contact", "/contact-us"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
              >
                {label}
              </a>
            ))}
            <a
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-center text-sm font-semibold text-white shadow-lg hover:opacity-90"
            >
              Sign In
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

/* ----------------------------- Footer ----------------------------- */
function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} CASCSUCCESS. All Rights Reserved.</p>
      </div>
    </footer>
  );
}

/* --------------------------------- Page ---------------------------------- */
export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  // ✅ Your logic unchanged
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
    <div className="min-h-screen bg-white text-gray-900">
      <Header />

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-16 md:pt-24">
        {/* Hero */}
        <section className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
            Secure Stripe Checkout
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl">
            Choose your plan
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            Access is tied to your email. Practice unlimitedly or book a full mock exam with AI scoring.
          </p>
        </section>

        {/* Plans */}
        <section className="mt-14 grid gap-8 md:grid-cols-2">
          <Card
            title="Practice Mode"
            badge="Popular for revision"
            desc="Unlimited practice with instant feedback."
            gradient="from-indigo-100 to-indigo-50"
            accent="indigo"
          >
            {TEST_PLAN_IDS.map((id) => {
              const p = PLANS[id];
              return (
                <PlanRow
                  key={p.id}
                  label={p.uiLabel}
                  onClick={() => checkout(p.id)}
                  loading={loading === p.id}
                  accent="indigo"
                />
              );
            })}
          </Card>

          <Card
            title="Live Mode (Mock Exam)"
            badge="Most comprehensive"
            desc="16 stations • 188 mins 30 secs (3 hrs 10 mins)"
            gradient="from-violet-100 to-fuchsia-50"
            accent="violet"
          >
            {LIVE_PLAN_IDS.map((id) => {
              const p = PLANS[id];
              return (
                <PlanRow
                  key={p.id}
                  label={p.uiLabel}
                  onClick={() => checkout(p.id)}
                  loading={loading === p.id}
                  accent="violet"
                />
              );
            })}
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/* --------------------------------- UI bits -------------------------------- */

function Card({
  title,
  desc,
  badge,
  gradient,
  accent,
  children,
}: {
  title: string;
  desc: string;
  badge?: string;
  gradient: string; // tailwind gradient classes after 'bg-gradient-to-br'
  accent: "indigo" | "violet";
  children: React.ReactNode;
}) {
  const ring =
    accent === "indigo"
      ? "ring-indigo-200 hover:ring-indigo-300"
      : "ring-violet-200 hover:ring-violet-300";

  return (
    <div className={`group rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-200 transition-all hover:shadow-xl ${ring}`}>
      <div className={`rounded-xl bg-gradient-to-br ${gradient} p-0.5`}>
        <div className="rounded-[10px] bg-white p-6">
          {badge && (
            <div className="mb-3 inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
              {badge}
            </div>
          )}
          <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
          <p className="mt-1 text-gray-600">{desc}</p>
          <div className="mt-6 space-y-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function PlanRow({
  label,
  onClick,
  loading,
  accent,
}: {
  label: string;
  onClick: () => void;
  loading: boolean;
  accent: "indigo" | "violet";
}) {
  const pill =
    accent === "indigo"
      ? "from-indigo-600 to-blue-600"
      : "from-violet-600 to-fuchsia-600";

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-left shadow-sm transition-all hover:bg-gray-100 disabled:opacity-60"
    >
      <div className="flex items-center justify-between">
        <span className="text-base font-medium text-gray-900">{label}</span>
        <span className={`rounded-full bg-gradient-to-r ${pill} px-4 py-1.5 text-sm font-semibold text-white shadow-md`}>
          {loading ? "Redirecting…" : "Buy"}
        </span>
      </div>
    </button>
  );
}
