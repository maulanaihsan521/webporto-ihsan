// Crop 8 pose maskot dari gambar grid 1536x1024 (4 kolom x 2 baris)
// Output: /tmp/mascot-cells/cell-{row}-{col}.png
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC = "/home/z/my-project/upload/pasted_image_1791390216207.png";
const OUT = "/tmp/mascot-cells";
fs.mkdirSync(OUT, { recursive: true });

const W = 1536, H = 1024;
const COLS = 4, ROWS = 2;
const cw = Math.floor(W / COLS); // 384
const ch = Math.floor(H / ROWS); // 512

(async () => {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const idx = r * COLS + c + 1;
      const left = c * cw;
      const top = r * ch;
      await sharp(SRC)
        .extract({ left, top, width: cw, height: ch })
        .png()
        .toFile(path.join(OUT, `cell-${idx}.png`));
      console.log(`cell-${idx}.png (kolom ${c + 1}, baris ${r + 1}) — r${top}..r${top + ch}, c${left}..c${left + cw}`);
    }
  }
  console.log("SELESAI — 8 cell ter-crop");
})().catch((e) => { console.error("GAGAL:", e.message); process.exit(1); });
