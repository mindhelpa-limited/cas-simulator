// app/api/score/route.ts

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { stations } from '@/lib/stations';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const { scores } = await req.json();

        const scoringPromises = scores.map(async (stationScore: any) => {
            const stationData = stations.find((s) => s.id === stationScore.stationId);
            if (!stationData) return stationScore;

            const prompt = `
                You are a senior psychiatry examiner evaluating a CASC exam performance.
                Based on the provided transcript and feedback domains, score the candidate.
                For each domain, provide a score from 1 to 4 (1=Fail, 2=Borderline, 3=Pass, 4=Excellent) and a brief justification.
                STATION TRANSCRIPT:\n---\n${stationScore.transcript}\n---
                FEEDBACK DOMAINS:\n---\n${stationData.feedbackDomains}\n---
                Respond with only a valid JSON object in the format: { "scores": [{ "domain": "Name", "score": <1-4>, "justification": "Reason." }] }
            `;

            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [{ role: 'system', content: prompt }],
                response_format: { type: 'json_object' },
            });

            const resultJson = JSON.parse(response.choices[0].message.content || '{}');
            return { ...stationScore, scores: resultJson.scores || [] };
        });

        const finalScores = await Promise.all(scoringPromises);
        return NextResponse.json(finalScores);

    } catch (error) {
        console.error('Scoring API error:', error);
        return NextResponse.json({ error: 'Scoring failed' }, { status: 500 });
    }
}