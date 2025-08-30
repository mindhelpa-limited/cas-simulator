// app/pricing/page.tsx
export const runtime = "nodejs";        // ✅ ensure Node runtime (Stripe SDK needs this)
export const dynamic = "force-dynamic"; // avoid static caching during dev

import Stripe from "stripe";
import { redirect } from "next/navigation";

const SECRET = process.env.STRIPE_SECRET_KEY;
if (!SECRET) {
  throw new Error("STRIPE_SECRET_KEY is missing from .env.local");
}
const STRIPE = new Stripe(SECRET); // let SDK use account API version
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// Read price IDs from env (comma-separated)
const LIVE_IDS = (process.env.LIVE_PRICE_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const PRACTICE_IDS = (process.env.PRACTICE_PRICE_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

type PriceRow = {
  id: string;
  label: string;     // e.g. "1 Month"
  amount: string;    // formatted currency
  accessDays?: number;
};

function money(unitCents: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(unitCents / 100);
}

// Narrow to real Product before reading .metadata
function productMetadata(p: Stripe.Price["product"]): Record<string, string> | undefined {
  if (typeof p === "string") return undefined;
  if ("deleted" in p && p.deleted) return undefined;
  return (p as Stripe.Product).metadata || undefined;
}

async function getRows(ids: string[]): Promise<PriceRow[]> {
  const out: PriceRow[] = [];
  for (const id of ids) {
    try {
      const price = await STRIPE.prices.retrieve(id, { expand: ["product"] });
      const unit = typeof price.unit_amount === "number" ? price.unit_amount : 0;
      const cur = (price.currency || "usd").toUpperCase();

      const md = {
        ...(productMetadata(price.product) || {}),
        ...(price.metadata || {}),
      } as Record<string, string>;

      const days = md["access_days"] ? Number(md["access_days"]) : undefined;
      const months = days ? Math.round(days / 30) : undefined;
      const label = months ? `${months} Month${months > 1 ? "s" : ""}` : "Access";

      out.push({
        id,
        label,
        amount: unit ? money(unit, cur) : "",
        accessDays: Number.isFinite(days as number) ? (days as number) : undefined,
      });
    } catch (e) {
      // If a bad price ID is in env, keep page rendering and show an entry you can notice
      out.push({ id, label: "Invalid price", amount: "—" });
    }
  }
  return out.sort((a, b) => (a.accessDays ?? 0) - (b.accessDays ?? 0));
}

// --- SERVER ACTION: create a Checkout Session ---
async function startCheckout(formData: FormData) {
  "use server";
  const priceId = String(formData.get("priceId") || "");
  const productKey = String(formData.get("productKey") || ""); // "live-mode" | "practice-mode"

  const all = [...LIVE_IDS, ...PRACTICE_IDS];
  if (!all.includes(priceId)) throw new Error("Invalid price selected");

  const session = await STRIPE.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { productKey }, // read on /checkout/return
    success_url: `${BASE_URL}/checkout/return?cs={CHECKOUT_SESSION_ID}`,
    cancel_url: `${BASE_URL}/pricing?checkout=cancelled`,
    automatic_tax: { enabled: true },
  });

  redirect(session.url!);
}

export default async function PricingPage() {
  // If no IDs, render a clear message instead of hanging
  const noLive = LIVE_IDS.length === 0;
  const noPractice = PRACTICE_IDS.length === 0;

  const [liveRows, practiceRows] = await Promise.all([
    noLive ? Promise.resolve<PriceRow[]>([]) : getRows(LIVE_IDS),
    noPractice ? Promise.resolve<PriceRow[]>([]) : getRows(PRACTICE_IDS),
  ]);

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Choose your plan</h1>

      <section className="grid md:grid-cols-2 gap-6">
        {/* Live Mode */}
        <div className="border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Live Mode (Mock Exam)</h2>
          <p className="text-sm text-neutral-600 mb-4">One-time payment — time-limited access.</p>
          {noLive ? (
            <p className="text-sm text-red-600">LIVE_PRICE_IDS is empty in .env.local</p>
          ) : (
            <div className="space-y-3">
              {liveRows.map((row) => (
                <form key={row.id} action={startCheckout}>
                  <input type="hidden" name="priceId" value={row.id} />
                  <input type="hidden" name="productKey" value="live-mode" />
                  <button type="submit" className="w-full rounded-lg py-2.5 px-4 bg-black text-white">
                    {row.label} — {row.amount}
                  </button>
                </form>
              ))}
            </div>
          )}
        </div>

        {/* Practice Mode */}
        <div className="border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Practice Mode</h2>
          <p className="text-sm text-neutral-600 mb-4">One-time payment — time-limited access.</p>
          {noPractice ? (
            <p className="text-sm text-red-600">PRACTICE_PRICE_IDS is empty in .env.local</p>
          ) : (
            <div className="space-y-3">
              {practiceRows.map((row) => (
                <form key={row.id} action={startCheckout}>
                  <input type="hidden" name="priceId" value={row.id} />
                  <input type="hidden" name="productKey" value="practice-mode" />
                  <button type="submit" className="w-full rounded-lg py-2.5 px-4 bg-black text-white">
                    {row.label} — {row.amount}
                  </button>
                </form>
              ))}
            </div>
          )}
        </div>
      </section>

      <p className="text-xs text-neutral-500 mt-6">
        Duration is determined by each price’s <code>access_days</code> metadata in Stripe.
      </p>
    </main>
  );
}
