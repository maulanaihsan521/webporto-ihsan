/**
 * Perbaiki logo Telkom University (Task 24 — "pada logo telkom university
 * tidak rapih").
 *
 * MASALAH:
 *  Sumber = lockup penuh 500x500: buku merah (y55-122) + huruf U abu
 *  (y144-287) + teks "Telkom University" 2 baris (y312-446). Lockup ber-rasio
 *  potret (320x390 setelah trim) → dalam lingkaran dot 32px:
 *   - teks 2 baris jadi coretan abu-abu blur (tidak terbaca = noise visual)
 *   - lambang terpaksa mengecil → banyak ruang kosong di sisi lingkaran
 *
 * SOLUSI (praktik standar avatar universitas):
 *  Pakai LAMBANG SAJA (buku merah + U — bbox x181-340 y55-287, 160x233) tanpa
 *  blok teks; nama institusi "Telkom University Purwokerto" sudah tertulis di
 *  kartu tepat di samping dot. Contain 256x256 putih murni → webp q85,
 *  timpa public/images/education/telkom-university.webp (path & DB tak berubah).
 */
const sharp = require("sharp");
const fs = require("fs");

const SRC = "/home/z/my-project/upload/Logo Telkom University.png";
const DST = "/home/z/my-project/public/images/education/telkom-university.webp";

// zona lambang (buku + U) — hasil analisis profil opaque per baris
const EMBLEM = { left: 181, top: 55, width: 160, height: 233 };

(async () => {
  const meta = await sharp(SRC).metadata();
  console.log("sumber:", meta.width + "x" + meta.height, "→ emblem", EMBLEM.width + "x" + EMBLEM.height);

  await sharp(SRC)
    .extract(EMBLEM)
    .resize(256, 256, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .webp({ quality: 85 })
    .toFile(DST);

  const outMeta = await sharp(DST).metadata();
  const st = fs.statSync(DST);
  console.log(
    "hasil: " + outMeta.width + "x" + outMeta.height + ", " + (st.size / 1024).toFixed(1) + " KB → " + DST
  );

  // preview ter-flatten utk inspeksi visual
  await sharp(DST).flatten({ background: "#ffffff" }).resize(512).png().toFile("/tmp/telkom-fixed-preview.png");
  console.log("preview → /tmp/telkom-fixed-preview.png");
})();
