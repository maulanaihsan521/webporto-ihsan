// REVIEW PASCA-BANNER: pastikan semua field portofolio utuh (tidak ada yang ter-wipe oleh PUT)
const { Pool } = require("pg");
const { loadEnvValue } = require("./db-conn");

const pool = new Pool({
  connectionString: loadEnvValue("DATABASE_URL"),
  ssl: { rejectUnauthorized: false },
});

(async () => {
  const r = await pool.query(`
    SELECT slug, title, client, role, "excerpt", "metaTitle", "metaDescription",
           "viewCount", featured, status, "categoryId", "demoUrl",
           banner IS NULL OR banner = '' AS no_banner,
           thumbnail IS NULL OR thumbnail = '' AS no_thumb,
           length(description) AS dlen
    FROM "Portfolio" ORDER BY "createdAt" ASC
  `);
  let allOk = true;
  for (const p of r.rows) {
    const issues = [];
    if (!p.excerpt || p.excerpt.length < 50) issues.push("EXCERPT_PENDEK/KOSONG");
    if (!p.metaTitle) issues.push("METATITLE_KOSONG");
    if (!p.metaDescription) issues.push("METADESC_KOSONG");
    if (p.dlen < 500) issues.push("DESC_PENDEK(" + p.dlen + ")");
    if (p.no_banner) issues.push("BANNER_KOSONG");
    if (p.no_thumb) issues.push("THUMB_KOSONG");
    if (!p.client) issues.push("CLIENT_KOSONG");
    if (p.viewCount === 0 || p.viewCount === null) issues.push("VIEWCOUNT=0");
    if (p.status !== "PUBLISHED") issues.push("STATUS=" + p.status);
    if (!p.categoryId) issues.push("KATEGORI_KOSONG");
    const ok = issues.length === 0;
    if (!ok) allOk = false;
    console.log(
      (ok ? "[OK]    " : "[ISSUE] ") + p.slug.padEnd(36) +
      " views=" + String(p.viewCount).padStart(3) +
      " featured=" + (p.featured ? "Y" : "n") +
      " dlen=" + String(p.dlen).padStart(5) +
      (ok ? "" : "  << " + issues.join(", "))
    );
  }
  console.log("\n" + (allOk ? "SEMUA FIELD UTUH ✓" : "ADA MASALAH — lihat baris [ISSUE]"));
  await pool.end();
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
