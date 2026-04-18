import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Send,
  Plus,
  X,
  Activity,
  Loader2,
  AlertTriangle,
  Bot,
  User,
} from "lucide-react";
import ConfidenceBar from "../components/ConfidenceBar.jsx";
import RiskBadge from "../components/RiskBadge.jsx";

/* ── Common symptoms quick-add ─────────────────────────────── */
const QUICK_SYMPTOMS = [
  "fever",
  "headache",
  "cough",
  "fatigue",
  "nausea",
  "vomiting",
  "chest pain",
  "shortness of breath",
  "dizziness",
  "abdominal pain",
  "back pain",
  "joint pain",
  "rash",
  "sore throat",
  "runny nose",
  "loss of appetite",
  "weight loss",
  "chills",
  "sweating",
  "blurred vision",
  "itching",
  "swelling",
  "palpitations",
  "anxiety",
  "insomnia",
];

/* ── Initial assistant greeting ────────────────────────────── */
const GREETING = {
  role: "assistant",
  text: "Hello! I'm the Aether AI Diagnostic System.\n\nAdd your symptoms using the panel on the right or type them below, then click **Analyze Symptoms** to receive an AI-powered assessment.\n\n⚠ This is for informational purposes only — always consult a doctor.",
};

/* ── Chat message bubble ──────────────────────────────────── */
function Bubble({ msg, onViewReport }) {
  const isUser = msg.role === "user";
  const isThinking = msg.role === "thinking";

  if (isThinking) {
    return (
      <div className="flex justify-start">
        <div className="flex items-center gap-2.5 px-4 py-2.5 glass rounded-2xl text-sm text-white/40">
          <Loader2 size={13} className="animate-spin text-aether-400" />
          {msg.text}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div
          className="w-7 h-7 rounded-xl bg-aether-500/20 border border-aether-500/30
                        flex items-center justify-center mr-2.5 mt-1 shrink-0"
        >
          <Bot size={13} className="text-aether-400" />
        </div>
      )}

      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                       ${
                         isUser
                           ? "bg-aether-500/20 border border-aether-500/30 text-white/85"
                           : "glass border border-white/8 text-white/75"
                       }`}
      >
        {/* Message text — support **bold** */}
        <p
          dangerouslySetInnerHTML={{
            __html: msg.text
              .replace(/\n/g, "<br/>")
              .replace(
                /\*\*(.*?)\*\*/g,
                "<strong class='text-white'>$1</strong>",
              ),
          }}
        />

        {/* Inline result card */}
        {msg.result && (
          <div className="mt-4 space-y-3 pt-3 border-t border-white/8">
            <ConfidenceBar confidence={msg.result.confidence} />
            <RiskBadge risk={msg.result.risk_level} />

            {/* Top conditions */}
            {msg.result.top_conditions?.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] text-white/25 uppercase tracking-widest mb-1.5 font-mono">
                  Top Conditions
                </p>
                {msg.result.top_conditions.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs mb-1"
                  >
                    <span className="text-white/50">{c.disease}</span>
                    <span className="font-mono text-aether-400">
                      {c.probability}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[11px] text-white/30 leading-relaxed">
              {msg.result.explanation}
            </p>

            <button
              onClick={onViewReport}
              className="text-xs text-aether-400 hover:text-aether-300 transition-colors
                         underline underline-offset-2"
            >
              View Full Report →
            </button>
          </div>
        )}
      </div>

      {isUser && (
        <div
          className="w-7 h-7 rounded-xl bg-white/8 border border-white/10
                        flex items-center justify-center ml-2.5 mt-1 shrink-0"
        >
          <User size={13} className="text-white/50" />
        </div>
      )}
    </motion.div>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */
export default function SymptomChecker() {
  const navigate = useNavigate();
  const bottomRef = useRef(null);

  const [input, setInput] = useState("");
  const [symptoms, setSymptoms] = useState([]);
  const [messages, setMessages] = useState([GREETING]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  /* auto-scroll chat */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* add symptom (from input or quick-add button) */
  const addSymptom = useCallback((s) => {
    const clean = s.trim().toLowerCase().replace(/\s+/g, " ");
    if (!clean) return;
    setSymptoms((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
    setInput("");
  }, []);

  const removeSymptom = (s) =>
    setSymptoms((prev) => prev.filter((x) => x !== s));

  /* analyze */
  const handleAnalyze = async () => {
    if (symptoms.length === 0 || loading) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", text: `Symptoms: ${symptoms.join(", ")}` },
      { role: "thinking", text: "AI is analyzing your symptoms…" },
    ]);
    setLoading(true);
    setResult(null);

    try {
      const { data } = await axios.post("/api/predict-symptoms", { symptoms });
      setResult(data);

      setMessages((prev) => [
        ...prev.filter((m) => m.role !== "thinking"),
        {
          role: "assistant",
          text: `Based on your ${symptoms.length} reported symptom(s), the AI identified **${data.prediction}** as the most probable condition with **${data.confidence}%** confidence.`,
          result: data,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev.filter((m) => m.role !== "thinking"),
        {
          role: "assistant",
          text: `⚠ Error: ${e.response?.data?.error || e.message}\n\nMake sure the backend services are running (see Admin page).`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = () => {
    if (!result) return;
    sessionStorage.setItem(
      "omnihealth_report",
      JSON.stringify({ type: "symptoms", symptoms, ...result }),
    );
    navigate("/report");
  };

  return (
    <div className="flex flex-col gap-5 h-[calc(100vh-8rem)]">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 shrink-0"
      >
        <Activity size={18} className="text-aether-400" />
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            Symptom Checker
          </h1>
          <p className="text-sm text-white/35">
            AI-powered disease prediction from your reported symptoms
          </p>
        </div>
      </motion.div>

      {/* Main area */}
      <div className="flex flex-1 gap-5 min-h-0">
        {/* ── Chat panel ── */}
        <div className="flex-1 flex flex-col glass rounded-3xl overflow-hidden min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <Bubble key={i} msg={msg} onViewReport={handleViewReport} />
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="shrink-0 border-t border-white/5 p-4">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSymptom(input);
                  }
                }}
                placeholder="Type a symptom and press Enter…"
                className="flex-1 bg-white/5 border border-white/8 rounded-xl
                           px-4 py-2.5 text-sm text-white placeholder-white/20
                           focus:outline-none focus:border-aether-500/50 focus:bg-white/8
                           transition-all"
              />
              <button
                onClick={() => addSymptom(input)}
                className="px-3 py-2.5 bg-white/6 border border-white/10 rounded-xl
                           text-white/50 hover:text-white hover:bg-white/10 transition-all"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={handleAnalyze}
                disabled={loading || symptoms.length === 0}
                className="px-4 py-2.5 bg-aether-500 hover:bg-aether-600
                           disabled:opacity-35 disabled:cursor-not-allowed
                           rounded-xl text-white transition-all flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="w-64 shrink-0 flex flex-col gap-4 overflow-y-auto">
          {/* Active symptoms */}
          <div className="glass rounded-3xl p-4">
            <p
              className="text-[10px] text-white/25 uppercase tracking-widest
                          font-mono mb-3"
            >
              Active Symptoms ({symptoms.length})
            </p>

            {symptoms.length === 0 ? (
              <p className="text-xs text-white/18 text-center py-3">
                None added yet
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {symptoms.map((s) => (
                  <span
                    key={s}
                    className="flex items-center gap-1.5 px-2.5 py-1
                               bg-aether-500/12 border border-aether-500/22
                               rounded-xl text-xs text-aether-300"
                  >
                    {s}
                    <button
                      onClick={() => removeSymptom(s)}
                      className="hover:text-white transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading || symptoms.length === 0}
              className="w-full py-2.5 bg-aether-500 hover:bg-aether-600
                         disabled:opacity-35 disabled:cursor-not-allowed
                         rounded-2xl text-white text-xs font-semibold
                         transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Analyzing…
                </>
              ) : (
                <>
                  <Activity size={13} /> Analyze Symptoms
                </>
              )}
            </button>
          </div>

          {/* Quick-add common symptoms */}
          <div className="glass rounded-3xl p-4">
            <p
              className="text-[10px] text-white/25 uppercase tracking-widest
                          font-mono mb-3"
            >
              Quick Add
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-72 overflow-y-auto pr-1">
              {QUICK_SYMPTOMS.map((s) => (
                <button
                  key={s}
                  onClick={() => addSymptom(s)}
                  disabled={symptoms.includes(s)}
                  className="px-2.5 py-1 glass border border-white/8 rounded-xl
                             text-[11px] text-white/45 hover:text-white
                             hover:border-aether-500/30 hover:bg-aether-500/8
                             disabled:opacity-25 disabled:cursor-not-allowed
                             transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Warning note */}
          <div className="glass rounded-2xl p-3 border border-yellow-400/10">
            <div className="flex items-start gap-2">
              <AlertTriangle
                size={12}
                className="text-yellow-400/60 mt-0.5 shrink-0"
              />
              <p className="text-[10px] text-white/25 leading-relaxed">
                AI predictions are not medical diagnoses. Consult a qualified
                healthcare professional.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
