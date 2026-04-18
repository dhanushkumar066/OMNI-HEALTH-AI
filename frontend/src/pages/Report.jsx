import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  AlertTriangle,
  Clock,
  Activity,
  FileImage,
} from "lucide-react";
import ConfidenceBar from "../components/ConfidenceBar.jsx";
import RiskBadge from "../components/RiskBadge.jsx";

/* ── Section wrapper ─────────────────────────────────────────── */
function Section({ title, children }) {
  return (
    <div className="glass rounded-2xl p-5">
      <p
        className="text-[10px] text-white/25 uppercase tracking-widest
                    font-mono pb-2.5 mb-3 border-b border-white/5"
      >
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

/* ── Key-value row ────────────────────────────────────────────── */
function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-white/35 shrink-0 w-44">{label}</span>
      <span className="text-sm text-white/75 text-right">{value}</span>
    </div>
  );
}

/* ── PDF generator ────────────────────────────────────────────── */
async function generatePDF(report, timestamp) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const M = 20;
  const RIGHT = W - M;

  /* ─ Header band ─ */
  doc.setFillColor(13, 11, 46);
  doc.rect(0, 0, W, 42, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(163, 163, 255);
  doc.text("OmniHealth AI — Medical Report", M, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 190);
  doc.text(`Generated: ${timestamp}`, M, 25);
  doc.text("Aether Health System v1.0", M, 31);
  doc.text(
    "WARNING: For informational purposes only. Not a substitute for professional medical advice.",
    M,
    38,
  );

  let y = 52;

  /* ─ Helper: add section ─ */
  const addSection = (title, rows) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(99, 102, 241);
    doc.text(title.toUpperCase(), M, y);
    y += 4;

    doc.setDrawColor(99, 102, 241, 0.4);
    doc.setLineWidth(0.3);
    doc.line(M, y, RIGHT, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [],
      body: rows,
      theme: "plain",
      styles: { fontSize: 9, textColor: [200, 200, 220], cellPadding: 1.8 },
      columnStyles: {
        0: { fontStyle: "bold", textColor: [140, 140, 190], cellWidth: 58 },
        1: { textColor: [220, 220, 240] },
      },
      margin: { left: M, right: M },
    });

    y = doc.lastAutoTable.finalY + 8;
  };

  /* ─ Sections ─ */
  addSection("Analysis Summary", [
    [
      "Analysis Type",
      report.type === "symptoms"
        ? "Symptom-based Diagnosis"
        : `${(report.model_type || report.type || "").toUpperCase()} Image Analysis`,
    ],
    ["Predicted Condition", report.prediction ?? "—"],
    ["Confidence", `${report.confidence ?? "—"}%`],
    ["Risk Level", report.risk_level ?? "—"],
    ["Generated At", timestamp],
  ]);

  if (report.symptoms?.length) {
    addSection("Reported Symptoms", [["Symptoms", report.symptoms.join(", ")]]);
  }

  if (report.filename) {
    addSection("Image Details", [
      ["Filename", report.filename],
      ["Model Used", (report.model_type ?? "CNN").toUpperCase()],
    ]);
  }

  if (report.explanation) {
    addSection("AI Explanation", [["Explanation", report.explanation]]);
  }

  if (report.top_conditions?.length) {
    addSection(
      "Top Predicted Conditions",
      report.top_conditions.map((c) => [c.disease, `${c.probability}%`]),
    );
  }

  if (
    report.class_probabilities &&
    Object.keys(report.class_probabilities).length
  ) {
    addSection(
      "Class Probabilities",
      Object.entries(report.class_probabilities).map(([k, v]) => [k, `${v}%`]),
    );
  }

  if (report.recommended_actions?.length) {
    addSection(
      "Recommended Actions",
      report.recommended_actions.map((a, i) => [`${i + 1}.`, a]),
    );
  }

  /* ─ Footer disclaimer ─ */
  const disc = [
    "DISCLAIMER: This AI-generated report is for informational purposes only.",
    "It does not constitute medical advice, diagnosis, or treatment.",
    "Always consult a qualified healthcare professional regarding any medical condition.",
    "OmniHealth AI — Aether Health System | Not approved for clinical use.",
  ];
  doc.setFontSize(7.5);
  doc.setTextColor(90, 90, 130);
  disc.forEach((line, i) => doc.text(line, M, 272 + i * 4.5));

  doc.save(`OmniHealth_Report_${Date.now()}.pdf`);
}

