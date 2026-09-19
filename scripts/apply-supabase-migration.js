/**
 * Apply prisma/migrations/20260826000000_indexes_and_ondelete/migration.sql
 * to Supabase via the pooler (Transaction mode / port 6543).
 *
 * Why this script exists:
 *   - prisma migrate deploy / prisma db push requires DIRECT_URL (port 5432,
 *     IPv6). This dev sandbox has no IPv6 outbound routing, so direct
 *     connection fails: "Can't reach database server at
 *     db.xxx.supabase.co:5432".
 *   - The pooler (port 6543, IPv4) is reachable. We use the `pg` driver
 *     directly to execute the migration SQL statement-by-statement.
 *   - migration.sql is idempotent (CREATE INDEX IF NOT EXISTS,
 *     DO $$ ... BEGIN ... END $$) so it is safe to re-run.
 *
 * Pre-migration step:
 *   - Deduplicate VisitorCount(date, path) — keep the row with the highest
 *     count, delete the rest. Otherwise the UNIQUE constraint addition fails
 *     with "could not create unique index".
 *
 * Usage:
 *   node scripts/run-with-env.js node scripts/apply-supabase-migration.js
 *
 * Output: per-statement pass/skip/fail counts + final summary.
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const MIGRATION_FILE = path.join(
  __dirname,
  '..',
  'prisma',
  'migrations',
  '20260826000000_indexes_and_ondelete',
  'migration.sql',
);

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('✗ DATABASE_URL not set in env');
  process.exit(1);
}
if (!fs.existsSync(MIGRATION_FILE)) {
  console.error(`✗ Migration file not found: ${MIGRATION_FILE}`);
  process.exit(1);
}

const sqlText = fs.readFileSync(MIGRATION_FILE, 'utf8');

// Step 1: strip `--` comments line-by-line BEFORE splitting. This prevents
// embedded semicolons inside comments (e.g. `Category dihapus; kolom`)
// from breaking the statement splitter.
function stripLineComments(text) {
  return text
    .split('\n')
    .map((line) => {
      // Find `--` outside of a single-quoted string. Simple heuristic: only
      // treat `--` as comment start if it is at start of line OR preceded by
      // whitespace. (Migration SQL has no -- inside string literals anyway.)
      const m = line.match(/^(\s*--.*)$|^((?:[^'"]|'[^']*'|"[^"]*")*)(\s--.*)$/);
      if (m && (m[1] || m[3])) {
        // Either full-line comment or trailing comment
        return m[1] ? '' : (m[2] || '');
      }
      return line;
    })
    .join('\n');
}

// Step 2: split into statements on `;` outside $$ blocks.
function splitStatements(text) {
  const out = [];
  let buf = '';
  let inDollar = false;
  let i = 0;
  while (i < text.length) {
    if (text.substr(i, 2) === '$$') {
      inDollar = !inDollar;
      buf += '$$';
      i += 2;
      continue;
    }
    const ch = text[i];
    buf += ch;
    if (ch === ';' && !inDollar) {
      out.push(buf);
      buf = '';
    }
    i++;
  }
  if (buf.trim()) out.push(buf);
  return out
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .filter((s) => !s.split('\n').every((line) => line.trim() === ''));
}

const stripped = stripLineComments(sqlText);
const statements = splitStatements(stripped);
console.log(`Loaded migration: ${MIGRATION_FILE}`);
console.log(`Total statements to execute: ${statements.length}\n`);

(async () => {
  const client = new Client({
    connectionString: url,
    query_timeout: 60000,
    connectionTimeoutMillis: 15000,
  });
  let pass = 0, skip = 0, fail = 0;
  const failures = [];
  try {
    await client.connect();
    console.log('✓ Connected to Supabase via pooler\n');

    // PRE-MIGRATION: deduplicate VisitorCount(date, path).
    // Keep row with max(count), delete the rest. Also accumulate unique+count.
    console.log('--- PRE-MIGRATION: deduplicate VisitorCount(date, path) ---');
    const dupCount = await client.query(`
      SELECT COUNT(*) AS pairs, SUM(c) AS extra_rows FROM (
        SELECT "date", "path", COUNT(*) AS c
        FROM "VisitorCount"
        GROUP BY "date", "path"
        HAVING COUNT(*) > 1
      ) AS dups;
    `);
    const dupPairs = parseInt(dupCount.rows[0].pairs || '0', 10);
    const extraRows = parseInt(dupCount.rows[0].extra_rows || '0', 10);
    console.log(`  Duplicate (date, path) pairs: ${dupPairs}`);
    console.log(`  Extra rows to delete:          ${extraRows}`);

    if (extraRows > 0) {
      // Delete duplicates — keep the row with the greatest count (most recent
      // accumulation wins). Use ctid (physical row id) to target specific rows.
      const del = await client.query(`
        DELETE FROM "VisitorCount"
        WHERE ctid IN (
          SELECT ctid FROM (
            SELECT ctid,
                   ROW_NUMBER() OVER (
                     PARTITION BY "date", "path"
                     ORDER BY "count" DESC, "unique" DESC, ctid
                   ) AS rn
            FROM "VisitorCount"
          ) AS s WHERE rn > 1
        )
        RETURNING id;
      `);
      console.log(`  Deleted ${del.rowCount} duplicate rows.\n`);
    } else {
      console.log('  No duplicates found.\n');
    }

    console.log('--- MIGRATION EXECUTION ---');
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const preview = stmt.split('\n')[0].slice(0, 80);
      try {
        await client.query(stmt);
        pass++;
        if (i < 5 || i % 10 === 0 || i === statements.length - 1) {
          console.log(`[${String(i + 1).padStart(3, '0')}/${statements.length}] ✓ ${preview}...`);
        }
      } catch (e) {
        const msg = e.message || '';
        const isAlreadyExists = /already exists|cannot use unique index/i.test(msg);
        const isDoesNotExist = /does not exist/i.test(msg);
        if (isAlreadyExists || isDoesNotExist) {
          skip++;
          if (i < 5 || i % 10 === 0) {
            console.log(`[${String(i + 1).padStart(3, '0')}/${statements.length}] ⊘ skip: ${msg.slice(0, 100)}`);
          }
        } else {
          fail++;
          failures.push({ idx: i + 1, stmt: preview, err: msg });
          console.log(`[${String(i + 1).padStart(3, '0')}/${statements.length}] ✗ FAIL: ${preview}`);
          console.log(`          ${msg.slice(0, 200)}`);
        }
      }
    }

    console.log(`\n========== SUMMARY ==========`);
    console.log(`Total: ${statements.length}`);
    console.log(`Pass:  ${pass}`);
    console.log(`Skip:  ${skip} (already exists / not found)`);
    console.log(`Fail:  ${fail}`);
    if (fail > 0) {
      console.log(`\nFailures:`);
      for (const f of failures) {
        console.log(`  #${f.idx}: ${f.stmt}`);
        console.log(`       ${f.err}`);
      }
      process.exit(2);
    }
  } catch (e) {
    console.error('✗ Fatal error:', e.message);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
})();
