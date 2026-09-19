/**
 * Inspect DB settings untuk P8 audit (social media links, owner info, SEO).
 * Dipakai internal untuk audit, bukan untuk production.
 */
const { Client } = require('pg');
const url = process.env.DATABASE_URL;

(async () => {
  const client = new Client({
    connectionString: url,
    query_timeout: 15000,
    connectionTimeoutMillis: 10000,
  });
  await client.connect();
  const r = await client.query(`
    SELECT key, value, "group"
    FROM "Setting"
    WHERE key LIKE 'social_%'
       OR key LIKE 'owner_%'
       OR key LIKE 'seo_%'
       OR key LIKE 'site_%'
       OR key LIKE 'stat_%'
    ORDER BY "group", key;
  `);
  console.log('Settings dari DB:');
  console.log('-'.repeat(80));
  for (const row of r.rows) {
    let val = row.value;
    if (val && val.length > 80) val = val.slice(0, 77) + '...';
    const isEmpty = !val || val.trim() === '' || val.trim() === '#';
    console.log(`  ${row.key.padEnd(30)} [${(row.group || '').padEnd(10)}] ${isEmpty ? '✗ KOSONG' : val}`);
  }
  await client.end();
})().catch(e => { console.error('✗ Error:', e.message); process.exit(1); });
