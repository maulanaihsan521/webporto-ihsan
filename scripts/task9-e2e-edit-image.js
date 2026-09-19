/**
 * Task 9 E2E: foto service card bisa di-edit dari dashboard admin.
 * Alur yang diuji (persis seperti yang dilakukan admin dari UI):
 *  1. Buat user ADMIN test + login → dapat session cookie
 *  2. GET  /api/admin/services            → pastikan field image ada
 *  3. POST /api/media (FormData, upload)  → file jadi di Supabase storage + record Media
 *  4. PUT  /api/admin/services/:id        → set image = URL hasil upload
 *  5. GET  /services (public)             → HTML memuat URL foto baru di kartu
 *  6. Cleanup: kembalikan image default, hapus media test & user test
 * Usage: node scripts/run-with-env.js node scripts/task9-e2e-edit-image.js
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

const db = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

const BASE = "http://localhost:3000";
const TEST_EMAIL = "task9-e2e@test.local";
const TEST_PASS = "TestPass123!x";
const ORIGIN = BASE;

// Foto pengganti sementara: pakai salah satu foto default lain sebagai file upload
const UPLOAD_FILE = "/home/z/my-project/public/images/services/videography.jpg";

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) process.exitCode = 1;
};

(async () => {
  // ---------- 1. Setup user & login ----------
  await db.user.deleteMany({ where: { email: TEST_EMAIL } });
  const bcrypt = (await import("bcryptjs")).default;
  const user = await db.user.create({
    data: {
      email: TEST_EMAIL,
      name: "Task 9 E2E",
      role: "ADMIN",
      password: await bcrypt.hash(TEST_PASS, 10),
    },
  });

  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: ORIGIN },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS }),
  });
  check("login admin", loginRes.ok, `status ${loginRes.status}`);
  const cookie = loginRes.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  if (!cookie) { console.error("Tidak dapat cookie session — abort"); process.exit(1); }

  // ---------- 2. GET services: field image ada ----------
  const svcRes = await fetch(`${BASE}/api/admin/services`, { headers: { cookie } });
  const services = await svcRes.json();
  check("GET /api/admin/services ok", svcRes.ok, `${services.length} layanan`);
  const target = services.find((s) => s.slug === "photography");
  check("field image tersedia di API", target && "image" in target, `photography.image = ${target?.image}`);
  const defaultImage = target.image; // simpan untuk cleanup

  // ---------- 3. Upload foto via /api/media (alur MediaPicker) ----------
  const fd = new FormData();
  const buf = readFileSync(UPLOAD_FILE);
  fd.append("files", new Blob([buf], { type: "image/jpeg" }), "task9-test-service-photo.jpg");
  fd.append("folder", "/");
  const upRes = await fetch(`${BASE}/api/media`, {
    method: "POST",
    headers: { cookie, Origin: ORIGIN },
    body: fd,
  });
  const upJson = await upRes.json().catch(() => ({}));
  const uploadedUrl = upJson?.files?.[0]?.url;
  check("upload foto via /api/media", upRes.ok && !!uploadedUrl, uploadedUrl?.slice(0, 90) || JSON.stringify(upJson).slice(0, 120));

  // ---------- 4. PUT service dengan image baru ----------
  const putRes = await fetch(`${BASE}/api/admin/services/${target.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", cookie, Origin: ORIGIN },
    body: JSON.stringify({ image: uploadedUrl }),
  });
  check("PUT image service", putRes.ok, `status ${putRes.status}`);

  // Verifikasi DB
  const inDb = await db.service.findUnique({ where: { id: target.id } });
  check("image tersimpan di DB", inDb.image === uploadedUrl, inDb.image?.slice(0, 80));

  // ---------- 5. Halaman publik menampilkan foto baru ----------
  const pubRes = await fetch(`${BASE}/services`);
  const html = await pubRes.text();
  check("halaman /services render foto baru", html.includes(uploadedUrl), "URL upload ditemukan di HTML");

  const homeRes = await fetch(`${BASE}/`);
  const homeHtml = await homeRes.text();
  check("homepage render foto baru", homeHtml.includes(uploadedUrl), "URL upload ditemukan di HTML home");

  // ---------- 5b. Validasi sanitize: URL eksternal valid diterima, junk ditolak ----------
  const putExt = await fetch(`${BASE}/api/admin/services/${target.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", cookie, Origin: ORIGIN },
    body: JSON.stringify({ image: "javascript:alert(1)" }),
  });
  const extJson = await putExt.json().catch(() => ({}));
  check("sanitize: junk URL dinetralkan ke null", putExt.ok && extJson.image === null, `image = ${extJson.image}`);

  // ---------- 6. Cleanup ----------
  // Kembalikan foto default photography
  await fetch(`${BASE}/api/admin/services/${target.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", cookie, Origin: ORIGIN },
    body: JSON.stringify({ image: defaultImage }),
  });
  // Hapus media record test (file storage dibiarkan — bucket public, tidak mengganggu)
  if (uploadedUrl) {
    await db.media.deleteMany({ where: { url: uploadedUrl } }).catch(() => {});
  }
  await db.user.deleteMany({ where: { email: TEST_EMAIL } });
  const final = await db.service.findUnique({ where: { id: target.id } });
  check("cleanup: foto photography kembali ke default", final.image === defaultImage, final.image);

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n===== E2E TASK 9: ${passed}/${results.length} PASS =====`);
})().catch((e) => {
  console.error("SCRIPT_ERROR:", e.message);
  process.exit(1);
}).finally(() => db.$disconnect());
