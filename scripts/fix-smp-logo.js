/**
 * Perbaiki logo SMP Negeri 1 Babakan (Task 22 fix — "logo terlihat tidak rapih").
 *
 * MASALAH:
 *  - Sumber 1674x940 banner lebar: logo asli (pentagon kuning + teks) hanya
 *    menempati x 366-1306 (940x918 ≈ persegi); sisi kiri/kanan = margin
 *    kosong berlatar GRADIEN ABU-ABU NETRAL (lum 232-255) → tampak sebagai
 *    persegi abu-abu kotor di lingkaran putih murni + logo terlihat kecil.
 *
 * SOLUSI (background removal berbasis chroma):
 *  - Piksel NETRAL CERAH (sat ≤ 12 dan lum ≥ 222) → transparan
 *    (latar abu-abu gradien); konten berwarna (pentagon kuning, teks hijau,
 *    obor ungu/merah) dan gelap (garis hitam) tetap utuh.
 *  - Trim tepi transparan → bbox konten ~940x918 (hampir persegi)
 *  - Contain 256x256 di atas PUTIH MURNI (255) — konsisten dgn logo lain
 *  - WebP q85 → timpa public/images/education/smpn-1-babakan.webp
 */
const sharp = require("sharp");
const fs = require("fs");

const SRC = "/home/z/my-project/upload/SMP Negeri Babakan Logo.png";
const DST = "/home/z/my-project/public/images/education/smpn-1-babakan.webp";

const SAT_MAX = 12; // saturasi (max-min channel) ≤ ini = netral
const LUM_MIN = 222; // luminance (max channel) ≥ ini = cerah

(async () => {
  const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // bangun RGBA dgn alpha hasil klasifikasi latar
  const rgba = Buffer.alloc(width * height * 4);
  let removed = 0;
  for (let i = 0; i < width * height; i++) {
    const p = i * channels;
    const r = data[p], g = data[p + 1], b = data[p + 2];
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const sat = mx - mn;
    const isBg = sat <= SAT_MAX && mx >= LUM_MIN;
    rgba[i * 4] = r;
    rgba[i * 4 + 1] = g;
    rgba[i * 4 + 2] = b;
    rgba[i * 4 + 3] = isBg ? 0 : 255;
    if (isBg) removed++;
  }
  console.log(
    "latar dihapus:",
    ((removed / (width * height)) * 100).toFixed(1) + "% piksel",
    "(" + removed + "/" + width * height + ")"
  );

  // CATATAN: sharp.trim() TIDAK bisa dipakai di sini — membandingkan nilai RGB
  // dgn threshold, sedangkan gradien latar bervariasi 232-254 (selisih 21 > 10)
  // → trim tidak terjadi sama sekali. Sebagai gantinya: hitung bbox piksel
  // opaque langsung dari mask alpha (presisi piksel).
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (rgba[(y * width + x) * 4 + 3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  console.log("bbox konten opaque:", minX + "," + minY, "→", maxX + "," + maxY, "=" + bw + "x" + bh);

  // simpan preview intermediate utk inspeksi
  const cutout = await sharp(rgba, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();

  // extract bbox → contain 256 putih murni → webp
  await sharp(cutout)
    .extract({ left: minX, top: minY, width: bw, height: bh })
    .resize(256, 256, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .webp({ quality: 85 })
    .toFile(DST);

  const outMeta = await sharp(DST).metadata();
  const st = fs.statSync(DST);
  console.log(
    "hasil: konten " + bw + "x" + bh +
      " → " + outMeta.width + "x" + outMeta.height +
      ", " + (st.size / 1024).toFixed(1) + " KB → " + DST
  );

  // preview transparan utk verifikasi visual
  await sharp(cutout).resize(400).png().toFile("/tmp/smp-cutout-preview.png");
  console.log("preview cutout → /tmp/smp-cutout-preview.png");
})();
