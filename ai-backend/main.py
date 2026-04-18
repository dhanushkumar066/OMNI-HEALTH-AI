import json
import pickle
import io
import base64
import numpy as np
from pathlib import Path
from typing import Optional
 
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
 
from predict_symptoms import SymptomPredictor
from predict_image    import ImagePredictor
 
# ─── App Setup ───────────────────────────────────────────────────────────────
 
app = FastAPI(
    title="OmniHealth AI API",
    description="Aether Health System — AI-powered medical prediction backend",
    version="1.0.0",
)
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
MODELS_DIR = Path("../models")
 
# ─── Load Models at Startup ──────────────────────────────────────────────────
 
symptom_predictor: Optional[SymptomPredictor] = None
brain_predictor:   Optional[ImagePredictor]   = None
chest_predictor:   Optional[ImagePredictor]   = None
 
 
@app.on_event("startup")
async def load_models():
    global symptom_predictor, brain_predictor, chest_predictor
 
    print("🔄  Loading models ...")
 
    # Symptom model
    symptom_path = MODELS_DIR / "symptom_model.pkl"
    if symptom_path.exists():
        symptom_predictor = SymptomPredictor(str(symptom_path))
        print("✅  Symptom model loaded.")
    else:
        print("⚠️   symptom_model.pkl not found — run train_all_models.py first.")
 
    # Brain MRI
    brain_path = MODELS_DIR / "brain_model.h5"
    brain_meta = MODELS_DIR / "brain_meta.json"
    if brain_path.exists():
        brain_predictor = ImagePredictor(str(brain_path), str(brain_meta) if brain_meta.exists() else None)
        print("✅  Brain MRI model loaded.")
 
    # Chest X-ray
    chest_path = MODELS_DIR / "chest_model.h5"
    chest_meta = MODELS_DIR / "chest_meta.json"
    if chest_path.exists():
        chest_predictor = ImagePredictor(str(chest_path), str(chest_meta) if chest_meta.exists() else None)
        print("✅  Chest X-ray model loaded.")
 
 
# ─── Schemas ─────────────────────────────────────────────────────────────────
 
class SymptomRequest(BaseModel):
    symptoms: list[str]
    patient_info: Optional[dict] = {}
 
 
class HealthResponse(BaseModel):
    prediction:      str
    confidence:      float
    risk_level:      str
    explanation:     str
    top_conditions:  list[dict]
    recommended_actions: list[str]
 
 
# ─── Utility ─────────────────────────────────────────────────────────────────
 
def confidence_to_risk(conf: float) -> str:
    if conf >= 0.75:
        return "High"
    elif conf >= 0.45:
        return "Medium"
    return "Low"
 
 
def get_actions(prediction: str, risk: str) -> list[str]:
    base = ["Consult a licensed medical professional for a definitive diagnosis."]
    if risk == "High":
        base += [
            "Seek immediate medical attention.",
            "Do not self-medicate based on AI output.",
            "Bring this AI report to your doctor.",
        ]
    elif risk == "Medium":
        base += [
            "Schedule a doctor's appointment within the next 48 hours.",
            "Monitor symptoms closely and rest adequately.",
        ]
    else:
        base += [
            "Continue to monitor your symptoms.",
            "Maintain a healthy diet, sleep, and hydration.",
        ]
    return base
 
 
# ─── Routes ──────────────────────────────────────────────────────────────────
 
@app.get("/")
async def root():
    return {"message": "OmniHealth AI API is running 🧠", "version": "1.0.0"}
 
 
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "models": {
            "symptom": symptom_predictor is not None,
            "brain":   brain_predictor is not None,
            "chest":   chest_predictor is not None,
        },
    }
 
 
@app.post("/predict-symptoms", response_model=HealthResponse)
async def predict_symptoms(req: SymptomRequest):
    if symptom_predictor is None:
        raise HTTPException(503, "Symptom model not loaded. Run train_all_models.py first.")
 
    result = symptom_predictor.predict(req.symptoms)
 
    risk    = confidence_to_risk(result["confidence"])
    actions = get_actions(result["prediction"], risk)
 
    return HealthResponse(
        prediction=result["prediction"],
        confidence=round(result["confidence"] * 100, 1),
        risk_level=risk,
        explanation=result.get("explanation", f"Based on {len(req.symptoms)} reported symptom(s), the model identified {result['prediction']} as the most probable condition."),
        top_conditions=result.get("top_conditions", []),
        recommended_actions=actions,
    )
 
 
@app.post("/predict-image")
async def predict_image(
    file:       UploadFile = File(...),
    model_type: str = "chest",  # "chest" | "brain"
    gradcam:    bool = True,
):
    predictor = chest_predictor if model_type == "chest" else brain_predictor
 
    if predictor is None:
        raise HTTPException(503, f"{model_type} model not loaded. Run train_all_models.py first.")
 
    image_bytes = await file.read()
 
    result = predictor.predict(image_bytes, generate_gradcam=gradcam)
 
    risk    = confidence_to_risk(result["confidence"] / 100)
    actions = get_actions(result["prediction"], risk)
 
    response = {
        "prediction":           result["prediction"],
        "confidence":           result["confidence"],
        "risk_level":           risk,
        "class_probabilities":  result.get("class_probabilities", {}),
        "explanation":          f"Image analysis with {model_type.upper()} model detected {result['prediction']} with {result['confidence']:.1f}% confidence.",
        "recommended_actions":  actions,
    }
 
    if result.get("gradcam_b64"):
        response["gradcam_image"] = result["gradcam_b64"]
 
    return JSONResponse(content=response)