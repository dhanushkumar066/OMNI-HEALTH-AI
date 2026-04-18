import { motion } from "framer-motion";

/**
 * Animated horizontal confidence bar.
 * Props:
 *   confidence  — number 0-100
 *   label       — optional string (default "Confidence")
 */
export default function ConfidenceBar({ confidence, label = "Confidence" }) {
  const pct = Math.min(100, Math.max(0, Number(confidence) || 0));

  /* colour shifts from green → amber → indigo as confidence rises */
  const barColor = pct >= 75 ? "#6366f1" : pct >= 45 ? "#f59e0b" : "#22c55e";

  return (
    <div className="w-full">
      {/* Header row */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono">
          {label}
        </span>
        <span className="text-xs font-mono text-white/65">
          {pct.toFixed(1)}%
        </span>
      </div>

      {/* Track */}
      <div className="h-1.5 w-full bg-white/6 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
