// Inspeksi thumbnail/banner/demoUrl semua portofolio + tabel PortfolioImage
const { Pool } = require("pg");
const { loadEnvValue } = require("./db-conn");

const pool = new Pool({
  connectionString: loadEnvValue("DATABASE_URL"),
  ssl: { rejectUnauthorized: false },
});

(async () => {
  const r = await pool.query(`
    SELECT p.id, p.title, p.slug, p.thumbnail, p.banner, p."demoUrl", p."ogImage",
           (SELECT COUNT(*) FROM "PortfolioImage" pi WHERE pi."portfolioId" = p.id) AS "imgCount"
    FROM "Portfolio" p
    ORDER BY p."createdAt" ASC
  `);
  console.log("=== PORTFOLIO: thumbnail / banner / demo ===");
  for (const p of r.rows) {
    console.log(`\n[${p.slug}]  ${p.title}`);
    console.log(`  thumbnail : ${p.thumbnail || "(KOSONG)"}`);
    console.log(`  banner    : ${p.banner || "(KOSONG)"}`);
    console.log(`  ogImage   : ${p.ogImage || "(KOSONG)"}`);
    console.log(`  demoUrl   : ${p.demoUrl || "(KOSONG)"}`);
    console.log(`  imgCount  : ${p.imgCount}`);
  }
  const pi = await pool.query(`
    SELECT pi."portfolioId", p.slug, pi.url, pi.alt, pi.type, pi."orderIndex"
    FROM "PortfolioImage" pi LEFT JOIN "Portfolio" p ON p.id = pi."portfolioId"
    ORDER BY p.slug, pi."orderIndex"
  `);
  console.log("\n=== PortfolioImage (" + pi.rows.length + " baris) ===");
  for (const row of pi.rows) {
    console.log(`  [${row.slug || "?"}] ${row.type} #${row.orderIndex}: ${String(row.url).slice(0, 90)} | alt=${row.alt || "-"}`);
  }  await pool.end();
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
