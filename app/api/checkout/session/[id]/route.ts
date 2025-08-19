import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!); // ← no apiVersion

export async function GET(_req: Request, { params }: any) {
  const id = params?.id as string | undefined;
  if (!id) {
    return NextResponse.json({ error: "Missing session id" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(id);
    return NextResponse.json(session);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Stripe error" }, { status: 500 });
  }
}
