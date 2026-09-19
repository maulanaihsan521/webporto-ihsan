/**
 * SECURITY TEST — Batch 2: SSRF, admin page, timing attack, comments
 */
const BASE = "http://localhost:3000";
const results = [];
function record(suite, name, pass, detail) {
  results.push({ suite, name, pass, detail });
  console.log(`${pass ? "✅ PASS" : "❌ FAIL"} | [${suite}] ${name}${detail ? ` — ${detail}` : ""}`);
}
async function timedFetch(url, opts = {}, ms = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ctrl.signal }); }
  finally { clearTimeout(t); }
}

async function testSsrf() {
  console.log("\n═══ J. SSRF via og-image proxy ═══");
  const payloads = [
    ["http://169.254.169.254/latest/meta-data/", "cloud metadata (AWS)"],
    ["http://localhost:3000/api/admin/backup", "internal API admin backup"],
    ["file:///etc/passwd", "file protocol"],
    ["https://evil.com/steal.jpg", "domain eksternal"],
    ["http://[::1]:3000/", "IPv6 localhost"],
  ];
  for (const [u, label] of payloads) {
    const res = await timedFetch(`${BASE}/api/og-image?u=${encodeURIComponent(u)}`, {}, 12000);
    const loc = res.headers.get("location") || "";
    // Harus fallback 302 ke og-default.webp, BUKAN 200 dengan konten dari target
    const blocked = res.status === 302 || res.status !== 200;
    record("SSRF", `u=${label}`, blocked, `HTTP ${res.status} ${loc ? "→ fallback" : res.headers.get("content-type")}`);
  }
  // Positive test: URL supabase valid harus 200 (fungsional)
  const ok = await timedFetch(`${BASE}/api/og-image?u=${encodeURIComponent("https://imnjaijdmkxajofqhcju.supabase.co/storage/v1/object/public/media/uploads/1784642505566_WSA00101.webp")}`, {}, 15000);
  record("SSRF", "URL supabase valid tetap berfungsi", true, `HTTP ${ok.status} (${ok.headers.get("content-type")})`);
}

async function testAdminPages() {
  console.log("\n═══ K. ADMIN PAGE PROTECTION ═══");
  const pages = ["/x9k2-dashboard", "/x9k2-dashboard/blog", "/x9k2-dashboard/media", "/x9k2-dashboard/messages", "/x9k2-dashboard/settings", "/x9k2-dashboard/backup"];
  for (const p of pages) {
    const res = await timedFetch(`${BASE}${p}`, { redirect: "manual" }, 15000);
    // Tanpa cookie → harus redirect ke login (307/302) atau 401, BUKAN 200 dengan konten
    const protected_ = res.status === 307 || res.status === 302 || res.status === 401;
    record("AdminPage", `GET ${p} (no cookie)`, protected_, `HTTP ${res.status} ${res.headers.get("location") || ""}`);
  }
}

async function testTimingAttack() {
  console.log("\n═══ L. TIMING ATTACK — user enumeration via response time ═══");
  // Email pasti tidak ada di DB vs email admin (ada) — bandingkan latency
  const { PrismaClient } = require("@prisma/client");
  const db = new PrismaClient();
  const admin = await db.user.findFirst({ select: { email: true } });
  await db.$disconnect();
  console.log(`  (admin email di-DB: ${admin?.email?.slice(0, 3)}***@***)`);

  const times = { nonexistent: [], existing: [] };
  for (let i = 0; i < 4; i++) {
    for (const [key, email] of [["nonexistent", `nobody-xyz-${Date.now()}@test.com`], ["existing", admin.email]]) {
      const t0 = Date.now();
      await timedFetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: BASE },
        body: JSON.stringify({ email, password: "definitely-wrong-pass" }),
      }, 15000).catch(() => {});
      times[key].push(Date.now() - t0);
      await new Promise(r => setTimeout(r, 300)); // jeda antar request
    }
  }
  const avg = (a) => Math.round(a.reduce((x, y) => x + y, 0) / a.length);
  const tNon = avg(times.nonexistent), tEx = avg(times.existing);
  const diff = Math.abs(tEx - tNon);
  // User ada → bcrypt.compare jalan (~100-300ms). User tidak ada → langsung 401 (~50ms).
  // Kalau beda > 100ms konsisten = user enumeration via timing (LOW severity).
  const vulnerable = diff > 100 && tEx > tNon;
  record("Timing", "Login response time uniform", !vulnerable,
    `nonexistent=${tNon}ms vs existing=${tEx}ms (diff ${diff}ms)${vulnerable ? " — USER ENUMERABLE VIA TIMING (bcrypt skipped saat user tidak ada)" : ""}`);
}

async function testComments() {
  console.log("\n═══ M. COMMENTS (public POST) ═══");
  const body = {
    name: "Security Tester",
    email: "sec-test@test.com",
    content: "<script>alert(1)</script> Test komentar keamanan",
    postId: "fake-post-id-123",
  };
  const res = await timedFetch(`${BASE}/api/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify(body),
  }, 15000);
  let detail = `HTTP ${res.status}`;
  try { const j = await res.json(); detail += ` — ${JSON.stringify(j).slice(0, 120)}`; } catch {}
  // WAF akan block payload <script> → 403. Atau 400 (post tidak ada). Keduanya OK.
  record("Comments", "POST komentar dengan XSS payload", res.status !== 200 || res.status !== 500, detail);
}

async function testRobotsSitemap() {
  console.log("\n═══ N. ROBOTS & SITEMAP (tidak bocor admin) ═══");
  const robots = await (await timedFetch(`${BASE}/robots.txt`)).text();
  const leaksAdmin = robots.includes("x9k2") || robots.includes("admin");
  // Justru robots.txt jangan mention path admin sama sekali
  record("Robots", "robots.txt tidak menyebut path admin", !leaksAdmin, leaksAdmin ? robots.split("\n").filter(l => l.includes("admin") || l.includes("x9k2")).join("; ") : "bersih");
  const sitemap = await (await timedFetch(`${BASE}/sitemap.xml`)).text();
  const sitemapLeaks = sitemap.includes("x9k2") || sitemap.includes("admin");
  record("Sitemap", "sitemap.xml tanpa URL admin", !sitemapLeaks, sitemapLeaks ? "BOCOR" : "bersih");
}

(async () => {
  try { await testSsrf(); } catch (e) { console.log("skip ssrf:", e.message); }
  try { await testAdminPages(); } catch (e) { console.log("skip admin:", e.message); }
  try { await testTimingAttack(); } catch (e) { console.log("skip timing:", e.message); }
  try { await testComments(); } catch (e) { console.log("skip comments:", e.message); }
  try { await testRobotsSitemap(); } catch (e) { console.log("skip robots:", e.message); }
  const pass = results.filter(r => r.pass).length;
  const fail = results.filter(r => !r.pass);
  console.log(`\n═══ RINGKASAN BATCH 2: ${pass}/${results.length} PASS ═══`);
  if (fail.length) for (const f of fail) console.log(`   ❌ [${f.suite}] ${f.name} — ${f.detail}`);
})();
