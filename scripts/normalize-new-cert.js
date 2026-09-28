/**
 * Normalisasi EXIF gambar sertifikat Malibu baru → cek dimensi → preview JPEG
 * (untuk verifikasi kemiringan via VLM setelah orientasi EXIF diterapkan)
 */
const sharp = require("sharp");
const path = require("path");

const SRC = path.join(__dirname, "..", "download", "cert-source", "raw-malibu-new.bin");
const OUT = path.join(__dirname, "..", "download", "cert-source", "malibu-new-normalized.jpg");

async function main() {
  const normalized = await sharp(SRC).rotate().toBuffer(); // EXIF auto-orient
  const meta = await sharp(normalized).metadata();
  console.log(`Setelah EXIF-normalize: ${meta.width}x${meta.height} (portrait=${meta.height > meta.width})`);

  await sharp(normalized).jpeg({ quality: 88 }).toFile(OUT);
  console.log("Preview tersimpan:", OUT);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
