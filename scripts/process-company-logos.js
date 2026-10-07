/**
 * Proses logo perusahaan untuk bagian karier (experience) + pendidikan.
 * Sumber: /home/z/my-project/upload/company-logos/ (unduhan Google Drive user)
 * Output: public/images/companies/*.webp — square 256x256, background putih
 * (aman untuk dark mode), webp q85.
 *
 * Langkah per logo:
 *  1. Trim tepi transparan (jika punya alpha) — buang ruang kosong sekitar logo
 *  2. Contain ke kanvas 256x256 dgn latar PUTIH (logo transparan/teks hitam
 *     tetap terbaca di tema gelap; logo ber-bg sendiri tetap alami)
 *  3. WebP q85
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC = "/home/z/my-project/upload/company-logos";
const OUT = "/home/z/my-project/public/images/companies";

const LOGOS = [
  { input: "bikinkreatif.jpg", output: "bikin-kreatif.webp", trim: false },
  { input: "marketing-crew.png", output: "marketing-crew.webp", trim: true },
  { input: "paradima.png", output: "paradigma.webp", trim: false },
  { input: "malibu62.png", output: "malibu-62.webp", trim: false },
  { input: "smb-telkom.png", output: "smb-telkom.webp", trim: true },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });

  for (const job of LOGOS) {
    const src = path.join(SRC, job.input);
    const dst = path.join(OUT, job.output);

    let pipeline = sharp(src);
    const meta = await pipeline.metadata();

    if (job.trim && meta.hasAlpha) {
      pipeline = sharp(src).trim({
        // trim piksel alpha < threshold kecil
        threshold: 12,
      });
    }

    await pipeline
      .resize(256, 256, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .webp({ quality: 85 })
      .toFile(dst);

    const st = fs.statSync(dst);
    const outMeta = await sharp(dst).metadata();
    console.log(
      `${job.output}: ${outMeta.width}x${outMeta.height}, ${(st.size / 1024).toFixed(1)} KB` +
        ` (sumber ${meta.width}x${meta.height} ${meta.hasAlpha ? "alpha" : "opaque"})`
    );
  }

  console.log("\nTotal:", fs.readdirSync(OUT).filter(f => f.endsWith(".webp")).length, "file webp");
})();
