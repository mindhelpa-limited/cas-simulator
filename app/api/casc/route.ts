import { NextResponse } from "next/server";

export const runtime = "edge"; // ensures low latency
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(req: Request) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured in .env.local" },
        { status: 500 }
      );
    }

    const contentType = req.headers.get("content-type");

    // 🎯 Case 1: WebRTC Realtime (SDP exchange)
    if (contentType === "application/sdp") {
      const offer = await req.text();

      const r = await fetch(
        "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/sdp",
          },
          body: offer,
        }
      );

      if (!r.ok) {
        const err = await r.text();
        return new NextResponse(err, { status: r.status });
      }

      const answer = await r.text();
      return new NextResponse(answer, {
        headers: { "Content-Type": "application/sdp" },
      });
    }

    // 🎯 Case 2: Fallback
    return NextResponse.json(
      { error: "Unsupported request type" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
