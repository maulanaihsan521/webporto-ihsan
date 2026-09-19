/** Task 9: buat user admin test persisten utk verifikasi UI browser (cleanup di script lain) */
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
const bcrypt = (await import("bcryptjs")).default;
const EMAIL = "task9-e2e@test.local";
await db.user.deleteMany({ where: { email: EMAIL } });
const u = await db.user.create({
  data: { email: EMAIL, name: "Task 9 UI Test", role: "ADMIN", password: await bcrypt.hash("TestPass123!x", 10) },
});
console.log("TEST_USER_READY", u.id);
db.$disconnect();
