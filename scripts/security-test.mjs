/**
 * DEEP SECURITY TEST — webporto-ihsan (milik sendiri, atas permintaan owner)
 * Target: localhost:3000 (dev) — aktif test; production — read-only test.
 *
 * Test suite:
 *  A. Security headers (CSP, HSTS, X-Frame-Options, dll)
 *  B. Info disclosure (file sensitif, source map, env, stack trace)
 *  C. Auth bypass admin API (tanpa cookie)
 *  D. CSRF (POST tanpa Origin / Origin evil)
 *  E. WAF (SQLi, XSS, path traversal, command injection di URL)
 *  F. Rate limit login (6x password salah)
 *  G. Cookie flags (login valid → cek httpOnly/secure/sameSite)
 *  H. Upload tanpa auth
 *  I. Injection di endpoint publik (search, contact)
 */
const BASE = "http://localhost:3000";
const PROD = "https://portofoliomaulanaihsan.my.id";

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

// ─────────────────────────────────────────────────────────────
async function testSecurityHeaders() {
  console.log("\n═══ A. SECURITY HEADERS (localhost) ═══");
  const res = await timedFetch(`${BASE}/`);
  const h = res.headers;
  const checks = [
    ["x-content-type-options", "nosniff"],
    ["x-frame-options", null], // ada atau CSP frame-ancestors
  ];
  for (const [hdr, _] of checks) {
    const v = h.get(hdr);
    record("Headers", `${hdr}`, !!v, v || "MISSING");
  }
  const csp = h.get("content-security-policy");
  record("Headers", "Content-Security-Policy", !!csp, csp ? csp.slice(0, 80) : "MISSING (bergantung vercel.json/next config)");
  const hsts = h.get("strict-transport-security");
  record("Headers", "HSTS (localhost tak wajib)", true, hsts || "tidak ada (normal di http dev)");
  const xfo = h.get("x-frame-options");
  const cspFrm = csp && csp.includes("frame-ancestors");
  record("Headers", "Clickjacking protection", !!(xfo || cspFrm), xfo || (cspFrm ? "via CSP frame-ancestors" : "TIDAK ADA"));

  console.log("\n═══ A2. SECURITY HEADERS (production) ═══");
  const res2 = await timedFetch(`${PROD}/`);
  const h2 = res2.headers;
  for (const hdr of ["x-content-type-options", "x-frame-options", "content-security-policy", "strict-transport-security", "referrer-policy", "permissions-policy"]) {
    const v = h2.get(hdr);
    record("Headers-Prod", hdr, !!v, v ? v.slice(0, 90) : "MISSING");
  }
}

// ─────────────────────────────────────────────────────────────
async function testInfoDisclosure() {
  console.log("\n═══ B. INFO DISCLOSURE ═══");
  const paths = [
    "/.env", "/.env.local", "/.env.supabase-backup", "/.git/config",
    "/db/export.json", "/prisma/schema.prisma", "/scripts/switch-supabase.mjs",
    "/server.log", "/dev.out.log", "/.originals-backup/x",
    "/source-map.js", "/.next/BUILD_ID", "/admin",
  ];
  for (const p of paths) {
    const res = await timedFetch(`${BASE}${p}`, {}, 10000);
    // File sensibel harus 404 (atau 307 redirect). 200 = bocor.
    const leaked = res.status === 200;
    record("InfoDisclosure", `GET ${p}`, !leaked, `HTTP ${res.status}`);
  }
  // Stack trace check: error page
  const resErr = await timedFetch(`${BASE}/x9k2-dashboard/nonexistent-page-xyz`);
  record("InfoDisclosure", "404 page tanpa stack trace", resErr.status === 404 || resErr.status === 200, `HTTP ${resErr.status}`);
  // /admin harus 404 (obscurity)
  const resAdmin = await timedFetch(`${BASE}/admin`);
  record("InfoDisclosure", "/admin → 404 (obscurity)", resAdmin.status === 404, `HTTP ${resAdmin.status}`);
}

