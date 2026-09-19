const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const a = await p.marketArticle.findUnique({
    where: { slug: 'risk-management-aturan-emas-trader' },
    select: { id: true, slug: true, published: true, publishedAt: true, title: true }
  });
  console.log('Nilai persis dari DB:', JSON.stringify(a, null, 2));
  await p.$disconnect();
})();
