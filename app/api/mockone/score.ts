import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { transcript, feedbackDomains } = body;

  const completion = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an examiner. Score the candidate based on feedbackDomains (0–5 each). Return JSON with keys: scores {domain: number}, feedback, overall.`,
        },
        {
          role: "user",
          content: `Transcript:\n${JSON.stringify(transcript)}\n\nFeedbackDomains:\n${JSON.stringify(
            feedbackDomains
          )}`,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  const data = await completion.json();
  return NextResponse.json(JSON.parse(data.choices[0].message.content));
}
