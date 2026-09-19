/** Task 9: cek _prisma_migrations + rows Service sebelum tambah kolom image */
const { Client } = require('pg');
require('dotenv').config({ path: '/home/z/my-project/.env' });

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    query_timeout: 30000,
  });
  try {
    await client.connect();

    // 1. _prisma_migrations state
    try {
      const mig = await client.query(
        `SELECT migration_name, finished_at IS NOT NULL AS applied FROM _prisma_migrations ORDER BY migration_name`
      );
      console.log('=== _prisma_migrations ===');
      mig.rows.forEach((r) => console.log(`  ${r.applied ? '✓' : '…'} ${r.migration_name}`));
    } catch (e) {
      console.log('=== _prisma_migrations: TABEL TIDAK ADA ===', e.message);
    }

    // 2. Kolom Service saat ini
    const cols = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_name = 'Service' ORDER BY ordinal_position
    `);
    console.log('\n=== Kolom tabel Service ===');
    cols.rows.forEach((r) => console.log(`  ${r.column_name} (${r.data_type})`));

    // 3. Rows service
    const svc = await client.query(
      `SELECT slug, title, "order" FROM "Service" ORDER BY "order" ASC`
    );
    console.log(`\n=== ${svc.rows.length} layanan ===`);
    svc.rows.forEach((r) => console.log(`  [${r.order}] ${r.slug} — ${r.title}`));
  } catch (e) {
    console.error('✗ Error:', e.message);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
})();
