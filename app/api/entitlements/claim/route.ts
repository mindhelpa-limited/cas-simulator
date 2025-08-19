import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebaseAdmin";

// tell Next.js this must always run server-side
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

type ClaimInput = {
  uid: string;
  product: string;
  expiresAt: number;
};

export async function POST(req: Request) {
  const body = (await req.json()) as ClaimInput;

  // initialize admin only when the route is actually called
  initAdmin();
  const db = getFirestore();

  await db
    .collection("users")
    .doc(body.uid)
    .collection("entitlements")
    .doc(body.product)
    .set(
      { expiresAt: body.expiresAt, createdAt: Date.now() },
      { merge: true }
    );

  return NextResponse.json({ ok: true });
}
