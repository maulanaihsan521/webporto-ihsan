const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const posts = await p.post.findMany({ select: { slug: true, published: true } });
  const markets = await p.marketArticle.findMany({ select: { slug: true, published: true, featured: true } });
  console.log('BLOG POSTS di DB:', posts.length);
  for (const x of posts) console.log('  ', x.published ? '[PUBLISHED]' : '[DRAFT]', x.slug);
  console.log('MARKET ARTICLES di DB:', markets.length);
  for (const x of markets) {
    const tag = x.published ? (x.featured ? '[PUBLISHED+FEATURED]' : '[PUBLISHED]') : '[DRAFT]';
    console.log('  ', tag, x.slug);
  }
  await p.$disconnect();
})();
