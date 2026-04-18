import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Activity,
  Brain,
  FileImage,
  FileText,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  LayoutDashboard,
  Zap,
} from "lucide-react";

/* ── Module cards ─────────────────────────────────────────── */
const MODULES = [
  {
    title: "Symptom Checker",
    desc: "Chat-style AI diagnosis from reported symptoms",
    icon: Activity,
    to: "/symptoms",
    badge: "Random Forest",
    grad: "from-aether-500/15 to-aether-700/5",
    border: "border-aether-500/20",
    glow: "hover:shadow-aether-500/10",
  },
  {
    title: "Brain MRI Analysis",
    desc: "Tumor detection with Grad-CAM heatmap",
    icon: Brain,
    to: "/imaging",
    badge: "MobileNetV2",
    grad: "from-bio-teal/15 to-bio-teal/5",
    border: "border-bio-teal/20",
    glow: "hover:shadow-bio-teal/10",
  },
  {
    title: "Chest X-Ray AI",
    desc: "Pneumonia screening from uploaded X-rays",
    icon: FileImage,
    to: "/imaging",
    badge: "CNN",
    grad: "from-bio-cyan/15 to-bio-cyan/5",
    border: "border-bio-cyan/20",
    glow: "hover:shadow-bio-cyan/10",
  },
  {
    title: "Medical Reports",
    desc: "Download structured PDF diagnostic reports",
    icon: FileText,
    to: "/report",
    badge: "PDF Export",
    grad: "from-bio-mint/15 to-bio-mint/5",
    border: "border-bio-mint/20",
    glow: "hover:shadow-bio-mint/10",
  },
];

/* ── Status pill ────────────────────────────────────────────── */
function StatusPill({ label, value, ok }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-xl">
      {ok ? (
        <CheckCircle size={12} className="text-bio-mint shrink-0" />
      ) : (
        <AlertCircle size={12} className="text-yellow-400/70 shrink-0" />
      )}
      <span className="text-[10px] text-white/35 uppercase tracking-wide font-mono">
        {label}
      </span>
      <span
        className={`text-[10px] font-mono font-medium
                        ${ok ? "text-bio-mint" : "text-yellow-400/70"}`}
      >
        {value}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    axios
      .get("/api/health")
      .then((r) => setHealth(r.data))
      .catch(() => setHealth(null));
  }, []);

  const models = health?.ai_backend?.models ?? {};

  return (
    <div className="space-y-7">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <LayoutDashboard size={18} className="text-aether-400" />
          <h1 className="font-display text-3xl font-bold text-white">
            Dashboard
          </h1>
        </div>
        <p className="text-sm text-white/35">
          Aether Health System — AI Diagnostic Platform
        </p>
      </motion.div>

      {/* System status bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl px-5 py-3.5 flex flex-wrap gap-3 items-center"
      >
        <span className="text-[9px] text-white/20 uppercase tracking-[0.2em] font-mono mr-1">
          System
        </span>
        <StatusPill
          label="Gateway"
          value={health ? "Online" : "Checking…"}
          ok={!!health}
        />
        <StatusPill
          label="AI Backend"
          value={health?.ai_backend?.status === "ok" ? "Online" : "Offline"}
          ok={health?.ai_backend?.status === "ok"}
        />
        <StatusPill
          label="Symptom Model"
          value={models.symptom ? "Loaded" : "Not loaded"}
          ok={!!models.symptom}
        />
        <StatusPill
          label="Brain Model"
          value={models.brain ? "Loaded" : "Not loaded"}
          ok={!!models.brain}
        />
        <StatusPill
          label="Chest Model"
          value={models.chest ? "Loaded" : "Not loaded"}
          ok={!!models.chest}
        />
      </motion.div>

      {/* Module cards */}
      <div className="grid grid-cols-2 gap-4">
        {MODULES.map((m, i) => (
          <motion.div
            key={m.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.07 }}
            whileHover={{ y: -5, scale: 1.01 }}
            onClick={() => navigate(m.to)}
            className={`glass border ${m.border} rounded-3xl p-6 cursor-pointer
                        bg-gradient-to-br ${m.grad}
                        transition-all duration-200 hover:shadow-xl ${m.glow}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-11 h-11 rounded-2xl bg-white/8 border border-white/8
                              flex items-center justify-center"
              >
                <m.icon size={19} className="text-white/75" />
              </div>
              <span
                className="text-[9px] font-mono text-white/25 border border-white/10
                               rounded-full px-2 py-0.5 uppercase tracking-widest"
              >
                {m.badge}
              </span>
            </div>
            <div className="text-[15px] font-semibold text-white mb-1">
              {m.title}
            </div>
            <div className="text-xs text-white/38 leading-relaxed mb-4">
              {m.desc}
            </div>
            <div
              className="flex items-center gap-1 text-xs text-white/25
                            hover:text-white/55 transition-colors"
            >
              Open <ArrowRight size={11} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick-start guide */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="glass rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Zap size={13} className="text-aether-400" />
          <span className="text-[10px] text-white/25 uppercase tracking-[0.18em] font-mono">
            Quick Start
          </span>
        </div>

        <ol className="space-y-2.5">
          {[
            {
              step: "01",
              cmd: "python download_datasets.py",
              note: "download all 4 Kaggle datasets",
            },
            {
              step: "02",
              cmd: "pip install -r requirements.txt",
              note: "install Python dependencies",
            },
            {
              step: "03",
              cmd: "python train_all_models.py",
              note: "train or load all models",
            },
            {
              step: "04",
              cmd: "cd ai-backend && uvicorn main:app --port 8000 --reload",
              note: "start FastAPI AI backend",
            },
            {
              step: "05",
              cmd: "cd node-backend && npm install && npm start",
              note: "start Node.js gateway",
            },
            {
              step: "06",
              cmd: "cd frontend && npm install && npm run dev",
              note: "start this React frontend",
            },
          ].map(({ step, cmd, note }) => (
            <li key={step} className="flex items-center gap-3 text-sm">
              <span className="text-aether-400/60 font-mono text-[10px] w-5 shrink-0">
                {step}
              </span>
              <code
                className="flex-1 text-white/60 bg-white/5 rounded-lg
                               px-2.5 py-1 text-xs font-mono truncate"
              >
                {cmd}
              </code>
              <span className="text-white/25 text-xs w-44 shrink-0 hidden xl:block">
                {note}
              </span>
            </li>
          ))}
        </ol>
      </motion.div>
    </div>
  );
}
