// Test akses Storage API Supabase baru
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const BASE = 'https://imnjaijdmkxajofqhcju.supabase.co';
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function main() {
  // 1. List buckets
  let r = await fetch(`${BASE}/storage/v1/bucket`, { headers: H });
  console.log('LIST BUCKETS:', r.status);
  if (r.ok) {
    const buckets = await r.json();
    buckets.forEach((b) => console.log('  bucket:', b.name, '| public:', b.public));
  } else {
    console.log('  body:', (await r.text()).slice(0, 200));
  }

  // 2. List files in "media" bucket
  r = await fetch(`${BASE}/storage/v1/object/list/media`, {
    method: 'POST',
    headers: { ...H, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: '', limit: 8 }),
  });
  console.log('LIST FILES media:', r.status);
  if (r.ok) {
    const files = await r.json();
    files.slice(0, 8).forEach((f) => console.log('  file:', f.name));
  } else {
    console.log('  body:', (await r.text()).slice(0, 200));
  }

  // 3. Test public download (file dari Setting seo_og_image)
  r = await fetch(`${BASE}/storage/v1/object/public/media/uploads/1785264329289_og-default.webp`, { method: 'HEAD' });
  console.log('PUBLIC HEAD og-default.webp:', r.status, r.headers.get('content-type'));
}

main().catch((e) => console.log('ERR:', e.message));
