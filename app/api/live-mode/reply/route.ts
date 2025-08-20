// app/api/live-mode/reply/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";           // safer for OpenAI + Upstash
export const dynamic = "force-dynamic";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Upstash Redis client (REST)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 1 request per 10 seconds per key (here: by IP)
// You can tweak the number and window to your needs.
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, "10 s"),
  analytics: true,
  prefix: "rl:live-mode-reply",
});

export async function POST(req: Request) {
  try {
    // use IP if available, otherwise a generic key
    const ip =
      (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "anonymous";

    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Ratelimit exceeded" }, { status: 429 });
    }

    const formData = await req.formData();
    const scenario = formData.get("scenario") as string | null;
    const audio = formData.get("audio") as File | null;
    const historyString = (formData.get("history") as string | null) ?? "[]";
    const history = JSON.parse(historyString);

    if (!scenario || !audio) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1) Transcribe user's audio
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
      language: "en",
    });
    const doctorText = transcription.text;

    // 2) Generate patient reply
    const messages = [
      {
        role: "system",
        content:
          "You are a realistic patient in a UK medical exam. Keep responses concise and realistic based on the provided scenario. Do not offer unsolicited info. Respond naturally to the doctor's questions.",
      },
      ...history,
      { role: "user", content: doctorText },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages as any,
      temperature: 0.8,
      stream: false,
    });

    const reply = completion.choices[0].message.content;
    return NextResponse.json({ doctorText, reply });
  } catch (error) {
    console.error("Error in reply route:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
