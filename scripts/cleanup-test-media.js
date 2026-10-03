/**
 * Bersihkan media test sisa sesi QA sebelumnya (test-*.png):
 * - Hapus record Media yang namanya diawali 'test-'
 * - Purge file di Supabase Storage
 * - Hanya file yang TIDAK direferensikan PortfolioImage/Portfolio/BlogPost yang dihapus
 *
 * Jalankan: node scripts/run-with-env.js node scripts/cleanup-test-media.js
 */
const { Client } = require("pg");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "media";

async function deleteFromSupabase(url) {
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return false;
  const key = url.slice(idx + marker.length);
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${SERVICE_KEY}`, "apikey": SERVICE_KEY },
    });
    console.log(`  [purge] ${key}: ${res.ok ? "terhapus" : "status " + res.status + " (abaikan)"}`);
    return res.ok;
  } catch (e) {
    console.log(`  [purge] ${key}: gagal (${e.message}, abaikan)`);
    return false;
  }
}

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, query_timeout: 30000, connectionTimeoutMillis: 15000 });
  await c.connect();

  const m = await c.query(`SELECT id, name, url FROM "Media" WHERE name LIKE 'test-%'`);
  console.log(`Media test: ${m.rows.length} record`);

  let deleted = 0;
  for (const row of m.rows) {
    const u1 = await c.query(`SELECT COUNT(*)::int AS n FROM "PortfolioImage" WHERE url = $1`, [row.url]);
    const u2 = await c.query(`SELECT COUNT(*)::int AS n FROM "Portfolio" WHERE thumbnail = $1 OR banner = $1 OR "ogImage" = $1`, [row.url]);
    const u3 = await c.query(`SELECT COUNT(*)::int AS n FROM "Post" WHERE "coverImage" = $1 OR "ogImage" = $1`, [row.url]);
    const used = u1.rows[0].n + u2.rows[0].n + u3.rows[0].n;

    if (used > 0) {
      console.log(`- SKIP ${row.name} (dipakai ${used}x)`);
      continue;
    }
    await c.query(`DELETE FROM "Media" WHERE id = $1`, [row.id]);
    await deleteFromSupabase(row.url);
    deleted++;
  }

  console.log(`\nSelesai: ${deleted} media test dibersihkan.`);
  await c.end();
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
