/**
 * Tes koneksi cepat ke Supabase via DATABASE_URL di .env
 */
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");
const env = {};
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  const k = t.slice(0, eq).trim();
  let v = t.slice(eq + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  env[k] = v;
}

async function main() {
  const client = new Client({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
  try {
    await client.connect();
    const res = await client.query("SELECT version(), current_database()");
    console.log("✅ Koneksi BERHASIL via transaction pooler");
    console.log("   DB:", res.rows[0].current_database);
    const tables = await client.query(
      "SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public'"
    );
    console.log("   Jumlah tabel public:", tables.rows[0].n);
    const counts = await client.query(
      "SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 12"
    );
    console.log("   Data per tabel (estimasi):");
    counts.rows.forEach((r) => console.log(`     - ${r.relname}: ${r.n_live_tup}`));
  } catch (e) {
    console.error("❌ Koneksi GAGAL:", e.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}
main();
