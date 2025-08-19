import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { scenarioId, answer } = body as { scenarioId: string; answer: string };

    if (!answer || !scenarioId) {
      return NextResponse.json({ error: "Missing scenario or answer" }, { status: 400 });
    }

    // 🔥 Ask GPT for structured feedback
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // change to "gpt-4o" for stronger exam-level feedback
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: `You are a CAS exam tutor. Evaluate the candidate's response strictly in CAS exam style.
Return JSON in this format:
{
  "scores": { "communication": number, "dataGathering": number, "professionalism": number, "clinicalReasoning": number },
  "overall": number,
  "strengths": string[],
  "improvements": string[],
  "summary": string
}`
        },
        {
          role: "user",
          content: `Scenario ID: ${scenarioId}\n\nCandidate Answer:\n${answer}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const data = JSON.parse(completion.choices[0].message?.content ?? "{}");

    return NextResponse.json({ feedback: data });
  } catch (e) {
    console.error("Evaluation error:", e);
    return NextResponse.json({ error: "Evaluation failed" }, { status: 500 });
  }
}
