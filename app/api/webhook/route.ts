import { NextResponse, NextRequest } from "next/server";
import Stripe from "stripe";
import { Readable } from "stream";
import { adminDb } from "@/lib/firebaseAdmin"; // ✅ use the correct path and name

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // apiVersion removed to avoid type error
});

export const config = {
  api: {
    bodyParser: false, // ✅ Disable Next.js default body parsing
  },
};

async function buffer(readable: Readable): Promise<Buffer> {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.arrayBuffer(); // ✅ Still needed
  const bodyBuffer = Buffer.from(rawBody); // ✅ Convert to Buffer
  const signature = req.headers.get("stripe-signature") as string;

  try {
    const event = stripe.webhooks.constructEvent(
      bodyBuffer,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // ✅ Handle event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        console.log("Payment success:", session.id);
        // Add logic to update Firebase or DB if needed
        break;

      default:
        console.log("Unhandled event type:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}