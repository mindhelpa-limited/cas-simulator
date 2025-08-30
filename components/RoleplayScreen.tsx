"use client";

import { useEffect, useRef } from "react";

type RoleplayProps = {
  station: {
    id: string;
    question: string;
    candidateInstructions: string;
    rolePlayerInstructions: string;
    scriptOutline: string[];
    openingLine?: string;
    voice: "alloy" | "sage" | "verse";
  };
  onFinish: () => void;
  timeRemaining?: number;
};

export default function RoleplayScreen({
  station,
  onFinish,
  timeRemaining,
}: RoleplayProps) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const startRealtime = async () => {
      try {
        // 1. Create peer connection
        const pc = new RTCPeerConnection();
        pcRef.current = pc;

        // 2. Get mic input
        const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
        mic.getTracks().forEach((track) => pc.addTrack(track, mic));

        // 3. Remote audio playback (AI)
        const audioEl = new Audio();
        audioEl.autoplay = true;
        pc.ontrack = (event) => {
          audioEl.srcObject = event.streams[0];
        };
        audioRef.current = audioEl;

        // 4. Create SDP offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // 5. Send offer → backend → OpenAI Realtime
        const response = await fetch("/api/casc", {
          method: "POST",
          headers: { "Content-Type": "application/sdp" },
          body: offer.sdp,
        });

        if (!response.ok) throw new Error(`Realtime failed: ${response.status}`);

        const answerSdp = await response.text();
        await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

        // 6. Send strict roleplay script instructions
        const dc = pc.createDataChannel("oai-events");
        dc.onopen = () => {
          dc.send(
            JSON.stringify({
              type: "response.create",
              response: {
                modalities: ["audio"],
                instructions: `
                  You are Henrietta Lacks, a bright UK medical student in a liaison psychiatry team. 
                  The doctor is presenting a case of a depressed patient following a myocardial infarction. 
                  STRICTLY follow these Actor Instructions in sequence, do not improvise outside them:

                  1. Begin by saying: "Doctor, can you summarise the case?"
                  2. Then ask if there is any additional information they would like to know. 
                     If they hesitate, prompt: "Would it help to ask collateral from someone else?"
                  3. Ask what they think the most likely diagnosis is, and any other possibilities. Keep this short.
                  4. Ask for their treatment plan. If they don’t cover biological, psychological, and social factors, 
                     gently encourage them to. Also ensure they cover both short- and long-term management.
                  5. Encourage specifics: If they mention medication, ask which one and why. 
                     If therapy, ask which type (CBT, IPT, etc.).
                  6. If the doctor asks about unrelated topics (like football, weather, etc.), politely redirect: 
                     "I don’t really think about that right now, let’s focus on the patient."

                  Rules:
                  - Stay completely in character as Henrietta Lacks.
                  - Speak only in English, in a natural, conversational UK tone.
                  - Never break character or explain what you are doing.
                `,
                audio: { voice: station.voice, format: "wav" },
              },
            })
          );
        };
      } catch (err) {
        console.error("Realtime error:", err);
      }
    };

    startRealtime();

    return () => {
      pcRef.current?.close();
      pcRef.current = null;
    };
  }, [station]);

  // Auto finish when timer hits 0
  useEffect(() => {
    if (timeRemaining !== undefined && timeRemaining <= 0) {
      pcRef.current?.close();
      onFinish();
    }
  }, [timeRemaining, onFinish]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <h2 className="text-xl font-bold mb-4">Roleplay in Progress</h2>
      <div className="relative w-64 h-64">
        {/* Wavy circle animation */}
        <div className="absolute inset-0 rounded-full border-4 border-blue-300 animate-ping"></div>
        <div className="absolute inset-4 rounded-full border-4 border-purple-400 animate-spin-slow"></div>
        <div className="absolute inset-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-lg font-semibold">
          Talking…
        </div>
      </div>
      {timeRemaining !== undefined && (
        <p className="mt-6 text-lg font-medium text-gray-700">
          Time left: {Math.floor(timeRemaining / 60)}:
          {(timeRemaining % 60).toString().padStart(2, "0")}
        </p>
      )}
    </div>
  );
}
