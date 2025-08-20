// app/api/checkout/session/[id]/route.ts
import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // required for Stripe in App Router

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// 👇 NEXT EXPECTS: params is a Promise<{ id: string }>
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // <- await the promise

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
    return NextResponse.json(
      { error: e?.message ?? "Stripe error" },
      { status: 500 }
    );
  }
}
