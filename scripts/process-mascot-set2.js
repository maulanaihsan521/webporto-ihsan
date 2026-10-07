// Task 15 v3: Crop content-aware FINAL utk grid maskot 3x4 (1536x1024).
// Split points hasil pengukuran piksel (alpha channel):
//  - Y-split per kolom: valley densitas (v1 ~392-403, v2 ~732-734) — spt v2.
//  - X-split baris 1: tengah celah konten [408, 772, 1155] (batas nominal aman,
//    tapi tengah-celah lebih berisiko-toleran).
//  - X-split baris 2: [405, 789, 1147] — PENTING: konten karakter kamera
//    melampaui x768 sampai x778, jadi split 768 lama memotongnya & bocor ke icon 7.
//  - X-split baris 3: [0..372] [450..750] [820..1112] [1194..1536] — ujung panah
//    meruncing PASTI tepi scene berikutnya: panah-1 x404-444 (tipis s.d. x444,
//    scene 2 mulai x450); panah-2 x783-819 (menjalin dgn piksel tepi badge s3,
//    split 820 mengorbankan 4px tepi badge - tak terlihat); panah-3 x1137-1177
//    (berakhir di ruang kosong, scene 4 badge mulai x1194).
// Output: 12 ikon -> timpa 16 file webp di public/images/mascots/.
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC = "/home/z/my-project/upload/pasted_image_1791392201119.png";
const OUT = "/home/z/my-project/public/images/mascots";
const SIZE = 256;

const MAP = {
  1:  ["mascot-beginner", "mascot-profesional"],
  2:  ["mascot-intermediate", "mascot-terukur"],
  3:  ["mascot-advanced", "mascot-cepat"],
  4:  ["mascot-expert", "mascot-berpengalaman"],
  5:  ["mascot-digital-marketing"],
  6:  ["mascot-creative-production"],
  7:  ["mascot-web-development"],
  8:  ["mascot-financial-market"],
  9:  ["mascot-discover"],
  10: ["mascot-plan"],
  11: ["mascot-execute"],
  12: ["mascot-deliver"],
};

// X-ranges terukur per baris (indeks 0..3 = kolom 1..4)
const ROW_X = {
  1: [[0, 408], [408, 772], [772, 1155], [1155, 1536]],
  2: [[0, 405], [405, 789], [789, 1147], [1147, 1536]],
  3: [[0, 372], [450, 750], [820, 1112], [1194, 1536]],
};

(async () => {
  const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const A = (x, y) => data[(y * W + x) * 4 + 3];

  // ---------- 1) Valley Y per kolom (utk batas baris 1/2 dan 2/3) ----------
  const smooth = (arr, win) => {
    const out = new Array(arr.length).fill(0);
    const half = Math.floor(win / 2);
    for (let i = 0; i < arr.length; i++) {
      let s = 0, n = 0;
      for (let k = -half; k <= half; k++) { const j = i + k; if (j >= 0 && j < arr.length) { s += arr[j]; n++; } }
      out[i] = s / n;
    }
    return out;
  };
  const valleys = [];
  for (let c = 0; c < 4; c++) {
    const x0 = ROW_X[2][c][0] + 6, x1 = ROW_X[2][c][1] - 6;
    const dens = new Array(H).fill(0);
    for (let y = 0; y < H; y++)
      for (let x = x0; x < x1; x++) if (A(x, y) > 10) dens[y]++;
    const sm = smooth(dens, 9);
    const argmin = (lo, hi) => { let best = lo, bv = Infinity; for (let y = lo; y <= hi; y++) if (sm[y] < bv) { bv = sm[y]; best = y; } return best; };
    const v1 = argmin(280, 440), v2 = argmin(600, 735);
    valleys.push({ v1, v2 });
    console.log(`kolom ${c + 1}: v1=${v1} v2=${v2}`);
  }

  // ---------- 2) Definisi 12 segmen ----------
  const segs = [];
  for (let c = 0; c < 4; c++) {
    const { v1, v2 } = valleys[c];
    segs.push({ i: c + 1, x0: ROW_X[1][c][0], x1: ROW_X[1][c][1], y0: 0, y1: v1 });
    segs.push({ i: c + 5, x0: ROW_X[2][c][0], x1: ROW_X[2][c][1], y0: v1 + 1, y1: v2 });
    segs.push({ i: c + 9, x0: ROW_X[3][c][0], x1: ROW_X[3][c][1], y0: v2 + 1, y1: H });
  }

  // ---------- 3) Crop -> trim -> contain 256 -> webp ----------
  const processed = [];
  let totalKb = 0;
  for (const s of segs) {
    const left = Math.round(s.x0), top = Math.round(s.y0);
    const width = Math.round(s.x1) - left, height = Math.round(s.y1) - top;
    const cellPng = `/tmp/v3-cell-${s.i}.png`;
    await sharp(SRC).extract({ left, top, width, height }).png().toFile(cellPng);

    const trimmed = await sharp(cellPng).trim().toBuffer({ resolveWithObject: true });
    const buf = await sharp(trimmed.data)
      .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 }, withoutEnlargement: false })
      .webp({ quality: 82 })
      .toBuffer();

    for (const name of MAP[s.i]) fs.writeFileSync(path.join(OUT, `${name}.webp`), buf), totalKb += buf.length / 1024;
    processed.push({ i: s.i, buf });
    console.log(`seg ${s.i}: x${left}-${left + width} y${top}-${top + height} -> trim ${trimmed.info.width}x${trimmed.info.height} -> ${MAP[s.i].join(",")} (${(buf.length / 1024).toFixed(1)} KB)`);
  }

  // ---------- 4) Contact sheet ----------
  const sheetCell = 270, gap = 10;
  const comps = processed.map(({ i, buf }) => ({
    input: buf,
    left: gap + ((i - 1) % 4) * (sheetCell + gap),
    top: gap + Math.floor((i - 1) / 4) * (sheetCell + gap),
  }));
  await sharp({ create: { width: 4 * sheetCell + 5 * gap, height: 3 * sheetCell + 4 * gap, channels: 4, background: { r: 240, g: 240, b: 245, alpha: 1 } } })
    .composite(comps).png().toFile("/tmp/grid12-sheet-v3.png");

  console.log(`\nSELESAI — 16 file ditimpa, total ${totalKb.toFixed(0)} KB. Sheet: /tmp/grid12-sheet-v3.png`);
})().catch((e) => { console.error("GAGAL:", e.message); process.exit(1); });
