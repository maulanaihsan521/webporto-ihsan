/**
 * Security Utilities — Pusat fungsi keamanan untuk Portfolio CMS
 *
 * Modul ini menyediakan:
 * - Input sanitization (XSS prevention)
 * - Rate limiting (in-memory, untuk Vercel serverless)
 * - CSRF protection (Origin/Referer validation)
 * - WAF (Web Application Firewall) sederhana
 *
 * Owner: Maulana Ihsan Rohim
 * Updated: 2026-08-04 (post security audit)
 */

import { NextRequest, NextResponse } from "next/server";

// ============================================================
// 1. INPUT SANITIZATION (VULN-003 fix — Stored XSS prevention)
// ============================================================

/**
 * Sanitasi input dari karakter berbahaya untuk mencegah Stored XSS.
 * Menghapus semua HTML tags dan karakter kontrol, lalu memotong ke panjang maksimal.
 */
export function sanitizeInput(input: unknown, maxLength = 2000): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "") // hapus semua HTML tags
    .replace(/javascript:/gi, "") // hapus javascript: protocol
    .replace(/on\w+\s*=/gi, "") // hapus on*= event handlers
    .replace(/[\x00-\x1F\x7F]/g, "") // hapus kontrol karakter
    .trim()
    .slice(0, maxLength);
}

/**
 * Validasi format email sederhana
 */
export function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email) && email.length <= 255;
}

/**
 * Validasi nomor telepon (hanya digit, +, -, spasi, kurung)
 */
export function isValidPhone(phone: string): boolean {
  return /^[\d+\-\s()]{7,20}$/.test(phone);
}

// ============================================================
// 2. RATE LIMITING (VULN-005 fix — No Rate Limiting)
// ============================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (reset saat serverless function cold start)
// Untuk produksi dengan traffic tinggi, gunakan Upstash Redis atau Vercel KV
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup expired entries setiap 5 menit untuk mencegah memory leak
let lastCleanup = Date.now();
function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60 * 1000) return;
  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) rateLimitStore.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Cek rate limit untuk key tertentu.
 *
 * @param key - Identifier unik (mis. `login:ip:1.2.3.4` atau `contact:ip:1.2.3.4`)
 * @param limit - Maksimal request dalam window
 * @param windowMs - Window waktu dalam milidetik
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  cleanupExpired();
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt < now) {
    // Window baru
    const entry: RateLimitEntry = { count: 1, resetAt: now + windowMs };
    rateLimitStore.set(key, entry);
    return { allowed: true, remaining: limit - 1, resetAt: entry.resetAt };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}

/**
 * Helper untuk dapatkan IP client dari request
 */
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

/**
 * Helper untuk response 429 Too Many Requests yang konsisten
 */
export function rateLimitResponse(resetAt: number, limit: number): NextResponse {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Terlalu banyak permintaan. Coba lagi nanti." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.floor(resetAt / 1000)),
      },
    }
  );
}

// ============================================================
// 3. CSRF PROTECTION (VULN-004 fix — No CSRF Protection)
// ============================================================

/**
 * Daftar origin yang diizinkan untuk state-changing requests (POST/PUT/PATCH/DELETE).
 * Tambahkan domain production dan preview di sini.
 */
