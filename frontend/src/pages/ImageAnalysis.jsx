import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Upload,
  Loader2,
  Brain,
  Scan,
  FileImage,
  AlertTriangle,
  X,
  Eye,
} from "lucide-react";
import ConfidenceBar from "../components/ConfidenceBar.jsx";
import RiskBadge from "../components/RiskBadge.jsx";

/* ── Model selector tabs ─────────────────────────────────────── */
const MODELS = [
  {
    id: "chest",
    label: "Chest X-Ray",
    icon: Scan,
    desc: "Pneumonia detection",
    active: "border-bio-cyan/40 text-bio-cyan bg-bio-cyan/10",
    idle: "border-white/10 text-white/40 hover:border-white/20 hover:text-white/70",
  },
  {
    id: "brain",
    label: "Brain MRI",
    icon: Brain,
    desc: "Tumor classification",
    active: "border-aether-400/40 text-aether-300 bg-aether-500/10",
    idle: "border-white/10 text-white/40 hover:border-white/20 hover:text-white/70",
  },
];

/* ── Upload dropzone ─────────────────────────────────────────── */
function DropZone({ onFile, preview, onClear, active }) {
  const onDrop = useCallback(
    (accepted) => {
      if (accepted[0]) onFile(accepted[0]);
    },
    [onFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  });

  return (
    <div
      {...getRootProps()}
      className={`glass rounded-3xl flex flex-col items-center justify-center
                  min-h-64 cursor-pointer border-2 border-dashed transition-all
                  ${
                    isDragActive
                      ? "border-aether-400/60 bg-aether-500/10"
                      : "border-white/10 hover:border-white/22"
                  }`}
    >
      <input {...getInputProps()} />

      {preview ? (
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <img
            src={preview}
            alt="Preview"
            className="max-h-56 max-w-full object-contain rounded-2xl"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="absolute top-3 right-3 w-7 h-7 rounded-xl bg-black/50
                       flex items-center justify-center hover:bg-black/70 transition-all"
          >
            <X size={13} className="text-white" />
          </button>
        </div>
      ) : (
        <>
          <div
            className="w-14 h-14 rounded-2xl bg-white/5 flex items-center
                          justify-center mb-4"
          >
            <Upload size={24} className="text-white/25" />
          </div>
          <p className="text-sm font-medium text-white/50">
            {isDragActive ? "Drop it here!" : "Drop a medical image here"}
          </p>
          <p className="text-xs text-white/25 mt-1">
            JPG · PNG · WEBP — max 20 MB
          </p>
        </>
      )}
    </div>
  );
}

/* ── Results card ────────────────────────────────────────────── */
function ResultCard({ result, onReport }) {
  const [showCam, setShowCam] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-3xl p-6 space-y-4"
    >
      {/* Prediction headline */}
      <div>
        <p
          className="text-[10px] text-white/25 uppercase tracking-widest
                      font-mono mb-0.5"
        >
          Prediction
        </p>
        <p className="text-2xl font-display font-bold text-white">
          {result.prediction}
        </p>
      </div>

      <ConfidenceBar confidence={result.confidence} />
      <RiskBadge risk={result.risk_level} />

      {/* Class probabilities */}
      {result.class_probabilities &&
        Object.keys(result.class_probabilities).length > 0 && (
          <div>
            <p
              className="text-[10px] text-white/25 uppercase tracking-widest
                        font-mono mb-2"
            >
              Class Probabilities
            </p>
            {Object.entries(result.class_probabilities).map(([cls, prob]) => (
              <div key={cls} className="flex items-center gap-3 mb-1.5">
                <span className="text-xs text-white/45 w-28 truncate">
                  {cls}
                </span>
                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-aether-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${prob}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                  />
                </div>
                <span className="text-[11px] font-mono text-white/40 w-10 text-right">
                  {prob}%
                </span>
              </div>
            ))}
          </div>
        )}

      {/* Grad-CAM */}
      {result.gradcam_image && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-white/25 uppercase tracking-widest font-mono">
              Grad-CAM Heatmap
            </p>
            <button
              onClick={() => setShowCam((v) => !v)}
              className="flex items-center gap-1 text-[10px] text-white/30
                         hover:text-white/60 transition-colors"
            >
              <Eye size={11} />
              {showCam ? "Hide" : "Show"}
            </button>
          </div>
          <AnimatePresence>
            {showCam && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <img
                  src={`data:image/png;base64,${result.gradcam_image}`}
                  alt="Grad-CAM"
                  className="rounded-2xl w-full object-cover max-h-48"
                />
                <p className="text-[10px] text-white/20 mt-1">
                  Red/warm areas = regions of highest AI attention
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Explanation */}
      <p className="text-xs text-white/30 leading-relaxed border-t border-white/5 pt-3">
        {result.explanation}
      </p>

      {/* View Report */}
      <button
        onClick={onReport}
        className="w-full py-2.5 bg-aether-500/12 border border-aether-500/22
                   rounded-xl text-aether-300 text-sm font-medium
                   hover:bg-aether-500/22 transition-all"
      >
        View Full Report →
      </button>
    </motion.div>
  );
}

