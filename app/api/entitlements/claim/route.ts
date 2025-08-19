import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return NextResponse.json({ error: "No auth" }, { status: 401 });
    const decoded = await adminAuth.verifyIdToken(token);

    const { session_id } = await req.json();
    if (!session_id) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

    const s = await stripe.checkout.sessions.retrieve(session_id);
    if (s.status !== "complete" || s.payment_status !== "paid") {
      return NextResponse.json({ error: "Session not paid/complete" }, { status: 400 });
    }

    const product = s.metadata?.product as "test" | "live";
    const durationDays = Number(s.metadata?.durationDays || 0);
    if (!product || !durationDays) return NextResponse.json({ error: "Missing metadata" }, { status: 400 });

    // idempotency – prevent double-claim
    const claimRef = adminDb.collection("stripe_sessions").doc(session_id);
    const snap = await claimRef.get();
    if (snap.exists) return NextResponse.json({ error: "Session already claimed" }, { status: 409 });

    const expiresAt = Date.now() + durationDays * 86400_000;

    // grant entitlement under users/{uid}
    const userRef = adminDb.collection("users").doc(decoded.uid);
    await userRef.set({
      entitlements: {
        [product === "test" ? "testMode" : "liveMode"]: {
          expiresAt,
          source: session_id,
        },
      },
    }, { merge: true });

    await claimRef.set({
      uid: decoded.uid,
      claimedAt: Date.now(),
      email: s.customer_details?.email || s.customer_email || null,
      product, durationDays
    });

    return NextResponse.json({ ok: true, expiresAt });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Claim failed" }, { status: 500 });
  }
}
