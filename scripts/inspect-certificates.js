// Inspect existing certificates to match style/format
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i === -1) continue;
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  env[t.slice(0, i).trim()] = v;
}

const { withPgbouncer } = (() => {
  // replicate db.ts normalization minimally
  return {
    withPgbouncer: (url) => {
      if (!url) return url;
      try {
        const u = new URL(url);
        u.searchParams.set('pgbouncer', 'true');
        const cl = parseInt(u.searchParams.get('connection_limit') || '1', 10);
        if (cl < 5) u.searchParams.set('connection_limit', '5');
        return u.toString();
      } catch { return url; }
    },
  };
})();

const prisma = new PrismaClient({
  datasources: { db: { url: withPgbouncer(env.DATABASE_URL) } },
});

async function main() {
  const certs = await prisma.certificate.findMany({
    orderBy: { issueDate: 'desc' },
    include: { category: true },
  });
  console.log('TOTAL CERTIFICATES:', certs.length);
  for (const c of certs) {
    console.log(JSON.stringify({
      title: c.title,
      slug: c.slug,
      description: c.description,
      issuer: c.issuer,
      issueDate: c.issueDate,
      expiryDate: c.expiryDate,
      credentialId: c.credentialId,
      credentialUrl: c.credentialUrl,
      fileUrl: c.fileUrl,
      imageUrl: c.imageUrl,
      featured: c.featured,
      category: c.category ? { name: c.category.name, slug: c.category.slug, type: c.category.type } : null,
    }, null, 1));
  }
  // Also list certificate-type categories
  const cats = await prisma.category.findMany({ where: { type: 'CERTIFICATE' } });
  console.log('\nCERTIFICATE CATEGORIES:', JSON.stringify(cats.map(c => ({ name: c.name, slug: c.slug, color: c.color })), null, 1));
}

main().finally(() => prisma.$disconnect());
