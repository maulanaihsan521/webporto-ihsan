import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await db.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      image: true,
      bio: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, email, password, role, bio, image } = body;

    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return NextResponse.json({ error: "Email sudah digunakan" }, { status: 400 });
    }

    const validRoles = ["ADMIN", "EDITOR", "VIEWER"];
    const finalRole = validRoles.includes(role) ? role : "VIEWER";

    const hashed = await bcrypt.hash(password, 10);

    const created = await db.user.create({
      data: {
        name: name?.trim() || null,
        email: email.toLowerCase().trim(),
        password: hashed,
        role: finalRole,
        bio: bio?.trim() || null,
        image: image?.trim() || null,
      },
      select: {
        id: true, email: true, name: true, role: true, image: true, bio: true,
        createdAt: true, updatedAt: true,
      },
    });

    await db.activityLog.create({
      data: {
        action: "CREATE",
        entity: "User",
        entityId: created.id,
        userId: session.id,
        detail: `Created user "${created.email}" with role ${finalRole}`,
      },
    });

    return NextResponse.json(
      { ...created, createdAt: created.createdAt.toISOString(), updatedAt: created.updatedAt.toISOString() },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("User create error:", e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
