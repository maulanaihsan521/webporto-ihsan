import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, email, role, bio, image, password } = body;

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    if (email && email.toLowerCase().trim() !== existing.email) {
      const conflict = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
      if (conflict) {
        return NextResponse.json({ error: "Email sudah digunakan" }, { status: 400 });
      }
    }

    const validRoles = ["ADMIN", "EDITOR", "VIEWER"];
    const data: any = {};
    if (typeof name === "string") data.name = name.trim() || null;
    if (typeof email === "string") data.email = email.toLowerCase().trim();
    if (typeof bio === "string") data.bio = bio.trim() || null;
    if (typeof image === "string") data.image = image.trim() || null;
    if (validRoles.includes(role)) data.role = role;
    if (typeof password === "string" && password.trim()) {
      data.password = await bcrypt.hash(password, 10);
    }

    const updated = await db.user.update({
      where: { id },
      data,
      select: {
        id: true, email: true, name: true, role: true, image: true, bio: true,
        createdAt: true, updatedAt: true,
      },
    });

    await db.activityLog.create({
      data: {
        action: "UPDATE",
        entity: "User",
        entityId: id,
        userId: session.id,
        detail: `Updated user "${updated.email}"`,
      },
    });

    return NextResponse.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (e: any) {
    console.error("User update error:", e);
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;

    if (id === session.id) {
      return NextResponse.json(
        { error: "Anda tidak dapat menghapus akun Anda sendiri" },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    await db.user.delete({ where: { id } });

    await db.activityLog.create({
      data: {
        action: "DELETE",
        entity: "User",
        entityId: id,
        userId: session.id,
        detail: `Deleted user "${existing.email}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("User delete error:", e);
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
