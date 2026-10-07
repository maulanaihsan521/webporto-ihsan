// Proses 16 icon maskot untuk Skills & Services:
// trim transparan → square 256x256 contain → webp q82
// Sumber: 12 cell batch-2 (/tmp/mascot2-cells) + 4 cell batch-1 lama (/tmp/mascot-cells)
// Output: public/images/mascots/*.webp
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const B2 = "/tmp/mascot2-cells"; // batch 2 (12 pose)
const B1 = "/tmp/mascot-cells";  // batch 1 (8 pose, 4 sudah dipakai About)
const OUT = "/home/z/my-project/public/images/mascots";
fs.mkdirSync(OUT, { recursive: true });

const PICKS = [
  // Proses 4 Langkah (services)
  { src: `${B2}/cell-1.png`,  name: "mascot-discover" },      // kaca pembesar
  { src: `${B2}/cell-10.png`, name: "mascot-plan" },          // clipboard checklist
  { src: `${B2}/cell-3.png`,  name: "mascot-execute" },       // laptop + tangan terangkat
  { src: `${B1}/cell-7.png`,  name: "mascot-deliver" },       // melambai (serah terima)
  // Kenapa Memilih Saya (services)
  { src: `${B2}/cell-4.png`,  name: "mascot-berpengalaman" }, // toga + ijazah
  { src: `${B1}/cell-5.png`,  name: "mascot-cepat" },         // bohlam (ide cepat)
  { src: `${B2}/cell-12.png`, name: "mascot-terukur" },       // tinju + grafik naik
  { src: `${B1}/cell-6.png`,  name: "mascot-profesional" },   // mengetik laptop
  // Legenda Level (skills)
  { src: `${B2}/cell-2.png`,  name: "mascot-beginner" },      // menulis (belajar)
  { src: `${B2}/cell-9.png`,  name: "mascot-intermediate" },  // kaca pembesar + bohlam
  { src: `${B2}/cell-11.png`, name: "mascot-advanced" },      // laptop + gear
  { src: `${B1}/cell-8.png`,  name: "mascot-expert" },        // tinju kemenangan
  // Domain Utama (skills)
  { src: `${B2}/cell-5.png`,  name: "mascot-digital-marketing" },    // megafon
  { src: `${B2}/cell-6.png`,  name: "mascot-creative-production" },  // kamera DSLR
  { src: `${B2}/cell-7.png`,  name: "mascot-web-development" },      // laptop + kode
  { src: `${B2}/cell-8.png`,  name: "mascot-financial-market" },     // grafik + koin
];

const SIZE = 256;

(async () => {
  let total = 0;
  for (const p of PICKS) {
    const dst = path.join(OUT, `${p.name}.webp`);
    const trimmed = await sharp(p.src).trim().toBuffer({ resolveWithObject: true });
    await sharp(trimmed.data)
      .resize(SIZE, SIZE, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 82 })
      .toFile(dst);
    const kb = fs.statSync(dst).size / 1024;
    total += kb;
    console.log(`${p.name}.webp  ${kb.toFixed(1)} KB`);
  }
  console.log(`\nSELESAI — ${PICKS.length} icon, total ${(total / 1024).toFixed(1)} MB`);
})().catch((e) => { console.error("GAGAL:", e.message); process.exit(1); });
