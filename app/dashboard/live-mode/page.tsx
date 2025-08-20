// app/dashboard/live-mode/page.tsx
"use client";
import { useEffect, useRef, useState } from "react";

/* ---------- Types ---------- */
type Circuit = "morning" | "afternoon";
type Station = {
  id: string;
  title: string;
  scenario: string;
  tags: string[];
  circuit?: Circuit;
  durationSec?: number;
};
type Schedule = {
  morning: { stations: number; perStationSec: number };
  afternoon: { stations: number; perStationSec: number };
  breakSec: number;
};
type Feedback = {
  scores: {
    communication: number;
    dataGathering: number;
    professionalism: number;
    clinicalReasoning: number;
  };
  overall: number;
  strengths: string[];
  improvements: string[];
  summary: string;
};
type Turn = { role: "user" | "assistant"; content: string };

/* ---------- Utils ---------- */
const READING_SEC = 60;
const DEFAULT_SCHEDULE: Schedule = {
  morning: { stations: 8, perStationSec: 11 * 60 + 10 },
  afternoon: { stations: 8, perStationSec: 8 * 60 + 40 },
  breakSec: 30 * 60,
};
const pad2 = (n: number) => n.toString().padStart(2, "0");
const mmss = (s: number) => `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;

/** Plays audio from a server-side API call */
const playAudio = async (text: string, onStart: () => void, onStop: () => void) => {
  try {
    onStart();
    const response = await fetch('/api/live-mode/generate-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch audio from server');
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    audio.play();

    audio.onended = () => {
      onStop();
      URL.revokeObjectURL(audioUrl);
    };

    audio.onerror = () => {
      onStop();
      console.error("Audio playback failed.");
    };

  } catch (error) {
    onStop();
    console.error("Error playing speech:", error);
  }
};

/* ---------- Page ---------- */
export default function LiveModePage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [schedule, setSchedule] = useState<Schedule>(DEFAULT_SCHEDULE);
  const [mode, setMode] = useState<"idle" | "station" | "break" | "finished">("idle");
  const [phase, setPhase] = useState<"reading" | "roleplay">("reading");
  const [current, setCurrent] = useState(0);
  const [readingLeft, setReadingLeft] = useState(READING_SEC);
  const [roleplayLeft, setRoleplayLeft] = useState(0);
  const [breakLeft, setBreakLeft] = useState(DEFAULT_SCHEDULE.breakSec);
  const [overlay, setOverlay] = useState<null | { kind: "next"; n: number }>(null);
  const [convos, setConvos] = useState<Record<number, Turn[]>>({});
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [patientSpeaking, setPatientSpeaking] = useState(false);
  const [micReady, setMicReady] = useState<null | boolean>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastPatientLine, setLastPatientLine] = useState<string>("");
  const [doctorSpeech, setDoctorSpeech] = useState<string>("");

  /* ---------- Start exam ---------- */
  const startExam = async () => {
    setBusy(true);
    setLastError(null);
    try {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicReady(true);
      } catch (e: any) {
        setMicReady(false);
        setLastError("Microphone permission blocked. Please allow mic access.");
      }
      const r = await fetch("/api/live-mode/generate", { method: "POST" });
      const data = await r.json();
      let genStations: Station[] = data?.stations ?? [];
      if (!genStations.length) throw new Error("No stations returned from /api/live-mode/generate");
      const sched: Schedule = data?.schedule ?? DEFAULT_SCHEDULE;
      setSchedule(sched);
      genStations = genStations.map((s: Station, i: number) => {
        const inMorning = i < sched.morning.stations;
        const perSec = inMorning ? sched.morning.perStationSec : sched.afternoon.perStationSec;
        return {
          ...s,
          circuit: s.circuit ?? (inMorning ? "morning" : "afternoon"),
          durationSec: s.durationSec ?? perSec,
        };
      });
      setStations(genStations);
      setCurrent(0);
      setPhase("reading");
      setReadingLeft(READING_SEC);
      setRoleplayLeft(Math.max((genStations[0].durationSec ?? 0) - READING_SEC, 60));
      setBreakLeft(sched.breakSec);
      setConvos({ 0: [] });
      setMode("station");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      console.error(e);
      setLastError(e?.message || String(e));
      alert("Could not start the exam. Check that /api/live-mode/reply works and OPENAI_API_KEY is set.");
    } finally {
      setBusy(false);
    }
  };

  /* ---------- Timers ---------- */
  useEffect(() => {
    if (mode !== "station" || phase !== "reading") return;
    const t = setInterval(() => {
      setReadingLeft((p) => {
        if (p <= 1) {
          clearInterval(t);
          beginRoleplay();
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [mode, phase, current, stations]);

  useEffect(() => {
    if (mode !== "station" || phase !== "roleplay") return;
    const t = setInterval(() => {
      setRoleplayLeft((p) => {
        if (p <= 1) {
          clearInterval(t);
          stopAudioRecorder();
          setPatientSpeaking(false);
          handleAutoAdvance();
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [mode, phase]);

  useEffect(() => {
    if (mode !== "break") return;
    const t = setInterval(() => {
      setBreakLeft((p) => {
        if (p <= 1) {
          clearInterval(t);
          goToStation(schedule.morning.stations);
          setMode("station");
          setPhase("reading");
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [mode, schedule]);

  /* ---------- Role-play ---------- */
  const beginRoleplay = async () => {
    setPhase("roleplay");
    startAudioRecorder();
    try {
      const opening = await fetchPatientReply(stations[current], []);
      const line = (opening || "").trim() || "Hello doctor. How can I help?";
      setLastPatientLine(line);
      setConvos((m) => ({ ...m, [current]: [{ role: "assistant", content: line }] }));
      await playAudio(
        line,
        () => setPatientSpeaking(true),
        () => setPatientSpeaking(false)
      );
    } catch (e: any) {
      console.error("Opening reply error:", e);
      setLastError(e?.message || String(e));
      const fallback = "Hello doctor. I’m here.";
      setLastPatientLine(fallback);
      await playAudio(
        fallback,
        () => setPatientSpeaking(true),
        () => setPatientSpeaking(false)
      );
    }
  };

  const fetchPatientReply = async (st: Station, history: Turn[], audioBlob?: Blob) => {
    const formData = new FormData();
    formData.append("scenario", `Title: ${st.title}\n${st.scenario}`);
    formData.append("history", JSON.stringify(history));
    if (audioBlob) {
      formData.append("audio", audioBlob, "audio.webm");
    }
    const res = await fetch("/api/live-mode/reply", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn("reply API non-200:", text);
      throw new Error("reply API failed");
    }
    const data = await res.json();
    if (data.doctorText) {
      setDoctorSpeech(data.doctorText);
    }
    return (data.reply as string) || "…";
  };

  /* ---------- Audio Recorder (Replaces Recognizer) ---------- */
  const startAudioRecorder = async () => {
    if (mediaRecorderRef.current) return;
    setLastError(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          commitDoctorTurn(audioBlob);
        }
        audioChunksRef.current = [];
        if (mode === "station" && phase === "roleplay") {
          mediaRecorderRef.current?.start();
        }
      };
      mediaRecorder.start();
      const audioContext = new window.AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkSilence = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
        if (average > 1) {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
          silenceTimerRef.current = setTimeout(() => {
            if (mediaRecorderRef.current?.state === "recording") {
              mediaRecorderRef.current.stop();
            }
          }, 1200);
        }
        if (mediaRecorderRef.current?.state === "recording") {
          requestAnimationFrame(checkSilence);
        }
      };
      checkSilence();
    } catch (e) {
      setLastError("Mic start failed. Check browser permission.");
      console.error("Mic error:", e);
    }
  };

  const stopAudioRecorder = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
  };

  const commitDoctorTurn = async (audioBlob: Blob) => {
    if (mode !== "station" || phase !== "roleplay") return;
    
    const prev = convos[current] ?? [];
    
    try {
      const reply = await fetchPatientReply(stations[current], prev, audioBlob);
      const line = (reply || "").trim() || "Okay, I understand.";
      setLastPatientLine(line);

      const history = prev.concat([
        { role: "user", content: doctorSpeech },
        { role: "assistant", content: line }
      ]);
      setConvos((m) => ({ ...m, [current]: history }));
      await playAudio(
        line,
        () => setPatientSpeaking(true),
        () => setPatientSpeaking(false)
      );
    } catch (e: any) {
      setLastError("Reply failed; continuing.");
      const fallback = "Alright. Could you tell me more about that?";
      setLastPatientLine(fallback);
      await playAudio(
        fallback,
        () => setPatientSpeaking(true),
        () => setPatientSpeaking(false)
      );
    }
  };

  /* ---------- Navigation ---------- */
  const goToStation = (i: number) => {
    const st = stations[i];
    if (!st) return;
    stopAudioRecorder();
    setPatientSpeaking(false);
    setCurrent(i);
    setPhase("reading");
    setReadingLeft(READING_SEC);
    const rp = Math.max((st.durationSec ?? 0) - READING_SEC, 60);
    setRoleplayLeft(rp);
    setConvos((m) => (m[i] ? m : { ...m, [i]: [] }));
  };
  const handleAutoAdvance = () => {
    if (current === schedule.morning.stations - 1) {
      countdownThen(() => setMode("break"));
    } else if (current < stations.length - 1) {
      countdownThen(() => goToStation(current + 1));
    } else {
      countdownThen(() => setMode("finished"));
    }
  };
  const countdownThen = (done: () => void) => {
    setOverlay({ kind: "next", n: 3 });
    const i = setInterval(() => {
      setOverlay((prev) => {
        if (!prev) return null;
        if (prev.n <= 1) {
          clearInterval(i);
          done();
          return null;
        }
        return { ...prev, n: prev.n - 1 };
      });
    }, 1000);
  };

  /* ---------- Scoring ---------- */
  useEffect(() => {
    const scoreAll = async () => {
      setBusy(true);
      try {
        const tasks = stations.map(async (st, i) => {
          const turns = convos[i] ?? [];
          const convoText = turns
            .map((t) => `${t.role === "user" ? "DOCTOR" : "PATIENT"}: ${t.content}`)
            .join("\n");
          if (!convoText.trim()) return null;
          const r = await fetch("/api/test-mode/evaluate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scenarioId: st.id, answer: convoText }),
          });
          const j = await r.json();
          return { id: st.id, fb: j.feedback as Feedback };
        });
        const res = await Promise.all(tasks);
        const map: Record<string, Feedback> = {};
        for (const x of res) if (x) map[x.id] = x.fb;
        setFeedback(map);
      } finally {
        setBusy(false);
      }
    };
    if (mode === "finished") scoreAll();
  }, [mode, stations, convos]);

  /* ---------- Render ---------- */
  if (mode === "idle") {
    return (
      <main className="min-h-screen bg-gray-950 text-gray-100 p-6">
        <div className="max-w-4xl mx-auto bg-gray-900 rounded-2xl p-6 shadow-lg">
          <h1 className="text-3xl font-bold mb-2">CAS Exam — Live Mode</h1>
          <p className="text-gray-300">Morning: 8 × 11:10 • Break: 30:00 • Afternoon: 8 × 8:40</p>
          <button
            onClick={startExam}
            disabled={busy}
            className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
          >
            {busy ? "Preparing exam…" : "▶ Start Exam"}
          </button>
          <div className="mt-4 space-y-1 text-sm">
            {micReady === false && (
              <p className="text-red-300">Mic permission blocked. Allow microphone in your browser.</p>
            )}
            {lastError && <p className="text-red-300">Error: {lastError}</p>}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            (After you click Start, audio & mic permissions allow the exam to flow automatically.)
          </p>
        </div>
      </main>
    );
  }
  if (mode === "break") {
    return (
      <main className="min-h-screen bg-gray-950 text-gray-100 p-6">
        <div className="max-w-2xl mx-auto bg-gray-900 rounded-2xl p-6 shadow-lg text-center">
          <h1 className="text-3xl font-bold mb-2">Break — 30 minutes</h1>
          <p className="text-2xl font-mono mb-6">{mmss(breakLeft)}</p>
          <p className="text-gray-300">You’ll automatically continue with the afternoon circuit.</p>
        </div>
      </main>
    );
  }
  if (mode === "finished") {
    return (
      <main className="min-h-screen bg-gray-950 text-gray-100 p-6">
        <div className="max-w-4xl mx-auto bg-gray-900 rounded-2xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">📊 Exam Results</h2>
          {busy && <p className="text-gray-300">Scoring stations…</p>}
          {stations.map((st) => {
            const fb = feedback[st.id];
            if (!fb) return null;
            return (
              <div key={st.id} className="mb-4 p-4 bg-gray-800 rounded-lg">
                <h3 className="font-semibold">{st.title}</h3>
                <p>Overall: <strong>{fb.overall}%</strong></p>
                <div className="grid md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <h4 className="font-semibold">✔ Strengths</h4>
                    <ul className="list-disc list-inside text-gray-300">
                      {fb.strengths.map((x, i) => <li key={i}>{x}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold">➤ Improvements</h4>
                    <ul className="list-disc list-inside text-gray-300">
                      {fb.improvements.map((x, i) => <li key={i}>{x}</li>)}
                    </ul>
                  </div>
                </div>
                <p className="mt-2 text-gray-300">{fb.summary}</p>
              </div>
            );
          })}
          <button
            onClick={() => location.assign("/dashboard")}
            className="mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }
  const st = stations[current];
  const inMorning = current < schedule.morning.stations;
  const circuitLabel = inMorning
    ? `Morning • ${current + 1}/${schedule.morning.stations}`
    : `Afternoon • ${current - schedule.morning.stations + 1}/${schedule.afternoon.stations}`;
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-6">
      {phase === "roleplay" && (
        <div className="fixed top-0 left-0 right-0 z-30 text-center py-2">
          <span
            className={`px-3 py-1 rounded text-sm font-medium ${
              patientSpeaking ? "bg-emerald-500 text-black" : "bg-amber-500 text-black"
            }`}
          >
            {patientSpeaking ? "Patient speaking…" : "Conversation is ongoing…"}
          </span>
        </div>
      )}
      {overlay && overlay.kind === "next" && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl font-bold">{overlay.n}</div>
            <div className="mt-2 text-xl text-white/80">Next station starting…</div>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto bg-gray-900 rounded-2xl p-6 shadow-lg">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{circuitLabel}</h1>
          {phase === "reading" ? (
            <span className="text-2xl font-mono text-yellow-400">🕮 {mmss(readingLeft)}</span>
          ) : (
            <span className="text-2xl font-mono text-yellow-400">⏳ {mmss(roleplayLeft)}</span>
          )}
        </div>
        <div className="p-5 bg-gray-800 rounded-lg mb-4">
          <h2 className="text-xl font-semibold">{st.title}</h2>
          <p className="mt-2 text-gray-300 whitespace-pre-line">{st.scenario}</p>
          <div className="mt-2 flex gap-2 flex-wrap">
            {(st.tags || []).map((t, i) => (
              <span key={i} className="px-2 py-1 text-xs bg-gray-700 rounded-full">{t}</span>
            ))}
          </div>
          {phase === "reading" && (
            <p className="mt-3 text-sm text-gray-400">
              Reading time. Role-play will start automatically.
            </p>
          )}
          {phase === "roleplay" && (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-gray-400">
                Role-play is live. Speak naturally; the patient will respond.
              </p>
              {lastPatientLine && (
                <p className="text-xs text-gray-500">
                  Last patient reply: <em>{lastPatientLine}</em>
                </p>
              )}
              {doctorSpeech && (
                <p className="text-xs text-green-300">
                  Last transcribed speech: <em>{doctorSpeech}</em>
                </p>
              )}
              {lastError && (
                <p className="text-xs text-red-300">Error: {lastError}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}