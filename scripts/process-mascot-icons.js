// Proses 4 pose maskot terpilih untuk icon About:
// trim transparan → square canvas 256x256 (contain, bg transparan) → webp q82
// Output: public/images/about/mascot-{visi,misi,nilai,hobi}.webp
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC = "/tmp/mascot-cells";
const OUT = "/home/z/my-project/public/images/about";
fs.mkdirSync(OUT, { recursive: true });

const PICKS = [
  { cell: "cell-1", name: "mascot-visi" },
  { cell: "cell-2", name: "mascot-misi" },
  { cell: "cell-3", name: "mascot-nilai" },
  { cell: "cell-4", name: "mascot-hobi" },
];

const SIZE = 256; // cukup tajam untuk display 40-64px @2x retina

(async () => {
  for (const p of PICKS) {
    const src = path.join(SRC, `${p.cell}.png`);
    const dst = path.join(OUT, `${p.name}.webp`);

    // 1) trim area transparan (auto-crop ke bounding box konten)
    const trimmed = await sharp(src).trim().toBuffer({ resolveWithObject: true });
    const { width, height } = trimmed.info;

    // 2) resize agar muat square SIZE, padding transparan, lalu webp
    await sharp(trimmed.data)
      .resize(SIZE, SIZE, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        withoutEnlargement: false,
      })
      .webp({ quality: 82 })
      .toFile(dst);

    const kb = (fs.statSync(dst).size / 1024).toFixed(1);
    console.log(`${p.name}.webp  (trim: ${width}x${height} → ${SIZE}x${SIZE})  ${kb} KB`);
  }
  console.log("SELESAI — 4 maskot icon siap di public/images/about/");
})().catch((e) => { console.error("GAGAL:", e.message); process.exit(1); });
