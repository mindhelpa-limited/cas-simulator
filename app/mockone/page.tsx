"use client";

import React, { useState, useRef, useCallback } from "react";
import stationsData from "./stations.json";

// Types
interface Station {
  title: string;
  candidateInstructions: string;
  actorInstructions: string;
  voice?: string;
}
interface TranscriptItem {
  speaker: "candidate" | "actor";
  text: string;
}

export default function MockOnePage() {
  const [examState, setExamState] = useState<
    "not-started" | "reading" | "station" | "break" | "completed"
  >("not-started");
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);

  // WebRTC refs
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentStation: Station = stationsData[currentStationIndex];

  // ✅ Setup realtime session
  const setupRealtimeSession = useCallback(async () => {
    if (!currentStation) return;

    try {
      // 1) Ask backend for session token
      const response = await fetch("/api/mockone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorInstructions: currentStation.actorInstructions,
          voice: currentStation.voice || "alloy",
        }),
      });

      if (!response.ok) throw new Error("Failed to get session token.");
      const { token } = await response.json();

      // 2) Setup RTCPeerConnection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Attach mic
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      mic.getTracks().forEach((track) => pc.addTrack(track, mic));

      // Setup audio output
      const audioEl = new Audio();
      audioEl.autoplay = true;
      audioRef.current = audioEl;
      pc.ontrack = (event) => {
        audioEl.srcObject = event.streams[0];
      };

      // Setup data channel for text events
      const dc = pc.createDataChannel("oai-events");
      dataChannelRef.current = dc;

      dc.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "response.text.delta") {
            setTranscript((prev) => [
              ...prev,
              { speaker: "actor", text: msg.delta },
            ]);
          }
          if (msg.type === "input_audio_buffer.transcript") {
            setTranscript((prev) => [
              ...prev,
              { speaker: "candidate", text: msg.transcript },
            ]);
          }
        } catch (err) {
          console.error("Bad realtime message:", err);
        }
      };

      // 3) Create local SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 4) Send offer to OpenAI
      const sdpResponse = await fetch(
        "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp || "",
        }
      );

      // ✅ Correct typing for answer
      const answer: RTCSessionDescriptionInit = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };

      // 5) Apply remote description
      await pc.setRemoteDescription(answer);

      console.log("✅ Realtime session established.");
    } catch (error) {
      console.error("Realtime setup error:", error);
      alert("Could not start the realtime session.");
    }
  }, [currentStation]);

  // ✅ Close realtime session
  const closeRealtimeSession = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.srcObject = null;
      audioRef.current = null;
    }
    console.log("🔒 Realtime session closed.");
  };

  return (
    <main className="p-6">
      {examState === "not-started" && (
        <div className="text-center">
          <h1 className="text-3xl font-bold">CASC Mock Exam</h1>
          <button
            onClick={() => {
              setExamState("station");
              setupRealtimeSession();
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg mt-6"
          >
            Start Station
          </button>
        </div>
      )}

      {examState === "station" && (
        <div className="max-w-xl mx-auto">
          <h2 className="text-xl font-semibold mb-2">
            Station {currentStationIndex + 1}: {currentStation.title}
          </h2>
          <div className="bg-gray-100 p-4 rounded-md h-64 overflow-y-auto">
            {transcript.map((item, i) => (
              <p
                key={i}
                className={
                  item.speaker === "candidate"
                    ? "text-blue-600 text-right"
                    : "text-gray-800 text-left"
                }
              >
                <b>{item.speaker}:</b> {item.text}
              </p>
            ))}
          </div>
          <button
            onClick={() => {
              closeRealtimeSession();
              setExamState("completed");
            }}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg"
          >
            End Station
          </button>
        </div>
      )}

      {examState === "completed" && (
        <div className="text-center">
          <h2 className="text-2xl font-bold">Station Completed!</h2>
        </div>
      )}
    </main>
  );
}
