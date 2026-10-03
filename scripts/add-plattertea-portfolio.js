/**
 * Tambah portfolio "PlatterTea — Food & Tea Ordering Website"
 * 1. Proses screenshot (sharp): banner 1440x480, thumbnail, galeri → WebP q82
 * 2. Upload ke Supabase Storage (bucket "media", key uploads/{ts}_{name}.webp)
 * 3. Insert record Media, Portfolio, dan PortfolioImage (galeri + lightbox)
 * Idempotent: hapus dulu entry dengan slug sama bila ada.
 */
const { Client } = require("pg");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "media";
const CATEGORY_WEB_DEV_ID = "cmrabl5hy0016sdar4g8ik5ze"; // Web Development (PORTFOLIO)

const DL = "/home/z/my-project/download";

// ── Konfigurasi asset ────────────────────────────────────────────────
const ASSETS = {
  banner:    { src: `${DL}/plattertea-hero.png`,  crop: { y: 120, h: 480 }, caption: null },
  thumbnail: { src: `${DL}/plattertea-hero.png`,  crop: null,               caption: null },
  g1:        { src: `${DL}/plattertea-hero.png`,  crop: null,               caption: "Halaman utama PlatterTea — hero \u201CMix, Sip, Enjoy!\u201D dengan navigasi, pencarian, dan keranjang" },
  g2:        { src: `${DL}/plattertea-menu.png`,  crop: null,               caption: "Katalog menu interaktif — filter kategori Platter, Tea, dan Combo dengan badge FAVORIT" },
  g3:        { src: `${DL}/plattertea-promo.png`, crop: null,               caption: "Promo Spesial Market Days — diskon Rp2.000 semua produk dan alur Open PO via WhatsApp" },
  g4:        { src: `${DL}/plattertea-order.png`, crop: null,               caption: "Alur cara pesan 5 langkah dan timeline Open PO dari H-7 hingga hari pengambilan" },
  g5:        { src: `${DL}/plattertea-cart.png`,  crop: null,               caption: "Keranjang pesanan — atur jumlah, isi nama dan catatan, checkout langsung via WhatsApp" },
  g6:        { src: `${DL}/plattertea-mobile.png`,crop: null,               caption: "Tampilan mobile-first — dioptimalkan untuk pengunjung dari share link WhatsApp dan Instagram" },
};

// ── Konfigurasi konten portfolio ─────────────────────────────────────
const PORTFOLIO = {
  title: "PlatterTea — Food & Tea Ordering Website",
  slug: "plattertea-food-tea-website",
  excerpt: "Website brand & pemesanan online untuk PlatterTea — Food & Tea Purwokerto: landing page promosi, katalog menu interaktif dengan filter kategori, keranjang pesanan, checkout otomatis via WhatsApp, promo Market Days, testimoni, hingga FAQ — mobile-first & SEO-ready.",
  role: "Full-Stack Developer",
  client: "PlatterTea — Brand Food & Tea Purwokerto",
  technologies: "Next.js, TypeScript, Tailwind CSS, Vercel",
  demoUrl: "https://plattertea.vercel.app/",
  featured: true,
  status: "PUBLISHED",
  projectDate: "2026-10-02",
  metaTitle: "PlatterTea — Food & Tea Ordering Website (Brand F&B Purwokerto) — Portfolio",
  metaDescription: "Website brand & pemesanan online PlatterTea — Food & Tea Purwokerto: katalog menu interaktif, keranjang pesanan, checkout otomatis via WhatsApp, promo Market Days, command palette, testimoni, dan FAQ. Mobile-first dengan Next.js + TypeScript.",
};

