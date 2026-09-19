/**
 * Audit Logging — Centralized security event logging
 *
 * Mencatat semua aktivitas penting di sistem untuk:
 * - Compliance UU PDP Pasal 34 (audit trail untuk data pribadi)
 * - ISO 27001 A.8.16 (Monitoring activities)
 * - OWASP A09 (Logging & Monitoring Failures)
 * - Deteksi serangan dini (brute force, reconnaissance, dll)
 * - Investigasi forensik pasca-incident
 *
 * Owner: Maulana Ihsan Rohim
 * Updated: 2026-08-04
 */

import { db } from "@/lib/db";

// ============================================================
// Action Types — konstanta untuk konsistensi
// ============================================================

export const AuditAction = {
  // Authentication events
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILED: "LOGIN_FAILED",
  LOGOUT: "LOGOUT",
  RATE_LIMITED: "RATE_LIMITED",
  RATE_LIMITED_LOGIN: "RATE_LIMITED_LOGIN",
  RATE_LIMITED_CONTACT: "RATE_LIMITED_CONTACT",

  // Authorization events
  ACCESS_DENIED: "ACCESS_DENIED",
  UNAUTHORIZED_ACCESS: "UNAUTHORIZED_ACCESS",

  // Security events
  WAF_BLOCKED: "WAF_BLOCKED",
  CSRF_BLOCKED: "CSRF_BLOCKED",
  XSS_BLOCKED: "XSS_BLOCKED",
  SQLI_BLOCKED: "SQLI_BLOCKED",
  PATH_TRAVERSAL_BLOCKED: "PATH_TRAVERSAL_BLOCKED",

  // Data access (PII)
  PII_ACCESS: "PII_ACCESS", // akses ke data kontak (PII)
  PII_EXPORT: "PII_EXPORT", // export data kontak

  // Data modification
  DATA_CREATED: "DATA_CREATED",
  DATA_UPDATED: "DATA_UPDATED",
  DATA_DELETED: "DATA_DELETED",

  // Configuration
  SETTINGS_CHANGED: "SETTINGS_CHANGED",
  USER_CREATED: "USER_CREATED",
  USER_ROLE_CHANGED: "USER_ROLE_CHANGED",
} as const;

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction];

// ============================================================
// Audit Log Entry Interface
// ============================================================

export interface AuditLogEntry {
  action: AuditActionType | string;
  entity: string;
  entityId?: string | null;
  detail?: string | null;
  userId?: string | null;
  ipAddress?: string | null;
}

// Safeguard: truncate fields untuk prevent abuse (very long strings could be DoS vector)
const MAX_DETAIL_LENGTH = 1000;
const MAX_ENTITY_ID_LENGTH = 255;
const MAX_ACTION_LENGTH = 100;
const MAX_ENTITY_LENGTH = 100;
const MAX_IP_LENGTH = 45; // IPv6 max length

function truncate(value: string | null | undefined, maxLen: number): string | null {
  if (!value) return null;
  if (value.length <= maxLen) return value;
  return value.slice(0, maxLen - 3) + "...";
}

// ============================================================
// Main logging function — async, non-blocking
// ============================================================

/**
 * Catat audit log entry ke database.
 *
 * Function ini sengaja dibuat "fire-and-forget" — tidak menunggu
 * database write selesai sebelum return. Alasannya:
 * 1. Audit logging tidak boleh memperlambat response ke user
 * 2. Kalau database error, request user tetap sukses
 * 3. Log error tetap muncul di server logs (Vercel dashboard)
 *
 * @example
 * auditLog({
 *   action: AuditAction.LOGIN_SUCCESS,
 *   entity: "User",
 *   entityId: user.id,
 *   userId: user.id,
 *   ipAddress: ip,
 *   detail: `Login berhasil dari IP ${ip}`,
 * });
 */
export async function auditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await db.activityLog.create({
      data: {
        action: truncate(entry.action, MAX_ACTION_LENGTH) ?? "UNKNOWN",
        entity: truncate(entry.entity, MAX_ENTITY_LENGTH) ?? "Unknown",
        entityId: truncate(entry.entityId, MAX_ENTITY_ID_LENGTH),
        detail: truncate(entry.detail, MAX_DETAIL_LENGTH),
        userId: entry.userId ?? null,
        ipAddress: truncate(entry.ipAddress, MAX_IP_LENGTH),
      },
    });
  } catch (error) {
    // Jangan throw — audit logging tidak boleh break aplikasi
    // Log ke stderr untuk debugging di Vercel dashboard
    console.error("[AuditLog] Failed to write log:", error, entry);
  }
}

/**
 * Fire-and-forget version — gunakan ini di route handler agar
 * tidak menunggu database write selesai.
 *
 * @example
 * auditLogAsync({ ... }); // tidak perlu await
 */
export function auditLogAsync(entry: AuditLogEntry): void {
  // Promise.catch untuk suppress unhandled rejection
  auditLog(entry).catch(() => {});
}

