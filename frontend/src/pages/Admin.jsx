import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import {
  Settings,
  RefreshCw,
  CheckCircle,
  XCircle,
  Server,
  Brain,
  Activity,
  Scan,
  Terminal,
} from "lucide-react";

/* ── Status card ─────────────────────────────────────────────── */
function StatusCard({ icon: Icon, label, ok, sub }) {
  return (
    <div className="glass rounded-2xl p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center
                       ${ok ? "bg-bio-mint/10" : "bg-red-500/10"}`}
      >
        {ok ? (
          <CheckCircle size={18} className="text-bio-mint" />
        ) : (
          <XCircle size={18} className="text-red-400/70" />
        )}
      </div>
      <div>
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="text-[10px] text-white/30 font-mono">{sub}</div>
      </div>
      <div
        className={`ml-auto text-[10px] font-mono px-2 py-0.5 rounded-lg
                       ${
                         ok
                           ? "bg-bio-mint/10 text-bio-mint"
                           : "bg-red-500/10 text-red-400/70"
                       }`}
      >
        {ok ? "OK" : "FAIL"}
      </div>
    </div>
  );
}

/* ── Model card ──────────────────────────────────────────────── */
function ModelCard({ icon: Icon, name, desc, loaded }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/6 flex items-center justify-center">
          <Icon size={18} className="text-white/50" />
        </div>
        {loaded ? (
          <CheckCircle size={15} className="text-bio-mint" />
        ) : (
          <XCircle size={15} className="text-red-400/60" />
        )}
      </div>
      <div className="text-sm font-semibold text-white mb-0.5">{name}</div>
      <div className="text-[11px] text-white/30 mb-3">{desc}</div>
      <div
        className={`text-[10px] font-mono px-2.5 py-1 rounded-lg w-fit
                       ${
                         loaded
                           ? "bg-bio-mint/10 text-bio-mint border border-bio-mint/20"
                           : "bg-red-500/10 text-red-400/60 border border-red-500/15"
                       }`}
      >
        {loaded ? "LOADED" : "NOT LOADED"}
      </div>
    </div>
  );
}

/* ── Command row ─────────────────────────────────────────────── */
function CmdRow({ step, cmd, note }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(cmd).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-aether-400/50 font-mono text-[10px] w-5 shrink-0">
        {step}
      </span>
      <code
        onClick={copy}
        title="Click to copy"
        className="flex-1 bg-white/5 hover:bg-white/8 cursor-pointer
                   rounded-xl px-3 py-2 text-xs text-white/65 font-mono
                   transition-all truncate select-all"
      >
        {copied ? "✓ Copied!" : cmd}
      </code>
      <span className="text-[10px] text-white/22 w-40 shrink-0 hidden xl:block">
        {note}
      </span>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────── */
export default function Admin() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/health", { timeout: 6000 });
      setHealth(data);
      setLastCheck(new Date().toLocaleTimeString());
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const models = health?.ai_backend?.models ?? {};
  const backOk = health?.ai_backend?.status === "ok";

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-white/50" />
          <div>
            <h1 className="font-display text-3xl font-bold text-white">
              Admin
            </h1>
            <p className="text-sm text-white/35">
              System health, model registry, and startup commands
            </p>
          </div>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 glass border border-white/10
                     rounded-xl text-sm text-white/50 hover:text-white transition-all"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </motion.div>

      {/* System status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4"
      >
        <StatusCard
          icon={Server}
          label="Node Gateway"
          ok={!!health}
          sub="Port 3001"
        />
        <StatusCard
          icon={Server}
          label="FastAPI Backend"
          ok={backOk}
          sub="Port 8000"
        />
        <StatusCard
          icon={Activity}
          label="Models Available"
          ok={!!(models.symptom || models.brain || models.chest)}
          sub="ML + CNN"
        />
      </motion.div>

      {/* Model registry */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.18 }}
      >
        <p
          className="text-[10px] text-white/22 uppercase tracking-[0.18em]
                      font-mono mb-3"
        >
          Model Registry
        </p>
        <div className="grid grid-cols-3 gap-4">
          <ModelCard
            icon={Activity}
            name="Symptom Model"
            desc="RandomForest · Disease classification from symptoms"
            loaded={!!models.symptom}
          />
          <ModelCard
            icon={Brain}
            name="Brain MRI CNN"
            desc="MobileNetV2 · Tumor detection + Grad-CAM"
            loaded={!!models.brain}
          />
          <ModelCard
            icon={Scan}
            name="Chest X-Ray CNN"
            desc="MobileNetV2 · Pneumonia detection + Grad-CAM"
            loaded={!!models.chest}
          />
        </div>
      </motion.div>

      {/* Startup commands */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="glass rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Terminal size={13} className="text-aether-400" />
          <p className="text-[10px] text-white/22 uppercase tracking-[0.18em] font-mono">
            Startup Commands
          </p>
        </div>

        <div className="space-y-2.5">
          {[
            {
              step: "1",
              cmd: "python download_datasets.py",
              note: "download all 4 Kaggle datasets",
            },
            {
              step: "2",
              cmd: "pip install -r requirements.txt",
              note: "install Python packages",
            },
            {
              step: "3",
              cmd: "python train_all_models.py",
              note: "train / load all models",
            },
            {
              step: "4",
              cmd: "cd ai-backend && uvicorn main:app --port 8000 --reload",
              note: "start FastAPI AI backend",
            },
            {
              step: "5",
              cmd: "cd node-backend && npm install && npm start",
              note: "start Node.js gateway",
            },
            {
              step: "6",
              cmd: "cd frontend && npm install && npm run dev",
              note: "start React frontend",
            },
          ].map((r) => (
            <CmdRow key={r.step} {...r} />
          ))}
        </div>

        <p className="text-[10px] text-white/18 mt-4 font-mono">
          Click any command to copy it.
          {lastCheck && `  ·  Last checked: ${lastCheck}`}
        </p>
      </motion.div>

      {/* Kaggle setup reminder */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.32 }}
        className="glass rounded-2xl p-5 border border-aether-500/15"
      >
        <p
          className="text-[10px] text-white/22 uppercase tracking-[0.18em]
                      font-mono mb-3"
        >
          Kaggle API Setup
        </p>
        <div className="space-y-2 text-xs text-white/40 font-mono">
          <p>1. pip install kaggle</p>
          <p>2. Go to kaggle.com → Account → API → Create New Token</p>
          <p>3. Place kaggle.json at:</p>
          <p className="pl-4 text-white/25">
            Windows : C:\Users\&lt;you&gt;\.kaggle\kaggle.json
          </p>
          <p className="pl-4 text-white/25">Mac/Linux: ~/.kaggle/kaggle.json</p>
          <p>4. Mac/Linux only: chmod 600 ~/.kaggle/kaggle.json</p>
          <p>5. python download_datasets.py</p>
        </div>
      </motion.div>
    </div>
  );
}
