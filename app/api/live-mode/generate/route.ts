// app/api/live-mode/generate/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Durations
const MORNING_STATION_SEC = 11 * 60 + 10;   // 11m10s
const AFTERNOON_STATION_SEC = 8 * 60 + 40;  // 8m40s

type RawStation = { title: string; scenario: string; tags: string[] };
type Station = RawStation & {
  id: string;
  circuit: "morning" | "afternoon";
  durationSec: number;
};

// ------------ Fallback content (16 stations) ------------
function fallbackStations(): Station[] {
  const base: RawStation[] = [
    {
      title: "Cognitive Assessment in Confused Elderly",
      scenario:
        "Perform a cognitive examination on Mr Smith, an elderly gentleman found wandering the streets. Assess orientation, attention, short-term memory, and red flags.",
      tags: ["Cognition", "Assessment", "Elderly"],
    },
    {
      title: "Medication Counselling – Rivastigmine",
      scenario:
        "Mr Paul Smith has a new diagnosis of Alzheimer’s disease. You’ve decided to start Rivastigmine. His brother wants to discuss effects, side-effects, monitoring, and expectations.",
      tags: ["Counselling", "Dementia", "Medicines"],
    },
    {
      title: "Acute Chest Pain in Middle-Aged Adult",
      scenario:
        "A 56-year-old presents with central chest pain radiating to the left arm. Take focused history, assess red flags, immediate management and safety netting.",
      tags: ["Cardiology", "Emergency", "ACS"],
    },
    {
      title: "Asthma Exacerbation Safety-Net",
      scenario:
        "A 22-year-old with asthma has increasing wheeze and night symptoms. Optimise control, check inhaler technique, and give clear safety-netting.",
      tags: ["Respiratory", "Asthma", "Safety-netting"],
    },
    {
      title: "Fever in a 2-Year-Old",
      scenario:
        "A toddler has had fever for 3 days. Take a focused paediatric history, look for red flags, address parental ICE, and discuss home care and when to seek help.",
      tags: ["Paediatrics", "Fever", "Red flags"],
    },
    {
      title: "New-Onset Low Mood with Risk Assessment",
      scenario:
        "A 29-year-old reports low mood and poor sleep. Explore symptoms, risk (including self-harm), contributing factors, and agree a management plan.",
      tags: ["Mental Health", "Depression", "Risk"],
    },
    {
      title: "Back Pain with Red-Flag Screening",
      scenario:
        "A 48-year-old has acute lower back pain after lifting. Screen for red flags (cauda equina, malignancy, infection), provide advice and safety-netting.",
      tags: ["MSK", "Back pain", "Red flags"],
    },
    {
      title: "TIA Assessment in Primary Care",
      scenario:
        "A 67-year-old describes transient right-sided weakness resolving within 30 minutes. Take history, assess stroke risk, and arrange urgent management.",
      tags: ["Neurology", "TIA", "Urgent care"],
    },
    {
      title: "Abdominal Pain – Possible Appendicitis",
      scenario:
        "A 21-year-old with peri-umbilical pain migrating to the RIF, nausea, and anorexia. Take focused history, differentials, and immediate plan.",
      tags: ["Surgery", "Abdomen", "Appendicitis"],
    },
    {
      title: "Antenatal Vaginal Bleeding",
      scenario:
        "A 28-year-old at 28 weeks presents with painless vaginal bleeding. Prioritise red flags and arrange urgent obstetric assessment.",
      tags: ["Obs & Gynae", "Antenatal", "Emergency"],
    },
    {
      title: "Elderly UTI with Delirium",
      scenario:
        "An 82-year-old in a care home is acutely confused with reduced intake. Consider UTI vs other causes of delirium; assess, manage, and safety-net.",
      tags: ["Geriatrics", "Delirium", "Infection"],
    },
    {
      title: "COPD Exacerbation – Community Plan",
      scenario:
        "A 71-year-old smoker with COPD has increased cough and sputum. Optimise inhalers, rescue pack use, and when to escalate.",
      tags: ["Respiratory", "COPD", "Planning"],
    },
    {
      title: "Head Injury with Anticoagulation",
      scenario:
        "A 74-year-old on apixaban tripped and hit his head. No LOC. Assess risk, indications for imaging, and safety-netting.",
      tags: ["Emergency", "Head injury", "Anticoagulation"],
    },
    {
      title: "Anaphylaxis – Immediate Management",
      scenario:
        "A 19-year-old with sudden facial swelling and wheeze after peanuts. Outline recognition and immediate management of anaphylaxis.",
      tags: ["Allergy", "Emergency", "Anaphylaxis"],
    },
    {
      title: "Diabetes – Foot Ulcer Advice",
      scenario:
        "A patient with type 2 diabetes presents with a small plantar ulcer. Assess infection risk, off-loading advice, and referral thresholds.",
      tags: ["Diabetes", "Foot", "Wound care"],
    },
    {
      title: "Suicidal Ideation – Crisis Plan",
      scenario:
        "A 35-year-old describes hopelessness with thoughts of jumping from a bridge. Perform a thorough risk assessment and agree a crisis plan.",
      tags: ["Mental Health", "Suicide risk", "Crisis"],
    },
  ];

  const addMeta = (s: RawStation, i: number): Station => ({
    ...s,
    id: crypto.randomUUID(),
    circuit: i < 8 ? "morning" : "afternoon",
    durationSec: i < 8 ? MORNING_STATION_SEC : AFTERNOON_STATION_SEC,
  });

  return base.map(addMeta);
}

// ------------ OpenAI generation ------------
async function generateWithOpenAI(): Promise<Station[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return fallbackStations();

  const system =
    "You are generating realistic UK OSCE/CSA-style stations for doctors. Keep scenarios concise and practical.";

  const user = `
Create 16 stations spanning varied domains (medicine, surgery, paediatrics, O&G, psychiatry, geriatrics, primary-care emergencies, counselling/medicines).
Return strict JSON:

{
  "stations": [
    { "title": string, "scenario": string, "tags": string[] },
    ...
  ]
}

Rules:
- 'scenario' is the standard stem the examiner shows.
- Keep each scenario 2–4 sentences, UK wording.
- tags: 2–4 concise terms.
`;

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });

  const json = await resp.json();
  const content = json?.choices?.[0]?.message?.content ?? "{}";
  let parsed: { stations?: RawStation[] } = {};
  try {
    parsed = JSON.parse(content);
  } catch {
    return fallbackStations();
  }

  const raw = Array.isArray(parsed.stations) ? parsed.stations : [];
  if (!raw.length) return fallbackStations();

  const mapWithMeta = (s: RawStation, i: number): Station => ({
    ...s,
    id: crypto.randomUUID(),
    circuit: i < 8 ? "morning" : "afternoon",
    durationSec: i < 8 ? MORNING_STATION_SEC : AFTERNOON_STATION_SEC,
  });

  return raw.slice(0, 16).map(mapWithMeta);
}

// ------------ Route handler ------------
export async function POST() {
  try {
    const stations = await generateWithOpenAI();
    return NextResponse.json({
      stations,
      schedule: {
        morning: { stations: 8, perStationSec: MORNING_STATION_SEC },
        breakSec: 30 * 60,
        afternoon: { stations: 8, perStationSec: AFTERNOON_STATION_SEC },
        totals: {
          performanceSec: 158 * 60 + 30, // 158m30s
          examSec: 188 * 60 + 30,        // includes 30m break
        },
      },
    });
  } catch (e: any) {
    console.error("live-mode/generate error", e);
    return NextResponse.json({ stations: fallbackStations() });
  }
}
