// app/api/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebase-admin";

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature error:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const uid = session.metadata?.uid;
    const product = session.metadata?.product;
    const durationDays = Number(session.metadata?.durationDays || 0);

    if (uid && product && durationDays > 0) {
      const expiresAt = Date.now() + durationDays * 24 * 60 * 60 * 1000;

      // ✅ FIX: adminDb is not a function, so remove ()
      await adminDb
        .collection("users")
        .doc(uid)
        .collection("entitlements")
        .doc(product)
        .set(
          {
            product,
            expiresAt,
            sessionId: session.id,
            updatedAt: Date.now(),
          },
          { merge: true }
        );

      console.log(`Entitlement saved for user ${uid}: ${product}`);
    }
  }

  return NextResponse.json({ received: true });
}