export const ALLOWED_ORIGINS = [
  // Production custom domain
  "https://portofoliomaulanaihsan.my.id",
  "https://www.portofoliomaulanaihsan.my.id",
  // Legacy Vercel deployment (keep for backward compat / redirect)
  "https://portofoliomaulanaihsan.vercel.app",
  "https://www.portofoliomaulanaihsan.vercel.app",
  // Localhost untuk testing (juga include di production untuk vercel preview)
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

/**
 * Cek apakah origin cocok dengan pattern wildcard preview milik PROYEK INI.
 *
 * SECURITY (Task 12): wildcard `*.vercel.app` / `*.space-z.ai` DIHAPUS —
 * attacker bisa bikin deployment Vercel sendiri dan lolos validasi CSRF.
 * Origin preview yang sah sudah tercakup dynamic check di validateCsrf()
 * (origin === host request via x-forwarded-host), jadi wildcard tidak dibutuhkan.
 * Pattern spesifik milik deploy ini tetap diizinkan di bawah.
 */
function isPreviewOriginAllowed(origin: string): boolean {
  try {
    const u = new URL(origin);
    // Hanya deployment Vercel milik proyek ini (bukan subdomain bebas).
    // Preview gateway sandbox sudah tercakup dynamic same-host check
    // (origin === x-forwarded-host) — tidak butuh wildcard space-z.ai.
    if (/^portofoliomaulanaihsan[a-z0-9-]*\.vercel\.app$/i.test(u.hostname)) return true;
    return false;
  } catch {
    return false;
  }
}

/**
 * Dapatkan origin publik dari request, dengan dukungan reverse proxy.
 * Saat di-deploy di belakang preview gateway / load balancer, Next.js
 * melihat request sebagai `http://localhost:3000` padahal browser client
 * melihatnya sebagai `https://preview-xxx.space-z.ai`. Kita perlu baca
 * header `x-forwarded-host` + `x-forwarded-proto` untuk dapat origin
 * yang sama persis dengan yang browser kirim di header Origin.
 */
function getRequestOrigin(req: NextRequest): string | null {
  const xfh = req.headers.get("x-forwarded-host");
  if (xfh) {
    const xfp = req.headers.get("x-forwarded-proto") || "https";
    return `${xfp}://${xfh}`;
  }
  try {
    return req.nextUrl.origin;
  } catch {
    return null;
  }
}

/**
 * Validasi CSRF berdasarkan Origin/Referer header.
 * Untuk state-changing requests (POST/PUT/PATCH/DELETE), wajib ada Origin atau Referer
 * yang cocok dengan ALLOWED_ORIGINS atau sama dengan host request sendiri.
 *
 * FIX: Tambah dynamic check — accept Origin yang sama dengan host request.
 * Ini memungkinkan login dari preview deployment, custom domain, atau domain lain
 * yang serve website ini, tanpa harus hardcode setiap domain.
 *
 * Catatan: GET/HEAD/OPTIONS tidak divalidasi (safe methods per RFC 7231)
 */
export function validateCsrf(req: NextRequest): boolean {
  const method = req.method.toUpperCase();
  // Safe methods tidak perlu CSRF check
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return true;

  // Dynamic: dapatkan host dari request URL atau X-Forwarded-Host header
  // (X-Forwarded-Host wajib dibaca karena preview gateway me-route request
  // ke localhost:3000 secara internal, tapi browser kirim Origin dengan
  // hostname publik — e.g. https://preview-xxx.space-z.ai)
  const requestHost = getRequestOrigin(req);

  const origin = req.headers.get("origin");
  if (origin) {
    // FIX: Accept jika origin sama dengan host request (dynamic, support preview/custom domain)
    if (requestHost && origin === requestHost) return true;
    // Atau jika origin ada di allowlist statis
    if (ALLOWED_ORIGINS.includes(origin)) return true;
    // FIX: Accept juga pattern wildcard (preview deployments space-z.ai & vercel.app)
    if (isPreviewOriginAllowed(origin)) return true;
    return false;
  }

  // Fallback ke Referer header
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      // FIX: Accept referer yang sama dengan host request (dynamic)
      if (requestHost && refererUrl.origin === requestHost) return true;
      if (ALLOWED_ORIGINS.includes(refererUrl.origin)) return true;
      if (isPreviewOriginAllowed(refererUrl.origin)) return true;
      return false;
    } catch {
      return false;
    }
  }

  // Tidak ada Origin dan Referer → tolak (state-changing request tanpa context tidak aman)
  return false;
}

// ============================================================
// 4. WAF (Web Application Firewall) — VULN-009 fix
// ============================================================

/**
 * Pola input berbahaya yang akan diblok oleh WAF
 *
 * SECURITY FIX (post-audit 2026-08-26): Pattern SQLi diperluas untuk cover
 * bypass yang ditemukan saat testing — pattern lama hanya match `'OR\s`
 * (apostrof langsung diikuti OR + spasi). Penyerang bisa bypass dengan:
 *   - `' OR '1'='1` (spasi antara `'` dan `OR`)
 *   - `1' OR 1=1` (idem)
 *   - `UNION SELECT` (tanpa apostrof prefix)
 *   - `SELECT * FROM` (statement tanpa apostrof)
 * Pattern baru pakai `'\s*` (optional whitespace) + alternatif tanpa apostrof
 * untuk SQL keywords standalone (`union\s+select`, `select\s+.*\s+from`).
 */
