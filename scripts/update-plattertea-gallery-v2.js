/**
 * Update galeri portfolio PlatterTea — VERSI WEBSITE BARU (multi-halaman)
 *
 * Website PlatterTea (plattertea.vercel.app) sudah update jadi multi-halaman:
 * - Home, Menu, Promo, About (+ Galeri foto & maskot), FAQ, Contact
 * - Section baru: Tea Collection
 *
 * Script ini:
 * 1. Proses 10 screenshot baru → webp q82 → upload ke Supabase Storage
 * 2. Ganti seluruh galeri (7 gambar lama → 10 gambar baru, order 0-9)
 * 3. Update thumbnail + banner + excerpt + metaDescription + bullet-1 description
 * 4. Hapus Media record + purge file storage lama (7 galeri + 2 hero lama)
 *
 * Jalankan: node scripts/run-with-env.js node scripts/update-plattertea-gallery-v2.js
 */
const { Client } = require("pg");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "media";
const PORTFOLIO_SLUG = "plattertea-food-tea-website";
const DIR = "/home/z/my-project/download/plattertea-new";

// ---------- Galeri baru (order 0-9) ----------
const NEW_GALLERY = [
  {
    key: "hero", src: "01-hero.png", order: 0,
    caption: "Halaman utama PlatterTea — hero “Mix, Sip, Enjoy!” dengan pencarian produk, keranjang, dan navigasi ke seluruh halaman (Menu, Promo, About, Gallery, FAQ, Contact)",
    mediaName: "PlatterTea hero (update multi-page)",
  },
  {
    key: "mascot", src: "02-about-mascot.png", order: 1,
    caption: "Halaman Tentang Kami — keluarga maskot PlatterTea (Semangat, Keren, Penuh Kasih, Santai) yang menyapa pengunjung brand Food & Tea Purwokerto",
    mediaName: "PlatterTea maskot about (update)",
  },
  {
    key: "menu", src: "03-menu.png", order: 2,
    caption: "Katalog menu interaktif — 8 produk Platter, Tea & Combo dengan filter kategori, badge favorit, dan tombol tambah-ke-keranjang",
    mediaName: "PlatterTea menu katalog (update)",
  },
  {
    key: "tea", src: "04-tea-collection.png", order: 3,
    caption: "Tea Collection — koleksi teh pilihan (Original, Yakult, Teh Tarik) dengan kartu produk, harga, dan tombol lihat detail",
    mediaName: "PlatterTea tea collection (baru)",
  },
  {
    key: "promo", src: "05-marketdays.png", order: 4,
    caption: "Promo Spesial Market Days — diskon semua produk dan alur Open PO via WhatsApp dari H-7 hingga pengambilan di booth",
    mediaName: "PlatterTea market days (update)",
  },
  {
    key: "cara-pesan", src: "06-cara-pesan.png", order: 5,
    caption: "Alur cara pesan 5 langkah yang jelas — dari pilih menu, isi keranjang, hingga checkout otomatis ke WhatsApp admin",
    mediaName: "PlatterTea cara pesan (update)",
  },
  {
    key: "cart-mobile", src: "09-cart-mobile.png", order: 6,
    caption: "Keranjang pesanan versi mobile — atur jumlah per item, isi nama & catatan, total otomatis dengan promo, checkout langsung via WhatsApp",
    mediaName: "PlatterTea keranjang mobile (update)",
  },
  {
    key: "galeri", src: "08-about-gallery.png", order: 7,
    caption: "Galeri foto di halaman Tentang Kami — momen dan keseruan bersama PlatterTea, dari dapur hingga produk siap dinikmati",
    mediaName: "PlatterTea galeri about (baru)",
  },
  {
    key: "faq", src: "07-faq.png", order: 8,
    caption: "Halaman FAQ — 8 pertanyaan umum seputar produk, harga, lokasi, cara pesan, dan Open PO Market Days",
    mediaName: "PlatterTea halaman FAQ (baru)",
  },
  {
    key: "mobile", src: "10-mobile-view.png", order: 9,
    caption: "Tampilan mobile-first dengan bottom navigation — dioptimalkan untuk pengunjung dari share link WhatsApp dan Instagram",
    mediaName: "PlatterTea mobile view (update)",
  },
];

