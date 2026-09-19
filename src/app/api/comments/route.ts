import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateCsrf, getClientIP, checkRateLimit, rateLimitResponse } from "@/lib/security";

/**
 * Public Comments API
 *
 * GET  /api/comments?postId=...         → returns approved comments (oldest-first)
 *                                         with one level of nested approved replies.
 *
 * POST /api/comments                    → creates a comment with approved=false
 *                                         (pending moderation). Body shape:
 *                                         { postId, name, email, content, parentId? }
 *                                         Returns { ok: true }.
 */

function isValidEmail(email: string): boolean {
  // simple but robust email validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function sanitize(s: string): string {
  // Strip <script> tags entirely, then strip remaining HTML tags,
  // then neutralize angle brackets as defense-in-depth. Comments are
  // rendered as plain text in the UI, so this is a safety net only.
  return s
    .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, (ch) => (ch === "<" ? "&lt;" : "&gt;"))
    .slice(0, 5000);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json(
        { error: "postId query parameter is required" },
        { status: 400 },
      );
    }

    // Verify post exists
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Fetch approved top-level comments with their approved replies (1 level).
    const comments = await db.comment.findMany({
      where: { postId, approved: true, parentId: null },
      include: {
        replies: {
          where: { approved: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Strip email for privacy (clients don't need it)
    const safe = comments.map((c) => ({
      id: c.id,
      name: c.name,
      content: c.content,
      parentId: c.parentId,
      postId: c.postId,
      createdAt: c.createdAt,
      replies: c.replies.map((r) => ({
        id: r.id,
        name: r.name,
        content: r.content,
        parentId: r.parentId,
        postId: r.postId,
        createdAt: r.createdAt,
      })),
    }));

    return NextResponse.json({ comments: safe });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // VULN-004 FIX: CSRF check
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // VULN-005 FIX: Rate limit per IP — 10 comments per jam
    const ip = getClientIP(req);
    const ipLimit = checkRateLimit(`comments:${ip}`, 10, 60 * 60 * 1000);
    if (!ipLimit.allowed) {
      return rateLimitResponse(ipLimit.resetAt, 10);
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const { postId, name, email, content, parentId } = body as {
      postId?: unknown;
      name?: unknown;
      email?: unknown;
      content?: unknown;
      parentId?: unknown;
    };

    // --- Validation ---
    if (typeof postId !== "string" || !postId.trim()) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }
    if (typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 },
      );
    }
    if (name.trim().length > 80) {
      return NextResponse.json(
        { error: "Name is too long (max 80 characters)" },
        { status: 400 },
      );
    }
    if (typeof email !== "string" || !isValidEmail(email.trim())) {
      return NextResponse.json(
        { error: "A valid email is required" },
        { status: 400 },
      );
    }
    if (typeof content !== "string" || content.trim().length < 3) {
      return NextResponse.json(
        { error: "Comment must be at least 3 characters" },
        { status: 400 },
      );
    }
    if (content.trim().length > 5000) {
      return NextResponse.json(
        { error: "Comment is too long (max 5000 characters)" },
        { status: 400 },
      );
    }

    // Verify post exists
    const post = await db.post.findUnique({
      where: { id: postId.trim() },
      select: { id: true },
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Optional parentId — verify it belongs to the same post and is top-level
    let resolvedParentId: string | null = null;
    if (typeof parentId === "string" && parentId.trim()) {
      const parent = await db.comment.findUnique({
        where: { id: parentId.trim() },
        select: { id: true, postId: true, parentId: true },
      });
      if (!parent) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 400 },
        );
      }
      if (parent.postId !== post.id) {
        return NextResponse.json(
          { error: "Parent comment does not belong to this post" },
          { status: 400 },
        );
      }
      // Only allow 1 level of nesting — parent must be a top-level comment
      if (parent.parentId !== null) {
        return NextResponse.json(
          { error: "Cannot reply to a nested comment" },
          { status: 400 },
        );
      }
      resolvedParentId = parent.id;
    }

    // Rate-limit by email to mitigate spam (max 5 comments / minute)
    const windowStart = new Date(Date.now() - 60_000);
    const recentCount = await db.comment.count({
      where: {
        email: email.trim().toLowerCase(),
        createdAt: { gte: windowStart },
      },
    });
    if (recentCount >= 5) {
      return NextResponse.json(
        { error: "Too many comments from you recently. Please try again later." },
        { status: 429 },
      );
    }

    await db.comment.create({
      data: {
        postId: post.id,
        name: name.trim().slice(0, 80),
        email: email.trim().toLowerCase().slice(0, 254),
        content: sanitize(content.trim()),
        parentId: resolvedParentId,
        approved: false, // pending moderation
      },
    });

    return NextResponse.json({
      ok: true,
      message:
        "Komentar Anda telah dikirim dan menunggu moderasi. Terima kasih!",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit comment" },
      { status: 500 },
    );
  }
}
