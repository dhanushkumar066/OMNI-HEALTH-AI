const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;
const AI_URL = process.env.AI_URL || "http://localhost:8000";

// ─── Middleware ──────────────────────────────────────────────────────────────

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "50mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

// ─── Health ──────────────────────────────────────────────────────────────────

app.get("/api/health", async (req, res) => {
  try {
    const r = await axios.get(`${AI_URL}/health`, { timeout: 5000 });
    res.json({ gateway: "ok", ai_backend: r.data });
  } catch (e) {
    res
      .status(503)
      .json({ gateway: "ok", ai_backend: "unreachable", error: e.message });
  }
});

// ─── Symptom Prediction ──────────────────────────────────────────────────────

app.post("/api/predict-symptoms", async (req, res) => {
  try {
    const { symptoms, patient_info } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ error: "symptoms array is required" });
    }

    const response = await axios.post(
      `${AI_URL}/predict-symptoms`,
      { symptoms, patient_info: patient_info || {} },
      { timeout: 30000 },
    );

    res.json(response.data);
  } catch (e) {
    const msg = e.response?.data?.detail || e.message;
    res.status(e.response?.status || 500).json({ error: msg });
  }
});

// ─── Image Prediction ────────────────────────────────────────────────────────

app.post("/api/predict-image", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const model_type = req.body.model_type || "chest";
    const gradcam = req.body.gradcam !== "false";

    const form = new FormData();
    form.append("file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const response = await axios.post(
      `${AI_URL}/predict-image?model_type=${model_type}&gradcam=${gradcam}`,
      form,
      { headers: form.getHeaders(), timeout: 60000 },
    );

    res.json(response.data);
  } catch (e) {
    const msg = e.response?.data?.detail || e.message;
    res.status(e.response?.status || 500).json({ error: msg });
  }
});

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀  OmniHealth Gateway running at http://localhost:${PORT}`);
  console.log(`    Forwarding AI calls to: ${AI_URL}\n`);
});

app.get("/", (req, res) => {
  res.json({
    message: "OmniHealth Gateway Running 🚀",
    status: "OK",
  });
});