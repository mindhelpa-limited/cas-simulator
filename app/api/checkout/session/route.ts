// app/api/checkout/session/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { PLANS, type PlanId } from "@/lib/plans";
import { adminAuth } from "@/lib/firebase-admin";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { planId?: PlanId; coupon?: string };
    if (!body?.planId) {
      return NextResponse.json({ error: "Missing planId" }, { status: 400 });
    }

    // FIX: Await the headers() function to get the headers object
    const allHeaders = await headers();
    const authH = allHeaders.get("authorization") || "";

    const idToken = authH.startsWith("Bearer ") ? authH.slice(7) : "";
    if (!idToken) return NextResponse.json({ error: "Missing Authorization" }, { status: 401 });
    // Corrected usage: adminAuth is an object, not a function.
    const user = await adminAuth.verifyIdToken(idToken);

    const plan = PLANS[body.planId];
    if (!plan) {
      return NextResponse.json({ error: `Unknown planId: ${body.planId}` }, { status: 400 });
    }
    if (typeof plan.amount !== "number") {
      return NextResponse.json({ error: `Plan ${body.planId} missing numeric amount` }, { status: 400 });
    }

    const origin =
      allHeaders.get("origin") ??
      process.env.NEXT_PUBLIC_BASE_URL ??
      "http://localhost:3000";

    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
    const code = body.coupon?.trim().toUpperCase();
    if (code === "DRKELVIN100") {
      const promos = await stripe.promotionCodes.list({ code: "DRKELVIN100", active: true, limit: 1 });
      const promo = promos.data[0];
      if (!promo) {
        return NextResponse.json(
          { error: "Promotion code DRKELVIN100 not found or inactive in Stripe." },
          { status: 400 }
        );
      }
      discounts = [{ promotion_code: promo.id }];
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: plan.currency ?? "gbp",
            unit_amount: Math.round(plan.amount),
            product_data: {
              name: `CAS ${plan.product === "test" ? "Practice" : "Live"} — ${plan.durationDays} days`,
            },
          },
        },
      ],
      metadata: {
        product: plan.product,
        durationDays: String(plan.durationDays),
        uid: user.uid,
      },
      allow_promotion_codes: true,
      discounts,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=1`,
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (err: any) {
    console.error("create session error", err);
    return NextResponse.json(
      { error: err.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}