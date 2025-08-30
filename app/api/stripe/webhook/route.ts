// app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebase-admin";
import { addDays } from "date-fns";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();

  // FIX: Await the headers() function to get the headers object
  const allHeaders = await headers();
  const signature = allHeaders.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;
      
      const uid = session.metadata?.uid;
      const product = session.metadata?.product;
      const durationDays = parseInt(session.metadata?.durationDays || "0", 10);

      if (!uid || !product || !durationDays) {
        console.error("Missing metadata in session:", session.metadata);
        return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
      }

      const expiresAt = addDays(new Date(), durationDays).getTime();

      try {
        // ✅ FIXED: remove () after adminDb
        await adminDb
          .collection("users")
          .doc(uid)
          .collection("entitlements")
          .doc("live")
          .set({
            product,
            expiresAt,
          });

        console.log(`Entitlement for user ${uid} saved successfully.`);
      } catch (e) {
        console.error("Error saving entitlement:", e);
        return NextResponse.json(
          { error: "Error saving entitlement" },
          { status: 500 }
        );
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
