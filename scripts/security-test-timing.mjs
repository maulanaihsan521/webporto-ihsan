/**
 * SECURITY TEST — Timing attack login (user enumeration)
 */
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.join(process.cwd(), ".env"), override: true });

const { PrismaClient } = (await import("@prisma/client"));
const db = new PrismaClient();

const BASE = "http://localhost:3000";

async function timedFetch(url, opts = {}, ms = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ctrl.signal }); }
  finally { clearTimeout(t); }
}

const admin = await db.user.findFirst({ select: { email: true } });
console.log(`admin email: ${admin.email.slice(0, 3)}*** (disembunyikan)`);

const times = { nonexistent: [], existing: [] };
for (let i = 0; i < 5; i++) {
  for (const [key, email] of [["nonexistent", `nobody-xyz-${Date.now()}-${i}@test.com`], ["existing", admin.email]]) {
    const t0 = Date.now();
    await timedFetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({ email, password: "definitely-wrong-pass" }),
    }, 15000).catch(() => {});
    times[key].push(Date.now() - t0);
    await new Promise(r => setTimeout(r, 400));
  }
}
const avg = (a) => Math.round(a.reduce((x, y) => x + y, 0) / a.length);
const tNon = avg(times.nonexistent), tEx = avg(times.existing);
const diff = Math.abs(tEx - tNon);
console.log(`nonexistent email: ${times.nonexistent.join(", ")} → avg ${tNon}ms`);
console.log(`existing email  : ${times.existing.join(", ")} → avg ${tEx}ms`);
console.log(`selisih: ${diff}ms`);
const vulnerable = tEx - tNon > 100;
console.log(vulnerable
  ? `❌ TIMING ATTACK TERDETEKSI: email terdaftar ${tEx - tNon}ms lebih lambat → bcrypt.skip saat user tidak ada = user enumerable (severity LOW)`
  : `✅ Response time cukup uniform (selisih ${diff}ms)`);
await db.$disconnect();
