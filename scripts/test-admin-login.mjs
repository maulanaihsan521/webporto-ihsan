// Reproduce admin login bug: create temp ADMIN user via Prisma,
// POST /api/auth/login, report status, cleanup is done by caller.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

const TEST_EMAIL = "login-repro@test.local";
const TEST_PASS = "TestPass123!x";

async function main() {
  // Clean previous test user if any
  await db.user.deleteMany({ where: { email: TEST_EMAIL } });

  // Create with known bcrypt hash (10 rounds, same as app)
  const bcrypt = (await import("bcryptjs")).default;
  const hash = await bcrypt.hash(TEST_PASS, 10);
  const user = await db.user.create({
    data: {
      email: TEST_EMAIL,
      name: "Login Repro Test",
      role: "ADMIN",
      password: hash,
    },
  });
  console.log("TEST_USER_CREATED", user.id);

  // Login attempt (Origin matches localhost host to pass CSRF)
  const res = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS }),
  });
  const body = await res.text();
  console.log("LOGIN_STATUS", res.status);
  console.log("LOGIN_BODY", body.slice(0, 300));
  const cookie = res.headers.get("set-cookie");
  console.log("SET_COOKIE", cookie ? cookie.split(";")[0].slice(0, 40) + "..." : "NONE");
}

main().catch((e) => { console.error("SCRIPT_ERROR", e.message); process.exit(1); }).finally(() => db.$disconnect());
