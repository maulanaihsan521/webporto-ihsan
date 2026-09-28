/**
 * Hapus file lama yang sudah tidak dipakai (orphaned) dari Supabase Storage:
 * - 1790567617537_sertifikat-pkl-malibu-62-studio.webp (versi awal, miring)
 * - 1790568194484_sertifikat-pkl-malibu-62-studio.webp (versi rotasi -2°, dibatalkan)
 * Versi final yang dipakai DB: 1790568387897_sertifikat-pkl-malibu-62-studio.webp
 */
const fs = require("fs");
const path = require("path");

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  env[t.slice(0, i).trim()] = v;
}

const BUCKET = env.SUPABASE_STORAGE_BUCKET || "media";
const OLD_KEYS = [
  "uploads/1790567617537_sertifikat-pkl-malibu-62-studio.webp",
  "uploads/1790568194484_sertifikat-pkl-malibu-62-studio.webp",
];

async function main() {
  const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prefixes: OLD_KEYS }),
  });
  console.log("Status:", res.status, res.ok ? "(berhasil)" : `(gagal): ${await res.text()}`);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
