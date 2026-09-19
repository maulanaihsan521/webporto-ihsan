/**
 * End-to-end test API upload: pastikan JPG yang diupload otomatis
 * dikonversi ke WebP oleh /api/media (POST).
 *
 * Craft admin_token JWT langsung dari JWT_SECRET + user di DB
 * (sama seperti signToken di src/lib/auth.ts).
 */
import { readFileSync } from "fs";
import path from "path";
import { createRequire } from "module";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env"), override: true });

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

// Pooler transaction mode (6543) tidak support prepared statements Prisma
// → append pgbouncer=true (logika sama dengan src/lib/db.ts)
function withPgbouncer(url) {
  try {
    const u = new URL(url);
    if (u.port === "6543" || u.hostname.includes("pooler.supabase.com")) {
      u.searchParams.set("pgbouncer", "true");
      u.searchParams.set("connection_limit", "5");
      return u.toString();
    }
    return url;
  } catch { return url; }
}
const db = new PrismaClient({
  datasources: { db: { url: withPgbouncer(process.env.DATABASE_URL) } },
});

const BASE = "http://localhost:3000";

async function main() {
  // 1. Ambil user admin pertama
  const user = await db.user.findFirst({ select: { id: true, email: true, name: true, role: true, image: true } });
  if (!user) { console.error("Tidak ada user di DB"); process.exit(1); }
  console.log(`Login sebagai: ${user.email} (${user.role})`);

  // 2. Craft JWT session (payload & options sama dengan signToken)
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "2h" });
  const cookie = `admin_token=${token}`;

  // 3. Ambil file JPG dari backup sebagai file test
  const backupDir = path.join(process.cwd(), ".originals-backup");
  const testFile = "1783423641797__MG_2244.jpg"; // 316KB JPG
  const fileBuf = readFileSync(path.join(backupDir, testFile));
  console.log(`File test: ${testFile} (${(fileBuf.length / 1024).toFixed(0)}KB)`);

  // 4. POST ke /api/media
  const form = new FormData();
  form.append("files", new Blob([new Uint8Array(fileBuf)], { type: "image/jpeg" }), testFile);
  form.append("folder", "/test-webp");

  const res = await fetch(`${BASE}/api/media`, {
    method: "POST",
    headers: { Cookie: cookie, Origin: BASE },
    body: form,
  });
  const json = await res.json();
  console.log(`\nHTTP ${res.status}`);
  console.log(JSON.stringify(json, null, 2));

  // 5. Verifikasi hasil
  const f = json?.files?.[0];
  if (f && !f.error) {
    const checks = [
      [f.url?.endsWith(".webp"), `URL berakhir .webp: ${f.url}`],
      [f.mimeType === "image/webp", `mimeType: ${f.mimeType}`],
      [f.name?.endsWith(".webp"), `name: ${f.name}`],
      [f.size < fileBuf.length, `size turun: ${fileBuf.length} → ${f.size} bytes (${((1 - f.size / fileBuf.length) * 100).toFixed(0)}% hemat)`],
    ];
    let ok = true;
    for (const [cond, label] of checks) {
      console.log(`${cond ? "✓" : "✗"} ${label}`);
      if (!cond) ok = false;
    }

    // 6. File benar-benar tersimpan & bisa dilayani (local mode)
    if (f.url?.startsWith("/uploads/")) {
      const serveRes = await fetch(`${BASE}${f.url}`);
      const ct = serveRes.headers.get("content-type");
      console.log(`${serveRes.ok && ct === "image/webp" ? "✓" : "✗"} File dilayani: HTTP ${serveRes.status}, content-type: ${ct}`);
      if (serveRes.ok && ct !== "image/webp") ok = false;
    }

    // 7. Cleanup: hapus media record test via API DELETE
    const delRes = await fetch(`${BASE}/api/media?id=${f.id}`, { method: "DELETE", headers: { Cookie: cookie, Origin: BASE } });
    console.log(`${delRes.ok ? "✓" : "✗"} Cleanup record test: HTTP ${delRes.status}`);

    console.log(ok ? "\n════ E2E UPLOAD WEBP: PASS ════" : "\n════ E2E UPLOAD WEBP: FAIL ════");
    process.exit(ok ? 0 : 1);
  } else {
    console.error("\n════ E2E UPLOAD WEBP: FAIL (upload error) ════");
    process.exit(1);
  }
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