const MALICIOUS_PATTERNS: RegExp[] = [
  // SQL Injection — quote + (optional whitespace) + SQL keyword
  /'\s*(?:or|union|select|insert|update|delete|drop|alter|create|exec)\b/i,
  // SQL Injection — SQL keyword standalone (untuk payload tanpa apostrof prefix)
  /\bunion\s+select\b/i,
  /\bselect\s+.+\s+from\b/i,
  /\binsert\s+into\b/i,
  /\bdelete\s+from\b/i,
  /\bdrop\s+table\b/i,
  // SQL Injection — tautology boolean (1=1, '1'='1', dll)
  // Only match digit=digit untuk reduce false positive (URL query rarely contains "or 5=5")
  /\b(?:or|and)\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i,
  // SQL comment markers
  /(?:--|#|\/\*)/,
  // XSS
  /<script[^>]*>|<\/script>/i,
  /javascript:/i,
  /\bon\w+\s*=/i, // on*= event handlers
  /<iframe[^>]*src\s*=/i,
  /<img[^>]*onerror\s*=/i,
  /<svg[^>]*onload\s*=/i,
  // Path traversal
  /\.\.[\/\\]/,
  /\.\.%2f|\.\.%5c/i,
  // Command injection
  /[;|&]\s*(?:cat|ls|id|whoami|uname|pwd|wget|curl|bash|sh)\b/i,
  /\$\(|`|\$\{/,
  // Template injection
  /\{\{.*?\}\}|<%.*?%>/,
  // NoSQL injection
  /\$where|\$gt|\$lt|\$ne|\$regex/i,
];

export interface WafResult {
  blocked: boolean;
  reason?: string;
  pattern?: string;
}

/**
 * Cek apakah input mengandung pola berbahaya.
 * Scan URL, query params, dan body (jika JSON).
 *
 * SECURITY FIX (post-review): Scan URL dalam 2 bentuk — URL-encoded (raw)
 * DAN URL-decoded. Penyerang sering kirim payload ter-encode (mis.
 * %3Cscript%3E untuk <script>) untuk bypass WAF yang hanya scan raw URL.
 */
export function wafCheck(req: NextRequest, bodyString?: string): WafResult {
  const url = req.url;
  const search = url.split("?")[1] || "";

  // Bangun payload dalam 2 bentuk: encoded (raw) + decoded
  const urlPayload = `${url}${search ? `?${search}` : ""}`;
  let urlDecoded = urlPayload;
  try {
    // FIX: Normalisasi `+` → spasi SEBELUM decode (Next.js me-encode spasi
    // di query string sebagai `+` sesuai application/x-www-form-urlencoded,
    // bukan %20). Tanpa ini, pattern SQLi seperti `union\s+select` gagal
    // match karena `\s` tidak match `+`.
    urlDecoded = decodeURIComponent(urlPayload.replace(/\+/g, " "));
  } catch {
    // Jika decode gagal (malformed encoding), pakai raw
  }

  // Scan URL raw + decoded
  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(urlPayload) || pattern.test(urlDecoded)) {
      return {
        blocked: true,
        reason: "Malicious pattern detected in URL",
        pattern: pattern.source,
      };
    }
  }

  // Scan body jika ada — juga cek decoded form (body mungkin JSON-encoded)
  if (bodyString) {
    let bodyDecoded = bodyString;
    try {
      bodyDecoded = decodeURIComponent(bodyString);
    } catch {
      // keep raw
    }
    for (const pattern of MALICIOUS_PATTERNS) {
      if (pattern.test(bodyString) || pattern.test(bodyDecoded)) {
        return {
          blocked: true,
          reason: "Malicious pattern detected in request body",
          pattern: pattern.source,
        };
      }
    }
  }

  return { blocked: false };
}

/**
 * Response 403 untuk request yang diblok WAF
 */
export function wafBlockedResponse(reason: string): NextResponse {
  // Log untuk monitoring (di serverless, log muncul di Vercel dashboard)
  console.warn("[WAF] Request blocked:", reason, {
    timestamp: new Date().toISOString(),
  });
  return NextResponse.json(
    { error: "Request blocked by security policy" },
    { status: 403 }
  );
}
