import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function GET(req: Request) {
  // Extract the dynamic [id] from the request URL
  const pathname = new URL(req.url).pathname; // e.g. /api/checkout/session/cs_test_123
  const id = decodeURIComponent(pathname.split("/").pop() || "");

  if (!id) {
    return NextResponse.json({ error: "Missing session id" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(id);
    return NextResponse.json(session);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to retrieve session" },
      { status: 500 }
    );
  }
}
