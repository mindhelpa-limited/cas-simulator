import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { PLANS, type PlanId } from "@/lib/plans";

export async function POST(req: NextRequest) {
  try {
    const { planId } = await req.json() as { planId: PlanId };
    const plan = PLANS[planId];
    if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_creation: "always",
      allow_promotion_codes: true,
      line_items: [{
        price_data: {
          currency: "gbp",
          product_data: { name: plan.checkoutName },
          unit_amount: plan.amountPence,
        },
        quantity: 1,
      }],
      metadata: {
        planId: plan.id,
        product: plan.product,
        durationDays: String(plan.durationDays),
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing?canceled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Stripe error" }, { status: 500 });
  }
}
