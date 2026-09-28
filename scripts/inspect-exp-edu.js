// Cek data experience & education terkait PKL/magang untuk validasi tanggal
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

const prisma = new PrismaClient({
  datasources: { db: { url: env.DATABASE_URL } },
});

async function main() {
  const exps = await prisma.experience.findMany({
    orderBy: { startDate: 'desc' },
    select: { company: true, position: true, location: true, startDate: true, endDate: true, current: true, description: true },
  });
  console.log('=== EXPERIENCES ===');
  for (const e of exps) {
    console.log(`${e.company} | ${e.position} | ${e.startDate?.toISOString().slice(0,10)} → ${e.current ? 'now' : e.endDate?.toISOString().slice(0,10)}`);
  }
  const edus = await prisma.education.findMany({
    orderBy: { startDate: 'desc' },
    select: { institution: true, degree: true, field: true, startDate: true, endDate: true, description: true },
  });
  console.log('\n=== EDUCATIONS ===');
  for (const e of edus) {
    console.log(`${e.institution} | ${e.degree} ${e.field || ''} | ${e.startDate?.toISOString().slice(0,10)} → ${e.endDate?.toISOString().slice(0,10)}`);
  }
}

main().finally(() => prisma.$disconnect());