const DESCRIPTION = `
<p><strong>PlatterTea</strong> adalah brand <strong>Food &amp; Tea</strong> asal Purwokerto yang menyajikan perpaduan Mix Platter dan tea dalam satu paket praktis — <em>Mix, Sip, Enjoy!</em> Untuk kebutuhan promosi dan pemesanan online-nya, saya membangun website production-ready yang menjadi etalase digital brand: dari landing page yang memperkenalkan identitas brand, katalog menu interaktif, hingga alur pemesanan lengkap yang berujung di <strong>WhatsApp admin</strong> — tanpa aplikasi tambahan, tanpa antre.</p>

<h3>Fitur Utama</h3>
<ul>
<li><strong>Landing page brand lengkap:</strong> hero, keunggulan, profil brand, promo, cara pesan 5 langkah, testimoni pelanggan, FAQ, lokasi &amp; jam operasional, hingga footer yang informatif.</li>
<li><strong>Katalog menu interaktif:</strong> kartu produk dengan foto, deskripsi, harga, dan badge FAVORIT — terfilter per kategori (Platter, Tea, Combo) plus koleksi Tea Collection.</li>
<li><strong>Keranjang pesanan:</strong> atur jumlah per item, isi nama &amp; catatan pesanan, lihat ringkasan, kosongkan keranjang — isinya tersimpan di browser sehingga tidak hilang saat halaman di-refresh.</li>
<li><strong>Checkout via WhatsApp:</strong> teks pesanan tersusun otomatis (paket, varian tea, jumlah, nama, catatan) dan siap dikirim ke admin dalam sekali klik.</li>
<li><strong>Promo &amp; Open PO:</strong> banner promo Market Days (diskon Rp2.000 semua produk), timeline Open PO mulai H-7 hingga pengambilan di booth, plus tombol salin format pesanan.</li>
<li><strong>Command palette (Ctrl+K) &amp; pencarian produk:</strong> navigasi cepat untuk melompat ke menu atau section mana pun tanpa scroll panjang.</li>
<li><strong>Testimoni interaktif:</strong> carousel testimoni pelanggan dengan form untuk menulis testimoni baru langsung dari website.</li>
</ul>

<h3>Desain &amp; Pengalaman Pengguna</h3>
<p>Desain mengusung identitas brand yang <strong>ceria dan menggugah selera</strong> — palet warna hangat khas produk F&amp;B, tipografi ramah, visual produk yang konsisten, serta animasi halus di setiap section. Seluruh halaman dirancang <strong>mobile-first</strong> karena mayoritas pengunjung brand F&amp;B datang dari share link WhatsApp dan Instagram. Aksesibilitas juga diperhatikan: struktur heading semantik, label ARIA pada seluruh kontrol (tombol keranjang, tab kategori, dialog), serta navigasi skip-link.</p>

<h3>Teknologi</h3>
<p>Dibangun dengan <strong>Next.js</strong> dan <strong>TypeScript</strong>, styling dengan <strong>Tailwind CSS</strong>, lalu di-deploy di <strong>Vercel</strong>. Struktur komponen yang modular menjaga halaman tetap ringan dimuat meski kaya konten visual — code splitting per section dan aset teroptimasi menjaga performa di jaringan mobile.</p>

<p>Melalui proyek ini saya berlatih menerjemahkan kebutuhan bisnis nyata — <em>branding, promosi event kampus, dan alur pemesanan praktis</em> — menjadi pengalaman digital utuh dari halaman publikasi sampai konversi pesanan. Kunjungi versi live melalui tautan demo di bawah untuk merasakan langsung alur memilih menu hingga checkout via WhatsApp.</p>
`.trim();

// ── Helpers ──────────────────────────────────────────────────────────
async function toWebp(src, crop) {
  let img = sharp(src);
  const meta = await img.metadata();
  if (crop) img = sharp(src).extract({ left: 0, top: crop.y, width: Math.min(meta.width, 1440), height: crop.h });
  const buf = await img.webp({ quality: 82 }).toBuffer();
  const m = await sharp(buf).metadata();
  return { buf, width: m.width, height: m.height };
}

