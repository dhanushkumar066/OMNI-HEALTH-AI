import os
import sys
import json
import pickle
import warnings
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # headless
import matplotlib.pyplot as plt
from pathlib import Path
 
warnings.filterwarnings("ignore")
 
MODELS_DIR = Path("models")
DATA_DIR   = Path("data")
MODELS_DIR.mkdir(exist_ok=True)
 
# ══════════════════════════════════════════════════════════════════════════════
#  1.  SYMPTOM MODEL  (Random Forest + XGBoost)
# ══════════════════════════════════════════════════════════════════════════════
 
def train_symptom_model():
    model_path = MODELS_DIR / "symptom_model.pkl"
    meta_path  = MODELS_DIR / "symptom_meta.json"
 
    if model_path.exists():
        print("✅  [Symptom] Model exists — loading.")
        with open(model_path, "rb") as f:
            bundle = pickle.load(f)
        return bundle
 
    print("\n🧠  [Symptom] Training model ...")
 
    # ── Load Dataset ──────────────────────────────────────────────────────────
    data_dir = DATA_DIR / "symptoms"
 
    # Try multiple filename patterns
    candidates = list(data_dir.glob("*.csv"))
    if not candidates:
        print("❌  Symptom dataset not found. Run download_datasets.py first.")
        sys.exit(1)
 
    # Find the main dataset file
    df = None
    for c in candidates:
        if "dataset" in c.name.lower() or "symptom" in c.name.lower():
            df = pd.read_csv(c)
            print(f"    Loaded: {c.name} ({len(df)} rows)")
            break
    if df is None:
        df = pd.read_csv(candidates[0])
        print(f"    Loaded: {candidates[0].name} ({len(df)} rows)")
 
    # ── Preprocess ────────────────────────────────────────────────────────────
    # The dataset has 'Disease' as target and symptom columns
    target_col = None
    for col in df.columns:
        if col.lower() in ("disease", "prognosis"):
            target_col = col
            break
    if target_col is None:
        target_col = df.columns[0]
 
    df.dropna(subset=[target_col], inplace=True)
    df.fillna("0", inplace=True)
 
    # Strip whitespace from string columns
    for col in df.select_dtypes(include="object").columns:
        df[col] = df[col].str.strip()
 
    X = df.drop(columns=[target_col])
    y = df[target_col]
 
    # Encode non-numeric features
    from sklearn.preprocessing import LabelEncoder
    feature_encoders = {}
    for col in X.select_dtypes(include="object").columns:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))
        feature_encoders[col] = le
 
    disease_encoder = LabelEncoder()
    y_enc = disease_encoder.fit_transform(y)
 
    feature_names = list(X.columns)
    class_names   = list(disease_encoder.classes_)
 
    from sklearn.model_selection import train_test_split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
    )
 
    # ── Train ─────────────────────────────────────────────────────────────────
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
 
    model = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
 
    y_pred = model.predict(X_test)
    acc    = accuracy_score(y_test, y_pred)
    print(f"    Accuracy: {acc*100:.2f}%")
 
    # ── Feature Importance Plot ───────────────────────────────────────────────
    importances  = model.feature_importances_
    top_n        = min(20, len(feature_names))
    top_idx      = np.argsort(importances)[::-1][:top_n]
    top_features = [feature_names[i] for i in top_idx]
    top_scores   = importances[top_idx]
 
    fig, ax = plt.subplots(figsize=(10, 6))
    bars = ax.barh(top_features[::-1], top_scores[::-1], color="#6366f1")
    ax.set_xlabel("Importance Score")
    ax.set_title("Top Symptom Feature Importances")
    plt.tight_layout()
    plt.savefig(MODELS_DIR / "symptom_feature_importance.png", dpi=120)
    plt.close()
    print("    📊  Feature importance plot saved.")
 
    # ── Confusion Matrix ──────────────────────────────────────────────────────
    cm = confusion_matrix(y_test, y_pred)
    fig, ax = plt.subplots(figsize=(max(8, len(class_names)//2), max(6, len(class_names)//2)))
    im = ax.imshow(cm, interpolation="nearest", cmap="Blues")
    ax.set_title("Symptom Model — Confusion Matrix")
    plt.colorbar(im, ax=ax)
    plt.tight_layout()
    plt.savefig(MODELS_DIR / "symptom_confusion_matrix.png", dpi=120)
    plt.close()
 
    # ── Save Bundle ───────────────────────────────────────────────────────────
    bundle = {
        "model":            model,
        "disease_encoder":  disease_encoder,
        "feature_encoders": feature_encoders,
        "feature_names":    feature_names,
        "class_names":      class_names,
        "accuracy":         acc,
    }
    with open(model_path, "wb") as f:
        pickle.dump(bundle, f)
 
    with open(meta_path, "w") as f:
        json.dump({"class_names": class_names, "feature_names": feature_names, "accuracy": acc}, f, indent=2)
 
    print(f"✅  [Symptom] Model saved → {model_path}")
    return bundle
 
 
# ══════════════════════════════════════════════════════════════════════════════
#  2.  LIVER MODEL  (XGBoost)
# ══════════════════════════════════════════════════════════════════════════════
 
def train_liver_model():
    model_path = MODELS_DIR / "liver_model.pkl"
 
    if model_path.exists():
        print("✅  [Liver] Model exists — loading.")
        with open(model_path, "rb") as f:
            return pickle.load(f)
 
    print("\n🫀  [Liver] Training model ...")
 
    csv_candidates = list((DATA_DIR / "liver").glob("*.csv"))
    if not csv_candidates:
        print("⚠️   Liver dataset not found — skipping.")
        return None
 
    df = pd.read_csv(csv_candidates[0])
    print(f"    Loaded: {csv_candidates[0].name} ({len(df)} rows)")
 
    # Encode gender
    from sklearn.preprocessing import LabelEncoder
    df["Gender"] = LabelEncoder().fit_transform(df["Gender"].astype(str))
    df.fillna(df.mean(numeric_only=True), inplace=True)
 
    target_col = "Dataset"
    X = df.drop(columns=[target_col])
    y = (df[target_col] == 1).astype(int)
 
    from sklearn.model_selection import train_test_split
    from sklearn.ensemble import GradientBoostingClassifier
    from sklearn.metrics import accuracy_score
 
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = GradientBoostingClassifier(n_estimators=150, random_state=42)
    model.fit(X_train, y_train)
 
    acc = accuracy_score(y_test, model.predict(X_test))
    print(f"    Accuracy: {acc*100:.2f}%")
 
    bundle = {"model": model, "feature_names": list(X.columns), "accuracy": acc}
    with open(model_path, "wb") as f:
        pickle.dump(bundle, f)
    print(f"✅  [Liver] Model saved → {model_path}")
    return bundle
 
 
# ══════════════════════════════════════════════════════════════════════════════
#  3.  CNN MODELS  (Brain MRI + Chest X-ray)
# ══════════════════════════════════════════════════════════════════════════════
 
def build_cnn(num_classes: int, input_shape=(224, 224, 3)):
    """MobileNetV2-based transfer learning model."""
    import tensorflow as tf
    from tensorflow.keras import layers, Model
    from tensorflow.keras.applications import MobileNetV2
 
    base = MobileNetV2(input_shape=input_shape, include_top=False, weights="imagenet")
    base.trainable = False  # freeze base
 
    inputs = tf.keras.Input(shape=input_shape)
    x = base(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.Dropout(0.4)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)
 
    model = Model(inputs, outputs)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model
 
 
def get_image_generators(train_dir, val_dir, img_size=(224, 224), batch=32):
    from tensorflow.keras.preprocessing.image import ImageDataGenerator
 
    train_gen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=15,
        zoom_range=0.1,
        horizontal_flip=True,
        width_shift_range=0.1,
        height_shift_range=0.1,
    )
    val_gen = ImageDataGenerator(rescale=1./255)
 
    train_data = train_gen.flow_from_directory(train_dir, target_size=img_size, batch_size=batch, class_mode="categorical")
    val_data   = val_gen.flow_from_directory(val_dir,   target_size=img_size, batch_size=batch, class_mode="categorical")
    return train_data, val_data
 
 
def save_training_plots(history, prefix: str):
    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
 
    axes[0].plot(history.history["accuracy"],     label="Train")
    axes[0].plot(history.history["val_accuracy"], label="Val")
    axes[0].set_title(f"{prefix} — Accuracy")
    axes[0].legend()
 
    axes[1].plot(history.history["loss"],     label="Train")
    axes[1].plot(history.history["val_loss"], label="Val")
    axes[1].set_title(f"{prefix} — Loss")
    axes[1].legend()
 
    plt.tight_layout()
    plt.savefig(MODELS_DIR / f"{prefix.lower().replace(' ', '_')}_training.png", dpi=120)
    plt.close()
    print(f"    📊  Training plot saved for {prefix}.")
 
 
def find_split_dirs(base: Path, names=("Training", "Testing", "train", "test", "Train", "Test")):
    """Find train/val directories, with fallback to auto-split."""
    train_dir = val_dir = None
    for n in ("Training", "train", "Train"):
        candidate = base / n
        if candidate.exists():
            train_dir = candidate
            break
    for n in ("Testing", "test", "Test", "Validation", "valid", "Val"):
        candidate = base / n
        if candidate.exists():
            val_dir = candidate
            break
    return train_dir, val_dir
 
 
def train_brain_model():
    model_path = MODELS_DIR / "brain_model.h5"
    meta_path  = MODELS_DIR / "brain_meta.json"
 
    if model_path.exists():
        print("✅  [Brain MRI] Model exists — loading.")
        import tensorflow as tf
        model = tf.keras.models.load_model(str(model_path))
        meta  = json.load(open(meta_path)) if meta_path.exists() else {}
        return model, meta
 
    print("\n🧠  [Brain MRI] Training CNN ...")
 
    brain_dir  = DATA_DIR / "brain_mri"
    train_dir, val_dir = find_split_dirs(brain_dir)
 
    if train_dir is None:
        print("⚠️   Brain MRI train folder not found — skipping.")
        return None, {}
 
    train_data, val_data = get_image_generators(str(train_dir), str(val_dir or train_dir))
    num_classes = len(train_data.class_indices)
    class_names = list(train_data.class_indices.keys())
    print(f"    Classes: {class_names}")
 
    model   = build_cnn(num_classes)
    history = model.fit(train_data, validation_data=val_data, epochs=10, verbose=1)
 
    save_training_plots(history, "Brain MRI")
 
    model.save(str(model_path))
    meta = {"class_names": class_names, "accuracy": float(max(history.history["val_accuracy"]))}
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
 
    print(f"✅  [Brain MRI] Model saved → {model_path}")
    return model, meta
 

 
def train_chest_model():
    model_path = MODELS_DIR / "chest_model.h5"
    meta_path  = MODELS_DIR / "chest_meta.json"
 
    if model_path.exists():
        print("✅  [Chest X-ray] Model exists — loading.")
        import tensorflow as tf
        model = tf.keras.models.load_model(str(model_path))
        meta  = json.load(open(meta_path)) if meta_path.exists() else {}
        return model, meta
 
    print("\n🫁  [Chest X-ray] Training CNN ...")
 
    chest_dir  = DATA_DIR / "chest_xray"
    train_dir, val_dir = find_split_dirs(chest_dir)
 
    if train_dir is None:
        print("⚠️   Chest X-ray train folder not found — skipping.")
        return None, {}
 
    train_data, val_data = get_image_generators(str(train_dir), str(val_dir or train_dir))
    num_classes = len(train_data.class_indices)
    class_names = list(train_data.class_indices.keys())
    print(f"    Classes: {class_names}")
 
    model   = build_cnn(num_classes)
    history = model.fit(train_data, validation_data=val_data, epochs=10, verbose=1)
 
    save_training_plots(history, "Chest X-ray")
 
    model.save(str(model_path))
    meta = {"class_names": class_names, "accuracy": float(max(history.history["val_accuracy"]))}
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
 
    print(f"✅  [Chest X-ray] Model saved → {model_path}")
    return model, meta
 
 
# ══════════════════════════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════════════════════════
 
def main():
    print("=" * 60)
    print("  OmniHealth AI — Training Pipeline")
    print("=" * 60)
 
    # 1. Symptom
    train_symptom_model()
 
    # 2. Liver
    train_liver_model()
 
    # 3. CNN models (require TensorFlow)
    try:
        import tensorflow as tf
        print(f"\n    TensorFlow {tf.__version__} detected.")
        train_brain_model()
        train_chest_model()
    except ImportError:
        print("\n⚠️   TensorFlow not installed — skipping CNN training.")
        print("     Run: pip install tensorflow")
 
    print("\n" + "=" * 60)
    print("  All models trained/loaded!")
    print("  Next: cd ai-backend && uvicorn main:app --port 8000")
    print("=" * 60)
 
 
if __name__ == "__main__":
    main()
 