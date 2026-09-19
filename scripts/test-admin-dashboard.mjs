// Verify full login -> dashboard flow with test user
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
const TEST_EMAIL = "login-repro@test.local";
const TEST_PASS = "TestPass123!x";

async function main() {
  const bcrypt = (await import("bcryptjs")).default;
  await db.user.deleteMany({ where: { email: TEST_EMAIL } });
  const hash = await bcrypt.hash(TEST_PASS, 10);
  await db.user.create({ data: { email: TEST_EMAIL, name: "Login Repro Test", role: "ADMIN", password: hash } });

  const login = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS }),
  });
  if (!login.ok) { console.log("LOGIN_FAIL", login.status); process.exit(1); }
  const cookie = login.headers.get("set-cookie").split(";")[0];
  console.log("LOGIN_OK");

  // Dashboard + a few admin pages with the auth cookie
  for (const p of ["/x9k2-dashboard", "/x9k2-dashboard/activity-log", "/x9k2-dashboard/analytics", "/x9k2-dashboard/blog"]) {
    const r = await fetch("http://localhost:3000" + p, { headers: { Cookie: cookie }, redirect: "manual" });
    console.log("PAGE", p, r.status);
  }
  // Cleanup test user + its activity logs
  const u = await db.user.findUnique({ where: { email: TEST_EMAIL } });
  if (u) {
    await db.activityLog.deleteMany({ where: { userId: u.id } });
    await db.user.delete({ where: { id: u.id } });
    console.log("TEST_USER_CLEANED");
  }
}
main().catch((e) => { console.error("SCRIPT_ERROR", e.message); process.exit(1); }).finally(() => db.$disconnect());
