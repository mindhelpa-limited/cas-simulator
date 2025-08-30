// app/api/voice/start/route.ts

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { stations } from '@/lib/stations'; // Import station data

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const { stationId } = await req.json();

        const station = stations.find(s => s.id === stationId);
        if (!station) {
            return NextResponse.json({ error: 'Station not found' }, { status: 404 });
        }

        // 1. Get the opening line from the AI
        const chatResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { 
                    role: 'system', 
                    content: `You are an AI actor in a psychiatry CASC exam. The consultation with the doctor is just beginning. Based on your instructions, deliver a brief, natural opening line to start the encounter. For example: "Hello doctor, thanks for seeing me." or "Hi, they told me I should speak to you." Do not ask a question yet, just start the conversation. Your instructions are:\n\n${station.actorInstructions}` 
                },
            ],
            max_tokens: 50, // Keep the opening line concise
        });
        const aiText = chatResponse.choices[0].message.content || "Hello doctor.";

        // 2. Convert the opening line to audio
        const ttsResponse = await openai.audio.speech.create({
            model: 'tts-1',
            voice: 'nova',
            input: aiText,
        });
        const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());

        return NextResponse.json({
            aiText: aiText,
            audio: audioBuffer.toString('base64'),
        });

    } catch (error)
    {
        console.error('API start error:', error);
        return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
    }
}