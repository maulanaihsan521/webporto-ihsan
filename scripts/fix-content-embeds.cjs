/**
 * FIX EMBED: ganti referensi filename .jpg/.png → .webp di SEMUA field
 * teks/konten (Post.content, MarketArticle.content, ogImage, dll).
 *
 * Konteks: migrasi WebP sudah mengganti file fisik + field URL khusus
 * (Media.url, Gallery.url, dst), TAPI gambar yang di-embed di dalam
 * konten rich-text artikel (markdown/HTML) dan field ogImage masih
 * merujuk nama file lama → gambar broken (404).
 *
 * Strategi: bangun rename map (nama file lama → nama baru) dari:
 *   1. File lokal: .originals-backup/ ↔ public/uploads/*.webp
 *   2. Bucket Supabase: pasangan xxx.png + xxx.webp yang ada
 * Lalu replace string nama file di semua kolom teks yang relevan.
 * Nama file unik (prefix timestamp) → replace nama file mentah aman.
 */
const path = require("path");
const { readdirSync, existsSync, readFileSync } = require("fs");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config({ path: path.join(process.cwd(), ".env"), override: true });

const db = new PrismaClient({
  datasources: { db: { url: withPgbouncer(process.env.DATABASE_URL) } },
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "media";
const CONVERTIBLE = new Set([".jpg", ".jpeg", ".png"]);

function withPgbouncer(url) {
  try {
    const u = new URL(url);
    if (u.port === "6543" || u.hostname.includes("pooler.supabase.com")) {
      u.searchParams.set("pgbouncer", "true");
      u.searchParams.set("connection_limit", "5");
      return u.toString();
    }
    return url;
  } catch { return url; }
}

async function listBucket(prefix) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prefix, limit: 500, offset: 0, sortBy: { column: "name", order: "asc" } }),
  });
  if (!res.ok) throw new Error(`list failed: ${res.status}`);
  return res.json();
}

// Ganti semua kemunculan nama file lama → baru dalam sebuah teks
function replaceAll(text, renameMap) {
  if (!text || typeof text !== "string") return text;
  let out = text;
  for (const [oldName, newName] of renameMap) {
    if (out.includes(oldName)) out = out.split(oldName).join(newName);
  }
  return out;
}

async function main() {
  console.log("═══ FIX EMBED: konten rich-text .jpg/.png → .webp ═══\n");

  // 1. Bangun rename map
  const renameMap = new Map(); // nama file lama (bare) → nama baru

  // 1a. Dari lokal: .originals-backup/*.jpg|png ↔ public/uploads/*.webp
  const backupDir = path.join(process.cwd(), ".originals-backup");
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (existsSync(backupDir) && existsSync(uploadsDir)) {
    const backups = readdirSync(backupDir).filter((f) => CONVERTIBLE.has(path.extname(f).toLowerCase()));
    const webpSet = new Set(readdirSync(uploadsDir));
    for (const old of backups) {
      const ext = path.extname(old);
      const webp = `${old.slice(0, -ext.length)}.webp`;
      if (webpSet.has(webp)) renameMap.set(old, webp);
    }
  }
  console.log(`Rename map lokal: ${renameMap.size} pasangan`);

  // 1b. Dari bucket Supabase: xxx.png + xxx.webp yang berdampingan
  const objects = await listBucket("uploads/");
  const bucketWebp = new Set(objects.map((o) => o.name.split("/").pop()).filter((n) => n.endsWith(".webp")));
  let supaPairs = 0;
  for (const o of objects) {
    const name = o.name.split("/").pop();
    const ext = path.extname(name).toLowerCase();
    if (!CONVERTIBLE.has(ext)) continue;
    const webp = `${name.slice(0, -ext.length)}.webp`;
    if (bucketWebp.has(webp) && !renameMap.has(name)) {
      renameMap.set(name, webp);
      supaPairs++;
    }
  }
  console.log(`Rename map Supabase: +${supaPairs} pasangan (total: ${renameMap.size})\n`);

  let totalUpdates = 0;

  // Helper update generik: apply replaceAll ke list kolom
  async function updateRows(model, label, fields, selectId) {
    const rows = await model.findMany({ select: { id: true, [selectId || "slug"]: true, ...Object.fromEntries(fields.map((f) => [f, true])) } });
    let n = 0;
    for (const row of rows) {
      const data = {};
      for (const f of fields) {
        const newVal = replaceAll(row[f], renameMap);
        if (newVal !== row[f]) data[f] = newVal;
      }
      if (Object.keys(data).length) {
        await model.update({ where: { id: row.id }, data });
        n++;
        const idLabel = row.slug || row.title || row.id;
        console.log(`  ✓ ${label} "${String(idLabel).slice(0, 50)}": ${Object.keys(data).join(", ")}`);
      }
    }
    totalUpdates += n;
    return n;
  }

  // 2. Update semua model dengan field konten
  console.log("── Post ──");
  await updateRows(db.post, "Post", ["content", "excerpt", "ogImage", "metaDescription", "canonical"]).catch(() => console.log("  (skip)"));
  console.log("\n── MarketArticle ──");
  await updateRows(db.marketArticle, "Market", ["content", "excerpt", "coverImage", "metaDescription"]).catch(() => console.log("  (skip)"));
  console.log("\n── Portfolio ──");
  await updateRows(db.portfolio, "Portfolio", ["description", "excerpt", "ogImage", "technologies", "metaDescription"]).catch(() => console.log("  (skip)"));
  console.log("\n── Gallery ──");
  await updateRows(db.gallery, "Gallery", ["description"]).catch(() => console.log("  (skip)"));
  console.log("\n── Service ──");
  await updateRows(db.service, "Service", ["description", "icon"]).catch(() => console.log("  (skip)"));
  console.log("\n── Faq ──");
  await updateRows(db.faq, "Faq", ["answer", "question"]).catch(() => console.log("  (skip)"));
  console.log("\n── Testimonial ──");
  await updateRows(db.testimonial, "Testimonial", ["content", "avatar"]).catch(() => console.log("  (skip)"));
  console.log("\n── Experience ──");
  await updateRows(db.experience, "Experience", ["description"]).catch(() => console.log("  (skip)"));
  console.log("\n── Education ──");
  await updateRows(db.education, "Education", ["description"]).catch(() => console.log("  (skip)"));
  console.log("\n── Certificate ──");
  await updateRows(db.certificate, "Certificate", ["description", "imageUrl", "logo"]).catch(() => console.log("  (skip)"));
  console.log("\n── Setting ──");
  await updateRows(db.setting, "Setting", ["value"], "key").catch(() => console.log("  (skip)"));
  console.log("\n── User ──");
  await updateRows(db.user, "User", ["bio", "image"], "email").catch(() => console.log("  (skip)"));

  console.log(`\n═══ SELESAI: ${totalUpdates} baris diperbarui ═══`);
  await db.$disconnect();
}

main().catch(async (e) => {
  console.error("FATAL:", e);
  await db.$disconnect().catch(() => {});
  process.exit(1);
});
