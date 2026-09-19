import { NextRequest, NextResponse } from "next/server";
import { wafCheck, wafBlockedResponse, validateCsrf } from "@/lib/security";

/**
 * Central Security Middleware
 *
 * Tanggung jawab:
 * 1. WAF (Web Application Firewall) — VULN-009 fix
 *    Block request dengan pola berbahaya (SQLi, XSS, path traversal, command injection)
 * 2. CSRF protection global untuk state-changing requests ke /api/*
 *    (POST/PUT/PATCH/DELETE) — ITERATION 2026-08-26
 *    Sebelumnya hanya 5 dari 44 admin routes yang validate CSRF. Untuk
 *    defense-in-depth, sekarang CSRF check global di middleware.
 * 3. Security headers untuk API routes
 * 4. Request logging untuk monitoring
 *
 * Catatan: Middleware ini jalan di Edge runtime (sebelum route handler),
 * jadi TIDAK bisa akses database atau JWT verification di sini.
 * Auth check dilakukan di route handler masing-masing.
 */

/**
 * Central Security Proxy (dulu: middleware.ts)
 *
 * MIGRASI 2026-09-16: Next.js 16 mendeprekasi konvensi `middleware.ts` →
 * `proxy.ts` (runtime Edge sama persis, hanya ganti nama konvensi + fungsi).
 * `npx @next/codemod middleware-to-proxy` menyarankan migrasi ini; API
 * (NextRequest/NextResponse/config.matcher) tidak berubah sama sekali.
 * Perilaku diverifikasi identik via baseline test sebelum & sesudah migrasi:
 * /admin→404, CSRF POST tanpa Origin→403, header nosniff, WAF SQLi→403.
 */

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();

  // ============================================================
  // 1. WAF check untuk semua request (URL only — body check di route)
  // ============================================================
  const urlWaf = wafCheck(req);
  if (urlWaf.blocked) {
    return wafBlockedResponse(urlWaf.reason || "URL blocked");
  }

  // ============================================================
  // 2. Security-by-obscurity: block legacy /admin path dengan 404
  // ============================================================
  // Folder admin sudah di-rename ke slug obscured (/x9k2-dashboard).
  // Path /admin lama di-return 404 Not Found supaya penyerang tidak
  // tahu admin area ada di URL lain. JANGAN reveal keberadaan admin.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return new NextResponse(null, { status: 404 });
  }

  // ============================================================
  // 3. CORS preflight handling (VULN-012 fix — explicit CORS)
  // ============================================================
  if (method === "OPTIONS" && pathname.startsWith("/api/")) {
    const origin = req.headers.get("origin");
    const allowedOrigins = [
      "https://portofoliomaulanaihsan.my.id",
      "https://www.portofoliomaulanaihsan.my.id",
      "https://portofoliomaulanaihsan.vercel.app",
      "https://www.portofoliomaulanaihsan.vercel.app",
      // Localhost selalu diizinkan untuk testing
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ];

    if (origin && allowedOrigins.includes(origin)) {
      // Origin valid → return 204 dengan CORS headers lengkap
      const corsHeaders = new Headers();
      corsHeaders.set("Access-Control-Allow-Origin", origin);
      corsHeaders.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
      corsHeaders.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-CSRF-Token"
      );
      corsHeaders.set("Access-Control-Max-Age", "86400");
      corsHeaders.set("Access-Control-Allow-Credentials", "true");
      corsHeaders.set("Vary", "Origin");
      return new NextResponse(null, { status: 204, headers: corsHeaders });
    }

    // VULN-012 FIX: OPTIONS tanpa Origin atau dengan Origin tidak valid
    // return 404 Not Found (obscure API existence, no ambiguity)
    return new NextResponse(
      JSON.stringify({ error: "Not Found" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // ============================================================
  // 4. CSRF protection global untuk state-changing API requests
  // ============================================================
  // ITERATION 2026-08-26: Sebelumnya, hanya 5 dari 44 admin routes yang
  // validate CSRF (login, contact, comments, newsletter, gallery/reorder).
  // Untuk defense-in-depth, CSRF check global di middleware agar semua
  // POST/PUT/PATCH/DELETE ke /api/* otomatis tervalidasi.
  //
  // Attack scenario yang dimitigasi:
  // - Attacker buat halaman malicious di evil.com
  // - User admin login ke portofoliomaulanaihsan.my.id (cookie httpOnly set)
  // - User kunjungi evil.com
  // - evil.com POST cross-site dengan cookie otomatis terkirim
  //
  // Mitigasi tambahan:
  // - JSON content-type wajib preflight CORS (browser block jika preflight gagal)
  // - Tapi text/plain & form-urlencoded adalah "simple request" (no preflight)
  // - CSRF check tetap penting untuk defense-in-depth
  if (
    pathname.startsWith("/api/") &&
    (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE")
  ) {
    if (!validateCsrf(req)) {
      return NextResponse.json(
        { error: "CSRF validation failed — Origin/Referer tidak valid" },
        { status: 403 }
      );
    }
  }

  // ============================================================
  // 5. Security headers tambahan untuk response
  // ============================================================
  const response = NextResponse.next();

  // X-Content-Type-Options untuk semua response
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Untuk API routes, tambahkan no-cache
  if (pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    response.headers.set("Pragma", "no-cache");
  }

  // Untuk admin route (slug obscured), tambahkan noindex
  if (pathname.startsWith("/x9k2-dashboard")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  }

  return response;
}

export const config = {
  // Match semua path kecuali static assets
  matcher: [
    /*
     * Match semua request path kecuali:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (logo, sw.js, manifest, dll)
     *
     * Note: google*.html sudah dihapus dari public/ di iterasi sebelumnya,
     * pattern exclusion dihapus juga untuk consistency.
     */
    "/((?!_next/static|_next/image|favicon.ico|logo.svg|logo-mi.png|apple-touch-icon.png|icon-192.png|icon-512.png|manifest.json|sw.js|uploads).*)",
  ],
};
