import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

type CreateSessionInput = {
  priceId: string;
  mode: "subscription" | "payment";
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
};

export async function POST(req: Request) {
  const body = (await req.json()) as CreateSessionInput;

  const session = await stripe.checkout.sessions.create({
    mode: body.mode,
    line_items: [{ price: body.priceId, quantity: 1 }],
    success_url: body.successUrl,
    cancel_url: body.cancelUrl,
    metadata: body.metadata,
  });

  return NextResponse.json({ id: session.id });
}
