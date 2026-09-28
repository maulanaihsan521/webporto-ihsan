/**
 * Luruskan sertifikat PKL Malibu 62 Studio yang miring ~2-3 derajat.
 * Strategi: generate kandidat rotasi (dua arah, beberapa sudut) + crop
 * inscribed rectangle (aspect ratio dipertahankan, tanpa area kosong),
 * lalu pilih yang terlurus via VLM di step berikutnya.
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "download", "cert-source", "raw-1KeppsS-e-FmDNhUlvo3BrLQNygwAF3Ri.bin");
const OUT = path.join(__dirname, "..", "download", "cert-source", "candidates");
fs.mkdirSync(OUT, { recursive: true });

// Sudut kandidat (derajat). Negatif = berlawanan jarum jam (sharp: positif = searah jarum jam)
const ANGLES = [-3.0, -2.5, -2.0, 2.0, 2.5, 3.0];

async function makeCandidate(normalized, angle, forVlm) {
  const meta = await sharp(normalized).metadata();
  const W = meta.width, H = meta.height;
  const rad = (Math.abs(angle) * Math.PI) / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);

  // Crop inscribed rectangle ber-aspect sama di dalam konten hasil rotasi:
  // constraint: a·cosθ + b·sinθ ≤ W/2 dan a·sinθ + b·cosθ ≤ H/2, dengan a/b = W/H
  const r = W / H;
  const b = Math.min((W / 2) / (r * cos + sin), (H / 2) / (r * sin + cos));
  const a = r * b;
  const cw = Math.round(2 * a), ch = Math.round(2 * b);

  // Canvas hasil rotasi (sharp auto-expand)
  const W2 = Math.round(W * cos + H * sin);
  const H2 = Math.round(W * sin + H * cos);
  const left = Math.round((W2 - cw) / 2);
  const top = Math.round((H2 - ch) / 2);

  let pipeline = sharp(normalized)
    .rotate(angle, { background: "#ffffff" })
    .extract({ left, top, width: cw, height: ch });

  if (forVlm) {
    // versi kecil untuk input VLM
    pipeline = pipeline.resize({ height: 900 });
  }
  return pipeline;
}

async function main() {
  // 1) Normalisasi EXIF dulu (orientasi final)
  const normalized = await sharp(SRC).rotate().toBuffer();
  const meta = await sharp(normalized).metadata();
  console.log(`Source setelah EXIF-normalize: ${meta.width}x${meta.height}`);

  // 2) Kandidat untuk VLM (kecil, JPEG)
  const manifest = [];
  // index 0 = original (referensi)
  await sharp(normalized).resize({ height: 900 }).jpeg({ quality: 88 }).toFile(path.join(OUT, "c0-original.jpg"));
  manifest.push({ idx: 0, angle: 0, label: "original (tidak dirotasi)" });
  console.log("c0-original.jpg (angle 0)");

  for (let i = 0; i < ANGLES.length; i++) {
    const angle = ANGLES[i];
    const idx = i + 1;
    const file = path.join(OUT, `c${idx}.jpg`);
    await (await makeCandidate(normalized, angle, true)).jpeg({ quality: 88 }).toFile(file);
    manifest.push({ idx, angle, label: `${angle > 0 ? "+" : ""}${angle}°` });
    console.log(`c${idx}.jpg (angle ${angle})`);
  }

  // 3) Simpan manifest
  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log("Selesai. Manifest:", manifest.map((m) => `${m.idx}:${m.angle}`).join(" "));
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