// ============================================================
// Helper functions untuk event umum
// ============================================================

/**
 * Log successful login
 */
export function logLoginSuccess(userId: string, ip: string, userAgent?: string) {
  auditLogAsync({
    action: AuditAction.LOGIN_SUCCESS,
    entity: "User",
    entityId: userId,
    userId,
    ipAddress: ip,
    detail: `Login berhasil dari IP ${ip}${userAgent ? ` (${userAgent})` : ""}`,
  });
}

/**
 * Log failed login attempt
 */
export function logLoginFailed(email: string, ip: string, reason?: string) {
  auditLogAsync({
    action: AuditAction.LOGIN_FAILED,
    entity: "User",
    entityId: email, // gunakan email karena user mungkin tidak ada
    detail: `Login gagal untuk email ${email} dari IP ${ip}${reason ? `: ${reason}` : ""}`,
    ipAddress: ip,
  });
}

/**
 * Log rate limit triggered
 */
export function logRateLimited(
  endpoint: string,
  ip: string,
  limit: number,
  window: string
) {
  auditLogAsync({
    action: AuditAction.RATE_LIMITED,
    entity: "RateLimit",
    entityId: endpoint,
    detail: `IP ${ip} kena rate limit di ${endpoint} (${limit} req/${window})`,
    ipAddress: ip,
  });
}

/**
 * Log WAF block
 */
export function logWafBlocked(
  endpoint: string,
  ip: string,
  reason: string,
  pattern?: string
) {
  auditLogAsync({
    action: AuditAction.WAF_BLOCKED,
    entity: "WAF",
    entityId: endpoint,
    detail: `IP ${ip} diblok WAF di ${endpoint}: ${reason}${
      pattern ? ` (pattern: ${pattern})` : ""
    }`,
    ipAddress: ip,
  });
}

/**
 * Log CSRF block
 */
export function logCsrfBlocked(endpoint: string, ip: string, origin?: string) {
  auditLogAsync({
    action: AuditAction.CSRF_BLOCKED,
    entity: "CSRF",
    entityId: endpoint,
    detail: `IP ${ip} diblok CSRF di ${endpoint}${origin ? ` (origin: ${origin})` : " (no origin)"}`,
    ipAddress: ip,
  });
}

/**
 * Log PII access (akses ke data kontak, newsletter subscribers, dll)
 */
export function logPiiAccess(
  endpoint: string,
  userId: string,
  ip: string,
  recordCount?: number
) {
  auditLogAsync({
    action: AuditAction.PII_ACCESS,
    entity: "PII",
    entityId: endpoint,
    userId,
    ipAddress: ip,
    detail: `Admin ${userId} akses PII di ${endpoint}${
      recordCount !== undefined ? ` (${recordCount} records)` : ""
    }`,
  });
}

/**
 * Log data creation (blog post, portfolio, dll)
 */
export function logDataCreated(
  entity: string,
  entityId: string,
  userId: string,
  ip: string,
  detail?: string
) {
  auditLogAsync({
    action: AuditAction.DATA_CREATED,
    entity,
    entityId,
    userId,
    ipAddress: ip,
    detail: detail ?? `Created ${entity} ${entityId}`,
  });
}

/**
 * Log data update
 */
export function logDataUpdated(
  entity: string,
  entityId: string,
  userId: string,
  ip: string,
  detail?: string
) {
  auditLogAsync({
    action: AuditAction.DATA_UPDATED,
    entity,
    entityId,
    userId,
    ipAddress: ip,
    detail: detail ?? `Updated ${entity} ${entityId}`,
  });
}

/**
 * Log data deletion
 */
export function logDataDeleted(
  entity: string,
  entityId: string,
  userId: string,
  ip: string,
  detail?: string
) {
  auditLogAsync({
    action: AuditAction.DATA_DELETED,
    entity,
    entityId,
    userId,
    ipAddress: ip,
    detail: detail ?? `Deleted ${entity} ${entityId}`,
  });
}

/**
 * Log unauthorized access attempt (401)
 */
export function logUnauthorizedAccess(
  endpoint: string,
  ip: string,
  method: string
) {
  auditLogAsync({
    action: AuditAction.UNAUTHORIZED_ACCESS,
    entity: "Auth",
    entityId: endpoint,
    detail: `Unauthorized ${method} ${endpoint} dari IP ${ip}`,
    ipAddress: ip,
  });
}

/**
 * Log access denied (403 — authenticated but not authorized)
 */
export function logAccessDenied(
  endpoint: string,
  userId: string | null,
  ip: string,
  reason?: string
) {
  auditLogAsync({
    action: AuditAction.ACCESS_DENIED,
    entity: "Auth",
    entityId: endpoint,
    userId,
    ipAddress: ip,
    detail: `Access denied untuk ${endpoint}${reason ? `: ${reason}` : ""}`,
  });
}
