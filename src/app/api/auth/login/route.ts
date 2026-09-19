import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import {
  checkRateLimit,
  rateLimitResponse,
  validateCsrf,
  getClientIP,
  wafCheck,
  wafBlockedResponse,
  sanitizeInput,
} from "@/lib/security";
import {
  logLoginSuccess,
  logLoginFailed,
  logRateLimited,
  logWafBlocked,
  logCsrfBlocked,
  AuditAction,
  auditLogAsync,
} from "@/lib/audit";

// ============================================================
// POST — Login dengan rate limiting + WAF + CSRF + AUDIT LOGGING
// VULN-005 FIX: Rate limit (5 attempts per 15 menit per IP, 10 per email per jam)
// VULN-004 FIX: CSRF check
// VULN-009 FIX: WAF check
// VULN-A09 FIX: Audit logging untuk semua auth events
// ============================================================
export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const userAgent = req.headers.get("user-agent") || undefined;

  try {
    // 1. CSRF check
    if (!validateCsrf(req)) {
      // Audit: CSRF blocked
      logCsrfBlocked("/api/auth/login", ip, req.headers.get("origin") || undefined);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Rate limit per IP: 5 attempts per 15 menit
    const ipLimit = checkRateLimit(`login:ip:${ip}`, 5, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      // Audit: rate limited
      logRateLimited("/api/auth/login", ip, 5, "15 menit");
      return rateLimitResponse(ipLimit.resetAt, 5);
    }

    // 3. Parse body untuk WAF
    const rawBody = await req.text();
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // 4. WAF check
    const waf = wafCheck(req, rawBody);
    if (waf.blocked) {
      // Audit: WAF blocked
      logWafBlocked("/api/auth/login", ip, waf.reason || "blocked", waf.pattern);
      return wafBlockedResponse(waf.reason || "blocked");
    }

    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    // 5. Sanitasi email
    const sanitizedEmail = sanitizeInput(email, 255).toLowerCase();

    // 6. Rate limit per email: 10 attempts per jam
    const emailLimit = checkRateLimit(
      `login:email:${sanitizedEmail}`,
      10,
      60 * 60 * 1000
    );
    if (!emailLimit.allowed) {
      // Audit: rate limited per email
      logRateLimited(`/api/auth/login (email: ${sanitizedEmail})`, ip, 10, "1 jam");
      return rateLimitResponse(emailLimit.resetAt, 10);
    }

    const user = await db.user.findUnique({
      where: { email: sanitizedEmail },
    });
    if (!user) {
      // Audit: login failed (user not found)
      logLoginFailed(sanitizedEmail, ip, "user not found");
      // SECURITY FIX (audit 2026-09-15): dummy bcrypt compare agar response time
      // untuk email yang tidak terdaftar sama dengan email terdaftar + password
      // salah — mencegah user enumeration via timing side-channel.
      await bcrypt.compare(password, "$2b$10$CwTycUXWue0Thq9StjUM0uJ8DoQxVZ0kFJl6U6oqAOXaGXcME6mue");
      // Jangan bocorkan apakah email ada atau tidak
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      // Audit: login failed (wrong password)
      logLoginFailed(sanitizedEmail, ip, "wrong password");
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.image,
    });

    const res = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
      },
    });

    // VULN-015 FIX: Cookie dengan flags lengkap
    // sameSite: "lax" (bukan "strict") agar cookie bisa ter-set di preview deployment
    // dan tetap aman dari CSRF (CSRF protection di-handle oleh validateCsrf di security.ts)
    res.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 2, // 2 jam
      path: "/",
    });

    // Audit: login success (gunakan helper yang include user agent)
    logLoginSuccess(user.id, ip, userAgent);

    // Tetap simpan activity log lama untuk backward compat dengan admin UI
    await db.activityLog.create({
      data: {
        action: "LOGIN",
        entity: "User",
        entityId: user.id,
        userId: user.id,
        ipAddress: ip,
      },
    });
    return res;
  } catch (e) {
    console.error("[login] Error:", e);
    // Audit: unexpected error
    auditLogAsync({
      action: AuditAction.LOGIN_FAILED,
      entity: "User",
      detail: `Login error: ${e instanceof Error ? e.message : "unknown"}`,
      ipAddress: ip,
    });
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const ip = getClientIP(req);
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("admin_token");

  // Audit: logout
  auditLogAsync({
    action: AuditAction.LOGOUT,
    entity: "User",
    detail: `Logout dari IP ${ip}`,
    ipAddress: ip,
  });

  return res;
}
