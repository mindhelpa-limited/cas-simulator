"use client";

import { useEffect, useState, useRef } from "react";

interface Station {
  id: string;
  title: string;
  scenario: string;
  tags: string[];
}

interface Feedback {
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
}

export default function LiveModePage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});
  const [loading, setLoading] = useState(false);

  // Timer (2 hours = 7200s)
  const [timeLeft, setTimeLeft] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  // Voice recording
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [recording, setRecording] = useState(false);

  /** Start exam */
  const startExam = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/live-mode/generate", { method: "POST" });
      const data = await res.json();
      setStations(data.stations);
      setAnswers(new Array(data.stations.length).fill(""));
      setCurrent(0);
      setFeedback({});
      setTimeLeft(2 * 60 * 60); // 2 hours
      setStarted(true);
      setFinished(false);
      speakScenario(data.stations[0].scenario); // read first station aloud
    } catch (e) {
      alert("Could not generate stations. Check API.");
    } finally {
      setLoading(false);
    }
  };

  /** Countdown */
  useEffect(() => {
    if (!started || finished) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          setFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [started, finished]);

  /** Format hh:mm:ss */
  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  /** Speak scenario aloud */
  const speakScenario = (text: string) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const utter = new SpeechSynthesisUtterance(text);
    const voice =
      synth.getVoices().find((v) => v.name.includes("Google UK English")) ||
      synth.getVoices()[0];
    if (voice) utter.voice = voice;
    utter.rate = 1;
    synth.cancel(); // stop anything playing
    synth.speak(utter);
  };

  /** Start/stop recording answer */
  const toggleRecording = () => {
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }
    const recog: SpeechRecognition = new SpeechRecognition();
    recog.lang = "en-GB";
    recog.continuous = true;
    recog.interimResults = true;
    recog.onresult = (e) => {
      let transcript = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      const copy = [...answers];
      copy[current] = transcript;
      setAnswers(copy);
    };
    recog.onend = () => setRecording(false);
    recog.start();
    recognitionRef.current = recog;
    setRecording(true);
  };

  /** Evaluate one answer */
  const evaluate = async (index: number) => {
    if (!answers[index].trim()) return alert("Answer is empty!");
    setLoading(true);
    try {
      const res = await fetch("/api/test-mode/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: stations[index].id,
          answer: answers[index],
        }),
      });
      const data = await res.json();
      setFeedback((prev) => ({
        ...prev,
        [stations[index].id]: data.feedback,
      }));
    } catch (e) {
      alert("Evaluation failed.");
    } finally {
      setLoading(false);
    }
  };

  /** Exam finished manually */
  const finishExam = () => {
    setFinished(true);
  };

  /** Reset for retake */
  const retake = () => {
    setStations([]);
    setAnswers([]);
    setFeedback({});
    setStarted(false);
    setFinished(false);
    setCurrent(0);
    setTimeLeft(0);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-gray-900 rounded-2xl p-6 shadow-lg">
        <h1 className="text-3xl font-bold mb-4">CAS Exam — Live Mode</h1>

        {!started && !finished && (
          <button
            onClick={startExam}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
          >
            {loading ? "Preparing exam…" : "▶ Start 2-Hour Exam"}
          </button>
        )}

        {started && !finished && stations.length > 0 && (
          <>
            {/* Timer */}
            <div className="mb-4 flex justify-between items-center">
              <span className="text-lg">
                Station {current + 1} of {stations.length}
              </span>
              <span className="text-2xl font-mono text-yellow-400">
                ⏳ {fmt(timeLeft)}
              </span>
            </div>

            {/* Station */}
            <div className="p-5 bg-gray-800 rounded-lg mb-4">
              <h2 className="text-xl font-semibold">{stations[current].title}</h2>
              <p className="mt-2 text-gray-300">{stations[current].scenario}</p>
              <div className="mt-2 flex gap-2">
                {stations[current].tags.map((t, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs bg-gray-700 rounded-full"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <button
                onClick={() => speakScenario(stations[current].scenario)}
                className="mt-3 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-sm"
              >
                🔊 Replay Scenario
              </button>
            </div>

            {/* Answer box */}
            <textarea
              value={answers[current]}
              onChange={(e) => {
                const copy = [...answers];
                copy[current] = e.target.value;
                setAnswers(copy);
              }}
              className="w-full h-32 p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Speak or type your response here..."
            />

            <div className="flex gap-3 mt-3">
              <button
                onClick={toggleRecording}
                className={`px-4 py-2 rounded ${
                  recording ? "bg-red-600" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {recording ? "⏹ Stop Recording" : "🎙 Start Recording"}
              </button>

              <button
                onClick={() => evaluate(current)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
              >
                ✅ Evaluate
              </button>

              {current > 0 && (
                <button
                  onClick={() => setCurrent((c) => c - 1)}
                  className="px-4 py-2 bg-gray-700 rounded"
                >
                  ◀ Prev
                </button>
              )}
              {current < stations.length - 1 && (
                <button
                  onClick={() => {
                    setCurrent((c) => c + 1);
                    speakScenario(stations[current + 1].scenario);
                  }}
                  className="px-4 py-2 bg-gray-700 rounded"
                >
                  Next ▶
                </button>
              )}
              <button
                onClick={finishExam}
                className="ml-auto px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
              >
                ⏹ End Exam
              </button>
            </div>

            {/* Feedback */}
            {feedback[stations[current].id] && (
              <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <h3 className="font-semibold">Feedback</h3>
                <p>
                  Overall:{" "}
                  <strong>{feedback[stations[current].id].overall}%</strong>
                </p>
                <p className="mt-2">{feedback[stations[current].id].summary}</p>
              </div>
            )}
          </>
        )}

        {/* Results summary */}
        {finished && (
          <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4">📊 Exam Results</h2>
            {Object.values(feedback).length === 0 && (
              <p className="text-gray-400">
                No stations were evaluated. Try again.
              </p>
            )}
            {Object.entries(feedback).map(([id, fb]) => (
              <div key={id} className="mb-4 p-4 bg-gray-800 rounded-lg">
                <h3 className="font-semibold">{id}</h3>
                <p>
                  Overall: <strong>{fb.overall}%</strong>
                </p>
                <ul className="list-disc list-inside text-gray-300">
                  {fb.strengths.map((s, i) => (
                    <li key={i}>✔ {s}</li>
                  ))}
                  {fb.improvements.map((s, i) => (
                    <li key={i}>➤ {s}</li>
                  ))}
                </ul>
              </div>
            ))}
            <button
              onClick={retake}
              className="mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold"
            >
              🔄 Retake Exam with New Questions
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
