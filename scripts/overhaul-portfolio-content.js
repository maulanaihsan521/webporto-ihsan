// =====================================================================
// OVERHAUL PORTOFOLIO (review & iteration):
// 1. landing-page-saas-startup → AgencyOS (ERP+CRM digital agency) — judul/slug/klien/deskripsi diseusaikan konten asli
// 2. branding-kit-coffee-shop → ARUNA Cafe (sistem manajemen kafe) — judul/slug/klien/deskripsi disesuaikan konten asli
// 3. fotografer-editor — deskripsi direstrukturisasi jadi HTML + kategori + tech + link galeri
// 4. videografer-editor — deskripsi direstrukturisasi + excerpt (kosong) + tech + link galeri
// 5. game-ihsan-racing — tambah kategori Web Development
// 6. aplikasiworkspace (ProjectForge) — slug jadi projectforge + kategori Web Development
// Update via admin API PUT (JWT + cookie + Origin CSRF)
// =====================================================================
const { getConnection } = require("./db-conn");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

function loadEnvValue(key) {
  const envPath = path.join(__dirname, "..", ".env");
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    if (t.slice(0, eq).trim() === key) {
      let v = t.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      return v;
    }
  }
  return "";
}

const JWT_SECRET = loadEnvValue("JWT_SECRET");
const SITE_GALLERY = "https://portofoliomaulanaihsan.my.id/gallery";

