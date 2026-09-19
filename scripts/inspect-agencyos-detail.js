// Inspeksi detail lengkap portofolio AgencyOS (untuk rewrite framing personal project)
const { Pool } = require("pg");
const { loadEnvValue } = require("./db-conn");

const pool = new Pool({
  connectionString: loadEnvValue("DATABASE_URL"),
  ssl: { rejectUnauthorized: false },
});

(async () => {
  const r = await pool.query(
    `SELECT id, title, slug, client, role, "excerpt", description, technologies,
            "metaTitle", "metaDescription", "demoUrl", "categoryId", featured, status
     FROM "Portfolio" WHERE slug = $1`,
    ["agencyos-erp-crm"]
  );
  const p = r.rows[0];
  if (!p) {
    console.log("TIDAK KETEMU");
  } else {
    console.log("ID        :", p.id);
    console.log("TITLE     :", p.title);
    console.log("SLUG      :", p.slug);
    console.log("CLIENT    :", p.client);
    console.log("ROLE      :", p.role);
    console.log("TECH      :", p.technologies);
    console.log("DEMO      :", p.demoUrl);
    console.log("CATEGORY  :", p.categoryId);
    console.log("FEATURED  :", p.featured, "| STATUS:", p.status);
    console.log("\nEXCERPT (" + (p.excerpt || "").length + " chars):\n" + p.excerpt);
    console.log("\nMETA TITLE:\n" + p.metaTitle);
    console.log("\nMETA DESC:\n" + p.metaDescription);
    console.log("\nDESCRIPTION (" + (p.description || "").length + " chars):\n" + p.description);
  }
  await pool.end();
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
