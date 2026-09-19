import { PrismaClient } from "@prisma/client";
const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
const u = await db.user.findUnique({ where: { email: "login-repro@test.local" } });
if (u) {
  await db.activityLog.deleteMany({ where: { userId: u.id } });
  
  await db.user.delete({ where: { id: u.id } });
  console.log("CLEANED", u.id);
} else console.log("ALREADY_CLEAN");
db.$disconnect();
