/**
 * Dump data relevan untuk review halaman About: settings owner_*, experiences, educations.
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

  const s = await client.query(`
    SELECT key, value FROM "Setting"
    WHERE key LIKE 'owner_%' OR key LIKE 'site_%'
    ORDER BY key;
  `);
  console.log('=== SETTINGS (owner_* / site_*) ===');
  for (const row of s.rows) {
    let val = row.value;
    if (val && val.length > 140) val = val.slice(0, 137) + '...';
    console.log(`${row.key} = ${JSON.stringify(val)}`);
  }

  const e = await client.query('SELECT * FROM "Experience" ORDER BY "order" ASC;');
  console.log('\n=== EXPERIENCES ===');
  for (const r of e.rows) {
    console.log(`[${r.order}] ${r.position} @ ${r.company} | type=${r.type} | ${new Date(r.startDate).toISOString().slice(0, 10)} -> ${r.current ? 'NOW' : r.endDate ? new Date(r.endDate).toISOString().slice(0, 10) : '?'} | loc=${r.location ?? '-'} | tech=${r.technologies ?? '-'}`);
    if (r.description) console.log(`      desc: ${r.description.slice(0, 90)}...`);
  }

  const d = await client.query('SELECT * FROM "Education" ORDER BY "order" ASC;');
  console.log('\n=== EDUCATIONS ===');
  for (const r of d.rows) {
    console.log(`[${r.order}] ${r.institution} | ${r.degree} ${r.field ? '- ' + r.field : ''} | ${new Date(r.startDate).toISOString().slice(0, 10)} -> ${r.current ? 'NOW' : r.endDate ? new Date(r.endDate).toISOString().slice(0, 10) : '?'} | grade=${r.grade ?? '-'} | org=${r.organization ?? '-'}`);
    if (r.achievements) console.log(`      ach: ${r.achievements.slice(0, 90)}...`);
    if (r.description) console.log(`      desc: ${r.description.slice(0, 90)}...`);
  }

  await client.end();
})().catch((err) => { console.error(err); process.exit(1); });
