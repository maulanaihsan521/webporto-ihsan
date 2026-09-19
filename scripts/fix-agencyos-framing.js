// =====================================================================
// FIX FRAMING AgencyOS: klien "PT. Bikin Kreatif Corp" → "Personal Project"
// (konfirmasi user: AgencyOS adalah proyek personal, BUKAN proyek KP/klien)
// Pola sama dengan fix-company-profile-framing.js (Task 11):
// - description: paragraf pembuka ditulis ulang (framing proyek personal + disclaimer)
// - excerpt / metaTitle / metaDescription konsisten
// - field lain dipertahankan (PUT API menuntut body lengkap)
// Update via admin API PUT (JWT + cookie + Origin CSRF)
// =====================================================================
const { getConnection, loadEnvValue } = require("./db-conn");
const jwt = require("jsonwebtoken");

const JWT_SECRET = loadEnvValue("JWT_SECRET");
const MATCH_SLUG = "agencyos-erp-crm";

const NEW_FIELDS = {
  client: "Personal Project",
  excerpt:
    "Proyek personal: sistem ERP + CRM terintegrasi dengan studi kasus operasional digital agency — pipeline penjualan, manajemen proyek & tugas, invoicing, HR, knowledge base, hingga AI Assistant.",
  metaTitle: "AgencyOS — ERP & CRM Digital Agency (Proyek Personal) — Portfolio",
  metaDescription:
    "Proyek personal: sistem ERP + CRM dengan studi kasus digital agency — pipeline penjualan & segmentasi pelanggan, manajemen proyek, invoicing & keuangan, HR, knowledge base, dan AI Assistant dengan keamanan RBAC & 2FA.",
  description: [
    '<p><strong>AgencyOS</strong> adalah <strong>proyek personal</strong> yang saya rancang untuk mengasah kemampuan full-stack development dengan memodelkan operasional sebuah digital agency secara end-to-end — dari mengelola lead dan pelanggan hingga proyek, keuangan, dan SDM dalam satu platform terintegrasi. Situs ini <strong>bukan sistem resmi dari agensi mana pun</strong>; seluruh data dan alur bisnis di dalamnya merupakan simulasi studi kasus yang saya susun sendiri.</p>',
    "<h3>Modul Utama</h3>",
    "<ul>",
    "<li><strong>CRM:</strong> manajemen customers, lead pipeline (Lead → Contacted → Meeting → Proposal → Negotiation → Won), dan segmentasi pelanggan.</li>",
    "<li><strong>Project Management:</strong> daftar proyek, tasks dengan papan Kanban, dan Content Calendar untuk perencanaan konten.</li>",
    "<li><strong>Dokumen & Keuangan:</strong> proposals, contracts, File Manager, invoices, serta modul Finance.</li>",
    "<li><strong>Manajemen:</strong> HR &amp; Payroll, SOP, dan Knowledge Base internal.</li>",
    "<li><strong>Insight:</strong> Analytics dan <strong>AI Assistant</strong> dengan ringkasan performa otomatis.</li>",
    "</ul>",
    '<p>Dashboard menampilkan KPI bisnis secara real-time — total customer &amp; lead, revenue bulanan, invoice tertunda, project berjalan, customer satisfaction, retention, dan conversion rate — dilengkapi grafik revenue 12 bulan, distribusi pipeline penjualan, pertumbuhan customer, serta lead per channel marketing. Keamanan dijaga melalui <strong>RBAC dan 2FA</strong>, dan sistem siap dipasang sebagai <strong>PWA</strong>.</p>',
    '<p>Melalui proyek ini saya berlatih menerjemahkan proses bisnis nyata menjadi arsitektur aplikasi yang modular — merancang skema data lintas modul, menyusun alur kerja antar peran, dan menghadirkan pengalaman dashboard yang informatif. Stakeholder lain dalam sistem (klien, anggota tim, HR) berperan sebagai data simulasi untuk memperagakan alur kerja yang lengkap.</p>',
  ].join("\n"),
};

async function main() {
  const client = getConnection();
  await client.connect();

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

  const cur = await client.query(`SELECT * FROM "Portfolio" WHERE slug = $1`, [MATCH_SLUG]);
  const p = cur.rows[0];
  if (!p) {
    console.log("TIDAK KETEMU:", MATCH_SLUG);
    await client.end();
    return;
  }
  console.log("Portofolio:", p.title, "|", p.id);

  // Body LENGKAP — field existing dipertahankan, field framing diganti
  const body = {
    title: p.title,
    slug: p.slug,
    excerpt: NEW_FIELDS.excerpt,
    description: NEW_FIELDS.description,
    thumbnail: p.thumbnail ?? "",
    banner: p.banner ?? "",
    videoUrl: p.videoUrl ?? "",
    role: p.role ?? "",
    client: NEW_FIELDS.client,
    status: p.status || "PUBLISHED",
    projectDate: p.projectDate ? p.projectDate.toISOString().slice(0, 10) : "",
    startDate: p.startDate ? p.startDate.toISOString().slice(0, 10) : "",
    endDate: p.endDate ? p.endDate.toISOString().slice(0, 10) : "",
    technologies: p.technologies ?? "",
    githubUrl: p.githubUrl ?? "",
    demoUrl: p.demoUrl ?? "",
    figmaUrl: p.figmaUrl ?? "",
    youtubeUrl: p.youtubeUrl ?? "",
    downloadUrl: p.downloadUrl ?? "",
    featured: p.featured,
    metaTitle: NEW_FIELDS.metaTitle,
    metaDescription: NEW_FIELDS.metaDescription,
    ogImage: p.ogImage ?? "",
    categoryId: p.categoryId ?? "",
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
  console.log(`PUT status=${res.status}`, res.status === 200 ? "OK" : JSON.stringify(json).slice(0, 300));

  // Verifikasi pasca-update
  const after = await client.query(
    `SELECT client, "metaTitle", length(description) AS dlen FROM "Portfolio" WHERE id = $1`,
    [p.id]
  );
  const a = after.rows[0];
  console.log("\nVERIFIKASI:");
  console.log("  client    :", a.client);
  console.log("  metaTitle :", a.metaTitle);
  console.log("  desc len  :", a.dlen, "chars");

  await client.end();
}

main().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
