import { PrismaClient } from "@prisma/client";
const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
const testUsers = await db.user.findMany({ where: { email: "login-repro@test.local" } });
const total = await db.user.count();
console.log("testUserSisa:", testUsers.length, "| totalUser:", total);
db.$disconnect();
