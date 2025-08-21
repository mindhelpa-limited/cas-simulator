// app/api/entitlements/claim/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    // auth
    const authH = req.headers.get("authorization") || "";
    const idToken = authH.startsWith("Bearer ") ? authH.slice(7) : "";
    if (!idToken) return NextResponse.json({ error: "Missing Authorization" }, { status: 401 });

    const user = await adminAuth().verifyIdToken(idToken);

    const { session_id } = await req.json();
    if (!session_id) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Unpaid or invalid session" }, { status: 400 });
    }

    const product = session.metadata?.product as "test" | "live" | undefined;
    const durationDays = Number(session.metadata?.durationDays ?? 0);
    if (!product || !durationDays) {
      return NextResponse.json({ error: "Missing session metadata" }, { status: 400 });
    }

    const expiresAt = Date.now() + durationDays * 24 * 60 * 60 * 1000;

    await adminDb()
      .collection("users")
      .doc(user.uid)
      .collection("entitlements")
      .doc(product)
      .set(
        { product, expiresAt, sessionId: session.id, source: "stripe", updatedAt: Date.now() },
        { merge: true }
      );

    return NextResponse.json({ ok: true, product, expiresAt });
  } catch (e: any) {
    console.error("claim error:", e);
    return NextResponse.json({ error: e?.message ?? "internal" }, { status: 500 });
  }
}
