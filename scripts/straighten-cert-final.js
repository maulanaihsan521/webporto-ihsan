/**
 * Finalisasi perbaikan gambar sertifikat PKL Malibu 62 Studio:
 * rotasi -2 derajat (hasil pemilihan VLM) + crop inscribed → WebP q82
 * (pipeline sama dgn image-convert.ts) → upload key BARU → update DB imageUrl.
 * Key baru dipakai agar tidak kena cache CDN Supabase pada URL lama.
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

const SRC = path.join(__dirname, "..", "download", "cert-source", "raw-1KeppsS-e-FmDNhUlvo3BrLQNygwAF3Ri.bin");
const ANGLE = -2; // hasil VLM comparison
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
  // 1) EXIF-normalize
  const normalized = await sharp(SRC).rotate().toBuffer();
  const meta = await sharp(normalized).metadata();
  const W = meta.width, H = meta.height;

  // 2) Hitung crop inscribed (aspect sama) utk rotasi ANGLE
  const rad = (Math.abs(ANGLE) * Math.PI) / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  const r = W / H;
  const b = Math.min((W / 2) / (r * cos + sin), (H / 2) / (r * sin + cos));
  const a = r * b;
  const cw = Math.round(2 * a), ch = Math.round(2 * b);
  const W2 = Math.round(W * cos + H * sin), H2 = Math.round(W * sin + H * cos);
  const left = Math.round((W2 - cw) / 2), top = Math.round((H2 - ch) / 2);

  // 3) Rotate + crop + WebP (q82, max 2560 — sama seperti pipeline web)
  const { data, info } = await sharp(normalized)
    .rotate(ANGLE, { background: "#ffffff" })
    .extract({ left, top, width: cw, height: ch })
    .resize(2560, 2560, { withoutEnlargement: true, fit: "inside" })
    .webp({ quality: 82, effort: 4 })
    .toBuffer({ resolveWithObject: true });
  console.log(`Final WebP: ${info.width}x${info.height}, ${(data.length / 1024).toFixed(0)} KB (rotasi ${ANGLE}°)`);

  // 4) Upload key baru
  const publicUrl = await uploadToSupabase(KEY, data);
  console.log(`Uploaded: ${publicUrl}`);

  // 5) Update DB record
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
