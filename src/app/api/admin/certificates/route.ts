import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const certs = await db.certificate.findMany({
    include: { category: true },
    orderBy: { issueDate: "desc" },
  });

  return NextResponse.json(certs);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();

    const slug = body.slug?.trim() || slugify(body.title || "");
    if (!slug) return NextResponse.json({ error: "Slug is required" }, { status: 400 });

    const existing = await db.certificate.findUnique({ where: { slug } });
    if (existing) return NextResponse.json({ error: "Slug sudah digunakan" }, { status: 400 });

    if (!body.issueDate) {
      return NextResponse.json({ error: "Tanggal terbit wajib diisi" }, { status: 400 });
    }

    const data: any = {
      title: body.title?.trim() || "",
      slug,
      description: body.description?.trim() || null,
      issuer: body.issuer?.trim() || "",
      issueDate: new Date(body.issueDate),
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      credentialId: body.credentialId?.trim() || null,
      credentialUrl: body.credentialUrl?.trim() || null,
      fileUrl: body.fileUrl?.trim() || null,
      imageUrl: body.imageUrl?.trim() || null,
      featured: !!body.featured,
      categoryId: body.categoryId || null,
    };

    const created = await db.certificate.create({ data });

    await db.activityLog.create({
      data: {
        action: "CREATE",
        entity: "Certificate",
        entityId: created.id,
        userId: session.id,
        detail: `Created certificate "${created.title}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error("Certificate create error:", e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
