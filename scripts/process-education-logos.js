/**
 * Proses 4 logo pendidikan (upload user) untuk timeline Pendidikan.
 * Pipeline sama dengan logo perusahaan (Task 17 / process-company-logos.js):
 *  1. Trim tepi kosong — piksel mirip warna sudut kiri-atas dibuang dari tepi
 *     (untuk RGBA = tepi transparan; untuk RGB ber-bg putih = tepi putih)
 *  2. Contain ke kanvas 256x256 latar PUTIH (aman dark mode)
 *  3. WebP q85
 * Output: public/images/education/*.webp — path statis utk field Education.logo
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC = "/home/z/my-project/upload";
const OUT = "/home/z/my-project/public/images/education";

const LOGOS = [
  { input: "logo smkn 1 lemah abang.png", output: "smkn-1-lemahabang.webp" },
  { input: "SMP Negeri Babakan Logo.png", output: "smpn-1-babakan.webp" },
  { input: "Logo SDN Tersana Baru.png", output: "sdn-tersana-baru.webp" },
  { input: "Logo Telkom University.png", output: "telkom-university.webp" },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });

  for (const job of LOGOS) {
    const src = path.join(SRC, job.input);
    const dst = path.join(OUT, job.output);

    const meta = await sharp(src).metadata();

    // trim: threshold 12 (same as Task 17) — buang tepi kosong sekitar logo
    const trimmed = await sharp(src)
      .trim({ threshold: 12 })
      .toBuffer({ resolveWithObject: false })
      .catch(async () => {
        // fallback: tanpa trim bila gagal (mis. gambar 1px dsb.)
        return sharp(src).toBuffer();
      });
    const trimmedMeta = await sharp(trimmed).metadata();

    await sharp(trimmed)
      .resize(256, 256, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .webp({ quality: 85 })
      .toFile(dst);

    const st = fs.statSync(dst);
    console.log(
      `${job.output}: ${trimmedMeta.width}x${trimmedMeta.height} setelah trim ` +
        `(sumber ${meta.width}x${meta.height} ${meta.hasAlpha ? "alpha" : "opaque"}) ` +
        `→ 256x256, ${(st.size / 1024).toFixed(1)} KB`
    );
  }

  console.log("\nTotal file di", OUT, ":", fs.readdirSync(OUT).length);
})();
