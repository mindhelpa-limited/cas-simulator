import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Force the API route to be dynamic, preventing caching issues
export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const scenario = formData.get("scenario") as string;
    const historyString = formData.get("history") as string;
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      console.error("No audio file received.");
      return NextResponse.json({
        doctorText: "...",
        reply: "Sorry, I couldn't receive your audio. Please try again.",
      }, { status: 400 });
    }

    const history = JSON.parse(historyString);

    // Transcribe the audio using the Whisper model
    const audioTranscription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });

    const doctorText = audioTranscription.text.trim();
    if (!doctorText) {
      return NextResponse.json({
        doctorText: "...",
        reply: "I couldn't hear what you said. Could you please repeat that?",
      });
    }

    // Prepare the messages for the chat completion
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an AI patient simulator. Your persona and the scenario are as follows: ${scenario}.
          You will respond to a doctor's queries, roleplaying as the patient. Keep your responses short and to the point.
          Avoid asking questions yourself; wait for the doctor's next question.`,
      },
      ...history,
      { role: "user", content: doctorText },
    ];

    // Get the patient's reply using the GPT-4o-mini model
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
    });

    const reply = completion.choices[0].message.content?.trim() || "";

    // Return the doctor's transcribed speech and the patient's reply
    return NextResponse.json({
      doctorText,
      reply,
    });

  } catch (error) {
    // Log the full error to the server console for debugging
    console.error("API route error:", error);
    // Return a generic error to the client to avoid revealing internal details
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}