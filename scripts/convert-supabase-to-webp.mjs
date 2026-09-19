/**
 * MIGRASI SUPABASE STORAGE: Konversi semua JPG/PNG di bucket → WebP
 * + update referensi URL di database.
 *
 * BUTUH env var (set di .env atau shell):
 *   NEXT_PUBLIC_SUPABASE_URL     → https://vjijkzlzqksgqsdrgxrm.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY    → dari Supabase Dashboard → Settings → API
 *   DATABASE_URL                 → koneksi Postgres (pooler 6543 OK)
 *
 * Alur per file:
 * 1. List objek di bucket (prefix uploads/) via Storage REST API
 * 2. Download file .jpg/.png (via public URL — bucket public)
 * 3. Konversi ke WebP (quality 82, max 2560px, EXIF auto-rotate)
 * 4. Upload sebagai .webp BARU (x-upsert: true — idempoten)
 * 5. Update SEMUA referensi URL di DB (Media, Gallery, Portfolio,
 *    PortfolioImage, Setting, User, Post, Certificate, Service, Testimonial)
 * 6. Default: original TIDAK dihapus (flag --delete-old untuk hapus setelah
 *    semua sukses dan sudah diverifikasi tampil di web)
 *
 * Jalankan:
 *   node scripts/convert-supabase-to-webp.mjs
 *   node scripts/convert-supabase-to-webp.mjs --delete-old   # hapus original
 */
import path from "path";
import { createRequire } from "module";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env"), override: true });

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const sharp = require("sharp");
const db = new PrismaClient();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "media";
const DELETE_OLD = process.argv.includes("--delete-old");

const WEBP_QUALITY = 82;
const MAX_DIMENSION = 2560;
const MIN_SIZE = 20 * 1024;
const CONVERTIBLE = new Set([".jpg", ".jpeg", ".png"]);
const CONCURRENCY = 4; // download+convert paralel

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib di-set.");
  console.error("   Ambil service role key: Supabase Dashboard → Settings → API → service_role");
  process.exit(1);
}

const authHeaders = {
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  apikey: SERVICE_ROLE_KEY,
};

// ─────────────────────────────────────────────────────────────────────────
// Storage helpers (REST API — tanpa SDK tambahan)
// ─────────────────────────────────────────────────────────────────────────
async function listBucket(prefix, limit = 500) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ prefix, limit, offset: 0, sortBy: { column: "name", order: "asc" } }),
  });
  if (!res.ok) throw new Error(`list failed: ${res.status} ${await res.text()}`);
  return res.json(); // [{name, id, updated_at, metadata: {size, ...}}]
}

