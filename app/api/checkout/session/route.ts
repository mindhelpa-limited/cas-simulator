import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { PLANS, type PlanId } from "@/lib/plans";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { planId?: PlanId };
    if (!body?.planId) {
      return NextResponse.json({ error: "Missing planId" }, { status: 400 });
    }

    const plan = PLANS[body.planId];
    if (!plan) {
      return NextResponse.json({ error: `Unknown planId: ${body.planId}` }, { status: 400 });
    }
    if (typeof plan.amount !== "number") {
      return NextResponse.json({ error: `Plan ${body.planId} missing numeric amount` }, { status: 400 });
    }

    const origin =
      (await headers()).get("origin") ??
      process.env.NEXT_PUBLIC_BASE_URL ??
      "http://localhost:3000";

    // ONE-TIME PAYMENT with inline price_data (no saved Stripe Price needed)
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: plan.currency ?? "gbp",
            unit_amount: Math.round(plan.amount), // amount in minor units (pence)
            product_data: {
              name: `CAS ${plan.product === "test" ? "Practice" : "Live"} — ${plan.durationDays} days`,
            },
          },
        },
      ],
      metadata: {
        product: plan.product,
        durationDays: String(plan.durationDays),
      },
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