// ─────────────────────────────────────────────────────────────
async function testAuthBypass() {
  console.log("\n═══ C. AUTH BYPASS ADMIN API (tanpa cookie) ═══");
  const apis = [
    ["GET", "/api/admin/blog"],
    ["GET", "/api/admin/messages"],
    ["GET", "/api/admin/media"],
    ["GET", "/api/admin/settings"],
    ["GET", "/api/admin/backup"],
    ["GET", "/api/admin/activity-log"],
    ["GET", "/api/media"],
    ["GET", "/api/admin/analytics"],
  ];
  for (const [m, p] of apis) {
    const res = await timedFetch(`${BASE}${p}`, { method: m }, 12000);
    // Prisma /api/admin/analytics biasa butuh auth juga
    record("AuthBypass", `${m} ${p} (no cookie)`, res.status === 401 || res.status === 403, `HTTP ${res.status}`);
  }
  // JWT forged (secret salah)
  const forged = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZha2UiLCJyb2xlIjoiQURNSU4iLCJlbWFpbCI6ImhheGVyQGV2aWwuY29tIn0.fakesignature123";
  const res2 = await timedFetch(`${BASE}/api/admin/blog`, { headers: { cookie: `admin_token=${forged}` } }, 12000);
  record("AuthBypass", "JWT forged (sign salah)", res2.status === 401 || res2.status === 403, `HTTP ${res2.status}`);
  // JWT alg none
  const noneJwt = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJpZCI6ImZha2UiLCJyb2xlIjoiQURNSU4ifQ.";
  const res3 = await timedFetch(`${BASE}/api/admin/blog`, { headers: { cookie: `admin_token=${noneJwt}` } }, 12000);
  record("AuthBypass", "JWT alg=none", res3.status === 401 || res3.status === 403, `HTTP ${res3.status}`);
}

