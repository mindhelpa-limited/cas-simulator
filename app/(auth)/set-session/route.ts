// app/(auth)/set-session/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    // 14 days
    const expiresInMs = 1000 * 60 * 60 * 24 * 14;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: expiresInMs,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set({
      name: "fb_session",
      value: sessionCookie,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production", // ✅ allow cookie on localhost
      path: "/",
      maxAge: Math.floor(expiresInMs / 1000),
    });
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to set session" },
      { status: 400 }
    );
  }
}