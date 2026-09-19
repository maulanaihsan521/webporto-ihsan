import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  sanitizeInput,
  isValidEmail,
  checkRateLimit,
  rateLimitResponse,
  validateCsrf,
  getClientIP,
  wafCheck,
  wafBlockedResponse,
} from "@/lib/security";
import {
  logRateLimited,
  logWafBlocked,
  logCsrfBlocked,
  auditLogAsync,
  AuditAction,
} from "@/lib/audit";

// Rate limit: 5 subscribe attempts per jam per IP
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 60 * 1000; // 1 jam

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  try {
    // 1. CSRF check
    if (!validateCsrf(req)) {
      logCsrfBlocked("/api/newsletter", ip, req.headers.get("origin") || undefined);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Rate limit
    const limit = checkRateLimit(`newsletter:${ip}`, RATE_LIMIT, RATE_WINDOW);
    if (!limit.allowed) {
      logRateLimited("/api/newsletter", ip, RATE_LIMIT, "1 jam");
      return rateLimitResponse(limit.resetAt, RATE_LIMIT);
    }

    // 3. Parse & WAF check
    const rawBody = await req.text();
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const waf = wafCheck(req, rawBody);
    if (waf.blocked) {
      logWafBlocked("/api/newsletter", ip, waf.reason || "blocked", waf.pattern);
      return wafBlockedResponse(waf.reason || "blocked");
    }

    // 4. Sanitize & validate email
    const email = sanitizeInput(body.email, 255).toLowerCase();
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const existing = await db.newsletter.findUnique({ where: { email } });
    if (existing) {
      if (!existing.active) {
        await db.newsletter.update({ where: { email }, data: { active: true } });
        // Audit: re-subscribe
        auditLogAsync({
          action: AuditAction.DATA_UPDATED,
          entity: "Newsletter",
          entityId: existing.id,
          detail: `Re-subscribed: ${email}`,
          ipAddress: ip,
        });
        return NextResponse.json({ ok: true, message: "Re-subscribed" });
      }
      return NextResponse.json({ ok: true, message: "Already subscribed" });
    }
    const sub = await db.newsletter.create({ data: { email } });
    // Audit: new subscription
    auditLogAsync({
      action: AuditAction.DATA_CREATED,
      entity: "Newsletter",
      entityId: sub.id,
      detail: `New subscriber: ${email}`,
      ipAddress: ip,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[newsletter] Error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // SECURITY (Task 12): rate-limit unsubscribe publik — sebelumnya bisa
    // di-bruteforce untuk enumerasi email subscriber (500 = ada, 200 = tidak)
    const ip = getClientIP(req);
    const rl = checkRateLimit(`newsletter:del:${ip}`, 10, 60 * 60 * 1000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt, 10);

    const body = await req.json();
    const email = sanitizeInput(body.email, 255).toLowerCase();
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    // SECURITY: netralisasi enumerasi — unknown email (P2025) dan sukses
    // memberi response yang sama persis.
    try {
      await db.newsletter.update({ where: { email }, data: { active: false } });
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code !== "P2025") throw e; // error lain → 500; unknown → ok (sama dgn sukses)
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[newsletter] DELETE error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
