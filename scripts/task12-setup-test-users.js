// Task 12: buat test users (admin + editor) untuk security testing
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const bcrypt = (await import('bcryptjs')).default;
  await p.user.deleteMany({ where: { email: { in: ['task12-admin@test.local', 'task12-editor@test.local', 'bruteforce@test.local'] } } });
  await p.user.create({
    data: {
      email: 'task12-admin@test.local', name: 'Task12 Admin', role: 'ADMIN',
      password: await bcrypt.hash('TestAdmin12!x', 10),
    },
  });
  await p.user.create({
    data: {
      email: 'task12-editor@test.local', name: 'Task12 Editor', role: 'EDITOR',
      password: await bcrypt.hash('TestEditor12!x', 10),
    },
  });
  console.log('test users created: task12-admin (ADMIN), task12-editor (EDITOR)');
  await p.$disconnect();
}
main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
