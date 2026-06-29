from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import os
import gdown

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "accident_model.keras")
FILE_ID = "1QWW-R6f6LFquteS1AEPGGl2xaqszP6L8"

if not os.path.exists(MODEL_PATH):
    print("Downloading model...")
    gdown.download(
        id=FILE_ID,
        output=MODEL_PATH,
        quiet=False
    )
    print("Download selesai!")

print("Loading model...")
model = tf.keras.models.load_model(MODEL_PATH)
print("Model loaded.")

IMG_HEIGHT = 224
IMG_WIDTH = 224
CLASS_NAMES = [
    "Non Accident",
    "Accident"
]

# Function untuk prediksi
def predict_image(image_bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((IMG_WIDTH, IMG_HEIGHT))
    img_array = np.array(img, dtype=np.float32) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    prediction = model.predict(img_array, verbose=0)
    prob = float(prediction[0][0])
    label = CLASS_NAMES[int(prob > 0.5)]
    return label, prob

# Untuk tes, connect atau tidak
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "online",
        "message": "CNN Accident Detection API"
    })

# Untuk prediksi.
@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({
            "error": "Tidak ada file."
        }), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({
            "error": "File kosong."
        }), 400
    try:
        image_bytes = file.read()
        label, prob = predict_image(image_bytes)
        return jsonify({
            "label": label,
            "accident_prob": round(prob * 100, 2),
            "non_accident_prob": round((1 - prob) * 100, 2)
        })
    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000, debug=True)