// app/api/live-mode/reply/route.ts
import { NextResponse } from "next/server";

type Turn = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  try {
    const { scenario, history, interrupt } = (await req.json()) as {
      scenario: string;
      history: Turn[];
      interrupt?: boolean;
    };

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content:
          [
            "You are a standardized patient in a CAS OSCE-style station.",
            "Stay in character as the PATIENT. Be concise (1–2 sentences per turn).",
            "Let the doctor lead; answer naturally and truthfully based on the scenario.",
            "Only provide information if asked or if appropriate. Allow pauses.",
            "You can ask short clarifying questions (e.g., 'What do you mean by that?').",
            "If the doctor interrupts, stop and let them speak.",
            "Tone: human, cooperative, realistic. No meta talk. Do not output 'DOCTOR:' or 'PATIENT:' labels.",
          ].join(" "),
      },
      {
        role: "user",
        content:
          "Station briefing for the patient (do not read this aloud; just use it as your backstory):\n" +
          scenario,
      },
    ];

    // Add the conversation history
    for (const t of history ?? []) {
      messages.push({
        role: t.role === "user" ? "user" : "assistant",
        content: t.content,
      });
    }

    // Brief nudge if we are handling a barge-in/interrupt
    if (interrupt) {
      messages.push({
        role: "system",
        content:
          "The doctor interrupted you. Resume with a short, natural reply in 1–2 sentences.",
      });
    }

    // Call OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Safe fallback if key is missing
      return NextResponse.json({
        reply:
          "Hello doctor. I'm not feeling very well and I’m hoping you can help.",
        note: "OPENAI_API_KEY missing on server; returned fallback line.",
      });
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.8,
        max_tokens: 180,
        messages,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("OpenAI error:", errText);
      return NextResponse.json({
        reply:
          "Hello doctor. Sorry—could you please say that again?",
        error: "OpenAI request failed",
      });
    }

    const data = await openaiRes.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json({
        reply: "Hello doctor. I’m here.",
        note: "No content in OpenAI response; returned fallback line.",
      });
    }

    return NextResponse.json({ reply });
  } catch (e: any) {
    console.error("reply route error:", e);
    // Always return something to keep the flow going
    return NextResponse.json({
      reply: "Hello doctor. I’m listening.",
      error: e?.message ?? "Unexpected error",
    });
  }
}
