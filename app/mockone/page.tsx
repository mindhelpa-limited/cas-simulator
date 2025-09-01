// app/mockone/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";

interface Station {
  title: string;
  readingTime: number;   // e.g., 240
  stationTime: number;   // e.g., 420
  candidateInstructions: string;
  actorInstructions: string;           // passed to API only (not shown)
  feedbackDomains: Record<string, string>;
  voice?: string;
}

type ExamPhase = "intro" | "reading" | "station" | "break" | "scoring" | "finished" | "error";

const Bell = () => (
  <audio
    ref={(el) => {
      if (el) el.play().catch(() => {});
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
  const [timer, setTimer] = useState(0); // seconds remaining in current phase
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

  // ---- Guard to prevent double transitions (Strict Mode, race conditions) ----
  const transitionLock = useRef(false);

  // ---- Load stations ----
  useEffect(() => {
    fetch("/data/stationsmockone.json")
      .then((res) => res.json())
      .then((data: Station[]) => {
        setStations(data);
        setTranscripts(data.map((_, i) => ({ stationIndex: i, log: [] })));
      })
      .catch(() => setPhase("error"));
  }, []);

  // ---- Single interval driving the countdown + transitions ----
  useEffect(() => {
    if (phase === "intro" || phase === "error" || phase === "scoring" || phase === "finished")
      return;

    const id = setInterval(() => {
      setTimer((prev) => {
        const next = prev - 1;

        // ring at 1:00 remaining during station
        if (phase === "station" && next === 60) {
          setShowBell(true);
          setTimeout(() => setShowBell(false), 2000);
        }

        if (next <= 0) {
          // handle phase end guarded
          if (!transitionLock.current) {
            transitionLock.current = true;
            setTimeout(() => {
              handlePhaseEnd(); // call outside setState synchronously to avoid re-entry
            }, 0);
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [phase, current, stations]);

  // ---- Transition handlers (state machine) ----
  const startPhase = (nextPhase: ExamPhase, nextIndex: number | null = null) => {
    if (nextIndex !== null) setCurrent(nextIndex);
    setPhase(nextPhase);

    if (nextPhase === "reading") {
      const idx = nextIndex ?? current;
      setTimer(stations[idx]?.readingTime ?? 240);
    } else if (nextPhase === "station") {
      const idx = nextIndex ?? current;
      setTimer(stations[idx]?.stationTime ?? 420);
    } else if (nextPhase === "break") {
      setTimer(30 * 60);
    }

    // release lock on next tick to avoid same-tick re-entry
    setTimeout(() => {
      transitionLock.current = false;
    }, 0);
  };

  const handlePhaseEnd = () => {
    if (phase === "reading") {
      // Reading -> Station (same station)
      startPhase("station", current);
      return;
    }

    if (phase === "station") {
      // After Station 8 (index 7) -> break; else next station reading; after 16 -> scoring
      if (current === 7) {
        // set up break, then continue with station 9 (index 8) after break
        startPhase("break", 8);
        return;
      }
      if (current < stations.length - 1) {
        startPhase("reading", current + 1);
        return;
      }
      // last station finished
      setPhase("scoring");
      setTimeout(() => {
        transitionLock.current = false;
      }, 0);
      handleScoring();
      return;
    }

    if (phase === "break") {
      // Break -> Reading (current already set to 8 above)
      startPhase("reading", current);
      return;
    }
  };

  // ---- Public actions ----
  const startExam = (name: string) => {
    if (!name.trim() || stations.length === 0) return;
    setCandidate(name.trim());
    startPhase("reading", 0); // Station 1 reading
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

    mediaRecorderRef.current.ondataavailable = (e) => {
      audioChunksRef.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = async () => {
      setIsProcessing(true);
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

      const form = new FormData();
      form.append("audio", audioBlob, "candidate_audio.webm");
      form.append("actorInstructions", stations[current].actorInstructions);
      form.append("voice", stations[current].voice || "alloy");
      form.append(
        "conversationHistory",
        JSON.stringify(transcripts.find((t) => t.stationIndex === current)?.log || [])
      );

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
    try {
      const resp = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateName: candidate, stations, transcripts }),
      });
      if (!resp.ok) throw new Error("Failed to generate report");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CASC_Report_${candidate.replace(/\s/g, "_")}.pdf`;
      a.click();
      setPhase("finished");
    } catch (e) {
      setPhase("error");
    }
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const st = stations[current];

  return (
    <main className="min-h-screen bg-white text-black flex flex-col items-center justify-between">
      <div className="flex-grow w-full max-w-3xl mx-auto p-6">
        {phase === "intro" && (
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Psychiatry CASC Exam Simulation</h1>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                startExam((e.target as any).name.value);
              }}
            >
              <input
                name="name"
                placeholder="Enter your full name"
                className="px-4 py-2 text-lg w-full max-w-md border rounded mb-4"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold"
              >
                Start Exam
              </button>
            </form>
          </div>
        )}

        {phase === "reading" && st && (
          <div>
            <div className="bg-gray-100 border p-4 rounded">
              <h3 className="font-semibold mb-2">Candidate Instructions</h3>
              <p className="whitespace-pre-wrap">{st.candidateInstructions}</p>
            </div>
          </div>
        )}

        {phase === "station" && st && (
          <div className="flex flex-col items-center gap-6">
            {/* Mic button */}
            <div className="flex flex-col items-center justify-center w-full">
              <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={isProcessing}
                className={`mt-6 w-32 h-32 rounded-full flex items-center justify-center font-bold text-white ${
                  isRecording ? "bg-red-600 animate-pulse" : "bg-green-600"
                } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isProcessing ? "Processing..." : isRecording ? "Stop" : "Speak"}
              </button>
              <p className="mt-2 text-sm text-gray-500">
                Press and speak — the AI actor will reply.
              </p>
            </div>

            {/* Conversation (candidate sees only dialogue, no actor script) */}
            <div className="w-full max-h-64 overflow-y-auto bg-gray-50 border rounded p-3 text-sm">
              <h4 className="font-semibold mb-2 text-gray-700">Conversation</h4>
              {(transcripts.find((t) => t.stationIndex === current)?.log || []).map(
                (entry, i) => (
                  <p
                    key={i}
                    className={entry.role === "user" ? "text-black" : "text-blue-700"}
                  >
                    <strong>{entry.role === "user" ? "You" : "Actor"}:</strong>{" "}
                    {entry.content}
                  </p>
                )
              )}
            </div>
          </div>
        )}

        {phase === "break" && (
          <div className="text-center">
            <h1 className="text-3xl mb-4 font-bold">Break Time</h1>
            <p>{formatTime(timer)}</p>
          </div>
        )}

        {phase === "scoring" && <p className="text-center">Generating Report...</p>}
        {phase === "finished" && <p className="text-center">Report Downloaded ✅</p>}
        {phase === "error" && (
          <p className="text-center text-red-600">Error occurred — please retry.</p>
        )}
      </div>

      {/* Sticky footer for station title + live time */}
      {st && (phase === "reading" || phase === "station") && (
        <footer className="sticky bottom-0 w-full bg-gray-200 border-t py-3 text-center">
          <h2 className="text-lg font-semibold">{st.title}</h2>
          <p className="text-sm">
            {phase === "reading" ? "Reading Time" : "Station Time"}: {formatTime(timer)}
          </p>
        </footer>
      )}

      {showBell && <Bell />}
      <audio ref={audioPlayerRef} hidden />
    </main>
  );
}
