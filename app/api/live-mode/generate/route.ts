// app/api/live-mode/generate/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

type Station = {
  id: string;
  title: string;
  scenario: string;
  tags: string[];
};

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * POST /api/live-mode/generate
 * Returns exactly 12 stations
 */
export async function POST() {
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "You are a medical exam author generating CAS/OSCE stations. " +
            "Output only concise, safe, realistic stations suitable for general practice exams. " +
            "Avoid personally identifiable data. Keep clinical details appropriate for assessment."
        },
        {
          role: "user",
          content: [
            "Generate exactly 12 CAS-style stations covering a broad mix of systems and skills.",
            "",
            "For each station, return JSON fields:",
            "- id: a short kebab-case slug (e.g., 'sore-throat')",
            "- title: concise station heading",
            "- scenario: the exact text candidates see/hear (do not include the heading again here)",
            "- tags: 2–4 short keywords",
            "",
            "Keep them succinct, realistic, and exam-appropriate."
          ].join("\n")
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "StationsPayload",
          schema: {
            type: "object",
            properties: {
              stations: {
                type: "array",
                minItems: 12,
                maxItems: 12,
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    scenario: { type: "string" },
                    tags: {
                      type: "array",
                      minItems: 2,
                      maxItems: 4,
                      items: { type: "string" }
                    }
                  },
                  required: ["id", "title", "scenario", "tags"],
                  additionalProperties: false
                }
              }
            },
            required: ["stations"],
            additionalProperties: false
          }
        }
      }
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const data = JSON.parse(raw) as { stations?: Station[] };

    if (!data.stations || data.stations.length !== 12) {
      throw new Error("Did not get 12 stations from model.");
    }

    const stations: Station[] = data.stations.map((s, i) => ({
      id: safeSlug(s.id || s.title || `station-${i + 1}`),
      title: trimMax(s.title, 120),
      scenario: trimMax(s.scenario, 600),
      tags: Array.isArray(s.tags)
        ? s.tags.slice(0, 4).map(t => trimMax(String(t), 24))
        : []
    }));

    return NextResponse.json({ stations }, { status: 200 });
  } catch (err) {
    console.error("LIVE GENERATE ERROR:", err);

    // Fallback: static 12-station bank
    const fallback: Station[] = [
      {
        id: "sore-throat",
        title: "Sore Throat with Fever",
        scenario:
          "A 30-year-old has a sore throat, fever, and difficulty swallowing for three days. Explore red flags, assess ICE, and provide safety netting.",
        tags: ["ENT", "Safety-netting"]
      },
      {
        id: "abdomen-pain",
        title: "Abdominal Pain in Young Adult",
        scenario:
          "A 24-year-old presents with lower abdominal pain and a low-grade fever for two days. Take focused history, explore ICE, and outline a safe plan.",
        tags: ["History", "Reasoning"]
      },
      {
        id: "chest-pain",
        title: "Chest Pain at Rest",
        scenario:
          "A 54-year-old reports chest tightness at rest lasting 10 minutes, now resolved. Take ACS-focused history and discuss immediate actions.",
        tags: ["Cardio", "Red Flags"]
      },
      {
        id: "back-pain",
        title: "Acute Low Back Pain",
        scenario:
          "A 41-year-old developed low back pain after lifting. Assess red flags, function, expectations, and provide evidence-based advice.",
        tags: ["MSK", "Advice"]
      },
      {
        id: "anxiety",
        title: "Escalating Anxiety",
        scenario:
          "A 27-year-old describes rising anxiety, palpitations, and poor sleep. Explore triggers, screen risk, and agree next steps.",
        tags: ["Mental Health", "Risk"]
      },
      {
        id: "child-fever",
        title: "Fever in a Child",
        scenario:
          "A 2-year-old has fever for 24 hours. Parent reports reduced feeding and irritability. Take history, assess red flags, and give safety-netting.",
        tags: ["Paeds", "Red Flags"]
      },
      {
        id: "uti",
        title: "Dysuria and Frequency",
        scenario:
          "A 33-year-old reports dysuria and urinary frequency. Clarify onset, systemic features, and pregnancy status. Plan investigations and safety-netting.",
        tags: ["Urology", "Infection"]
      },
      {
        id: "diabetes-review",
        title: "Diabetes Annual Review",
        scenario:
          "A 60-year-old with type 2 diabetes attends review. Cover monitoring, medications, hypoglycaemia risks, lifestyle, and complication screening.",
        tags: ["Chronic", "Counselling"]
      },
      {
        id: "rash",
        title: "New Onset Rash",
        scenario:
          "A 19-year-old developed an itchy rash after starting an antibiotic. Clarify timing, systemic symptoms, allergy history, and outline management.",
        tags: ["Derm", "Allergy"]
      },
      {
        id: "pregnancy-bleed",
        title: "Early Pregnancy Bleeding",
        scenario:
          "A 29-year-old at 6 weeks pregnant reports spotting. Explore symptoms, pain, and discuss safety-netting and referral.",
        tags: ["Obs", "Counselling"]
      },
      {
        id: "headache",
        title: "Recurrent Headaches",
        scenario:
          "A 36-year-old presents with recurrent headaches. Explore onset, red flags, triggers, medication use, and provide a safe management plan.",
        tags: ["Neuro", "History"]
      },
      {
        id: "cough",
        title: "Persistent Cough",
        scenario:
          "A 48-year-old presents with a cough lasting 6 weeks. Explore smoking history, red flags, systemic symptoms, and plan appropriate next steps.",
        tags: ["Resp", "Screening"]
      }
    ];

    return NextResponse.json({ stations: fallback }, { status: 200 });
  }
}

/* ------------ small utils ------------ */
function safeSlug(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .trim();
}
function trimMax(s: string, n: number) {
  if (!s) return s;
  return s.length > n ? s.slice(0, n - 1).trim() + "…" : s;
}