async function uploadToSupabase(key, buffer, mime) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`, {
    method: "POST",
    headers: {
      "Content-Type": mime,
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

// ── Main ─────────────────────────────────────────────────────────────
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, query_timeout: 30000, connectionTimeoutMillis: 15000 });
  await c.connect();

  // Idempotent: bersihkan entry lama dengan slug sama + file storage-nya
  const old = await c.query(`SELECT id, thumbnail, banner FROM "Portfolio" WHERE slug = $1`, [PORTFOLIO.slug]);
  if (old.rows[0]) {
    const oldImgs = await c.query(`SELECT url FROM "PortfolioImage" WHERE "portfolioId" = $1`, [old.rows[0].id]);
    const oldUrls = [old.rows[0].thumbnail, old.rows[0].banner, ...oldImgs.rows.map((r) => r.url)].filter(Boolean);
    await c.query(`DELETE FROM "PortfolioImage" WHERE "portfolioId" = $1`, [old.rows[0].id]);
    await c.query(`DELETE FROM "Portfolio" WHERE id = $1`, [old.rows[0].id]);
    console.log(`Entry lama '${PORTFOLIO.slug}' dihapus (re-run).`);
    for (const u of [...new Set(oldUrls)]) {
      await c.query(`DELETE FROM "Media" WHERE url = $1`, [u]);
      await deleteFromSupabase(u);
    }
  }

  const urls = {};
  for (const [keyName, a] of Object.entries(ASSETS)) {
    if (!fs.existsSync(a.src)) throw new Error(`Screenshot tidak ditemukan: ${a.src}`);
    const { buf, width, height } = await toWebp(a.src, a.crop);
    const base = path.basename(a.src, path.extname(a.src)).replace(/[^a-zA-Z0-9-_]/g, "_");
    const filename = `${Date.now()}_${base}.webp`;
    const url = await uploadToSupabase(`uploads/${filename}`, buf, "image/webp");
    urls[keyName] = { url, size: buf.length, width, height };
    console.log(`[upload] ${keyName}: ${filename} (${width}x${height}, ${(buf.length / 1024).toFixed(0)} KB)`);

    await c.query(
      `INSERT INTO "Media" (id, name, url, type, "mimeType", size, folder, width, height, alt, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, 'IMAGE', 'image/webp', $3, '/', $4, $5, $6, now(), now())`,
      [`PlatterTea ${keyName}`, url, buf.length, width, height, a.caption]
    );
  }

  // Insert Portfolio
  const p = await c.query(
    `INSERT INTO "Portfolio" (id, title, slug, excerpt, description, thumbnail, banner, role, client, status,
        "projectDate", technologies, "demoUrl", featured, "viewCount", "metaTitle", "metaDescription",
        "categoryId", "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1,$2,$3,$4,$5,$6,$7,$8,'PUBLISHED',$9,$10,$11,true,0,$12,$13,$14, now(), now())
     RETURNING id, slug`,
    [
      PORTFOLIO.title, PORTFOLIO.slug, PORTFOLIO.excerpt, DESCRIPTION,
      urls.thumbnail.url, urls.banner.url, PORTFOLIO.role, PORTFOLIO.client,
      PORTFOLIO.projectDate, PORTFOLIO.technologies, PORTFOLIO.demoUrl,
      PORTFOLIO.metaTitle, PORTFOLIO.metaDescription, CATEGORY_WEB_DEV_ID,
    ]
  );
  const pid = p.rows[0].id;
  console.log(`\n[portfolio] dibuat: ${PORTFOLIO.slug} (id=${pid})`);

  // Insert galeri (PortfolioImage) — urutan: hero, menu, promo, order, cart, mobile
  const galleryOrder = ["g1", "g2", "g3", "g4", "g5", "g6"];
  for (let i = 0; i < galleryOrder.length; i++) {
    const k = galleryOrder[i];
    await c.query(
      `INSERT INTO "PortfolioImage" (id, url, caption, "order", "portfolioId")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4)`,
      [urls[k].url, ASSETS[k].caption, i, pid]
    );
    console.log(`[galeri ${i}] ${k} — "${ASSETS[k].caption.slice(0, 60)}..."`);
  }

  // Ringkasan
  const check = await c.query(
    `SELECT p.title, p.slug, p.featured, cat.name AS cat, p."demoUrl",
            (SELECT COUNT(*) FROM "PortfolioImage" pi WHERE pi."portfolioId" = p.id) AS imgs
     FROM "Portfolio" p LEFT JOIN "Category" cat ON cat.id = p."categoryId" WHERE p.id = $1`,
    [pid]
  );
  console.log("\n=== VERIFIKASI ===");
  console.log(JSON.stringify(check.rows[0], null, 2));

  await c.end();
  console.log("\nSelesai — portfolio PlatterTea berhasil ditambahkan.");
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
