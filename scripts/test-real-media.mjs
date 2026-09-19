// Ambil URL media asli dari DB baru, lalu test akses publiknya
import { Client } from 'pg';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const NEW_DB = process.env.DIRECT_URL || '';

async function main() {
  const c = new Client({ connectionString: NEW_DB });
  await c.connect();

  const { rows: urls } = await c.query(
    `SELECT url FROM "Media" WHERE url LIKE '%supabase%' LIMIT 4`
  );
  const { rows: settings } = await c.query(
    `SELECT key, value FROM "Setting" WHERE value LIKE '%supabase%' LIMIT 4`
  );
  await c.end();

  const all = [...urls.map((r) => r.url), ...settings.map((r) => r.value)];
  console.log('=== URL ASLI DARI DB ===');
  all.forEach((u) => console.log(' ', u.slice(0, 110)));

  console.log('=== TEST AKSES PUBLIK ===');
  for (const u of all.slice(0, 4)) {
    try {
      const r = await fetch(u, { method: 'HEAD' });
      console.log(' ', r.status, r.headers.get('content-type') || '', '←', u.split('/').pop().slice(0, 50));
    } catch (e) {
      console.log('  FETCH FAIL:', e.message.slice(0, 80));
    }
  }
}

main().catch((e) => console.log('ERR:', e.message));