const NEW_EXCERPT =
  "Website multi-halaman & pemesanan online untuk PlatterTea — Food & Tea Purwokerto: beranda, katalog menu interaktif, Tea Collection, halaman Tentang Kami dengan galeri foto & maskot brand, promo Market Days, FAQ, dan kontak — lengkap dengan keranjang pesanan dan checkout otomatis via WhatsApp, mobile-first & SEO-ready.";

const NEW_META_DESC =
  "Website multi-halaman PlatterTea — Food & Tea Purwokerto: katalog menu interaktif, Tea Collection, galeri brand, FAQ, keranjang pesanan, dan checkout otomatis via WhatsApp.";

async function toWebp(src) {
  const buf = await sharp(src).webp({ quality: 82 }).toBuffer();
  const m = await sharp(buf).metadata();
  return { buf, width: m.width, height: m.height };
}

async function uploadToSupabase(key, buffer) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`, {
    method: "POST",
    headers: {
      "Content-Type": "image/webp",
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "apikey": SERVICE_KEY,
      "x-upsert": "true",
    },
    body: buffer,
  });
  if (!res.ok && res.status !== 409) {
    const txt = await res.text();
    throw new Error(`Upload gagal ${key}: ${res.status} ${txt}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key}`;
}

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
    console.log(`  [purge] ${key}: ${res.ok ? "terhapus" : "status " + res.status + " (abaikan)"}`);
  } catch (e) {
    console.log(`  [purge] ${key}: gagal (${e.message}, abaikan)`);
  }
}

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, query_timeout: 30000, connectionTimeoutMillis: 15000 });
  await c.connect();

  // ============ 1. Ambil portfolio + galeri lama ============
  const p = await c.query(
    `SELECT id, title, thumbnail, banner, excerpt, description, "metaDescription" FROM "Portfolio" WHERE slug = $1`,
    [PORTFOLIO_SLUG]
  );
  const port = p.rows[0];
  if (!port) throw new Error(`Portfolio '${PORTFOLIO_SLUG}' tidak ditemukan`);
  const pid = port.id;
  console.log(`Portfolio: ${port.title} (id=${pid})`);

  const old = await c.query(
    `SELECT id, url, caption, "order" FROM "PortfolioImage" WHERE "portfolioId" = $1 ORDER BY "order" ASC`,
    [pid]
  );
  console.log(`\nGaleri lama (${old.rows.length}):`);
  old.rows.forEach((r) => console.log(`  [order=${r.order}] ${r.url.split("/").pop()}`));

  const oldUrls = old.rows.map((r) => r.url);
  // thumbnail & banner lama juga akan diganti → kumpulkan untuk purge
  const extraOld = [port.thumbnail, port.banner].filter((u) => u && !oldUrls.includes(u));

  // ============ 2. Proses & upload gambar baru ============
  console.log(`\n=== UPLOAD ${NEW_GALLERY.length} GAMBAR BARU ===`);
  const uploaded = {};
  for (const item of NEW_GALLERY) {
    const src = path.join(DIR, item.src);
    if (!fs.existsSync(src)) throw new Error(`Screenshot tidak ditemukan: ${src}`);
    const { buf, width, height } = await toWebp(src);
    const base = "plattertea-" + item.key.replace(/[^a-zA-Z0-9-]/g, "-");
    const filename = `${Date.now()}_${base}.webp`;
    const url = await uploadToSupabase(`uploads/${filename}`, buf);
    uploaded[item.key] = { url, size: buf.length, width, height };
    console.log(`  [upload] ${item.key}: ${filename} (${width}x${height}, ${(buf.length / 1024).toFixed(0)} KB)`);

    await c.query(
      `INSERT INTO "Media" (id, name, url, type, "mimeType", size, folder, width, height, alt, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, 'IMAGE', 'image/webp', $3, '/', $4, $5, $6, now(), now())`,
      [item.mediaName, url, buf.length, width, height, item.caption]
    );
  }

  // ============ 3. Ganti galeri: hapus 7 baris lama, insert 10 baru ============
  console.log(`\n=== UPDATE PORTFOLIOIMAGE ===`);
  await c.query(`DELETE FROM "PortfolioImage" WHERE "portfolioId" = $1`, [pid]);
  console.log(`  ${old.rows.length} baris lama dihapus`);

  for (const item of NEW_GALLERY) {
    const u = uploaded[item.key];
    await c.query(
      `INSERT INTO "PortfolioImage" (id, url, caption, "order", "portfolioId")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4)`,
      [u.url, item.caption, item.order, pid]
    );
    console.log(`  [insert] order=${item.order} <- ${item.key}`);
  }

  // ============ 4. Update record Portfolio ============
  console.log(`\n=== UPDATE PORTFOLIO ===`);
  const heroUrl = uploaded.hero.url;

  // Bullet pertama description → versi multi-halaman
  let desc = port.description || "";
  const bulletRegex = /<li><strong>Landing page brand lengkap:<\/strong>.*?<\/li>/s;
  const newBullet =
    "<li><strong>Website multi-halaman:</strong> beranda (hero, keunggulan, cara pesan, testimoni), halaman Menu, halaman Promo Market Days, halaman Tentang Kami lengkap dengan galeri foto &amp; maskot brand, halaman FAQ, dan halaman Kontak — dengan navigasi konsisten di desktop maupun mobile.</li>";
  if (bulletRegex.test(desc)) {
    desc = desc.replace(bulletRegex, newBullet);
    console.log("  description: bullet-1 diganti versi multi-halaman");
  } else {
    console.log("  description: bullet-1 TIDAK match — dibiarkan apa adanya");
  }

  await c.query(
    `UPDATE "Portfolio" SET thumbnail = $1, banner = $2, excerpt = $3, description = $4, "metaDescription" = $5, "updatedAt" = now() WHERE id = $6`,
    [heroUrl, heroUrl, NEW_EXCERPT, desc, NEW_META_DESC, pid]
  );
  console.log("  thumbnail + banner -> hero baru");
  console.log("  excerpt + metaDescription -> versi multi-halaman");

  // ============ 5. Bersihkan Media + storage lama ============
  console.log(`\n=== CLEANUP (${oldUrls.length + extraOld.length} file lama) ===`);
  const allOldUrls = [...oldUrls, ...extraOld];
  const dm = await c.query(`DELETE FROM "Media" WHERE url = ANY($1)`, [allOldUrls]);
  console.log(`  Media records terhapus: ${dm.rowCount}`);
  for (const u of allOldUrls) await deleteFromSupabase(u);

  // ============ 6. Verifikasi ============
  const final = await c.query(
    `SELECT url, caption, "order" FROM "PortfolioImage" WHERE "portfolioId" = $1 ORDER BY "order" ASC`,
    [pid]
  );
  console.log(`\n=== GALERI FINAL (${final.rows.length} gambar) ===`);
  final.rows.forEach((r) =>
    console.log(`  [order=${r.order}] ${r.url.split("/").pop()}\n           "${(r.caption || "").slice(0, 90)}"`)
  );

  const check = await c.query(
    `SELECT thumbnail, banner, excerpt FROM "Portfolio" WHERE id = $1`,
    [pid]
  );
  console.log(`\nthumbnail: ${check.rows[0].thumbnail.split("/").pop()}`);
  console.log(`banner:     ${check.rows[0].banner.split("/").pop()}`);

  await c.end();
  console.log("\nSelesai — portfolio PlatterTea berhasil diperbarui ke versi website multi-halaman.");
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
