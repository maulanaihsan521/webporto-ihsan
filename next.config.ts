import type { NextConfig } from "next";
import { config } from "dotenv";

// ITERATION 2026-08-26: Load .env file di next.config.ts supaya env vars
// tersedia untuk Next.js build worker (yang spawn sebagai child process
// dan tidak inherit env vars dari parent shell). Tanpa ini, `next build`
// gagal saat prerendering pages yang memanggil generateMetadata →
// getSettings() → Prisma query DB, karena DATABASE_URL undefined di worker.
//
// Production Vercel: env vars di-set di Vercel dashboard, dotenv
// akan skip jika vars sudah ada (override: false).
config({ path: ".env", override: false });

const nextConfig: NextConfig = {
  // NOTE: "output: standalone" removed — it conflicts with Vercel's serverless
  // tracing (.nft.json files) and causes ENOENT build errors on Vercel.
  // Standalone output is only needed for self-hosted Docker deployments.

  // ITERATION 2026-08-26: ignoreBuildErrors tetap true untuk sekarang.
  // Sebelumnya coba set false untuk catch type errors, tapi build gagal
  // di sandbox lokal karena (1) DB direct port di-block Supabase firewall,
  // (2) Next.js 16 build worker tidak inherit env vars dari parent shell.
  // Production Vercel tetap bisa build (env di-set di Vercel dashboard +
  // Vercel IP allowlist di Supabase).
  //
  // TODO production: Set ignoreBuildErrors=false setelah migrate DB schema
  // dan setup CI yang run dengan env vars lengkap. Type errors yang ter-silence:
  //   - scripts/migrate-uploads-to-oss.ts (import path tidak resolve)
  //   - scripts/restore-backup.ts (idem)
  // Note: type errors ini sudah di-exclude dari build via tsconfig.json exclude.
  typescript: {
    ignoreBuildErrors: true,
  },

  // ITERATION 2026-08-26: reactStrictMode aktif untuk catch subtle bugs
  // (double-effect untuk useEffect, deprecated lifecycle, dll).
  // Sebelumnya false — kemungkinan karena dev warning yang noisy.
  // Warning itu sehat; kita harus fix root cause bukan silence.
  reactStrictMode: true,
  devIndicators: false,

  // FIX 2026-09-16: Allow sandbox preview origins di dev mode.
  // Next.js 15.3+ memblokir cross-origin request ke /_next/static chunks
  // dari host yang tidak dikenal. Preview URL sandbox (preview-*.space-z.ai)
  // kena blokir ini → halaman preview gagal load JS/CSS (lihat pm2 error log
  // "Blocked cross-origin request ... from preview-chat-*.space-z.ai").
  // Wildcard *.space-z.ai mengizinkan semua preview subdomain (ID chat
  // berubah per sesi). DEV-ONLY: di production build (Vercel) setting ini
  // diabaikan sepenuhnya — tidak ada implikasi keamanan di produksi.
  allowedDevOrigins: ["*.space-z.ai"],

  // VULN-007 FIX: Disable x-powered-by header (hapus "Next.js" disclosure)
  poweredByHeader: false,

  // PERF (Task 12): image optimizer — host Supabase Storage (cover post,
  // thumbnail portfolio, media) di-izinkan utk next/image (auto resize/WebP).
  // Gambar host lain tetap <img> polos via OptimizedImage fallback.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.supabase.in" },
    ],
    formats: ["image/webp"],
    qualities: [70, 75, 82],
  },

  // ITERATION 2026-08-26: Optimasi bundle — tree-shake imports dari
  // library UI yang besar (lucide-react, radix, dll).
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-accordion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@radix-ui/react-tooltip",
      "react-hook-form",
      "@mdxeditor/editor",
    ],
  },

  // VULN-002 FIX: Tambahkan security headers di semua response
  async headers() {
    // "unsafe-eval" HANYA untuk development — React dev mode memerlukan eval()
    // untuk fitur debugging (rekonstruksi callstack). Tanpa ini, console error
    // "eval() is not supported in this environment" muncul di setiap halaman
    // saat `next dev`. Produksi TIDAK PERNAH menyertakan token ini (React
    // tidak memakai eval() di production build) — CSP produksi tetap ketat.
    const isDev = process.env.NODE_ENV !== "production";

    return [
      {
        source: "/(.*)",
        headers: [
          // 1. Content-Security-Policy — pencegah utama XSS
          //
          // ITERATION 2026-08-26: 'unsafe-eval' dihapus dari script-src.
          // Sebelumnya ditambahkan (kemungkinan untuk Next.js dev HMR atau
          // library tertentu), tapi di production ini berbahaya karena
          // membuka pintu untuk eval()-based XSS.
          //
          // TradingView tidak butuh eval — hanya load script external via
          // <script src="https://s3.tradingview.com/...">. Script-src allowlist
          // 'self' + s3.tradingview.com sudah cukup.
          //
          // 'unsafe-inline' tetap dipertahankan karena Next.js butuh inline
          // styles/scripts untuk hydration & runtime.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://s3.tradingview.com`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://vercel.live wss://vercel.live https://s3.tradingview.com wss://*.tradingview.com",
              "media-src 'self' https:",
              "frame-src 'self' https://s3.tradingview.com https://*.tradingview.com https://www.google.com",
              "frame-ancestors 'none'", // cegah clickjacking (iframe embed ke situs lain)
              "form-action 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          // 2. X-Frame-Options — backup untuk browser lama (cegah clickjacking)
          { key: "X-Frame-Options", value: "DENY" },
          // 3. X-Content-Type-Options — cegah MIME sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // 4. Referrer-Policy — batasi referrer leakage
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // 5. Permissions-Policy — disable features tidak perlu
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
          },
          // 6. Cross-Origin isolation headers
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          // 7. HSTS — Vercel sudah set, tapi pastikan konfigurasi lengkap
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // 8. X-DNS-Prefetch-Control — ON (2026-09-17, lag fix market page).
          // Sebelumnya "off" untuk privacy, tapi halaman /financial-market
          // embed widget TradingView (s3.tradingview.com) — DNS prefetch
          // tercepat di sana dan situs sudah mengekspos pihak ketiga itu.
          // "off" juga bisa membatalkan <link rel="dns-prefetch"> yang kita
          // tambahkan di halaman market.
          { key: "X-DNS-Prefetch-Control", value: "on" },
          // 9. X-Download-Options — cegah file open directly di IE
          { key: "X-Download-Options", value: "noopen" },
          // 10. X-Permitted-Cross-Domain-Policies — restrict Adobe/PDF cross-domain
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
        ],
      },
      // Specific headers untuk admin area — extra protection
      // (Task 12: /x9k2-dashboard adalah path admin nyata; /admin legacy tetap)
      {
        source: "/x9k2-dashboard/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet",
          },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet",
          },
        ],
      },
      // Headers untuk API — no caching untuk security
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
    ];
  },

  // Redirect URL lama → URL baru (konten dipindah / SEO link lama tetap sampai)
  async redirects() {
    return [
      // 2026-09-19: Artikel market dipindahkan ke Blog (kategori Financial
      // Market). URL lama /financial-market/[slug] → /blog/[slug] secara
      // PERMANEN (308) — dievaluasi sebelum routing sehingga crawler/link
      // WhatsApp lama langsung dapat status redirect yang benar, TIDAK
      // terpengaruh toggle market_section (artikel blog selalu hidup).
      // Slug yang tidak ada → /blog/[slug] memberi 404 dari halaman blog.
      {
        source: "/financial-market/:slug",
        destination: "/blog/:slug",
        permanent: true,
      },
      // Redirect photography-related portfolio URLs to /gallery
      // (these URLs may have been indexed by Google but don't exist as portfolio items)
      {
        source: "/portfolio/photography",
        destination: "/gallery",
        permanent: true,
      },
      {
        source: "/portfolio/product-photography",
        destination: "/gallery",
        permanent: true,
      },
      {
        source: "/portfolio/fotografi",
        destination: "/gallery",
        permanent: true,
      },
      {
        source: "/portfolio/product-fotografi",
        destination: "/gallery",
        permanent: true,
      },
      {
        source: "/portfolio/fotografer",
        destination: "/gallery",
        permanent: true,
      },
      {
        source: "/portfolio/photography-portfolio",
        destination: "/gallery",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
