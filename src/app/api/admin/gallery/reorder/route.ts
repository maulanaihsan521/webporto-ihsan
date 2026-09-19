import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { validateCsrf } from "@/lib/security";
import { logDataUpdated } from "@/lib/audit";

/**
 * POST /api/admin/gallery/reorder
 * Body: { items: [{ id: string, order: number }] }
 *
 * Update urutan (order) untuk multiple gallery items sekaligus.
 * Dipakai oleh drag-and-drop reorder di gallery manager.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
    }

    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { items } = body as { items: Array<{ id: string; order: number }> };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items array is required" },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of items) {
      if (!item.id || typeof item.id !== "string") {
        return NextResponse.json(
          { error: "Invalid item id" },
          { status: 400 }
        );
      }
      if (typeof item.order !== "number" || item.order < 0) {
        return NextResponse.json(
          { error: "Invalid order value" },
          { status: 400 }
        );
      }
    }

    // Update semua items dalam transaction untuk konsistensi
    await db.$transaction(
      items.map((item) =>
        db.gallery.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    // Audit log
    logDataUpdated(
      "Gallery",
      "reorder",
      session.id,
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
      `Reordered ${items.length} gallery items`
    );

    return NextResponse.json({ ok: true, updated: items.length });
  } catch (e) {
    console.error("[gallery reorder] Error:", e);
    return NextResponse.json(
      { error: "Failed to reorder gallery items" },
      { status: 500 }
    );
  }
}
