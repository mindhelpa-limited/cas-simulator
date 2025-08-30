// app/api/finish-signup/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import Stripe from "stripe";
// Import the top-level 'admin' object, as well as 'adminAuth' and 'adminDb'
import { admin, adminAuth, adminDb } from "@/lib/firebase-admin";
const SECRET = process.env.STRIPE_SECRET_KEY;
if (!SECRET) throw new Error("STRIPE_SECRET_KEY is missing from .env.local");
const STRIPE = new Stripe(SECRET);

// ---- helpers ----
function productMetadata(p: Stripe.Price["product"]): Record<string, string> | undefined {
  if (typeof p === "string") return undefined;
  if ("deleted" in p && p.deleted) return undefined;
  return (p as Stripe.Product).metadata || undefined;
}

async function peekSession(sessionId: string) {
  if (!sessionId) throw new Error("No session id provided");

  let session: Stripe.Checkout.Session;
  try {
    session = await STRIPE.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price.product"],
    });
  } catch (err: any) {
    throw new Error(`Stripe error: ${err?.message || "failed to retrieve session"}`);
  }

  const paid = session.payment_status === "paid";
  const complete = session.status === "complete";
  if (!paid && !complete) {
    throw new Error(
      `Session not paid yet (status=${session.status}, payment_status=${session.payment_status})`
    );
  }

  const email = session.customer_details?.email || "";
  if (!email) throw new Error("No email on Checkout Session");

  const productKey = (session.metadata?.productKey as string | undefined) || "live-mode";

  const item = session.line_items?.data?.[0];
  const price = item?.price as Stripe.Price | undefined;

  let accessDays: number | undefined;
  if (price) {
    const md = {
      ...(productMetadata(price.product) || {}),
      ...(price.metadata || {}),
    } as Record<string, string>;
    accessDays = md["access_days"] ? Number(md["access_days"]) : undefined;
  }

  const createdMs = (session.created || 0) * 1000;
  const accessUntil =
    accessDays && accessDays > 0 ? createdMs + accessDays * 24 * 60 * 60 * 1000 : undefined;

  const redirectPath = `/dashboard/${productKey}`;
  return { email, productKey, accessUntil, redirectPath };
}

// ---- GET: verify session & preview data ----
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("cs");
    if (!sessionId) {
      return NextResponse.json({ error: "Missing ?cs (Checkout Session ID)" }, { status: 400 });
    }
    const peek = await peekSession(sessionId);
    return NextResponse.json(peek);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Could not verify payment session" },
      { status: 400 }
    );
  }
}

// ---- POST: create/link user, write entitlement, return custom token ----
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sessionId: string | undefined = body.sessionId;
    const password: string | undefined = body.password;

    if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    if (!password) return NextResponse.json({ error: "Password required" }, { status: 400 });

    const peek = await peekSession(sessionId);
    const { email, productKey, accessUntil, redirectPath } = peek;

    // Create or update user
    let user: any = null;
    try {
      // Use the imported adminAuth object directly
      user = await adminAuth.getUserByEmail(email);
      await adminAuth.updateUser(user.uid, { password });
    } catch {
      // Use the imported adminAuth object directly
      user = await adminAuth.createUser({
        email,
        password,
        emailVerified: true,
      });
    }
    const uid = user.uid as string;

    // Store/merge entitlement
    // Use the imported adminDb and admin objects
    await adminDb
      .collection("users")
      .doc(uid)
      .collection("entitlements")
      .doc(productKey)
      .set(
        {
          page: productKey,
          accessUntil: accessUntil
            // Use the top-level 'admin' object here
            ? admin.firestore.Timestamp.fromMillis(accessUntil)
            : null,
          // Use the top-level 'admin' object here
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          source: "stripe_checkout",
          sessionId,
        },
        { merge: true }
      );

    // ✅ Return a Firebase custom token so the client can sign in
    // Use the imported adminAuth object directly
    const customToken = await adminAuth.createCustomToken(uid);

    return NextResponse.json({ redirectTo: redirectPath, customToken });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to finish signup" },
      { status: 400 }
    );
  }
}