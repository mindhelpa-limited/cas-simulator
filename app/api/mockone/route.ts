// app/api/mockone/route.ts

import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const actorInstructions = formData.get('actorInstructions') as string;
    const stationVoice = (formData.get('voice') as string) || 'alloy';
    const conversationHistory = JSON.parse(
      (formData.get('conversationHistory') as string) || '[]'
    );

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // 1. Transcribe the user's audio to text using Whisper
    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: audioFile,
    });
    const userTranscript = transcription.text;

    // 2. Get the AI actor's text response using the Chat API
    const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are an AI actor in a psychiatry CASC exam. Your personality and what you know are strictly defined by the 'Actor Instructions'.
        - Your name and role are in the instructions.
        - Respond naturally and in character based *only* on the instructions provided.
        - Do not break character or reveal you are an AI.
        - Keep your responses concise and directly related to the candidate's questions or statements.
        - If the candidate asks a question not covered by your instructions, respond naturally with something like "I'm not sure about that" or deflect in character.
        ---
        ACTOR INSTRUCTIONS:
        ${actorInstructions}`,
      },
      // Add previous turns to maintain context
      ...conversationHistory,
      {
        role: 'user',
        content: userTranscript,
      },
    ];

    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: chatMessages,
    });
    const actorResponseText = chatResponse.choices[0].message.content || 'I am not sure how to respond to that.';

    // 3. Convert the actor's text response to speech using TTS
    const audioResponse = await openai.audio.speech.create({
      model: 'tts-1',
      voice: stationVoice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
      input: actorResponseText,
    });

    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    
    // Send back the transcript and the AI's text response along with the audio
    const headers = new Headers();
    headers.set('Content-Type', 'audio/mpeg');
    headers.set('X-User-Transcript', encodeURIComponent(userTranscript));
    headers.set('X-Actor-Response', encodeURIComponent(actorResponseText));

    return new NextResponse(audioBuffer, { status: 200, headers });

  } catch (error) {
    console.error('Error in mockone API:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}