/* ── Main Page ───────────────────────────────────────────────── */
export default function ImageAnalysis() {
  const navigate = useNavigate();

  const [modelType, setModelType] = useState("chest");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFile = (f) => {
    setFile(f);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const form = new FormData();
    form.append("file", file);
    form.append("model_type", modelType);
    form.append("gradcam", "true");

    try {
      const { data } = await axios.post("/api/predict-image", form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 90000,
      });
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReport = () => {
    if (!result) return;
    sessionStorage.setItem(
      "omnihealth_report",
      JSON.stringify({
        type: modelType,
        model_type: modelType,
        filename: file?.name,
        ...result,
      }),
    );
    navigate("/report");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2"
      >
        <FileImage size={18} className="text-bio-cyan" />
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            Medical Imaging AI
          </h1>
          <p className="text-sm text-white/35">
            Upload MRI or X-ray images for CNN analysis with Grad-CAM
            explanations
          </p>
        </div>
      </motion.div>

      {/* Model tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-3"
      >
        {MODELS.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setModelType(m.id);
              setResult(null);
              setError(null);
            }}
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl glass border
                        transition-all ${modelType === m.id ? m.active : m.idle}`}
          >
            <m.icon size={16} />
            <div className="text-left">
              <div className="text-sm font-semibold leading-tight">
                {m.label}
              </div>
              <div className="text-[10px] opacity-60">{m.desc}</div>
            </div>
          </button>
        ))}
      </motion.div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-5">
        {/* Left — upload */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-4"
        >
          <DropZone
            onFile={handleFile}
            preview={preview}
            onClear={clearFile}
            active={modelType}
          />

          {file && (
            <div
              className="glass rounded-2xl px-4 py-3 flex items-center
                            justify-between gap-3"
            >
              <div className="flex items-center gap-2 text-xs text-white/50 truncate">
                <FileImage size={13} />
                <span className="truncate">{file.name}</span>
              </div>
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="shrink-0 px-4 py-1.5 bg-aether-500 hover:bg-aether-600
                           disabled:opacity-40 rounded-xl text-white text-xs
                           font-semibold transition-all flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Analyzing…
                  </>
                ) : (
                  "Analyze →"
                )}
              </button>
            </div>
          )}

          {error && (
            <div
              className="glass rounded-2xl p-4 border border-red-500/20
                            flex items-start gap-3"
            >
              <AlertTriangle
                size={15}
                className="text-red-400 mt-0.5 shrink-0"
              />
              <p className="text-sm text-red-300/80 leading-relaxed">{error}</p>
            </div>
          )}
        </motion.div>

        {/* Right — results */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Loading state */}
          {loading && (
            <div
              className="glass rounded-3xl flex flex-col items-center
                            justify-center min-h-64 space-y-5 p-8"
            >
              <div className="relative w-16 h-16">
                <div
                  className="absolute inset-0 rounded-full border-2
                                border-aether-500/20 animate-ping"
                />
                <div
                  className="absolute inset-2 rounded-full border-2
                                border-aether-400/35 animate-pulse"
                />
                <Loader2
                  size={22}
                  className="absolute inset-0 m-auto
                                              text-aether-400 animate-spin"
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-white/40 font-mono">
                  AI is analyzing the image…
                </p>
                <p className="text-xs text-white/20 mt-1">
                  Running CNN inference + Grad-CAM
                </p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !result && (
            <div
              className="glass rounded-3xl flex flex-col items-center
                            justify-center min-h-64 text-center p-8"
            >
              <Scan size={40} className="text-white/8 mb-4" />
              <p className="text-sm text-white/22">
                Upload an image and click Analyze to see results here
              </p>
            </div>
          )}

          {/* Result */}
          {!loading && result && (
            <ResultCard result={result} onReport={handleReport} />
          )}
        </motion.div>
      </div>
    </div>
  );
}