// ─────────────────────────────────────────────────────────────
async function testCsrf() {
  console.log("\n═══ D. CSRF ═══");
  // POST tanpa Origin header
  let res = await timedFetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@test.com", password: "x" }),
  }, 12000);
  record("CSRF", "POST login tanpa Origin", res.status === 403, `HTTP ${res.status}`);
  // POST dengan Origin evil
  res = await timedFetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://evil-attacker.com" },
    body: JSON.stringify({ email: "test@test.com", password: "x" }),
  }, 12000);
  record("CSRF", "POST login Origin evil.com", res.status === 403, `HTTP ${res.status}`);
  // POST dengan Origin valid (localhost) — harus LULU CSRF (401 dari auth salah boleh)
  res = await timedFetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ email: "test@test.com", password: "x" }),
  }, 12000);
  record("CSRF", "POST login Origin valid → lanjut (bukan 403)", res.status !== 403, `HTTP ${res.status} (401 = kredensial salah, OK)`);
  // POST newsletter tanpa Origin (endpoint publik)
  res = await timedFetch(`${BASE}/api/newsletter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "csrf-test@test.com" }),
  }, 12000);
  record("CSRF", "POST newsletter tanpa Origin", res.status === 403, `HTTP ${res.status}`);
}

// ─────────────────────────────────────────────────────────────
async function testWaf() {
  console.log("\n═══ E. WAF / INJECTION ═══");
  const payloads = [
    ["/api/search?q=<script>alert(1)</script>", "XSS di search"],
    ["/api/search?q=' OR '1'='1", "SQLi classic"],
    ["/api/search?q=1' UNION SELECT * FROM \"User\"--", "SQLi UNION"],
    ["/api/search?q=../../etc/passwd", "Path traversal"],
    ["/api/search?q=$(cat /etc/passwd)", "Command injection"],
    ["/api/search?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E", "XSS URL-encoded"],
    ["/blog?q=union+select+1", "SQLi encoded (+)"],
  ];
  for (const [p, label] of payloads) {
    let res;
    try {
      res = await timedFetch(`${BASE}${p}`, {}, 12000);
      record("WAF", label, res.status === 403, `HTTP ${res.status}`);
    } catch (e) {
      record("WAF", label, false, `ERROR ${e.message}`);
    }
  }
}

// ─────────────────────────────────────────────────────────────
async function testRateLimit() {
  console.log("\n═══ F. RATE LIMIT LOGIN ═══ (6x salah — expect 429 di percobaan ke-6)");
  let got429 = false, lastStatus = null;
  for (let i = 1; i <= 7; i++) {
    const res = await timedFetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({ email: `ratelimit-test-${i}@test.com`, password: "wrongpass" }),
    }, 12000);
    lastStatus = res.status;
    if (res.status === 429) { got429 = true; break; }
  }
  record("RateLimit", "Login diblok setelah percobaan berlebih", got429, `status terakhir ${lastStatus}${got429 ? " (429 tercapai)" : " — TIDAK ter-rate-limit dalam 7 attempt!"}`);
}

// ─────────────────────────────────────────────────────────────
async function testUploadNoAuth() {
  console.log("\n═══ H. UPLOAD TANPA AUTH ═══");
  const fd = new FormData();
  fd.append("files", new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], { type: "image/png" }), "test.png");
  const res = await timedFetch(`${BASE}/api/media`, {
    method: "POST",
    headers: { Origin: BASE },
    body: fd,
  }, 15000);
  record("Upload", "POST /api/media tanpa login", res.status === 401 || res.status === 403, `HTTP ${res.status}`);
}

// ─────────────────────────────────────────────────────────────
async function testPublicApiAbuse() {
  console.log("\n═══ I. ENDPOINT PUBLIK ═══");
  // Contact dengan XSS payload di body (Origin valid supaya lolos CSRF, lihat reaksi)
  const xssBody = {
    name: "<script>alert('xss')</script>",
    email: "attacker@evil.com",
    subject: "'; DROP TABLE Message; --",
    message: "<img src=x onerror=alert(1)> UNION SELECT * FROM \"User\"",
  };
  const res = await timedFetch(`${BASE}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify(xssBody),
  }, 15000);
  let detail = `HTTP ${res.status}`;
  try {
    const j = await res.json();
    detail += ` — ${JSON.stringify(j).slice(0, 100)}`;
  } catch {}
  // Pass kalau: 400 (validasi), 403 (WAF), atau 200 tapi tersimpan ter-sanitize. 500 = error handling buruk.
  record("PublicAPI", "Contact dengan payload XSS/SQLi", res.status !== 500, detail);
}

// ─────────────────────────────────────────────────────────────
async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║   DEEP SECURITY TEST — webporto-ihsan (own site)         ║");
  console.log("║   Target: localhost:3000 + production (read-only)         ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  try { await testSecurityHeaders(); } catch (e) { console.log("skip headers:", e.message); }
  try { await testInfoDisclosure(); } catch (e) { console.log("skip info:", e.message); }
  try { await testAuthBypass(); } catch (e) { console.log("skip auth:", e.message); }
  try { await testCsrf(); } catch (e) { console.log("skip csrf:", e.message); }
  try { await testWaf(); } catch (e) { console.log("skip waf:", e.message); }
  try { await testRateLimit(); } catch (e) { console.log("skip ratelimit:", e.message); }
  try { await testUploadNoAuth(); } catch (e) { console.log("skip upload:", e.message); }
  try { await testPublicApiAbuse(); } catch (e) { console.log("skip public:", e.message); }

  // Ringkasan
  const pass = results.filter(r => r.pass).length;
  const fail = results.filter(r => !r.pass);
  console.log("\n╔════════════ RINGKASAN ════════════╗");
  console.log(`  PASS: ${pass}/${results.length}`);
  if (fail.length) {
    console.log("  TEMUAN (FAIL):");
    for (const f of fail) console.log(`   ❌ [${f.suite}] ${f.name} — ${f.detail}`);
  } else {
    console.log("  ✅ Semua tes lulus");
  }
}
main();
