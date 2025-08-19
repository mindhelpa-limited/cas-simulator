// app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // don't prerender

export async function POST(_req: Request) {
  // No-op webhook so build passes. We'll wire Stripe later.
  return NextResponse.json({ received: true });
}
