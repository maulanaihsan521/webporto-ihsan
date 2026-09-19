import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  sanitizeInput,
  isValidEmail,
  isValidPhone,
  checkRateLimit,
  rateLimitResponse,
  validateCsrf,
  wafCheck,
  wafBlockedResponse,
  getClientIP,
} from "@/lib/security";
import {
  logPiiAccess,
  logRateLimited,
  logWafBlocked,
  logCsrfBlocked,
  logDataCreated,
  logDataUpdated,
  logDataDeleted,
  logUnauthorizedAccess,
  logAccessDenied,
  auditLogAsync,
  AuditAction,
} from "@/lib/audit";

// ============================================================
// GET — Hanya untuk admin yang terautentikasi
// VULN-001 FIX: Sebelumnya public, sekarang wajib auth + admin role
// VULN-A09 FIX: Audit logging untuk PII access (compliance UU PDP Pasal 34)
// ============================================================
export async function GET(req: NextRequest) {
  const ip = getClientIP(req);

  // 1. Auth check — hanya admin yang boleh lihat daftar pesan
  const session = await getSession();
  if (!session) {
    // Audit: unauthorized access attempt
    logUnauthorizedAccess("/api/contact", ip, "GET");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    // Audit: access denied (authenticated but not admin)
    logAccessDenied("/api/contact", session.id, ip, "non-admin role");
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  // 2. Rate limit per admin user (mencegah scraping meski sudah auth)
  const rateKey = `admin:contact:list:${session.id}`;
  const limit = checkRateLimit(rateKey, 30, 60 * 1000); // 30 req/menit
  if (!limit.allowed) {
    // Audit: rate limited
    logRateLimited("/api/contact (admin list)", ip, 30, "1 menit");
    return rateLimitResponse(limit.resetAt, 30);
  }

  // 3. Pagination untuk batasi exposure data
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1"));
  const requestLimit = Math.min(
    Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? "20")),
    50
  );

  const [messages, total] = await Promise.all([
    db.message.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * requestLimit,
      take: requestLimit,
    }),
    db.message.count(),
  ]);

  // VULN-A09 FIX: Audit logging untuk PII access (compliance UU PDP Pasal 34)
  logPiiAccess("/api/contact", session.id, ip, messages.length);

  return NextResponse.json({
    data: messages,
    pagination: { page, limit: requestLimit, total },
  });
}

