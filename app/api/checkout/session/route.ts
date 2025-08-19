// app/api/checkout/session/route.ts
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!); // ← no apiVersion

export async function POST(req: Request) {
  try {
    const { priceId, customerEmail, successUrl, cancelUrl, metadata } = await req.json();

    if (!priceId) {
      return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
    }

    const origin =
      (await headers()).get("origin") ??
      process.env.NEXT_PUBLIC_BASE_URL ??
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      customer_email: customerEmail,
      success_url:
        successUrl ?? `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl ?? `${origin}/pricing?canceled=1`,
      metadata: metadata ?? {},
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (err: any) {
    console.error("create session error", err);
    return NextResponse.json(
      { error: err.message ?? "Unexpected error" },
      { status: 500 },
    );
  }
}