const UPDATES = [
  // ---------- 1. AgencyOS ----------
  {
    matchSlug: "landing-page-saas-startup",
    fields: {
      title: "AgencyOS — ERP & CRM untuk Digital Agency",
      slug: "agencyos-erp-crm",
      excerpt:
        "Sistem ERP + CRM terintegrasi untuk operasional digital agency: pipeline penjualan, manajemen proyek & tugas, invoicing, HR, knowledge base, hingga AI Assistant.",
      client: "PT. Bikin Kreatif Corp",
      role: "Full-Stack Developer",
      technologies: "Next.js, TypeScript, Tailwind CSS",
      categorySlug: "web-development",
      metaTitle: "AgencyOS — ERP & CRM untuk Digital Agency — Portfolio",
      metaDescription:
        "Sistem ERP + CRM untuk digital agency: pipeline penjualan & segmentasi pelanggan, manajemen proyek, invoicing & keuangan, HR, knowledge base, dan AI Assistant dengan keamanan RBAC & 2FA.",
      description: [
        '<p><strong>AgencyOS</strong> adalah sistem <strong>ERP + CRM terintegrasi</strong> yang dirancang untuk menjawab kebutuhan operasional sebuah digital agency profesional — dari mengelola lead dan pelanggan hingga proyek, keuangan, dan SDM dalam satu platform. Sistem ini dibangun untuk <strong>PT. Bikin Kreatif Corp</strong>, sebuah Creative Digital Agency, sebagai pendukung digitalisasi proses bisnis mereka.</p>',
        "<h3>Modul Utama</h3>",
        "<ul>",
        "<li><strong>CRM:</strong> manajemen customers, lead pipeline (Lead → Contacted → Meeting → Proposal → Negotiation → Won), dan segmentasi pelanggan.</li>",
        "<li><strong>Project Management:</strong> daftar proyek, tasks dengan papan Kanban, dan Content Calendar untuk perencanaan konten.</li>",
        "<li><strong>Dokumen & Keuangan:</strong> proposals, contracts, File Manager, invoices, serta modul Finance.</li>",
        "<li><strong>Manajemen:</strong> HR &amp; Payroll, SOP, dan Knowledge Base internal.</li>",
        "<li><strong>Insight:</strong> Analytics dan <strong>AI Assistant</strong> dengan ringkasan performa otomatis.</li>",
        "</ul>",
        '<p>Dashboard menampilkan KPI bisnis secara real-time — total customer &amp; lead, revenue bulanan, invoice tertunda, project berjalan, customer satisfaction, retention, dan conversion rate — dilengkapi grafik revenue 12 bulan, distribusi pipeline penjualan, pertumbuhan customer, serta lead per channel marketing. Keamanan dijaga melalui <strong>RBAC dan 2FA</strong>, dan sistem siap dipasang sebagai <strong>PWA</strong>.</p>',
      ].join("\n"),
    },
  },

  // ---------- 2. ARUNA Cafe ----------
  {
    matchSlug: "branding-kit-coffee-shop",
    fields: {
      title: "ARUNA Cafe — Enterprise Management System",
      slug: "aruna-cafe-management-system",
      excerpt:
        "Sistem manajemen kafe terintegrasi: POS, kitchen display, QR order, reservasi, inventori & resep, CRM & loyalitas, keuangan, hingga AI insight — dengan demo multi-peran.",
      client: "Personal Project",
      role: "Full-Stack Developer",
      technologies: "Next.js, TypeScript, Tailwind CSS",
      categorySlug: "web-development",
      metaTitle: "ARUNA Cafe — Sistem Manajemen Kafe Terintegrasi — Portfolio",
      metaDescription:
        "Sistem manajemen kafe enterprise: POS, menu & kitchen display, QR order, reservasi, inventori & resep, gudang & supplier, CRM & loyalitas, keuangan, dan AI insight — dengan akses demo multi-peran.",
      description: [
        '<p><strong>ARUNA Cafe</strong> adalah proyek personal berupa <strong>enterprise management system</strong> untuk operasional kafe modern — satu platform terpadu yang menangani transaksi, dapur, rantai pasok, pelanggan, hingga keuangan. Proyek ini menjadi sarana saya mengasah kemampuan membangun aplikasi berskala besar dengan banyak modul yang saling terintegrasi.</p>',
        "<h3>Modul Utama</h3>",
        "<ul>",
        "<li><strong>Operasional:</strong> POS (dine-in, takeaway, delivery), manajemen menu, Kitchen Display, <strong>QR Order</strong>, dan reservasi meja.</li>",
        "<li><strong>Rantai pasok:</strong> Inventory dengan peringatan stok minimum, Recipe, Warehouse, Suppliers, dan Purchasing.</li>",
        "<li><strong>Pelanggan & tim:</strong> CRM, program Loyalty, dan HR.</li>",
        "<li><strong>Keuangan & laporan:</strong> modul Finance dan Reports.</li>",
        "</ul>",
        '<p>Dashboard owner menyajikan revenue harian &amp; bulanan, margin, average order value, estimasi profit, dan meja aktif secara real-time — diperkaya <strong>AI Insight</strong> (ringkasan bisnis otomatis) serta rekomendasi promo berbasis data untuk menggerakkan menu lambat dan menarik kembali pelanggan pasif. Tersedia <strong>akses demo multi-peran</strong> (Owner, Manager, Cashier, Barista) dengan tampilan dan hak akses yang berbeda untuk masing-masing peran.</p>',
      ].join("\n"),
    },
  },

  // ---------- 3. Fotografer & Editor ----------
  {
    matchSlug: "fotografer-editor",
    fields: {
      excerpt:
        "Karya fotografi & editing: portrait, fashion editorial, foto produk, dokumentasi event, hingga travel — dengan retouching dan color grading yang konsisten.",
      client: "Personal Project",
      role: "Fotografer & Editor",
      technologies: "Adobe Photoshop",
      categorySlug: "photography",
      demoUrl: SITE_GALLERY,
      metaTitle: "Fotografer & Editor — Portofolio Fotografi & Photo Editing",
      metaDescription:
        "Portofolio fotografi & photo editing: portrait, fashion editorial, foto produk, dokumentasi event, dan travel photography — lengkap dengan retouching serta color grading.",
      description: [
        '<p>Saya adalah fotografer dan editor yang memiliki ketertarikan pada dunia visual, storytelling, dan pengolahan gambar. Saya menggabungkan kemampuan fotografi dengan proses editing untuk menghasilkan visual yang tidak hanya menarik secara estetis, tetapi juga mampu menyampaikan karakter, suasana, dan cerita di balik setiap momen.</p>',
        "<h3>Cakupan Karya</h3>",
        "<ul>",
        "<li><strong>Portrait &amp; fashion editorial</strong> — sesi pemotretan personal hingga kebutuhan pameran dan konten brand.</li>",
        "<li><strong>Foto produk</strong> — termasuk foto produk ekspor untuk kebutuhan komersial.</li>",
        "<li><strong>Dokumentasi event &amp; organisasi</strong> — acara kampus, gathering, dan momen spesial seperti birthday shoot.</li>",
        "<li><strong>Travel photography</strong> dan konten visual untuk media sosial.</li>",
        "</ul>",
        '<p>Dalam proses kreatif, saya memperhatikan komposisi, pencahayaan, warna, dan detail agar setiap karya memiliki identitas visual yang kuat. Setelah proses pengambilan gambar, saya melakukan <strong>editing dan color grading</strong> untuk menyempurnakan visual, memperkuat mood, serta menjaga konsistensi karya.</p>',
        '<p>Bagi saya, fotografi bukan hanya tentang mengabadikan sebuah momen, tetapi tentang bagaimana sebuah gambar dapat memberikan kesan, menyampaikan cerita, dan memiliki nilai visual yang kuat. Karya lengkap dapat dilihat di <a href="/gallery">halaman galeri</a>.</p>',
        '<p><em>Photography • Photo Editing • Color Grading • Visual Storytelling</em></p>',
      ].join("\n"),
    },
  },

  // ---------- 4. Videografer & Editor ----------
  {
    matchSlug: "videografer-editor",
    fields: {
      excerpt:
        "Karya videografi & editing: reels vertikal IG/TikTok, konten mahasiswa & motivasi, Q&A, hingga video promosi — dari shooting, color grading, hingga sound design.",
      client: "Telkom University Purwokerto",
      role: "Videografer & Editor",
      technologies: "Adobe Premiere Pro, CapCut",
      demoUrl: SITE_GALLERY,
      metaTitle: "Videografer & Editor — Portofolio Videografi & Video Editing",
      metaDescription:
        "Portofolio videografi & video editing: reels vertikal IG/TikTok, konten relatable mahasiswa & motivasi, Q&A, video promosi, dan dokumentasi — dari shooting hingga color grading.",
      description: [
        '<p>Saya adalah videografer dan editor yang memiliki ketertarikan pada dunia visual, storytelling, dan produksi video. Saya menggabungkan proses pengambilan gambar dengan editing untuk menciptakan video yang tidak hanya menarik secara visual, tetapi juga mampu menyampaikan cerita, suasana, dan pesan secara kuat.</p>',
        "<h3>Cakupan Karya</h3>",
        "<ul>",
        "<li><strong>Short-form reels</strong> vertikal untuk Instagram &amp; TikTok — konten relatable dan trend mahasiswa.</li>",
        "<li><strong>Konten motivasi &amp; storytelling</strong> dengan penyusunan narasi dan ritme yang kuat.</li>",
        "<li><strong>Q&amp;A dan konten edukatif</strong> untuk audiens mahasiswa.</li>",
        "<li><strong>Video promosi</strong> dan dokumentasi kegiatan.</li>",
        "</ul>",
        '<p>Dalam proses kreatif, saya memperhatikan komposisi, pencahayaan, pergerakan kamera, pemilihan angle, ritme, serta detail visual untuk membangun alur yang menarik. Setelah proses produksi, saya mengolah footage melalui <strong>editing, color grading, sound design, dan penyusunan storytelling</strong> agar setiap video memiliki karakter dan identitas visual yang konsisten.</p>',
        '<p>Bagi saya, video bukan hanya sekumpulan footage yang disusun menjadi satu, tetapi sebuah media untuk menghidupkan cerita melalui gambar, gerakan, suara, dan emosi. Karya lengkap dapat dilihat di <a href="/gallery">halaman galeri</a>.</p>',
        '<p><em>Videography • Video Editing • Color Grading • Cinematography • Visual Storytelling</em></p>',
      ].join("\n"),
    },
  },

  // ---------- 5. Game Ihsan Racing: kategori saja ----------
  {
    matchSlug: "game-ihsan-racing",
    fields: { categorySlug: "web-development" },
  },

  // ---------- 6. ProjectForge: slug + kategori ----------
  {
    matchSlug: "aplikasiworkspace",
    fields: { slug: "projectforge", categorySlug: "web-development" },
  },
];

