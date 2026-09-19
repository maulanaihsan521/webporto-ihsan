import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Supabase pooler (pgBouncer, transaction mode — port 6543) tidak mendukung
 * prepared statements Prisma. Fix: auto-append `pgbouncer=true` agar Prisma
 * mematikan prepared statements. Aman untuk direct connection (port 5432) —
 * dilewati otomatis.
 *
 * connection_limit MINIMAL 5: cukup untuk query paralel dalam satu page render
 * (mis. dashboard admin menjalankan ~30 query via Promise.all).
 *
 * FIX 2026-09-17 (bug "This page couldn't load" setiap login admin):
 * Pernah ada URL env yang sudah membawa `pgbouncer=true&connection_limit=1`
 * — karena param sudah ada, blok lama melewati normalisasi ini dan pool
 * tetap 1 koneksi → P2024 "connection pool timeout" saat dashboard menjalankan
 * ~30 query paralel → server component throw → error boundary "This page
 * couldn't load". Sekarang pooler URL SELALU dinormalisasi: connection_limit
 * di-bump ke minimal 5 bila kurang (termasuk yang sudah tertanam di env var
 * Vercel/lokal), sehingga fix ini berlaku otomatis di produksi setelah push
 * tanpa perlu mengubah env var di dashboard Vercel.
 */
const MIN_POOLER_CONNECTION_LIMIT = 5

function withPgbouncer(url: string | undefined): string | undefined {
  if (!url) return url
  try {
    const u = new URL(url)
    const isPooler = u.port === '6543' || u.hostname.includes('pooler.supabase.com')
    if (isPooler) {
      // Selalu pastikan pgbouncer=true (nonaktifkan prepared statements Prisma)
      u.searchParams.set('pgbouncer', 'true')
      // Selalu pastikan connection_limit >= 5 — override nilai lebih kecil
      // (mis. 1 dari env lama) yang menyebabkan pool timeout P2024.
      const currentLimit = Number(u.searchParams.get('connection_limit') ?? MIN_POOLER_CONNECTION_LIMIT)
      if (!Number.isFinite(currentLimit) || currentLimit < MIN_POOLER_CONNECTION_LIMIT) {
        u.searchParams.set('connection_limit', String(MIN_POOLER_CONNECTION_LIMIT))
      }
      return u.toString()
    }
    return url
  } catch {
    // URL tidak valid / format sqlite (file:...) — kembalikan apa adanya
    return url
  }
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: withPgbouncer(process.env.DATABASE_URL) } },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
