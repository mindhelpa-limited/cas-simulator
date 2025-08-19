import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebaseAdmin";

initAdmin();

type ClaimInput = {
  uid: string;
  product: string;
  expiresAt: number;
};

export async function POST(req: Request) {
  const body = (await req.json()) as ClaimInput;

  const db = getFirestore();
  await db
    .collection("users")
    .doc(body.uid)
    .collection("entitlements")
    .doc(body.product)
    .set({ expiresAt: body.expiresAt, createdAt: Date.now() }, { merge: true });

  return NextResponse.json({ ok: true });
}
