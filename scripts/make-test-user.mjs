import { PrismaClient } from "@prisma/client";
const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
const bcrypt = (await import("bcryptjs")).default;
await db.user.deleteMany({ where: { email: "login-repro@test.local" } });
const hash = await bcrypt.hash("TestPass123!x", 10);
const u = await db.user.create({ data: { email: "login-repro@test.local", name: "Login Repro Test", role: "ADMIN", password: hash } });
console.log("TEST_USER_READY", u.id);
db.$disconnect();
