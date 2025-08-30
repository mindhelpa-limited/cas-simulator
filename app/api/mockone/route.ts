import { NextResponse } from 'next/server'; 
import OpenAI from 'openai';

export async function POST(request: Request) {
    // 1. Check for the API key in environment variables.
    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
            { error: 'OPENAI_API_KEY is not set in environment variables.' },
            { status: 500 }
        );
    }

    try {
        // 2. Safely parse the request body.
        const { actorInstructions, voice } = await request.json();

        // 3. Ensure required instructions are present.
        if (!actorInstructions) {
            return NextResponse.json(
                { error: 'actorInstructions are required.' },
                { status: 400 }
            );
        }

        // 4. Define the system instructions for the AI's role-play character.
        const systemPrompt = `You are a professional role-play actor in a medical Objective Structured Clinical Examination (OSCE). 
Your name and character details are specified in the instructions below. 
You must strictly adhere to these instructions. Do not break character. 
Respond naturally and realistically to the candidate's questions. 
If the candidate is taking too long on one question, gently guide them to the next one as per your instructions. 
Your current role instructions are: ${actorInstructions}`;

        // 5. Initialize OpenAI client.
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // 6. Create a Realtime session with valid parameters.
        const session = await openai.beta.realtime.sessions.create({
            model: 'gpt-4o-realtime-preview',
            instructions: systemPrompt,   // ✅ use "instructions" instead of "system_prompt"
            voice: voice || 'nova',
        });

        // 7. Return the session token.
        return NextResponse.json({ token: session.client_secret.value });
    } catch (error) {
        console.error('Error creating Realtime session:', error);
        return NextResponse.json(
            { error: 'Failed to create Realtime session.' },
            { status: 500 }
        );
    }
}
