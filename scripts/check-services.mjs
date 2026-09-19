import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
const services = await db.service.findMany({ orderBy: { order: 'asc' } });
for (const s of services) {
  console.log(`${s.order} | slug: ${s.slug} | ${s.title} | icon: ${s.icon} | color: ${s.color}`);
  console.log(`   features: ${(s.features || '').slice(0, 80)}`);
}
await db.$disconnect();
