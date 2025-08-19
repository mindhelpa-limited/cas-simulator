'use client';

import { useEffect, useState, useRef } from 'react';

type Scenario = { 
  id: string; 
  title: string;        
  scenario: string;     
  tags: string[] 
};

type Feedback = {
  scores: { communication: number; dataGathering: number; professionalism: number; clinicalReasoning: number };
  overall: number;
  strengths: string[];
  improvements: string[];
  summary: string;
};

export default function TestMode() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [active, setActive] = useState<Scenario | null>(null);

  // TTS
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // STT
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Feedback
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(false);

  /** Load scenarios */
  useEffect(() => {
    const list: Scenario[] = [
      {
        id: 'abdomen-pain',
        title: 'Abdominal Pain in Young Adult',
        scenario: 'A 24-year-old presents with lower abdominal pain and low-grade fever for two days. Take a focused history, show empathy, explore ICE, and outline a safe initial plan.',
        tags: ['History', 'Reasoning'],
      },
      {
        id: 'sore-throat',
        title: 'Sore Throat with Fever',
        scenario: 'A 30-year-old has sore throat, fever, and difficulty swallowing for three days. Explore red flags, assess ICE, and provide safety netting.',
        tags: ['ENT', 'Safety-netting'],
      },
    ];
    setScenarios(list);
    setActive(list[0]);
  }, []);

  /** Load Google UK English Female voice */
  useEffect(() => {
    const load = () => {
      const voices = window.speechSynthesis.getVoices();
      const ukVoice =
        voices.find(v => /Google UK English Female/i.test(v.name)) ||
        voices.find(v => /Google UK English/i.test(v.name)) ||
        voices[0] ||
        null;
      setVoice(ukVoice);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  /** Speak scenario */
  const speakScenario = () => {
    if (!active || !voice) return;
    setIsSpeaking(true);
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(active.scenario);
    utter.voice = voice;
    utter.rate = 0.95;
    utter.pitch = 1.0;
    utter.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  /** STT setup */
  useEffect(() => {
    // @ts-ignore
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-GB';
    rec.onresult = (e: SpeechRecognitionEvent) => {
      let text = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      setTranscript(text);
    };
    rec.onend = () => setIsRecording(false);
    recognitionRef.current = rec;
  }, []);

  const startRec = () => {
    if (!recognitionRef.current) { alert('Speech recognition not supported. Use Chrome.'); return; }
    setTranscript('');
    recognitionRef.current.start();
    setIsRecording(true);
  };
  const stopRec = () => recognitionRef.current?.stop();

  /** Evaluate */
  const evaluate = async () => {
    if (!active) return;
    const answer = transcript.trim();
    if (!answer) return alert('Say something first!');
    setLoading(true); setFeedback(null);
    try {
      const res = await fetch('/api/test-mode/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: active.id, answer }),
      });
      const data = await res.json();
      setFeedback(data.feedback);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-gray-900 rounded-2xl shadow-lg p-8 text-gray-100">
        <h1 className="text-3xl font-bold text-center mb-6">CAS Exam — Test Mode</h1>

        {active && (
          <>
            {/* Scenario */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold">{active.title}</h2>
              <p className="mt-2 text-gray-300">{active.scenario}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {active.tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 text-sm bg-gray-800 rounded-full">{tag}</span>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={speakScenario}
                disabled={isSpeaking || !voice}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700"
              >
                🔊 Play Scenario
              </button>
              {!isRecording ? (
                <button
                  onClick={startRec}
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700"
                >
                  🎙 Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRec}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700"
                >
                  ⏹ Stop Recording
                </button>
              )}
            </div>

            {/* Transcript */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-400 mb-2">Transcript</label>
              <div className="w-full min-h-[80px] border border-gray-700 bg-gray-800 rounded-lg p-3 text-gray-200">
                {transcript || 'Say something...'}
              </div>
            </div>

            {/* Evaluate */}
            <button
              onClick={evaluate}
              disabled={loading || !transcript}
              className={`w-full py-3 rounded-lg font-semibold ${
                loading || !transcript
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {loading ? 'Scoring…' : '✅ Get Feedback'}
            </button>

            {/* Feedback */}
            {feedback && (
              <div className="mt-6 p-5 border border-gray-700 rounded-xl bg-gray-800">
                <h3 className="text-lg font-semibold mb-2">Feedback</h3>
                <p className="text-gray-300">Overall: <strong>{feedback.overall}%</strong></p>
                <p className="mt-2">{feedback.summary}</p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">✔ Strengths</h4>
                    <ul className="list-disc list-inside text-gray-300">
                      {feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold">➤ Improvements</h4>
                    <ul className="list-disc list-inside text-gray-300">
                      {feedback.improvements.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

/** Vendor-prefixed types */
declare global {
  interface Window { webkitSpeechRecognition?: any; SpeechRecognition?: any; }
}
