// app/api/voice/route.ts

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { stations } from '@/lib/stations'; // Import station data

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get('audio') as File;
        const stationId = parseInt(formData.get('stationId') as string, 10);
        const conversationHistory = JSON.parse(formData.get('conversation') as string);
        
        const station = stations.find(s => s.id === stationId);
        if (!station) {
            return NextResponse.json({ error: 'Station not found' }, { status: 404 });
        }

        if (!audioFile) {
            return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
        }

        const transcription = await openai.audio.transcriptions.create({
            model: 'whisper-1',
            file: audioFile,
        });
        const userText = transcription.text;

        const chatResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: `You are an AI actor in a psychiatry CASC exam. Follow these instructions precisely and stay in character. Do not break character. Instructions:\n\n${station.actorInstructions}` },
                ...conversationHistory,
                { role: 'user', content: userText },
            ],
        });
        const aiText = chatResponse.choices[0].message.content || "I'm not sure how to respond.";

        const ttsResponse = await openai.audio.speech.create({
            model: 'tts-1',
            voice: 'nova',
            input: aiText,
        });
        const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());

        return NextResponse.json({
            userText,
            aiText,
            audio: audioBuffer.toString('base64'),
        });

    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
    }
}