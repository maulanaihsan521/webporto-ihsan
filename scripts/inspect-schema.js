// Inspect schema kolom tabel Portfolio + PortfolioImage
const { Client } = require("pg");

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, query_timeout: 30000, connectionTimeoutMillis: 15000 });
  await c.connect();

  for (const t of ["Portfolio", "PortfolioImage"]) {
    const cols = await c.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
      [t]
    );
    console.log(`=== ${t} ===`);
    cols.rows.forEach((r) => console.log(`  ${r.column_name} (${r.data_type})`));
  }

  await c.end();
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
