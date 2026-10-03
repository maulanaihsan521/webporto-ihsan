/**
 * Update galeri portfolio PlatterTea:
 * 1. Ganti gambar keranjang (desktop, gelap) → screenshot keranjang MODE MOBILE (iPhone 14)
 * 2. Tambah gambar baru: bagian About dengan maskot brand (square 900x900)
 * 3. Reorder galeri: hero, about, menu, promo, cara pesan, keranjang mobile, mobile view
 * 4. Bersihkan file + record Media lama untuk gambar keranjang yang diganti
 */
const { Client } = require("pg");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "media";
const PORTFOLIO_SLUG = "plattertea-food-tea-website";
const DL = "/home/z/my-project/download";

const NEW_IMAGES = {
  about: {
    src: `${DL}/plattertea-about-square-raw.png`,
    caption: "Kenalan dengan PlatterTea — bagian about dengan maskot brand dan foto produk, memperkenalkan identitas Food & Tea Purwokerto",
  },
  cartMobile: {
    src: `${DL}/plattertea-cart-mobile-raw.png`,
    caption: "Keranjang pesanan versi mobile — atur jumlah per item, isi nama & catatan, total otomatis, checkout langsung via WhatsApp",
  },
};

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
    console.log(`[purge] ${key}: ${res.ok ? "terhapus" : "status " + res.status + " (abaikan)"}`);
  } catch (e) {
    console.log(`[purge] ${key}: gagal (${e.message}, abaikan)`);
  }
}

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, query_timeout: 30000, connectionTimeoutMillis: 15000 });
  await c.connect();

  // 1. Ambil portfolio
  const p = await c.query(`SELECT id, title FROM "Portfolio" WHERE slug = $1`, [PORTFOLIO_SLUG]);
  if (!p.rows[0]) throw new Error(`Portfolio '${PORTFOLIO_SLUG}' tidak ditemukan`);
  const pid = p.rows[0].id;
  console.log(`Portfolio: ${p.rows[0].title} (id=${pid})`);

  // 2. Ambil galeri saat ini
  const cur = await c.query(`SELECT id, url, caption, "order" FROM "PortfolioImage" WHERE "portfolioId" = $1 ORDER BY "order" ASC`, [pid]);
  console.log(`\nGaleri saat ini (${cur.rows.length}):`);
  cur.rows.forEach((r) => console.log(`  [order=${r.order}] ${r.url.split("/").pop()} — "${(r.caption || "").slice(0, 50)}..."`));

  const oldCart = cur.rows.find((r) => r.order === 4 && r.url.includes("cart"));
  if (!oldCart) throw new Error("Baris gambar keranjang lama (order=4) tidak ditemukan");

  // 3. Proses & upload gambar baru
  const urls = {};
  for (const [keyName, a] of Object.entries(NEW_IMAGES)) {
    if (!fs.existsSync(a.src)) throw new Error(`Screenshot tidak ditemukan: ${a.src}`);
    const { buf, width, height } = await toWebp(a.src);
    const base = path.basename(a.src, path.extname(a.src)).replace(/[^a-zA-Z0-9-_]/g, "_");
    const filename = `${Date.now()}_${base}.webp`;
    const url = await uploadToSupabase(`uploads/${filename}`, buf);
    urls[keyName] = { url, size: buf.length, width, height };
    console.log(`\n[upload] ${keyName}: ${filename} (${width}x${height}, ${(buf.length / 1024).toFixed(0)} KB)`);

    await c.query(
      `INSERT INTO "Media" (id, name, url, type, "mimeType", size, folder, width, height, alt, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, 'IMAGE', 'image/webp', $3, '/', $4, $5, $6, now(), now())`,
      [`PlatterTea ${keyName} (update)`, url, buf.length, width, height, a.caption]
    );
    console.log(`[media] record Media dibuat untuk ${keyName}`);
  }

  // 4. Reorder + update + insert (pakai order sementara negatif agar aman)
  //    Urutan final: hero=0, about=1, menu=2, promo=3, caraPesan=4, cartMobile=5, mobile=6
  const menu = cur.rows.find((r) => r.order === 1);
  const promo = cur.rows.find((r) => r.order === 2);
  const cara = cur.rows.find((r) => r.order === 3);
  const mobile = cur.rows.find((r) => r.order === 5);

  await c.query(`UPDATE "PortfolioImage" SET "order" = -6 WHERE id = $1`, [mobile.id]);   // mobile → sementara
  await c.query(`UPDATE "PortfolioImage" SET "order" = -5 WHERE id = $1`, [oldCart.id]);  // cart → sementara (akan jadi 5)
  await c.query(`UPDATE "PortfolioImage" SET "order" = -4 WHERE id = $1`, [cara.id]);
  await c.query(`UPDATE "PortfolioImage" SET "order" = -3 WHERE id = $1`, [promo.id]);
  await c.query(`UPDATE "PortfolioImage" SET "order" = -2 WHERE id = $1`, [menu.id]);

  // Insert About di posisi 1
  await c.query(
    `INSERT INTO "PortfolioImage" (id, url, caption, "order", "portfolioId")
     VALUES (gen_random_uuid()::text, $1, $2, 1, $3)`,
    [urls.about.url, NEW_IMAGES.about.caption, pid]
  );
  console.log(`\n[insert] about+mascot → order=1`);

  // Update cart: URL baru + caption baru + order=5
  await c.query(
    `UPDATE "PortfolioImage" SET url = $1, caption = $2, "order" = 5 WHERE id = $3`,
    [urls.cartMobile.url, NEW_IMAGES.cartMobile.caption, oldCart.id]
  );
  console.log(`[update] keranjang → versi mobile, order=5`);

  // Finalisasi order
  await c.query(`UPDATE "PortfolioImage" SET "order" = 2 WHERE id = $1`, [menu.id]);
  await c.query(`UPDATE "PortfolioImage" SET "order" = 3 WHERE id = $1`, [promo.id]);
  await c.query(`UPDATE "PortfolioImage" SET "order" = 4 WHERE id = $1`, [cara.id]);
  await c.query(`UPDATE "PortfolioImage" SET "order" = 6 WHERE id = $1`, [mobile.id]);

  // 5. Hapus record Media lama + file storage keranjang desktop yang gelap
  await c.query(`DELETE FROM "Media" WHERE url = $1`, [oldCart.url]);
  console.log(`[media] record Media keranjang lama dihapus`);
  await deleteFromSupabase(oldCart.url);

  // 6. Verifikasi
  const final = await c.query(
    `SELECT url, caption, "order" FROM "PortfolioImage" WHERE "portfolioId" = $1 ORDER BY "order" ASC`,
    [pid]
  );
  console.log(`\n=== GALERI FINAL (${final.rows.length} gambar) ===`);
  final.rows.forEach((r) => console.log(`  [order=${r.order}] ${r.url.split("/").pop()}\n           "${(r.caption || "").slice(0, 80)}"`));

  await c.end();
  console.log("\nSelesai — galeri PlatterTea berhasil diperbarui.");
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
