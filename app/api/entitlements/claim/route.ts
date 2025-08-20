import Stripe from "stripe";
import { NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

initAdmin();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    // 1) Auth: must be logged in (Bearer <idToken>)
    const authH = req.headers.get("authorization") || "";
    const idToken = authH.startsWith("Bearer ") ? authH.slice(7) : "";
    if (!idToken) return NextResponse.json({ error: "Missing Authorization" }, { status: 401 });

    const user = await getAuth().verifyIdToken(idToken);

    // 2) Body: session id from success URL
    const { session_id } = await req.json();
    if (!session_id) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

    // 3) Stripe: make sure it’s paid and read metadata we set during checkout
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Unpaid or invalid session" }, { status: 400 });
    }

    const product = (session.metadata?.product as "test" | "live" | undefined) || undefined;
    const durationDays = Number(session.metadata?.durationDays ?? 0);
    if (!product || !durationDays) {
      return NextResponse.json({ error: "Missing session metadata" }, { status: 400 });
    }

    // 4) Grant entitlement in Firestore
    const expiresAt = Date.now() + durationDays * 24 * 60 * 60 * 1000;
    const db = getFirestore();
    await db
      .collection("users")
      .doc(user.uid)
      .collection("entitlements")
      .doc(product)
      .set(
        {
          product,
          expiresAt,
          sessionId: session.id,
          source: "stripe",
          updatedAt: Date.now(),
        },
        { merge: true }
      );

    return NextResponse.json({ ok: true, product, expiresAt });
  } catch (err: any) {
    console.error("claim error:", err);
    return NextResponse.json({ error: err?.message ?? "internal" }, { status: 500 });
  }
}
