// Task 12: check market settings + full settings dump
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const all = await p.setting.findMany();
  console.log('ALL SETTINGS:', JSON.stringify(all.map(x => ({ k: x.key, v: x.value })), null, 1));
  await p.$disconnect();
}
main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
