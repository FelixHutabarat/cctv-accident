# Accident Detection (CNN Image Classifier)

Sistem klasifikasi gambar berbasis CNN untuk mendeteksi apakah sebuah gambar menunjukkan kondisi **kecelakaan (Accident)** atau **bukan kecelakaan (Non Accident)**. Proyek ini terdiri dari backend Flask yang menjalankan model Keras untuk inferensi, dan frontend statis (HTML/CSS/JS) yang menyediakan antarmuka upload gambar dan menampilkan hasil prediksi.

## Tech Stack & Arsitektur

**Model & Training**
- TensorFlow / Keras — CNN dibangun from scratch (3 layer konvolusi + dense layer)
- Input gambar: 224×224 piksel, RGB
- Output: 1 neuron dengan aktivasi sigmoid (binary classification)
- Format model: `.keras` (native Keras format)

**Backend**
- Python + Flask — REST API untuk inferensi
- Flask-CORS — mengizinkan request lintas origin dari frontend
- Pillow (PIL) — preprocessing gambar (resize, konversi RGB)
- NumPy — manipulasi array gambar sebelum masuk ke model
- ngrok (pyngrok) — expose server lokal ke URL publik untuk testing/demo

**Frontend**
- HTML, CSS, JavaScript murni (tanpa framework)
- Fetch API — komunikasi dengan endpoint `/predict` milik backend
- Drag-and-drop & file picker untuk upload gambar
- Deploy: Vercel (static hosting)

**Arsitektur Alur Kerja**

```
┌─────────────────┐         POST /predict          ┌──────────────────┐
│   Frontend       │  ────── (FormData: file) ────► │   Backend Flask   │
│  (Vercel/Static) │                                 │  (ngrok tunnel)   │
│                  │  ◄──── JSON response ────────── │                   │
│  index.html      │   { label, accident_prob,       │  model.keras      │
│  scripts.js      │     non_accident_prob }          │  (CNN inference)  │
└─────────────────┘                                 └──────────────────┘
```

1. Pengguna upload/drag gambar di frontend.
2. Frontend mengirim file via `fetch()` ke endpoint `/predict` backend (URL ngrok atau domain produksi).
3. Backend melakukan preprocessing (resize 224×224, normalisasi 0–1), menjalankan `model.predict()`.
4. Backend mengembalikan label klasifikasi beserta persentase probabilitas masing-masing kelas dalam format JSON.
5. Frontend menampilkan hasil (badge label + progress bar persentase) tanpa reload halaman.

## Struktur Folder Proyek

```
project/
├── model/
│   ├── app.py                 # Flask API: load model, endpoint /predict
│   └── accident_model.keras   # File model hasil training (Keras format)
│
├── web/
│   ├── index.html             # Halaman utama (UI upload & hasil prediksi)
│   ├── scripts.js             # Logic frontend: drag-drop, fetch ke /predict, render hasil
│   └── style.css              # Styling halaman (asumsi nama file, sesuaikan jika berbeda)
│
└── README.md
```

**Catatan struktur:**
- Folder `model/` dan `web/` berada **sejajar** (sibling), bukan bersarang satu sama lain.
- `app.py` memuat model dari path absolut (`BASE_DIR`) sehingga dapat dijalankan dari direktori kerja mana pun.
- Frontend di `web/` bersifat statis sepenuhnya — tidak memerlukan build step, cocok untuk deploy langsung ke Vercel.

## Class Mapping

Model dilatih dengan urutan kelas berikut (sesuai `class_indices` saat training):

| Index | Kelas       |
|-------|-------------|
| 0     | Accident     |
| 1     | Non Accident |

Output sigmoid dari model merepresentasikan `P(Non Accident)`. Backend mengonversi nilai ini menjadi probabilitas masing-masing kelas:

```python
accident_prob     = (1 - prob) * 100
non_accident_prob = prob * 100
```

## Catatan Pengembangan

- Saat menjalankan backend secara lokal untuk development, URL ngrok berubah setiap kali server di-restart (kecuali menggunakan domain custom ngrok berbayar) — perlu update `PREDICT_URL` di `scripts.js` setiap sesi baru.
- Untuk testing lokal tanpa ngrok, jalankan backend di `127.0.0.1:5000` dan frontend lewat local server (misal `python -m http.server` atau ekstensi Live Server), lalu arahkan `PREDICT_URL` ke `http://127.0.0.1:5000/predict`.
- Jangan commit token/API key (termasuk ngrok authtoken) ke repository — gunakan environment variable atau secrets manager.
