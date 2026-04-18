import io
import json
import base64
import numpy as np
from pathlib import Path
from typing import Optional
 
 
class ImagePredictor:
    def __init__(self, model_path: str, meta_path: Optional[str] = None):
        import tensorflow as tf
        self.model       = tf.keras.models.load_model(model_path)
        self.img_size    = (224, 224)
        self.class_names = []
 
        if meta_path and Path(meta_path).exists():
            with open(meta_path) as f:
                meta = json.load(f)
            self.class_names = meta.get("class_names", [])
 
    def _preprocess(self, image_bytes: bytes) -> np.ndarray:
        from PIL import Image
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize(self.img_size)
        arr = np.array(img, dtype=np.float32) / 255.0
        return np.expand_dims(arr, axis=0)
 
    def predict(self, image_bytes: bytes, generate_gradcam: bool = True) -> dict:
        import tensorflow as tf
 
        img_tensor = self._preprocess(image_bytes)
        proba      = self.model.predict(img_tensor, verbose=0)[0]
 
        class_idx   = int(np.argmax(proba))
        confidence  = float(proba[class_idx]) * 100
        prediction  = self.class_names[class_idx] if self.class_names else str(class_idx)
 
        class_probabilities = {}
        for i, p in enumerate(proba):
            name = self.class_names[i] if i < len(self.class_names) else str(i)
            class_probabilities[name] = round(float(p) * 100, 1)
 
        result = {
            "prediction":          prediction,
            "confidence":          round(confidence, 1),
            "class_probabilities": class_probabilities,
            "gradcam_b64":         None,
        }
 
        if generate_gradcam:
            try:
                result["gradcam_b64"] = self._compute_gradcam(img_tensor, class_idx, image_bytes)
            except Exception as e:
                print(f"    Grad-CAM failed: {e}")
 
        return result
 
    def _compute_gradcam(self, img_tensor: np.ndarray, class_idx: int, orig_bytes: bytes) -> str:
        """Generate Grad-CAM heatmap overlay as base64 PNG."""
        import tensorflow as tf
        import cv2
        from PIL import Image
 
        # Find last conv layer
        last_conv = None
        for layer in reversed(self.model.layers):
            if isinstance(layer, (tf.keras.layers.Conv2D,)):
                last_conv = layer
                break
            # Handle nested MobileNet
            if hasattr(layer, "layers"):
                for sub in reversed(layer.layers):
                    if isinstance(sub, tf.keras.layers.Conv2D):
                        last_conv = sub
                        break
                if last_conv:
                    break
 
        if last_conv is None:
            return ""
 
        grad_model = tf.keras.Model(
            inputs=self.model.input,
            outputs=[last_conv.output, self.model.output],
        )
 
        with tf.GradientTape() as tape:
            inputs        = tf.cast(img_tensor, tf.float32)
            conv_out, preds = grad_model(inputs)
            loss          = preds[:, class_idx]
 
        grads   = tape.gradient(loss, conv_out)
        pooled  = tf.reduce_mean(grads, axis=(0, 1, 2))
        cam     = tf.reduce_sum(tf.multiply(pooled, conv_out[0]), axis=-1)
        cam     = tf.nn.relu(cam)
        cam     = cam.numpy()
 
        # Normalize
        cam_min, cam_max = cam.min(), cam.max()
        if cam_max - cam_min > 0:
            cam = (cam - cam_min) / (cam_max - cam_min)
 
        # Resize to original image size
        cam_resized = cv2.resize(cam, self.img_size)
        heatmap     = cv2.applyColorMap(np.uint8(255 * cam_resized), cv2.COLORMAP_JET)
 
        # Overlay on original image
        orig_img = Image.open(io.BytesIO(orig_bytes)).convert("RGB").resize(self.img_size)
        orig_arr = np.array(orig_img)
        overlay  = cv2.addWeighted(orig_arr, 0.6, heatmap[:, :, ::-1], 0.4, 0)
 
        # Encode to base64
        _, buf = cv2.imencode(".png", overlay[:, :, ::-1])
        return base64.b64encode(buf.tobytes()).decode("utf-8")
 