async function main() {
  const client = getConnection();
  await client.connect();

  // Lookup category id by slug
  const catRows = await client.query(`SELECT id, slug FROM "Category"`);
  const catBySlug = Object.fromEntries(catRows.rows.map((r) => [r.slug, r.id]));

  const user = await client.query(
    `SELECT id, email, name, role FROM "User" WHERE role = 'ADMIN' LIMIT 1`
  );
  const admin = user.rows[0];
  const token = jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name, role: admin.role, image: null },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
  console.log("Admin:", admin.email, "\n");

  for (const upd of UPDATES) {
    const cur = await client.query(`SELECT * FROM "Portfolio" WHERE slug = '${upd.matchSlug}'`);
    const p = cur.rows[0];
    if (!p) {
      console.log(`SKIP: ${upd.matchSlug} tidak ditemukan`);
      continue;
    }
    const f = upd.fields;

    const body = {
      title: f.title ?? p.title,
      slug: f.slug ?? p.slug,
      excerpt: f.excerpt ?? p.excerpt ?? "",
      description: f.description ?? p.description ?? "",
      thumbnail: p.thumbnail ?? "",
      banner: p.banner ?? "",
      videoUrl: p.videoUrl ?? "",
      role: f.role ?? p.role ?? "",
      client: f.client ?? p.client ?? "",
      status: p.status || "PUBLISHED",
      projectDate: p.projectDate ? p.projectDate.toISOString().slice(0, 10) : "",
      startDate: p.startDate ? p.startDate.toISOString().slice(0, 10) : "",
      endDate: p.endDate ? p.endDate.toISOString().slice(0, 10) : "",
      technologies: f.technologies ?? p.technologies ?? "",
      githubUrl: p.githubUrl ?? "",
      demoUrl: f.demoUrl ?? p.demoUrl ?? "",
      figmaUrl: p.figmaUrl ?? "",
      youtubeUrl: p.youtubeUrl ?? "",
      downloadUrl: p.downloadUrl ?? "",
      featured: p.featured,
      metaTitle: f.metaTitle ?? p.metaTitle ?? "",
      metaDescription: f.metaDescription ?? p.metaDescription ?? "",
      ogImage: p.ogImage ?? "",
      categoryId: f.categorySlug ? catBySlug[f.categorySlug] ?? "" : p.categoryId ?? "",
    };

    const res = await fetch(`http://localhost:3000/api/admin/portfolio/${p.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: `admin_token=${token}`,
        Origin: "http://localhost:3000",
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    const ok = res.status === 200;
    console.log(
      `${ok ? "OK " : "ERR"} ${p.title} → ${body.title}` +
        (f.slug && f.slug !== p.slug ? ` (slug: ${p.slug} → ${f.slug})` : "") +
        ` | status=${res.status}` +
        (!ok ? ` | ${JSON.stringify(json).slice(0, 200)}` : "")
    );
  }

  await client.end();
}

main().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
