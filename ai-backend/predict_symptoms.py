import pickle
import numpy as np
from pathlib import Path
from typing import Optional
 
 
class SymptomPredictor:
    def __init__(self, model_path: str):
        with open(model_path, "rb") as f:
            bundle = pickle.load(f)
 
        self.model           = bundle["model"]
        self.disease_encoder = bundle["disease_encoder"]
        self.feature_names   = bundle["feature_names"]
        self.class_names     = bundle["class_names"]
 
    def predict(self, symptoms: list[str]) -> dict:
        """
        Predict disease from list of symptom strings.
        Symptoms are matched against known feature names (flexible matching).
        """
        # Build feature vector
        input_vec = np.zeros(len(self.feature_names))
 
        symptoms_lower = [s.lower().replace(" ", "_") for s in symptoms]
 
        matched = []
        for i, feat in enumerate(self.feature_names):
            feat_lower = feat.lower().replace(" ", "_")
            if any(sym in feat_lower or feat_lower in sym for sym in symptoms_lower):
                input_vec[i] = 1
                matched.append(feat)
 
        if not matched:
            # Fallback: try partial match
            for i, feat in enumerate(self.feature_names):
                for sym in symptoms_lower:
                    if sym[:5] in feat.lower() or feat.lower()[:5] in sym:
                        input_vec[i] = 1
                        matched.append(feat)
                        break
 
        # Predict
        proba = self.model.predict_proba(input_vec.reshape(1, -1))[0]
        top_k = np.argsort(proba)[::-1][:5]
 
        prediction  = self.class_names[top_k[0]]
        confidence  = float(proba[top_k[0]])
 
        top_conditions = [
            {"disease": self.class_names[i], "probability": round(float(proba[i]) * 100, 1)}
            for i in top_k
        ]
 
        explanation = (
            f"The AI matched {len(matched)} symptom feature(s): {', '.join(matched[:5])}. "
            f"Based on pattern recognition across the training dataset, "
            f"'{prediction}' emerged as the most probable condition."
        )
 
        return {
            "prediction":    prediction,
            "confidence":    confidence,
            "top_conditions": top_conditions,
            "matched_features": matched,
            "explanation":   explanation,
        }