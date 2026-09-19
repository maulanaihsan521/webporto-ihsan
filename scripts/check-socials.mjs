import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const rows = await prisma.setting.findMany({ where: { key: { startsWith: 'social_' } } });
for (const r of rows) console.log(r.key.padEnd(20), '→', r.value || '(kosong)');
await prisma.$disconnect();
