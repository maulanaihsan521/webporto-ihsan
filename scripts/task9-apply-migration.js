/**
 * Task 9: Apply prisma/migrations/20260919100000_add_service_image/migration.sql
 * ke Supabase via pooler TX (6543) — pola sama dgn apply-supabase-migration.js.
 * SQL idempotent (IF NOT EXISTS + WHERE image IS NULL) — aman diulang.
 * Usage: node scripts/run-with-env.js node scripts/task9-apply-migration.js
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const MIGRATION_FILE = path.join(
  __dirname, '..', 'prisma', 'migrations',
  '20260919100000_add_service_image', 'migration.sql',
);

const url = process.env.DATABASE_URL;
if (!url) { console.error('✗ DATABASE_URL not set'); process.exit(1); }
if (!fs.existsSync(MIGRATION_FILE)) {
  console.error(`✗ Migration file not found: ${MIGRATION_FILE}`);
  process.exit(1);
}

const sqlText = fs.readFileSync(MIGRATION_FILE, 'utf8');

// split sederhana per-statement (tidak ada $$ block di file ini)
const statements = sqlText
  .split('\n')
  .map((l) => l.replace(/--.*$/, '')) // strip komentar
  .join('\n')
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);

(async () => {
  const client = new Client({
    connectionString: url,
    query_timeout: 60000,
    connectionTimeoutMillis: 15000,
  });
  try {
    await client.connect();
    console.log('✓ Connected to Supabase via pooler\n');
    for (const stmt of statements) {
      const preview = stmt.split('\n')[0].slice(0, 70);
      try {
        const r = await client.query(stmt);
        console.log(`✓ ${preview}...${r.rowCount != null ? ` (${r.rowCount} rows)` : ''}`);
      } catch (e) {
        const msg = e.message || '';
        if (/already exists|does not exist/i.test(msg)) {
          console.log(`⊘ skip: ${msg.slice(0, 80)}`);
        } else {
          console.error(`✗ FAIL: ${preview}\n   ${msg}`);
          process.exit(2);
        }
      }
    }

    // verifikasi
    const check = await client.query(
      `SELECT slug, "image" FROM "Service" ORDER BY "order" ASC`
    );
    console.log('\n=== Verifikasi kolom image ===');
    check.rows.forEach((r) =>
      console.log(`  ${r.image ? '✓' : '✗ NULL'} ${r.slug} → ${r.image || '-'}`)
    );
    const nullCount = check.rows.filter((r) => !r.image).length;
    console.log(`\n${check.rows.length - nullCount}/${check.rows.length} layanan punya foto default.`);
    if (nullCount > 0) {
      console.log('⚠ Ada layanan tanpa foto (frontend akan fallback ke default per-slug).');
    }
  } catch (e) {
    console.error('✗ Fatal:', e.message);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
})();
