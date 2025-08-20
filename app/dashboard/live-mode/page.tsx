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

/* Web Speech shims (build-safe) */
type MySpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: (e: any) => void;
  onend: () => void;
};
declare global {
  interface Window {
    SpeechRecognition?: new () => MySpeechRecognition;
    webkitSpeechRecognition?: new () => MySpeechRecognition;
  }
}

/* ---------- Utils ---------- */
const READING_SEC = 60;
const DEFAULT_SCHEDULE: Schedule = {
  morning: { stations: 8, perStationSec: 11 * 60 + 10 },
  afternoon: { stations: 8, perStationSec: 8 * 60 + 40 },
  breakSec: 30 * 60,
};
const pad2 = (n: number) => n.toString().padStart(2, "0");
const mmss = (s: number) => `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;

/** Wait for voices to be ready (Chrome sometimes returns [] initially) */
async function loadVoice(): Promise<SpeechSynthesisVoice | null> {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const synth = window.speechSynthesis;

  // Try event-based first
  let voices = synth.getVoices();
  if (!voices.length) {
    await new Promise<void>((resolve) => {
      const on = () => {
        synth.onvoiceschanged = null;
        resolve();
      };
      synth.onvoiceschanged = on;
      // Safety timeout in case event never fires
      setTimeout(on, 800);
    });
    voices = synth.getVoices();
  }

  return (
    voices.find((v) => /Google UK English/i.test(v.name)) ||
    voices[0] ||
    null
  );
}

/** Speak text in short chunks; marks speaking on/off; safe to call repeatedly */
async function speakInChunks(
  text: string,
  onStart: () => void,
  onStop: () => void,
  shouldStop: () => boolean
) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  const voice = await loadVoice();

  const chunks = text
    .split(/(?<=[\.\!\?])\s+/)
    .map((c) => c.trim())
    .filter(Boolean);

  for (const chunk of chunks) {
    if (shouldStop()) return;
    const u = new SpeechSynthesisUtterance(chunk);
    if (voice) u.voice = voice;
    u.rate = 1;

    await new Promise<void>((resolve) => {
      u.onstart = () => onStart();
      u.onend = () => {
        onStop();
        resolve();
      };
      try {
        // Ensure any prior utterance is cleared
        synth.cancel();
        synth.speak(u);
      } catch {
        onStop();
        resolve();
      }
    });

    if (shouldStop()) {
      synth.cancel();
      onStop();
      return;
    }
  }
}

/* ---------- Page ---------- */
export default function LiveModePage() {
  // Data
  const [stations, setStations] = useState<Station[]>([]);
  const [schedule, setSchedule] = useState<Schedule>(DEFAULT_SCHEDULE);

  // Flow
  const [mode, setMode] = useState<"idle" | "station" | "break" | "finished">("idle");
  const [phase, setPhase] = useState<"reading" | "roleplay">("reading");
  const [current, setCurrent] = useState(0);

  // Timers
  const [readingLeft, setReadingLeft] = useState(READING_SEC);
  const [roleplayLeft, setRoleplayLeft] = useState(0);
  const [breakLeft, setBreakLeft] = useState(DEFAULT_SCHEDULE.breakSec);

  // Overlays
  const [overlay, setOverlay] = useState<null | { kind: "next"; n: number }>(null);

  // Conversation + feedback
  const [convos, setConvos] = useState<Record<number, Turn[]>>({});
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});

  // Mic & speech & indicators
  const recRef = useRef<MySpeechRecognition | null>(null);
  const doctorTurnRef = useRef<string>("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [patientSpeaking, setPatientSpeaking] = useState(false);
  const [micReady, setMicReady] = useState<null | boolean>(null);
  const [ttsReady, setTtsReady] = useState<null | boolean>(null);

  // Debug
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastPatientLine, setLastPatientLine] = useState<string>("");

  /* ---------- Start exam ---------- */
  const startExam = async () => {
    setBusy(true);
    setLastError(null);
    try {
      // 1) Ask mic permission explicitly so STT can hear you
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicReady(true);
      } catch (e: any) {
        setMicReady(false);
        setLastError("Microphone permission blocked. Please allow mic access.");
      }

      // 2) Prime TTS voices (user-gesture happened just now)
      const v = await loadVoice();
      setTtsReady(!!v);

      // 3) Generate stations
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
          stopRecognizer();
          window.speechSynthesis?.cancel();
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
    startRecognizer();

    try {
      const opening = await fetchPatientReply(stations[current], []);
      const line = (opening || "").trim() || "Hello doctor. How can I help?";
      setLastPatientLine(line);
      setConvos((m) => ({ ...m, [current]: [{ role: "assistant", content: line }] }));

      await speakInChunks(
        line,
        () => setPatientSpeaking(true),
        () => setPatientSpeaking(false),
        () => roleplayLeft <= 0 || mode !== "station" || phase !== "roleplay"
      );
    } catch (e: any) {
      console.error("Opening reply error:", e);
      setLastError(e?.message || String(e));
      const fallback = "Hello doctor. I’m here.";
      setLastPatientLine(fallback);
      await speakInChunks(
        fallback,
        () => setPatientSpeaking(true),
        () => setPatientSpeaking(false),
        () => roleplayLeft <= 0 || mode !== "station" || phase !== "roleplay"
      );
    }
  };

  const fetchPatientReply = async (st: Station, history: Turn[], interrupt = false) => {
    const res = await fetch("/api/live-mode/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenario: `Title: ${st.title}\n${st.scenario}`,
        history,
        interrupt,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn("reply API non-200:", text);
      throw new Error("reply API failed");
    }
    const data = await res.json();
    return (data.reply as string) || "…";
  };

  /* ---------- Recognizer ---------- */
  const startRecognizer = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setLastError("Speech recognition not supported. Use Chrome.");
      return;
    }
    const rec: MySpeechRecognition = new SR();
    rec.lang = "en-GB";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e: any) => {
      // If patient is speaking, stop them so the doctor can barge in naturally
      if (window.speechSynthesis?.speaking) {
        window.speechSynthesis.cancel();
        setPatientSpeaking(false);
      }

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const txt = (r[0]?.transcript || "").trim();
        if (!txt) continue;

        if (r.isFinal) {
          if (doctorTurnRef.current) doctorTurnRef.current += " ";
          doctorTurnRef.current += txt;

          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(commitDoctorTurn, 1100);
        }
      }
    };

    rec.onend = () => {
      // Auto-restart while in roleplay
      if (mode === "station" && phase === "roleplay") {
        try {
          rec.start();
        } catch {}
      }
    };

    try {
      rec.start();
      recRef.current = rec;
    } catch (e: any) {
      setLastError("Mic start failed. Check browser permission.");
    }
  };

  const stopRecognizer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    try {
      recRef.current?.stop();
    } catch {}
  };

  const commitDoctorTurn = async () => {
    const text = doctorTurnRef.current.trim();
    doctorTurnRef.current = "";
    if (!text || mode !== "station" || phase !== "roleplay") return;

    const prev = convos[current] ?? [];
    const history = prev.concat({ role: "user", content: text });
    setConvos((m) => ({ ...m, [current]: history }));

    try {
      const reply = await fetchPatientReply(stations[current], history);
      const line = (reply || "").trim() || "Okay, I understand.";
      setLastPatientLine(line);
      setConvos((m) => ({ ...m, [current]: history.concat({ role: "assistant", content: line }) }));

      await speakInChunks(
        line,
        () => setPatientSpeaking(true),
        () => setPatientSpeaking(false),
        () => roleplayLeft <= 0 || mode !== "station" || phase !== "roleplay"
      );
    } catch (e: any) {
      setLastError("Reply failed; continuing.");
      const fallback = "Alright. Could you tell me more about that?";
      setLastPatientLine(fallback);
      await speakInChunks(
        fallback,
        () => setPatientSpeaking(true),
        () => setPatientSpeaking(false),
        () => roleplayLeft <= 0 || mode !== "station" || phase !== "roleplay"
      );
    }
  };

  /* ---------- Navigation ---------- */
  const goToStation = (i: number) => {
    const st = stations[i];
    if (!st) return;
    stopRecognizer();
    window.speechSynthesis?.cancel();
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
            {ttsReady === false && <p className="text-yellow-300">No TTS voice available yet; will retry.</p>}
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
              {/* Tiny debug line so you can confirm replies without DevTools */}
              {lastPatientLine && (
                <p className="text-xs text-gray-500">
                  Last patient reply: <em>{lastPatientLine}</em>
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