/* ── Main Page ───────────────────────────────────────────────── */
export default function Report() {
  const [report, setReport] = useState(null);
  const [ts, setTs] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("omnihealth_report");
    if (raw) {
      try {
        setReport(JSON.parse(raw));
      } catch {}
    }
    setTs(new Date().toLocaleString());
  }, []);

  const handlePDF = async () => {
    if (!report || pdfBusy) return;
    setPdfBusy(true);
    try {
      await generatePDF(report, ts);
    } catch (e) {
      alert("PDF generation failed: " + e.message);
    } finally {
      setPdfBusy(false);
    }
  };

  /* ── Empty state ── */
  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <FileText size={48} className="text-white/8" />
        <p className="text-white/25 text-sm">No report available.</p>
        <p className="text-white/15 text-xs">
          Run a Symptom Check or Image Analysis first.
        </p>
      </div>
    );
  }

  const isImage = report.type !== "symptoms";

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-aether-400" />
          <div>
            <h1 className="font-display text-3xl font-bold text-white">
              Medical Report
            </h1>
            <p className="text-xs text-white/30 flex items-center gap-1.5 mt-0.5">
              <Clock size={11} /> {ts}
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handlePDF}
          disabled={pdfBusy}
          className="flex items-center gap-2 px-5 py-2.5 bg-aether-500
                     hover:bg-aether-600 disabled:opacity-50 rounded-xl
                     text-white text-sm font-semibold transition-all"
        >
          <Download size={14} />
          {pdfBusy ? "Generating…" : "Download PDF"}
        </motion.button>
      </motion.div>

      {/* Sections */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {/* Summary */}
        <Section title="Analysis Summary">
          <Row
            label="Analysis Type"
            value={
              isImage
                ? `${(report.model_type || report.type || "").toUpperCase()} Image Analysis`
                : "Symptom-based Diagnosis"
            }
          />
          <Row
            label="Predicted Condition"
            value={
              <span className="font-semibold text-white">
                {report.prediction}
              </span>
            }
          />
          <Row label="Generated" value={ts} />
        </Section>

        {/* Confidence + Risk */}
        <Section title="AI Confidence & Risk">
          <ConfidenceBar confidence={report.confidence} />
          <div className="pt-2">
            <RiskBadge risk={report.risk_level} large />
          </div>
        </Section>

        {/* Symptoms (if symptom analysis) */}
        {report.symptoms?.length > 0 && (
          <Section title="Reported Symptoms">
            <div className="flex flex-wrap gap-2">
              {report.symptoms.map((s) => (
                <span
                  key={s}
                  className="flex items-center gap-1.5 px-3 py-1
                             bg-aether-500/10 border border-aether-500/20
                             rounded-xl text-xs text-aether-300"
                >
                  <Activity size={10} /> {s}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Image file info */}
        {report.filename && (
          <Section title="Image Details">
            <Row label="File" value={report.filename} />
            <Row
              label="Model"
              value={(report.model_type || "CNN").toUpperCase()}
            />
          </Section>
        )}

        {/* Explanation */}
        {report.explanation && (
          <Section title="AI Explanation">
            <p className="text-sm text-white/55 leading-relaxed">
              {report.explanation}
            </p>
          </Section>
        )}

        {/* Top conditions */}
        {report.top_conditions?.length > 0 && (
          <Section title="Top Predicted Conditions">
            {report.top_conditions.map((c, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-white/55">{c.disease}</span>
                <span className="text-sm font-mono text-aether-400">
                  {c.probability}%
                </span>
              </div>
            ))}
          </Section>
        )}

        {/* Class probabilities (image model) */}
        {report.class_probabilities &&
          Object.keys(report.class_probabilities).length > 0 && (
            <Section title="Class Probabilities">
              {Object.entries(report.class_probabilities).map(([cls, prob]) => (
                <div key={cls} className="flex items-center gap-3 mb-1">
                  <span className="text-xs text-white/45 w-32 truncate">
                    {cls}
                  </span>
                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-aether-500 rounded-full"
                      style={{ width: `${prob}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-white/40 w-10 text-right">
                    {prob}%
                  </span>
                </div>
              ))}
            </Section>
          )}

        {/* Recommended actions */}
        {report.recommended_actions?.length > 0 && (
          <Section title="Recommended Actions">
            <ul className="space-y-2">
              {report.recommended_actions.map((a, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-white/55"
                >
                  <span className="text-aether-400/60 font-mono text-[10px] mt-0.5 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {a}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Disclaimer */}
        <div className="glass rounded-2xl p-4 border border-yellow-400/10">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={14}
              className="text-yellow-400/60 mt-0.5 shrink-0"
            />
            <p className="text-xs text-white/28 leading-relaxed">
              <strong className="text-yellow-400/60">Disclaimer:</strong> This
              report is generated by an AI system for informational purposes
              only. It does not constitute medical advice, diagnosis, or
              treatment. Always seek the advice of a qualified healthcare
              provider.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
