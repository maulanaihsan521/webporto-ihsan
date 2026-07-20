import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const cert = await db.certificate.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!cert) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(cert);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const existing = await db.certificate.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const slug = body.slug?.trim() || slugify(body.title || existing.title);
    if (slug !== existing.slug) {
      const dup = await db.certificate.findUnique({ where: { slug } });
      if (dup) return NextResponse.json({ error: "Slug sudah digunakan" }, { status: 400 });
    }

    const data: any = {
      title: body.title?.trim() ?? existing.title,
      slug,
      description: body.description?.trim() || null,
      issuer: body.issuer?.trim() ?? existing.issuer,
      issueDate: body.issueDate ? new Date(body.issueDate) : existing.issueDate,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : body.expiryDate === "" ? null : existing.expiryDate,
      credentialId: body.credentialId?.trim() || null,
      credentialUrl: body.credentialUrl?.trim() || null,
      fileUrl: body.fileUrl?.trim() || null,
      imageUrl: body.imageUrl?.trim() || null,
      featured: body.featured ?? existing.featured,
      categoryId: body.categoryId || null,
    };

    const updated = await db.certificate.update({ where: { id }, data });

    await db.activityLog.create({
      data: {
        action: "UPDATE",
        entity: "Certificate",
        entityId: id,
        userId: session.id,
        detail: `Updated certificate "${updated.title}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json(updated);
  } catch (e: any) {
    console.error("Certificate update error:", e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const existing = await db.certificate.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.certificate.delete({ where: { id } });

    await db.activityLog.create({
      data: {
        action: "DELETE",
        entity: "Certificate",
        entityId: id,
        userId: session.id,
        detail: `Deleted certificate "${existing.title}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Certificate delete error:", e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
