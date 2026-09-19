/**
 * Smoke test: connect to Supabase via pooler (IPv4 / port 6543), list tables
 * and indexes, report back. Used as a sanity check before applying migrations.
 *
 * Usage:
 *   node scripts/run-with-env.js node scripts/test-supabase-pooler.js
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
    console.log('✓ Connected to Supabase via pooler (port 6543)');

    const tables = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    console.log(`\nTables in 'public' schema: ${tables.rows.length}`);
    for (const r of tables.rows) console.log(`  - ${r.tablename}`);

    const idx = await client.query(`
      SELECT indexname FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY indexname;
    `);
    console.log(`\nExisting indexes: ${idx.rows.length}`);
    for (const r of idx.rows.slice(0, 30)) console.log(`  - ${r.indexname}`);
    if (idx.rows.length > 30) console.log(`  ... and ${idx.rows.length - 30} more`);

    const counts = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM "User") AS users,
        (SELECT COUNT(*) FROM "Post") AS posts,
        (SELECT COUNT(*) FROM "Portfolio") AS portfolios,
        (SELECT COUNT(*) FROM "Category") AS categories,
        (SELECT COUNT(*) FROM "Certificate") AS certificates,
        (SELECT COUNT(*) FROM "Skill") AS skills,
        (SELECT COUNT(*) FROM "Experience") AS experiences,
        (SELECT COUNT(*) FROM "Education") AS educations,
        (SELECT COUNT(*) FROM "Service") AS services,
        (SELECT COUNT(*) FROM "Testimonial") AS testimonials,
        (SELECT COUNT(*) FROM "Faq") AS faqs,
        (SELECT COUNT(*) FROM "Message") AS messages,
        (SELECT COUNT(*) FROM "Newsletter") AS newsletter,
        (SELECT COUNT(*) FROM "Media") AS media,
        (SELECT COUNT(*) FROM "Setting") AS settings,
        (SELECT COUNT(*) FROM "ActivityLog") AS activity_logs,
        (SELECT COUNT(*) FROM "Visitor") AS visitors,
        (SELECT COUNT(*) FROM "VisitorCount") AS visitor_counts;
    `);
    console.log('\nRow counts (production data):');
    for (const [k, v] of Object.entries(counts.rows[0])) {
      console.log(`  ${k.padEnd(20)} = ${v}`);
    }
  } catch (e) {
    console.error('✗ Error:', e.message);
    if (e.stack) console.error(e.stack.split('\n').slice(0, 5).join('\n'));
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
})();
