import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  Scan,
  Activity,
  Shield,
  ArrowRight,
  Sparkles,
  ChevronDown,
} from "lucide-react";

/* ── Feature cards ─────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Brain,
    title: "Neural Diagnosis",
    desc: "RandomForest trained on 4 000+ symptom–disease pairs",
    color: "text-aether-400",
    bg: "bg-aether-500/10 border-aether-500/20",
  },
  {
    icon: Scan,
    title: "MRI & X-Ray AI",
    desc: "MobileNetV2 CNN with Grad-CAM visual explanations",
    color: "text-bio-teal",
    bg: "bg-bio-teal/10 border-bio-teal/20",
  },
  {
    icon: Activity,
    title: "Risk Stratification",
    desc: "Low / Medium / High scoring with actionable steps",
    color: "text-bio-mint",
    bg: "bg-bio-mint/10 border-bio-mint/20",
  },
  {
    icon: Shield,
    title: "Explainable AI",
    desc: "Feature importance + heatmaps — no black boxes",
    color: "text-bio-cyan",
    bg: "bg-bio-cyan/10 border-bio-cyan/20",
  },
];

/* ── Stats row ─────────────────────────────────────────────── */
const STATS = [
  { value: "4", label: "AI Models" },
  { value: "41+", label: "Diseases" },
  { value: "100+", label: "Symptoms" },
  { value: "XAI", label: "Explained" },
];

/* ── Animation variants ─────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay },
});

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg,#0d0b2e 0%,#1a1740 55%,#0c1525 100%)",
      }}
    >
      {/* Ambient background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute top-[-10%] left-[20%] w-[700px] h-[700px]
                        bg-aether-600/10 rounded-full blur-[140px]"
        />
        <div
          className="absolute bottom-[5%] right-[15%] w-[450px] h-[450px]
                        bg-bio-teal/8 rounded-full blur-[110px]"
        />
        <div
          className="absolute top-[40%] left-[-5%] w-[300px] h-[300px]
                        bg-bio-cyan/5 rounded-full blur-[90px]"
        />
      </div>

      {/* ── Nav ── */}
      <nav className="relative z-10 flex items-center justify-between px-10 py-5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl bg-aether-500/20 border border-aether-500/35
                          flex items-center justify-center glow-indigo"
          >
            <Brain size={19} className="text-aether-400" />
          </div>
          <div>
            <span className="font-display text-[17px] font-semibold text-white">
              OmniHealth AI
            </span>
            <span className="ml-2 text-[10px] text-white/25 font-mono uppercase tracking-[0.2em]">
              Aether
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-5 py-2 glass border border-white/10
                       rounded-xl text-sm text-white/65 hover:text-white
                       hover:border-white/20 transition-all"
          >
            Dashboard
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/symptoms")}
            className="flex items-center gap-2 px-5 py-2 bg-aether-500 hover:bg-aether-600
                       rounded-xl text-sm text-white font-medium transition-all glow-indigo"
          >
            Start <ArrowRight size={14} />
          </motion.button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div
        className="relative z-10 flex flex-col items-center text-center
                      pt-20 pb-10 px-6"
      >
        <motion.div
          {...fadeUp(0)}
          className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full
                     text-xs text-aether-300 font-mono mb-8 border border-aether-500/20"
        >
          <Sparkles size={11} />
          Hackathon Edition · Aether Health System v1.0
        </motion.div>

        <motion.h1
          {...fadeUp(0.1)}
          className="font-display text-6xl md:text-7xl font-bold text-white
                     leading-[1.1] max-w-4xl"
        >
          Medicine, Reimagined
          <br />
          <span
            className="bg-gradient-to-r from-aether-400 via-bio-cyan to-bio-mint
                           bg-clip-text text-transparent"
          >
            Through Intelligence
          </span>
        </motion.h1>

        <motion.p
          {...fadeUp(0.2)}
          className="mt-6 text-lg text-white/45 max-w-2xl leading-relaxed"
        >
          AI-powered symptom analysis, brain MRI tumor detection, chest X-ray
          pneumonia screening, and liver disease prediction — all in one
          clinical-grade platform.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          {...fadeUp(0.3)}
          className="mt-10 flex flex-wrap gap-4 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/symptoms")}
            className="px-8 py-3.5 bg-aether-500 hover:bg-aether-600 rounded-2xl
                       text-white font-semibold text-sm transition-all glow-indigo"
          >
            Start Symptom Check
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/imaging")}
            className="px-8 py-3.5 glass border border-white/12 rounded-2xl
                       text-white/65 font-semibold text-sm
                       hover:text-white hover:border-white/22 transition-all"
          >
            Analyze Medical Image
          </motion.button>
        </motion.div>

        {/* Stats */}
        <motion.div
          {...fadeUp(0.4)}
          className="mt-14 flex gap-8 md:gap-16 justify-center"
        >
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-display font-bold text-white">
                {s.value}
              </div>
              <div className="text-xs text-white/30 mt-0.5 uppercase tracking-wider font-mono">
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Feature grid ── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="relative z-10 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4
                   gap-4 px-10 pb-24"
      >
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 + i * 0.08 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className={`glass border rounded-3xl p-5 cursor-default
                        hover:bg-white/[0.08] transition-all ${f.bg}`}
          >
            <f.icon size={20} className={`${f.color} mb-3`} />
            <div className="text-sm font-semibold text-white mb-1">
              {f.title}
            </div>
            <div className="text-xs text-white/38 leading-relaxed">
              {f.desc}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="relative z-10 flex justify-center pb-8"
      >
        <ChevronDown size={18} className="text-white/15" />
      </motion.div>
    </div>
  );
}
