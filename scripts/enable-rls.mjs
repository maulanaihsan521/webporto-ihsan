// Inspeksi status RLS semua tabel di schema public (Supabase Advisor check)
// + enable RLS pada tabel yang belum aktif (tanpa policy = deny PostgREST).
//
// Kenapa aman untuk app ini:
// - App akses DB via Prisma dengan role `postgres` (table OWNER) — owner
//   BYPASS RLS kecuali di-set FORCE ROW LEVEL SECURITY (yang TIDAK kita lakukan).
// - App tidak memakai PostgREST/anon key sama sekali (grep: tidak ada
//   supabase-js / rest/v1 / ANON_KEY di codebase).
// - Storage bucket media terpisah dari table RLS — tidak terpengaruh.
//
// Jalankan: node scripts/enable-rls.mjs   (DATABASE_URL dari .env)
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

async function main() {
  const before = await db.$queryRawUnsafe(`
    SELECT c.relname AS table_name, c.relrowsecurity AS rls
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname;
  `);

  const missing = before.filter((t) => !t.rls);
  console.log(`Total tabel public: ${before.length}`);
  console.log(`RLS sudah aktif    : ${before.length - missing.length}`);
  console.log(`RLS belum aktif    : ${missing.length}`);

  if (missing.length > 0) {
    console.log("\nMeng-enable RLS pada:");
    for (const t of missing) {
      console.log(`  - ${t.table_name}`);
      await db.$executeRawUnsafe(`ALTER TABLE public."${t.table_name}" ENABLE ROW LEVEL SECURITY;`);
    }
  }

  // Verify pass
  const after = await db.$queryRawUnsafe(`
    SELECT c.relname AS table_name, c.relrowsecurity AS rls,
           (SELECT count(*) FROM pg_policies p
             WHERE p.schemaname='public' AND p.tablename=c.relname) AS policies
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname;
  `);
  const stillOff = after.filter((t) => !t.rls);
  console.log(`\n=== VERIFIKASI ===`);
  console.log(`RLS aktif: ${after.length - stillOff.length}/${after.length}`);
  if (stillOff.length) {
    console.log("MASIH OFF:", stillOff.map((t) => t.table_name).join(", "));
    process.exitCode = 1;
  } else {
    console.log("SEMUA tabel public kini RLS aktif (tanpa policy = PostgREST deny-by-default).");
  }
  // Ringkas policy (harus 0 — app pakai owner bypass)
  const withPolicies = after.filter((t) => Number(t.policies) > 0);
  console.log(`Tabel dengan policy: ${withPolicies.length} (ekspektasi 0)`);
}

main()
  .catch((e) => { console.error("ERROR:", e.message); process.exit(1); })
  .finally(() => db.$disconnect());
