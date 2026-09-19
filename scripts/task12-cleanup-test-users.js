// Task 12: hapus semua user & data test
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const r1 = await p.user.deleteMany({ where: { email: { in: ['task12-admin@test.local', 'task12-editor@test.local', 'bruteforce@test.local'] } } });
  console.log('test users deleted:', r1.count);
  // media test hasil upload berbahaya (kalau lolos pun tercatat, hapus by name evil)
  const r2 = await p.media.deleteMany({ where: { OR: [{ name: { contains: 'evil' } }, { name: { contains: 'svg' } }] } });
  console.log('test media deleted:', r2.count);
  await p.$disconnect();
}
main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
