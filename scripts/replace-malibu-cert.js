/**
 * Ganti gambar sertifikat PKL Malibu 62 Studio dengan foto baru (sudah lurus
 * setelah EXIF-normalize): WebP q82 max 2560 → upload key baru → update DB.
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  env[t.slice(0, i).trim()] = v;
}
process.env.DATABASE_URL = env.DATABASE_URL;

const SRC = path.join(__dirname, "..", "download", "cert-source", "raw-malibu-new.bin");
const KEY = `uploads/${Date.now()}_sertifikat-pkl-malibu-62-studio.webp`;

async function uploadToSupabase(key, buffer) {
  const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${env.SUPABASE_STORAGE_BUCKET || "media"}/${key}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "image/webp",
      "x-upsert": "true",
    },
    body: new Uint8Array(buffer),
  });
  if (!res.ok) throw new Error(`Upload gagal (${res.status}): ${await res.text()}`);
  return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${env.SUPABASE_STORAGE_BUCKET || "media"}/${key}`;
}

async function main() {
  // WebP pipeline sama dgn image-convert.ts: EXIF rotate + q82 + max 2560
  const { data, info } = await sharp(SRC)
    .rotate()
    .resize(2560, 2560, { withoutEnlargement: true, fit: "inside" })
    .webp({ quality: 82, effort: 4 })
    .toBuffer({ resolveWithObject: true });
  console.log(`WebP: ${info.width}x${info.height} (${info.width > info.height ? "landscape" : "portrait"}), ${(data.length / 1024).toFixed(0)} KB`);

  const publicUrl = await uploadToSupabase(KEY, data);
  console.log(`Uploaded: ${publicUrl}`);

  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const updated = await prisma.certificate.update({
      where: { slug: "praktik-kerja-lapangan-teknik-komputer-informatika" },
      data: { imageUrl: publicUrl },
    });
    console.log(`DB updated: ${updated.title}`);
    console.log(`imageUrl → ${updated.imageUrl}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
