// app/mockone/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";

interface Station {
  title: string;
  readingTime: number;
  stationTime: number;
  candidateInstructions: string;
  actorInstructions: string;
  feedbackDomains: Record<string, string>;
  voice?: string;
}
type ExamPhase = "intro" | "reading" | "station" | "break" | "scoring" | "finished" | "error";

const Bell = () => (
  <audio
    ref={(el) => {
      if (el) {
        el.play().catch(() => {});
      }
    }}
    hidden
  >
    <source src="/bell.mp3" type="audio/mpeg" />
  </audio>
);

export default function MockOnePage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState<ExamPhase>("intro");
  const [timer, setTimer] = useState(0);
  const [candidate, setCandidate] = useState("");
  const [showBell, setShowBell] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const [transcripts, setTranscripts] = useState<
    { stationIndex: number; log: { role: string; content: string }[] }[]
  >([]);

  // --- Load stations ---
  useEffect(() => {
    fetch("/data/stationsmockone.json")
      .then((res) => res.json())
      .then((data) => {
        setStations(data);
        setTranscripts(data.map((_: any, i: number) => ({ stationIndex: i, log: [] })));
      })
      .catch(() => setPhase("error"));
  }, []);

  // --- Timer logic ---
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((t) => t - 1);
        if (phase === "station" && timer === 61) {
          setShowBell(true);
          setTimeout(() => setShowBell(false), 2000);
        }
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0 && phase !== "intro") {
      if (phase === "reading") setPhase("station");
      else if (phase === "station") advanceStation();
      else if (phase === "break") setPhase("reading");
    }
  }, [timer, phase]);

  // --- Reset timer when phase changes ---
  useEffect(() => {
    if (phase === "reading" && stations[current]) {
      setTimer(stations[current].readingTime); // always 4 min from JSON
    } else if (phase === "station" && stations[current]) {
      setTimer(stations[current].stationTime); // always 7 min from JSON
    } else if (phase === "break") {
      setTimer(30 * 60); // 30 min
    }
  }, [phase, current, stations]);

  const advanceStation = () => {
    if (current === 7) {
      setPhase("break");
      setCurrent(8);
    } else if (current < stations.length - 1) {
      setCurrent((c) => c + 1);
      setPhase("reading");
    } else {
      setPhase("scoring");
      handleScoring();
    }
  };

  const startExam = (name: string) => {
    if (name.trim() && stations.length > 0) {
      setCandidate(name);
      setCurrent(0);
      setPhase("reading");
      setTimer(stations[0].readingTime); // ✅ ensure we start with Reading
    }
  };

  const updateTranscript = (role: "user" | "assistant", content: string) => {
    setTranscripts((prev) => {
      const copy = [...prev];
      copy[current].log.push({ role, content });
      return copy;
    });
  };

  const handleStartRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];
    mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
    mediaRecorderRef.current.onstop = async () => {
      setIsProcessing(true);
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const form = new FormData();
      form.append("audio", audioBlob, "candidate_audio.webm");
      form.append("actorInstructions", stations[current].actorInstructions);
      form.append("voice", stations[current].voice || "alloy");
      form.append("conversationHistory", JSON.stringify(transcripts.find(t => t.stationIndex === current)?.log || []));

      try {
        const resp = await fetch("/api/mockone", { method: "POST", body: form });
        if (!resp.ok) throw new Error("API fail");
        const userTranscript = decodeURIComponent(resp.headers.get("X-User-Transcript") || "");
        const actorResponse = decodeURIComponent(resp.headers.get("X-Actor-Response") || "");
        updateTranscript("user", userTranscript);
        updateTranscript("assistant", actorResponse);

        const audioBlobResp = await resp.blob();
        const audioUrl = URL.createObjectURL(audioBlobResp);
        if (audioPlayerRef.current) {
          audioPlayerRef.current.src = audioUrl;
          audioPlayerRef.current.play();
        }
      } finally {
        setIsProcessing(false);
      }
    };
    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleScoring = async () => {
    const resp = await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateName: candidate, stations, transcripts })
    });
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CASC_Report_${candidate.replace(/\s/g, "_")}.pdf`;
    a.click();
    setPhase("finished");
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const st = stations[current];

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl mx-auto">
        {phase === "intro" && (
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Psychiatry CASC Exam Simulation</h1>
            <form onSubmit={(e) => { e.preventDefault(); startExam((e.target as any).name.value); }}>
              <input
                name="name"
                placeholder="Enter your full name"
                className="px-4 py-2 text-lg w-full max-w-md bg-gray-700 border border-gray-600 rounded mb-4"
              />
              <button type="submit" className="px-6 py-3 bg-blue-600 rounded-lg font-bold">
                Start Exam
              </button>
            </form>
          </div>
        )}

        {phase === "reading" && st && (
          <div>
            <h2 className="text-2xl font-bold mb-2">{st.title}</h2>
            <p className="text-sm mb-4">Reading Time: {formatTime(timer)}</p>
            <div className="bg-gray-800 p-4 rounded">
              <h3 className="text-lg font-semibold mb-2">Candidate Instructions</h3>
              <p className="whitespace-pre-wrap">{st.candidateInstructions}</p>
            </div>
          </div>
        )}

        {phase === "station" && st && (
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold">{st.title}</h2>
            <p className="mb-4">Station Time: {formatTime(timer)}</p>
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={`mt-6 w-32 h-32 rounded-full flex items-center justify-center font-bold ${
                isRecording ? "bg-red-600 animate-pulse" : "bg-green-600"
              }`}
            >
              {isRecording ? "Stop" : "Speak"}
            </button>
          </div>
        )}

        {phase === "break" && (
          <div className="text-center">
            <h1 className="text-3xl mb-4">Break Time</h1>
            <p>{formatTime(timer)}</p>
          </div>
        )}

        {phase === "scoring" && <p className="text-center">Generating Report...</p>}
        {phase === "finished" && <p className="text-center">Report Downloaded ✅</p>}
        {phase === "error" && <p className="text-center text-red-500">Error occurred</p>}
      </div>

      {showBell && <Bell />}
      <audio ref={audioPlayerRef} hidden />
    </main>
  );
}
