// app/api/score/route.ts
import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ---------------- Types ----------------
interface Station {
  title: string;
  feedbackDomains: Record<string, string>;
}

interface ScoreRequest {
  candidateName: string;
  stations: Station[];
  transcripts: { stationIndex: number; log: { role: string; content: string }[] }[];
}

interface ScoreResult {
  scores: Record<string, number>;
  feedback: string;
  overallStationScore: number;
}

// ---------------- Utility ----------------
// Force-creates a real ArrayBuffer (not ArrayBufferLike / SharedArrayBuffer).
function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(u8.byteLength);
  new Uint8Array(ab).set(u8);
  return ab;
}

// ---------------- Scoring Function ----------------
async function getStationScore(
  station: Station,
  transcriptLog: { role: string; content: string }[]
): Promise<ScoreResult> {
  const feedbackCriteria = JSON.stringify(station.feedbackDomains, null, 2);
  const transcriptText = transcriptLog.map(t => `${t.role}: ${t.content}`).join('\n');

  const systemPrompt = `You are an expert examiner for a psychiatry CASC exam. Your task is to score a candidate's performance on a single station based on a provided transcript and specific feedback domains.
  
  1. Analyze the transcript and evaluate the candidate's performance against each criterion in the 'Feedback Domains'.
  2. For each domain, provide a score from 1 to 10 (1=Fail, 5=Pass, 10=Excellent).
  3. Provide a concise, constructive feedback summary (2-3 sentences).
  4. Calculate an overall score for the station by averaging the domain scores.
  5. Your output MUST be a valid JSON object with the following structure: { "scores": { "DomainName": score }, "feedback": "...", "overallStationScore": avg_score }.`

  const userPrompt = `
    STATION TITLE: ${station.title}
    
    FEEDBACK DOMAINS:
    ${feedbackCriteria}
    
    CONVERSATION TRANSCRIPT:
    ${transcriptText}
    
    Please provide your evaluation in the specified JSON format.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result as ScoreResult;
  } catch (error) {
    console.error(`Error scoring station "${station.title}":`, error);
    const failedDomains = Object.keys(station.feedbackDomains).reduce(
      (acc, key) => ({ ...acc, [key]: 1 }),
      {}
    );
    return {
      scores: failedDomains,
      feedback: "An error occurred during scoring for this station.",
      overallStationScore: 1,
    };
  }
}

// ---------------- PDF Report ----------------
async function createPdfReport(
  candidateName: string,
  stationScores: (ScoreResult & { stationTitle: string })[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 50;

  // Report Header
  page.drawText('Psychiatry CASC Exam Report', {
    x: 50,
    y,
    font: boldFont,
    size: 24,
    color: rgb(0.1, 0.1, 0.4),
  });
  y -= 40;
  page.drawText(`Candidate: ${candidateName}`, { x: 50, y, font: boldFont, size: 16 });
  y -= 25;
  page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y, font, size: 12 });
  y -= 40;

  // Overall Score
  const totalScore = stationScores.reduce((sum, s) => sum + s.overallStationScore, 0);
  const overallAverage = (totalScore / stationScores.length).toFixed(2);
  page.drawText('Overall Performance', { x: 50, y, font: boldFont, size: 18 });
  y -= 25;
  page.drawText(`Average Score: ${overallAverage} / 10`, { x: 50, y, font, size: 14 });
  y -= 40;

  page.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 20;

  // Station-by-Station Breakdown
  for (const station of stationScores) {
    if (y < 150) {
      page = pdfDoc.addPage();
      y = height - 50;
    }

    page.drawText(station.stationTitle, {
      x: 50,
      y,
      font: boldFont,
      size: 14,
      color: rgb(0.1, 0.1, 0.4),
    });
    y -= 20;

    // Domain Scores
    for (const [domain, score] of Object.entries(station.scores)) {
      page.drawText(`${domain}: `, { x: 70, y, font, size: 11 });
      page.drawText(`${score}/10`, { x: 200, y, font: boldFont, size: 11 });
      y -= 15;
    }

    // Feedback
    page.drawText('Feedback:', { x: 70, y, font: boldFont, size: 11 });
    y -= 15;
    const feedbackLines = station.feedback.match(/.{1,80}(\s|$)/g) || [];
    feedbackLines.forEach(line => {
      page.drawText(line.trim(), {
        x: 80,
        y,
        font,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= 12;
    });
    y -= 20;
  }

  return await pdfDoc.save(); // Uint8Array
}

// ---------------- API Endpoint ----------------
export async function POST(req: Request) {
  try {
    const { candidateName, stations, transcripts }: ScoreRequest = await req.json();

    const scoringPromises = stations.map((station, index) => {
      const transcriptLog = transcripts.find(t => t.stationIndex === index)?.log || [];
      return getStationScore(station, transcriptLog);
    });

    const results = await Promise.all(scoringPromises);

    const detailedResults = results.map((result, index) => ({
      ...result,
      stationTitle: stations[index].title,
    }));

    const pdfBytes = await createPdfReport(candidateName, detailedResults);

    // ✅ Final fix: convert Uint8Array -> definite ArrayBuffer (no SharedArrayBuffer union)
    const pdfArrayBuffer = toArrayBuffer(pdfBytes);

    return new NextResponse(
      new Blob([pdfArrayBuffer], { type: 'application/pdf' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="CASC_Report.pdf"',
        },
      }
    );
  } catch (error) {
    console.error('Error in scoring API:', error);
    return NextResponse.json({ error: 'Failed to generate score report' }, { status: 500 });
  }
}
