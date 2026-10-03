/**
 * Update gambar About di galeri PlatterTea:
 * Ganti screenshot lama (section 'Kenalan dengan PlatterTea' — foto produk)
 * dengan screenshot BENAR: halaman Tentang Kami → section 'Kenalan Sama Maskot Kami'
 * (4 maskot: Semangat, Keren, Penuh Kasih, Santai + ilustrasi Keluarga PlatterTea!)
 */
const { Client } = require("pg");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "media";
const PORTFOLIO_SLUG = "plattertea-food-tea-website";
const SRC = "/home/z/my-project/download/plattertea-mascot-square-raw.png";

const NEW_CAPTION =
  "Kenalan Sama Maskot Kami — keluarga maskot PlatterTea (Semangat, Keren, Penuh Kasih, Santai) yang menyapa di halaman Tentang Kami";

async function deleteFromSupabase(url) {
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const key = url.slice(idx + marker.length);
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${SERVICE_KEY}`, "apikey": SERVICE_KEY },
    });
    console.log(`[purge] ${key}: ${res.ok ? "terhapus" : "status " + res.status + " (abaikan)"}`);
  } catch (e) {
    console.log(`[purge] ${key}: gagal (${e.message}, abaikan)`);
  }
}

(async () => {
  if (!fs.existsSync(SRC)) throw new Error(`Screenshot tidak ditemukan: ${SRC}`);
  const c = new Client({ connectionString: process.env.DATABASE_URL, query_timeout: 30000, connectionTimeoutMillis: 15000 });
  await c.connect();

  // 1. Cari baris galeri about (order=1) yang akan diganti
  const p = await c.query(`SELECT id FROM "Portfolio" WHERE slug = $1`, [PORTFOLIO_SLUG]);
  const pid = p.rows[0].id;
  const old = await c.query(
    `SELECT id, url, caption FROM "PortfolioImage" WHERE "portfolioId" = $1 AND "order" = 1`,
    [pid]
  );
  if (!old.rows[0]) throw new Error("Baris galeri about (order=1) tidak ditemukan");
  const oldRow = old.rows[0];
  console.log(`Gambar about lama: ${oldRow.url.split("/").pop()}\n  caption: ${oldRow.caption}`);

  // 2. Proses & upload screenshot maskot
  const buf = await sharp(SRC).webp({ quality: 82 }).toBuffer();
  const meta = await sharp(buf).metadata();
  const filename = `${Date.now()}_plattertea-mascot.webp`;
  const upRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/uploads/${filename}`, {
    method: "POST",
    headers: {
      "Content-Type": "image/webp",
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "apikey": SERVICE_KEY,
      "x-upsert": "true",
    },
    body: buf,
  });
  if (!upRes.ok && upRes.status !== 409) throw new Error(`Upload gagal: ${upRes.status} ${await upRes.text()}`);
  const newUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/uploads/${filename}`;
  console.log(`\n[upload] ${filename} (${meta.width}x${meta.height}, ${(buf.length / 1024).toFixed(0)} KB)`);

  // 3. Insert record Media baru
  await c.query(
    `INSERT INTO "Media" (id, name, url, type, "mimeType", size, folder, width, height, alt, "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, 'IMAGE', 'image/webp', $3, '/', $4, $5, $6, now(), now())`,
    [`PlatterTea mascot section (revisi)`, newUrl, buf.length, meta.width, meta.height, NEW_CAPTION]
  );
  console.log(`[media] record Media baru dibuat`);

  // 4. Update baris galeri: URL + caption baru
  await c.query(`UPDATE "PortfolioImage" SET url = $1, caption = $2 WHERE id = $3`, [newUrl, NEW_CAPTION, oldRow.id]);
  console.log(`[galeri] baris about di-update → screenshot maskot`);

  // 5. Hapus Media lama + file storage lama
  await c.query(`DELETE FROM "Media" WHERE url = $1`, [oldRow.url]);
  await deleteFromSupabase(oldRow.url);

  // 6. Verifikasi final
  const final = await c.query(
    `SELECT url, caption, "order" FROM "PortfolioImage" WHERE "portfolioId" = $1 ORDER BY "order" ASC`,
    [pid]
  );
  console.log(`\n=== GALERI FINAL (${final.rows.length} gambar) ===`);
  final.rows.forEach((r) => console.log(`  [order=${r.order}] ${r.url.split("/").pop()}`));

  await c.end();
  console.log("\nSelesai — gambar maskot menggantikan gambar about lama.");
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
