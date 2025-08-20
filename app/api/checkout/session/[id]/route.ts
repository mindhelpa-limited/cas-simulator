// app/api/checkout/session/[id]/route.ts
import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "Missing session id" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(id);
    return NextResponse.json({
      id: session.id,
      paid: session.payment_status === "paid",
      email: session.customer_details?.email ?? null,
      metadata: session.metadata ?? {},
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Stripe error" }, { status: 500 });
  }
}