async function downloadObject(key) {
  const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${key} failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function uploadObject(key, buffer, mimeType) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`, {
    method: "POST",
    headers: {
      ...authHeaders,
      "Content-Type": mimeType || "application/octet-stream",
      "x-upsert": "true",
    },
    body: new Uint8Array(buffer),
  });
  if (!res.ok) throw new Error(`upload ${key} failed: ${res.status} ${await res.text()}`);
}

async function deleteObject(key) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`, {
    method: "DELETE",
    headers: authHeaders,
  });
  if (!res.ok && res.status !== 404) {
    console.warn(`  ! delete ${key} failed: ${res.status}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Konversi
// ─────────────────────────────────────────────────────────────────────────
async function convertBuffer(input) {
  const { data, info } = await sharp(input)
    .rotate()
    .resize(MAX_DIMENSION, MAX_DIMENSION, { withoutEnlargement: true, fit: "inside" })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height };
}

// ─────────────────────────────────────────────────────────────────────────
// Update referensi URL di database (URL Supabase → .webp)
// ─────────────────────────────────────────────────────────────────────────
function mapUrl(oldUrl, renameMap) {
  if (!oldUrl || typeof oldUrl !== "string") return oldUrl;
  for (const [oldKey, newKey] of renameMap) {
    if (oldUrl.includes(oldKey)) return oldUrl.replace(oldKey, newKey);
  }
  return oldUrl;
}

async function updateDatabase(renameMap, fileStats) {
  let total = 0;

  const media = await db.media.findMany({ select: { id: true, url: true, name: true } });
  for (const m of media) {
    const newUrl = mapUrl(m.url, renameMap);
    const newName = m.name ? mapUrl(m.name, renameMap) : m.name;
    if (newUrl !== m.url || newName !== m.name) {
      const stat = fileStats.get(newUrl.split("/").pop());
      await db.media.update({
        where: { id: m.id },
        data: {
          ...(newUrl !== m.url ? { url: newUrl } : {}),
          ...(newName !== m.name ? { name: newName } : {}),
          ...(stat ? { size: stat.size, mimeType: "image/webp", width: stat.width, height: stat.height } : {}),
        },
      });
      total++;
    }
  }

  const tables = [
    { model: db.gallery, fields: ["url", "thumbnail"] },
    { model: db.portfolio, fields: ["thumbnail", "banner"] },
    { model: db.portfolioImage, fields: ["url"] },
    { model: db.setting, fields: ["value"] },
    { model: db.user, fields: ["image"] },
    { model: db.post, fields: ["coverImage"] },
    { model: db.certificate, fields: ["imageUrl", "logo"] },
    { model: db.service, fields: ["icon", "logo"] },
    { model: db.testimonial, fields: ["avatar"] },
  ];
  for (const { model, fields } of tables) {
    try {
      const rows = await model.findMany();
      for (const row of rows) {
        const data = {};
        for (const f of fields) {
          const oldVal = row[f];
          const newVal = mapUrl(oldVal, renameMap);
          if (newVal !== oldVal) data[f] = newVal;
        }
        if (Object.keys(data).length) {
          await model.update({ where: { id: row.id }, data });
          total++;
        }
      }
    } catch { /* model/field opsional — skip */ }
  }
  return total;
}

// ─────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("════════════════════════════════════════════════════════════");
  console.log("  MIGRASI SUPABASE STORAGE JPG/PNG → WEBP");
  console.log(`  Bucket: ${BUCKET} | Quality: ${WEBP_QUALITY} | Max: ${MAX_DIMENSION}px`);
  console.log(`  Hapus original: ${DELETE_OLD ? "YA (--delete-old)" : "TIDAK (default)"}`);
  console.log("════════════════════════════════════════════════════════════\n");

  const objects = await listBucket("uploads/");
  // NOTE: Storage list API mengembalikan `name` RELATIF terhadap prefix
  // (mis. "1784_foto.jpg", bukan "uploads/1784_foto.jpg") — jadi
  // bangun full key dengan prefix secara eksplisit.
  const prefixed = objects.map((o) => ({
    ...o,
    name: o.name.startsWith("uploads/") ? o.name : `uploads/${o.name}`,
  }));
  const targets = prefixed.filter((o) => {
    if (o.id === null) return false; // folder placeholder
    const name = o.name.split("/").pop();
    const ext = path.extname(name).toLowerCase();
    return CONVERTIBLE.has(ext) && (o.metadata?.size ?? 0) >= MIN_SIZE;
  });
  console.log(`Total objek: ${objects.length} | Target konversi (jpg/png): ${targets.length}\n`);

  const renameMap = new Map(); // old key → new key (relatif bucket, mis. uploads/x.jpg)
  const fileStats = new Map();
  let totalBefore = 0, totalAfter = 0, ok = 0, fail = 0;

  // Proses paralel (batch CONCURRENCY)
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async (o) => {
        const key = o.name; // uploads/xxx.jpg
        const ext = path.extname(key);
        const newKey = `${key.slice(0, -ext.length)}.webp`;
        const originalSize = o.metadata?.size ?? 0;

        const input = await downloadObject(key);
        const { buffer, width, height } = await convertBuffer(input);
        if (buffer.length >= originalSize) {
          return { key, skipped: true, reason: "webp >= original" };
        }
        await uploadObject(newKey, buffer, "image/webp");
        return { key, newKey, buffer, width, height, originalSize, skipped: false };
      }),
    );

    for (const r of results) {
      if (r.status === "rejected") {
        fail++;
        console.error(`✗ GAGAL ${r.reason?.message?.split("\n")[0]}`);
        continue;
      }
      const v = r.value;
      if (v.skipped) {
        console.log(`⏭ Skip ${v.key}: ${v.reason}`);
        continue;
      }
      renameMap.set(v.key, v.newKey);
      fileStats.set(v.newKey.split("/").pop(), { size: v.buffer.length, width: v.width, height: v.height });
      totalBefore += v.originalSize;
      totalAfter += v.buffer.length;
      ok++;
      console.log(
        `✓ ${v.key} → ${v.newKey}  ${(v.originalSize / 1024 / 1024).toFixed(2)}MB → ${(v.buffer.length / 1024 / 1024).toFixed(2)}MB (${((1 - v.buffer.length / v.originalSize) * 100).toFixed(1)}% hemat)`,
      );
    }
  }

  console.log(`\n──────────── UPLOAD SELESAI ────────────`);
  console.log(`Berhasil: ${ok} | Gagal: ${fail}`);
  if (totalBefore > 0) {
    console.log(`Total: ${(totalBefore / 1024 / 1024).toFixed(1)}MB → ${(totalAfter / 1024 / 1024).toFixed(1)}MB (${((1 - totalAfter / totalBefore) * 100).toFixed(1)}% hemat)`);
  }

  if (renameMap.size > 0) {
    console.log(`\nMengupdate referensi database...`);
    const updates = await updateDatabase(renameMap, fileStats);
    console.log(`✓ ${updates} baris database diperbarui.`);
  }

  if (DELETE_OLD && renameMap.size > 0 && fail === 0) {
    console.log(`\nMenghapus ${renameMap.size} file original dari bucket...`);
    for (const oldKey of renameMap.keys()) await deleteObject(oldKey);
    console.log("✓ Original dihapus dari bucket.");
  } else if (!DELETE_OLD) {
    console.log("\nNOTE: original TIDAK dihapus. Setelah verifikasi tampilan web, jalankan:");
    console.log("      node scripts/convert-supabase-to-webp.mjs --delete-old");
  }

  await db.$disconnect();
}

main().catch(async (e) => {
  console.error("FATAL:", e);
  await db.$disconnect().catch(() => {});
  process.exit(1);
});
