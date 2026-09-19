/**
 * Post-migration verification: query pg_indexes + pg_constraint to confirm
 * the migration applied correctly.
 *
 * Usage:
 *   node scripts/run-with-env.js node scripts/verify-supabase-schema.js
 */
const { Client } = require('pg');

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('✗ DATABASE_URL not set in env');
  process.exit(1);
}

(async () => {
  const client = new Client({
    connectionString: url,
    query_timeout: 20000,
    connectionTimeoutMillis: 15000,
  });
  try {
    await client.connect();
    console.log('✓ Connected\n');

    // 1. Index count by table
    const idxByTable = await client.query(`
      SELECT tablename, COUNT(*) AS n
      FROM pg_indexes
      WHERE schemaname = 'public'
      GROUP BY tablename
      ORDER BY n DESC, tablename;
    `);
    console.log('=== Indexes per table ===');
    let totalIdx = 0;
    for (const r of idxByTable.rows) {
      console.log(`  ${r.tablename.padEnd(20)} ${r.n}`);
      totalIdx += parseInt(r.n, 10);
    }
    console.log(`  ${'TOTAL'.padEnd(20)} ${totalIdx}\n`);

    // 2. New _idx indexes (the ones the migration added)
    const newIdx = await client.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public' AND indexname LIKE '%_idx'
      ORDER BY tablename, indexname;
    `);
    console.log(`=== Performance _idx indexes: ${newIdx.rows.length} ===`);
    for (const r of newIdx.rows) {
      console.log(`  ${r.tablename.padEnd(20)} ${r.indexname}`);
    }
    console.log('');

    // 3. FK constraints with onDelete rule (confdeltype is single-char code)
    const fks = await client.query(`
      SELECT conname, conrelid::regclass AS table_name,
             confdeltype
      FROM pg_constraint
      WHERE contype = 'f' AND connamespace = 'public'::regnamespace
      ORDER BY conrelid::regclass::text, conname;
    `);
    console.log('=== Foreign keys with onDelete rules ===');
    const ruleMap = { c: 'CASCADE', n: 'SET NULL', r: 'RESTRICT', a: 'NO ACTION', d: 'SET DEFAULT' };
    for (const r of fks.rows) {
      console.log(`  ${r.conname.padEnd(35)} ${ruleMap[r.confdeltype] || r.confdeltype}  (${r.table_name})`);
    }
    console.log('');

    // 4. Unique constraints (looking for VisitorCount_date_path_key)
    const uniq = await client.query(`
      SELECT conname, conrelid::regclass AS table_name,
             string_agg(attname, ', ' ORDER BY ord) AS cols
      FROM pg_constraint
      JOIN unnest(conkey) WITH ORDINALITY AS u(u_attnum, ord) ON true
      JOIN pg_attribute ON attrelid = conrelid AND pg_attribute.attnum = u.u_attnum
      WHERE contype = 'u' AND connamespace = 'public'::regnamespace
      GROUP BY conname, conrelid
      ORDER BY conname;
    `);
    console.log('=== Unique constraints ===');
    for (const r of uniq.rows) {
      console.log(`  ${r.conname.padEnd(40)} (${r.table_name}) cols: ${r.cols}`);
    }
    console.log('');

    // 5. Quick row counts to confirm data is intact
    const counts = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM "VisitorCount") AS visitor_counts,
        (SELECT COUNT(*) FROM "Visitor") AS visitors,
        (SELECT COUNT(*) FROM "Post") AS posts,
        (SELECT COUNT(*) FROM "Portfolio") AS portfolios,
        (SELECT COUNT(*) FROM "Media") AS media,
        (SELECT COUNT(*) FROM "ActivityLog") AS activity_logs;
    `);
    console.log('=== Row counts (post-migration sanity check) ===');
    for (const [k, v] of Object.entries(counts.rows[0])) {
      console.log(`  ${k.padEnd(20)} = ${v}`);
    }
  } catch (e) {
    console.error('✗ Error:', e.message);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
})();
