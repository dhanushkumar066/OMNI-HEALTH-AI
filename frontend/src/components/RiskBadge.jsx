import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

const CONFIG = {
  Low: {
    icon: ShieldCheck,
    text: "Low Risk",
    classes: "bg-risk-low/10 border-risk-low/25 text-risk-low",
  },
  Medium: {
    icon: ShieldAlert,
    text: "Medium Risk",
    classes: "bg-risk-medium/10 border-risk-medium/25 text-risk-medium",
  },
  High: {
    icon: ShieldX,
    text: "High Risk",
    classes: "bg-risk-high/10 border-risk-high/25 text-risk-high",
  },
};

/**
 * Risk level pill badge.
 * Props:
 *   risk   — "Low" | "Medium" | "High"
 *   large  — boolean (optional) — bigger padding/text
 */
export default function RiskBadge({ risk, large = false }) {
  const cfg = CONFIG[risk] ?? CONFIG.Low;
  const Icon = cfg.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 border rounded-xl font-semibold
                  ${large ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs"}
                  ${cfg.classes}`}
    >
      <Icon size={large ? 16 : 13} />
      {cfg.text}
    </div>
  );
}