// ============================================================
// POST — Public submit dengan sanitization + CSRF + rate limit + WAF + AUDIT
// VULN-003 FIX: Sanitasi XSS
// VULN-004 FIX: CSRF validation
// VULN-005 FIX: Rate limiting per IP
// VULN-009 FIX: WAF check
// VULN-A09 FIX: Audit logging untuk semua security events
// ============================================================
export async function POST(req: NextRequest) {
  const ip = getClientIP(req);

  try {
    // 1. CSRF check — wajib Origin/Referer valid
    if (!validateCsrf(req)) {
      // Audit: CSRF blocked
      logCsrfBlocked("/api/contact", ip, req.headers.get("origin") || undefined);
      return NextResponse.json(
        { error: "Forbidden: Invalid origin" },
        { status: 403 }
      );
    }

    // 2. Rate limit per IP — 3 pesan per jam
    const rateKey = `contact:${ip}`;
    const limit = checkRateLimit(rateKey, 3, 60 * 60 * 1000); // 3 pesan/jam
    if (!limit.allowed) {
      // Audit: rate limited
      logRateLimited("/api/contact", ip, 3, "1 jam");
      return rateLimitResponse(limit.resetAt, 3);
    }

    // 3. Parse body untuk WAF check
    const rawBody = await req.text();
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // 4. WAF check — scan untuk pola berbahaya
    const waf = wafCheck(req, rawBody);
    if (waf.blocked) {
      // Audit: WAF blocked
      logWafBlocked("/api/contact", ip, waf.reason || "blocked", waf.pattern);
      return wafBlockedResponse(waf.reason || "blocked");
    }

    // 5. Extract & validate fields
    const { name, email, phone, subject, message } = body;

    // 6. Validasi field wajib
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    // 7. Sanitasi semua input string (VULN-003 fix)
    const sanitizedName = sanitizeInput(name, 100);
    const sanitizedEmail = sanitizeInput(email, 255).toLowerCase();
    const sanitizedPhone = phone ? sanitizeInput(phone, 20) : null;
    const sanitizedSubject = subject ? sanitizeInput(subject, 200) : null;
    const sanitizedMessage = sanitizeInput(message, 2000);

    // 8. Validasi format
    if (sanitizedName.length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 }
      );
    }
    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }
    if (sanitizedPhone && !isValidPhone(sanitizedPhone)) {
      return NextResponse.json(
        { error: "Invalid phone format" },
        { status: 400 }
      );
    }
    if (sanitizedMessage.length < 10) {
      return NextResponse.json(
        { error: "Message must be at least 10 characters" },
        { status: 400 }
      );
    }

    // 9. Simpan ke database dengan data yang sudah disanitasi
    const msg = await db.message.create({
      data: {
        name: sanitizedName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        subject: sanitizedSubject,
        message: sanitizedMessage,
      },
    });

    // Audit: contact message submitted
    auditLogAsync({
      action: AuditAction.DATA_CREATED,
      entity: "Message",
      entityId: msg.id,
      detail: `Pesan kontak baru dari ${sanitizedName} <${sanitizedEmail}>`,
      ipAddress: ip,
    });

    return NextResponse.json({ ok: true, id: msg.id });
  } catch (e) {
    console.error("[contact POST] Error:", e);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH — Admin only (read/unread/star/reply)
// VULN-A09 FIX: Audit logging untuk semua admin actions
// ============================================================
export async function PATCH(req: NextRequest) {
  const ip = getClientIP(req);
  try {
    const session = await getSession();
    if (!session) {
      logUnauthorizedAccess("/api/contact", ip, "PATCH");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      logUnauthorizedAccess("/api/contact", ip, "non-admin PATCH");
      return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
    }

    // CSRF check
    if (!validateCsrf(req)) {
      logCsrfBlocked("/api/contact", ip, req.headers.get("origin") || undefined);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, action, reply } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const msg = await db.message.findUnique({ where: { id } });
    if (!msg) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (action === "read") {
      await db.message.update({ where: { id }, data: { read: true } });
      logDataUpdated("Message", id, session.id, ip, `Marked as read: ${msg.name}`);
    } else if (action === "unread") {
      await db.message.update({ where: { id }, data: { read: false } });
      logDataUpdated("Message", id, session.id, ip, `Marked as unread: ${msg.name}`);
    } else if (action === "star") {
      await db.message.update({
        where: { id },
        data: { starred: !msg.starred },
      });
      logDataUpdated("Message", id, session.id, ip, `Toggled star: ${msg.name}`);
    } else if (action === "reply") {
      if (!reply || typeof reply !== "string") {
        return NextResponse.json(
          { error: "Reply content required" },
          { status: 400 }
        );
      }
      const sanitizedReply = sanitizeInput(reply, 5000);
      await db.message.update({
        where: { id },
        data: { reply: sanitizedReply, replied: true, replierId: session.id },
      });
      // Audit: reply sent
      logDataUpdated("Message", id, session.id, ip, `Replied to ${msg.name} <${msg.email}>`);
      await db.activityLog.create({
        data: {
          action: "REPLY",
          entity: "Message",
          entityId: id,
          userId: session.id,
          detail: `Replied to message from ${msg.name}`,
        },
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[contact PATCH] Error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// ============================================================
// DELETE — Admin only
// VULN-A09 FIX: Audit logging untuk data deletion
// ============================================================
export async function DELETE(req: NextRequest) {
  const ip = getClientIP(req);
  try {
    const session = await getSession();
    if (!session) {
      logUnauthorizedAccess("/api/contact", ip, "DELETE");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      logUnauthorizedAccess("/api/contact", ip, "non-admin DELETE");
      return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
    }

    // CSRF check
    if (!validateCsrf(req)) {
      logCsrfBlocked("/api/contact", ip, req.headers.get("origin") || undefined);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Get message info before delete (for audit log)
    const msg = await db.message.findUnique({ where: { id }, select: { name: true, email: true } });

    await db.message.delete({ where: { id } });

    // Audit: message deleted
    logDataDeleted("Message", id, session.id, ip, `Deleted message from ${msg?.name ?? "unknown"} <${msg?.email ?? "unknown"}>`);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[contact DELETE] Error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
