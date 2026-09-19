// Task 12: audit host URL gambar di DB (untuk next/image remotePatterns)
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const posts = await p.post.findMany({ where: { published: true }, select: { coverImage: true }, take: 200 });
  const ports = await p.portfolio.findMany({ select: { thumbnail: true, banner: true }, take: 200 });
  const gals = await p.gallery.findMany({ select: { url: true, thumbnail: true }, take: 300 });
  const certs = await p.certificate.findMany({ select: { imageUrl: true }, take: 100 });
  const hosts = new Set();
  const urls = [
    ...posts.flatMap(x => [x.coverImage].filter(Boolean)),
    ...ports.flatMap(x => [x.thumbnail, x.banner].filter(Boolean)),
    ...gals.flatMap(x => [x.url, x.thumbnail]).filter(Boolean),
    ...certs.map(x => x.imageUrl).filter(Boolean),
  ];
  urls.forEach(u => {
    try { hosts.add(new URL(u).hostname); } catch { hosts.add('LOCAL: ' + String(u).slice(0, 25)); }
  });
  console.log('TOTAL urls:', urls.length);
  console.log('HOSTS:', JSON.stringify([...hosts], null, 1));
  await p.$disconnect();
}
main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
