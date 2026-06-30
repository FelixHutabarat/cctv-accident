from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import os
import threading
from pyngrok import ngrok

app = Flask(__name__)
CORS(app)  # WAJIB karena sekarang ada cross-origin request dari Vercel

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'accident_model.keras')

print("Loading model...")
model = tf.keras.models.load_model(MODEL_PATH)
print("Model loaded.")

IMG_HEIGHT  = 224
IMG_WIDTH   = 224
CLASS_NAMES = ['Accident', 'Non Accident']

def predict_image(image_bytes):
    img       = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    img       = img.resize((IMG_WIDTH, IMG_HEIGHT))
    img_array = np.array(img, dtype=np.float32) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    prediction = model.predict(img_array, verbose=0)
    prob       = float(prediction[0][0])  # prob = P(Non Accident), karena index 1 = Non Accident
    label      = CLASS_NAMES[int(prob > 0.5)]

    accident_prob     = round((1 - prob) * 100, 1)  # P(Accident) = 1 - prob
    non_accident_prob = round(prob * 100, 1)         # P(Non Accident) = prob

    return label, accident_prob, non_accident_prob


@app.route('/', methods=['GET'])
def home():
    return jsonify({'status': 'online', 'message': 'CNN Accident Detection API'})


@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'Tidak ada file'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'File kosong'}), 400

    try:
        image_bytes = file.read()
        label, accident_prob, non_accident_prob = predict_image(image_bytes)

        return jsonify({
            'label'            : label,
            'accident_prob'    : accident_prob,
            'non_accident_prob': non_accident_prob,
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    NGROK_AUTHTOKEN = "2xH1yLJA0zzAGofS8b3Io6gxs5b_6WsPDsHAqyUpzbgAd18nf"
    ngrok.set_auth_token(NGROK_AUTHTOKEN)

    public_url = ngrok.connect(5000)
    print("=" * 60)
    print(f"Public URL (ngrok): {public_url}")
    print("Salin URL di atas ke PREDICT_URL di scripts.js, lalu deploy ulang/refresh Vercel")
    print("=" * 60)

    threading.Thread(
        target=lambda: app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)
    ).start()