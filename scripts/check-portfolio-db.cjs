const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const items = await p.portfolio.findMany({ select: { slug: true, title: true, status: true } });
  console.log('=== PORTFOLIO ===');
  for (const x of items) console.log(`[${x.status || '?'}]`.padEnd(10), x.slug, '|', x.title);
  const m = await p.marketArticle.findMany({ where: { slug: { in: ['risk-management-aturan-emas-trader', 'panduan-lengkap-candlestick-untuk-pemula'] } }, select: { slug: true, published: true, title: true } });
  console.log('=== MARKET (yang dicek) ===');
  for (const x of m) console.log(x.published ? '[LIVE] ' : '[DRAFT]', x.slug);
  await p.$disconnect();
})();
