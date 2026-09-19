import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const VALID_COLORS = [
  "amber", "rose", "violet", "cyan", "orange", "emerald", "fuchsia", "green",
];

/** Validasi URL/path foto layanan — terima path lokal ("/images/...") atau URL http(s) */
function sanitizeImage(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim();
  if (!v) return null;
  if (v.startsWith("/") && !v.includes("..") && /^[-\w./]+$/.test(v)) return v;
  try {
    const u = new URL(v);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
  } catch {
    /* invalid URL → null */
  }
  return null;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });

  const services = await db.service.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });

  try {
    const body = await req.json();

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Judul layanan wajib diisi" }, { status: 400 });
    }

    const slug = body.slug?.trim() || slugify(body.title);
    if (!slug) return NextResponse.json({ error: "Slug is required" }, { status: 400 });

    const existing = await db.service.findUnique({ where: { slug } });
    if (existing) return NextResponse.json({ error: "Slug sudah digunakan" }, { status: 400 });

    const color = body.color?.trim() && VALID_COLORS.includes(body.color.trim()) ? body.color.trim() : null;

    const data: any = {
      title: body.title.trim(),
      slug,
      description: body.description?.trim() || null,
      icon: body.icon?.trim() || null,
      color,
      features: body.features?.trim() || null,
      image: sanitizeImage(body.image),
      order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0,
    };

    const created = await db.service.create({ data });

    await db.activityLog.create({
      data: {
        action: "CREATE",
        entity: "Service",
        entityId: created.id,
        userId: session.id,
        detail: `Created service "${created.title}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error("Service create error:", e);
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
