// Crop 12 pose maskot dari grid 1536x1024 (4 kolom x 3 baris)
// Output: /tmp/mascot2-cells/cell-N.png
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC = "/home/z/my-project/upload/pasted_image_1791391223829.png";
const OUT = "/tmp/mascot2-cells";
fs.mkdirSync(OUT, { recursive: true });

const W = 1536, H = 1024;
const COLS = 4, ROWS = 3;
const cw = Math.floor(W / COLS); // 384
const ch = Math.floor(H / ROWS); // 341

(async () => {
  let n = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      n++;
      const left = c * cw;
      const top = r * ch;
      await sharp(SRC)
        .extract({ left, top, width: cw, height: ch })
        .png()
        .toFile(path.join(OUT, `cell-${n}.png`));
    }
  }
  console.log(`SELESAI — ${n} cell ter-crop ke ${OUT}`);
})().catch((e) => { console.error("GAGAL:", e.message); process.exit(1); });
