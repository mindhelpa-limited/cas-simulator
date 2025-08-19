import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const s = await stripe.checkout.sessions.retrieve(params.id);
    const email = s.customer_details?.email || s.customer_email || "";
    return NextResponse.json({
      id: s.id,
      email,
      status: s.status,
      paid: s.payment_status === "paid",
      metadata: s.metadata || {},
    });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
