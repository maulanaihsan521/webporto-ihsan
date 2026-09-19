import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const VALID_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];

const CATEGORY_SUGGESTIONS = [
  "Digital Marketing", "Social Media", "Photography", "Videography",
  "Design", "Video Editing", "Development", "Database", "Tools",
  "Financial Market", "Data Analysis",
];

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });

  const skills = await db.skill.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json(skills);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });

  try {
    const body = await req.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Nama skill wajib diisi" }, { status: 400 });
    }

    const slug = body.slug?.trim() || slugify(body.name);
    if (!slug) return NextResponse.json({ error: "Slug is required" }, { status: 400 });

    const existing = await db.skill.findUnique({ where: { slug } });
    if (existing) return NextResponse.json({ error: "Slug sudah digunakan" }, { status: 400 });

    const level = VALID_LEVELS.includes(body.level) ? body.level : "INTERMEDIATE";
    let percentage = Number(body.percentage);
    if (!Number.isFinite(percentage)) percentage = 0;
    percentage = Math.max(0, Math.min(100, Math.round(percentage)));

    const data: any = {
      name: body.name.trim(),
      slug,
      category: body.category?.trim() || "Lainnya",
      percentage,
      level,
      icon: body.icon?.trim() || null,
      description: body.description?.trim() || null,
      color: body.color?.trim() || null,
      featured: !!body.featured,
      order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0,
    };

    const created = await db.skill.create({ data });

    await db.activityLog.create({
      data: {
        action: "CREATE",
        entity: "Skill",
        entityId: created.id,
        userId: session.id,
        detail: `Created skill "${created.name}" (${created.category})`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error("Skill create error:", e);
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export { CATEGORY_SUGGESTIONS };
