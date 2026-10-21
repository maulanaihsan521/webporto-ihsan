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
  const client = new Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
  await client.connect();

  const col = async (table, column) => {
    const r = await client.query(
      "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2",
      [table, column]
    );
    return r.rowCount > 0;
  };

  console.log("Post.documentUrl ada?   ", await col("Post", "documentUrl"));
  console.log("Service.image ada?      ", await col("Service", "image"));

  // cek index hasil migrasi 20260826
  const idx = await client.query(
    "SELECT indexname FROM pg_indexes WHERE schemaname='public' AND indexname IN ('Post_status_createdAt_idx','Post_slug_key','Comment_postId_idx')"
  );
  console.log("Index migrasi terlihat: ", idx.rows.map(r => r.indexname).join(", ") || "(tidak ada)");

  // cek FK ondelete
  const fk = await client.query(
    "SELECT conname, confdeltype FROM pg_constraint WHERE contype='f' AND conname LIKE '%categoryId%' LIMIT 5"
  );
  fk.rows.forEach(r => console.log(`FK ${r.conname}: ondelete=${r.confdeltype === 'n' ? 'SET NULL' : r.confdeltype}`));

  await client.end();
}
main().catch(e => { console.error("ERR:", e.message); process.exit(1); });
