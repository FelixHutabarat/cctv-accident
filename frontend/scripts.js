/* ===== Nav Toggle ===== */
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

navToggle.addEventListener("click", () => {
  navToggle.classList.toggle("active");
  navLinks.classList.toggle("open");
  document.body.style.overflow = navLinks.classList.contains("open")
    ? "hidden"
    : "";
  navToggle.setAttribute(
    "aria-expanded",
    navToggle.classList.contains("active"),
  );
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navToggle.classList.remove("active");
    navLinks.classList.remove("open");
    document.body.style.overflow = "";
    navToggle.setAttribute("aria-expanded", "false");
  });
});

/* ===== Scroll Reveal ===== */
const prefersReduced = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

if (!prefersReduced) {
  const reveals = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          entry.target.style.transitionDelay = `${i * 60}ms`;
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
  );
  reveals.forEach((el) => observer.observe(el));
  setTimeout(() => reveals.forEach((el) => el.classList.add("visible")), 3000);
} else {
  document
    .querySelectorAll(".reveal")
    .forEach((el) => el.classList.add("visible"));
}

/* ===== FAQ Accordion ===== */
function faqOpen(item) {
  const answer = item.querySelector(".faq-answer");
  item.classList.add("open");
  answer.style.maxHeight = answer.scrollHeight + "px";
  item.querySelector(".faq-question").setAttribute("aria-expanded", "true");
}

function faqClose(item) {
  const answer = item.querySelector(".faq-answer");
  item.classList.remove("open");
  answer.style.maxHeight = "0";
  item.querySelector(".faq-question").setAttribute("aria-expanded", "false");
}

document.querySelectorAll(".faq-question").forEach((btn) => {
  btn.addEventListener("click", () => {
    const item = btn.closest(".faq-item");
    item.classList.contains("open") ? faqClose(item) : faqOpen(item);
  });
});

/* ===== Drop Zone & Upload ke /predict ===== */
const dropZone = document.getElementById("dropZone");
const demoResult = document.getElementById("demoResult");

// Hidden file input
const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = "image/*";
fileInput.style.display = "none";
document.body.appendChild(fileInput);

dropZone.addEventListener("click", (e) => {
  if (e.target.closest("button")) return;
  fileInput.click();
});

// Drag & drop
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});
dropZone.addEventListener("dragleave", () =>
  dropZone.classList.remove("drag-over"),
);
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  const file = e.dataTransfer.files[0];
  if (file) processFile(file);
});

fileInput.addEventListener("change", () => {
  if (fileInput.files[0]) processFile(fileInput.files[0]);
});

/* ===== Tombol "Simulasi Klasifikasi" → trigger upload ===== */
function simulateClassify() {
  fileInput.click();
}

/* ===== Endpoint backend Flask =====
   Karena Flask sekarang menyajikan index.html & scripts.js dari folder yang sama
   (lihat app.py: send_from_directory(WEB_FOLDER, ...)), kita bisa pakai path
   relatif "/predict" — otomatis mengarah ke origin yang sama, tidak perlu
   menulis domain/ngrok URL secara hardcode. */
const PREDICT_URL = "https://e2e8-2001-448a-1082-a01f-a4af-6e30-3854-c320.ngrok-free.app/predict";

/* ===== Proses file & kirim ke backend untuk prediksi ===== */
function processFile(file) {
  const reader = new FileReader();

  // Tampilkan preview gambar di Drop Zone
  reader.onload = (e) => {
    dropZone.style.backgroundImage = `url(${e.target.result})`;
    dropZone.style.backgroundSize = "cover";
    dropZone.style.backgroundPosition = "center";
    dropZone.querySelector("p").textContent = "Memproses…";
    dropZone.querySelector("span").textContent = "";

    sendToServer(file);
  };

  reader.readAsDataURL(file);
}

/* ===== Kirim file ke backend Flask (/predict) ===== */
async function sendToServer(file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(PREDICT_URL, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server error: ${res.status}`);
    }

    const data = await res.json();

    showResult({
      label: data.label,
      accident_prob: data.accident_prob,
      non_accident_prob: data.non_accident_prob,
    });
  } catch (err) {
    console.error("Gagal melakukan klasifikasi:", err);
    showError();
  }
}

/* ===== Tampilkan hasil prediksi ===== */
function showResult(data) {
  const isAccident = data.label === "Accident";
  const badgeAccident = document.getElementById("resultBadgeAccident");
  const badgeSafe = document.getElementById("resultBadgeSafe");
  const accConf = document.getElementById("accConf");
  const safeConf = document.getElementById("safeConf");
  const accBar = document.getElementById("accBar");
  const safeBar = document.getElementById("safeBar");

  badgeAccident.style.display = isAccident ? "inline-flex" : "none";
  badgeSafe.style.display = isAccident ? "none" : "inline-flex";

  accConf.textContent = data.accident_prob + "%";
  safeConf.textContent = data.non_accident_prob + "%";
  accBar.style.width = data.accident_prob + "%";
  safeBar.style.width = data.non_accident_prob + "%";

  accBar.style.background = isAccident ? "var(--accent)" : "var(--text-dim)";
  safeBar.style.background = isAccident ? "var(--text-dim)" : "var(--safe)";

  demoResult.style.display = "block";

  dropZone.querySelector("p").textContent = "Klik untuk upload gambar lain";
  dropZone.querySelector("span").textContent = "JPG, PNG, WEBP — maks. 10MB";
}

function showError() {
  dropZone.querySelector("p").textContent = "Terjadi kesalahan, coba lagi.";
  dropZone.querySelector("span").textContent = "";
}