import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * API Galeri Portfolio (PortfolioImage):
 *  POST   { url, caption? }                          → tambah gambar (order = paling akhir)
 *  PUT    { images: [{ id, caption?, order? }] }     → update caption &/atau urutan (bulk)
 *  DELETE ?imageId=xxx                                → hapus satu gambar galeri
 * Semua aksi tercatat di ActivityLog dan me-revalidate halaman publik.
 */

async function requireAdmin() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (session.role !== "ADMIN")
    return { error: NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 }) };
  return { session };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const session = auth.session!;

  const { id } = await params;
  try {
    const body = await req.json();
    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!url) return NextResponse.json({ error: "URL gambar wajib diisi" }, { status: 400 });
    if (!/^https?:\/\/.+/i.test(url) && !url.startsWith("/"))
      return NextResponse.json({ error: "URL gambar tidak valid" }, { status: 400 });
    const caption = typeof body.caption === "string" && body.caption.trim() ? body.caption.trim() : null;

    const portfolio = await db.portfolio.findUnique({
      where: { id },
      select: { id: true, title: true },
    });
    if (!portfolio) return NextResponse.json({ error: "Portfolio tidak ditemukan" }, { status: 404 });

    const last = await db.portfolioImage.findFirst({
      where: { portfolioId: id },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const created = await db.portfolioImage.create({
      data: {
        url,
        caption,
        order: (last?.order ?? -1) + 1,
        portfolioId: id,
      },
    });

    await db.activityLog.create({
      data: {
        action: "CREATE",
        entity: "PortfolioImage",
        entityId: created.id,
        userId: session.id,
        detail: `Added gallery image to portfolio "${portfolio.title}"`,
      },
    });

    revalidatePublicPages();
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error("Gallery add error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const session = auth.session!;

  const { id } = await params;
  try {
    const body = await req.json();
    const images = Array.isArray(body.images) ? body.images : null;
    if (!images || images.length === 0)
      return NextResponse.json({ error: "Daftar gambar kosong / tidak valid" }, { status: 400 });

    // Validasi: setiap item harus punya id milik portfolio ini
    const ids = images.map((im: any) => String(im.id || ""));
    const owned = await db.portfolioImage.findMany({
      where: { portfolioId: id, id: { in: ids } },
      select: { id: true },
    });
    const ownedSet = new Set(owned.map((o) => o.id));
    const valid = images.every((im: any) => ownedSet.has(String(im.id)));
    if (!valid)
      return NextResponse.json(
        { error: "Terdapat gambar yang tidak milik portfolio ini" },
        { status: 400 }
      );

    // Update per item: caption dan/atau order.
    // Jika `renumber: true`, order otomatis mengikuti posisi di array (untuk swap urutan).
    const ops: Promise<any>[] = [];
    images.forEach((im: any, idx: number) => {
      const data: any = {};
      if (typeof im.caption === "string") data.caption = im.caption.trim() || null;
      if (typeof im.order === "number") data.order = im.order;
      else if (body.renumber) data.order = idx;
      if (Object.keys(data).length > 0) {
        ops.push(db.portfolioImage.update({ where: { id: String(im.id) }, data }));
      }
    });
    await Promise.all(ops);

    const updated = await db.portfolioImage.findMany({
      where: { portfolioId: id },
      orderBy: { order: "asc" },
    });

    await db.activityLog.create({
      data: {
        action: "UPDATE",
        entity: "PortfolioImage",
        entityId: id,
        userId: session.id,
        detail: `Updated gallery (${images.length} images) of portfolio id=${id}`,
      },
    });

    revalidatePublicPages();
    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("Gallery update error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const session = auth.session!;

  const { id } = await params;
  const imageId = req.nextUrl.searchParams.get("imageId");
  if (!imageId) return NextResponse.json({ error: "Parameter imageId wajib" }, { status: 400 });

  try {
    const img = await db.portfolioImage.findFirst({
      where: { id: imageId, portfolioId: id },
      include: { portfolio: { select: { title: true } } },
    });
    if (!img) return NextResponse.json({ error: "Gambar tidak ditemukan" }, { status: 404 });

    await db.portfolioImage.delete({ where: { id: imageId } });

    // Rapikan urutan ulang (0..n-1) setelah penghapusan
    const rest = await db.portfolioImage.findMany({
      where: { portfolioId: id },
      orderBy: { order: "asc" },
    });
    await Promise.all(
      rest.map((r, i) =>
        r.order === i
          ? Promise.resolve()
          : db.portfolioImage.update({ where: { id: r.id }, data: { order: i } })
      )
    );

    await db.activityLog.create({
      data: {
        action: "DELETE",
        entity: "PortfolioImage",
        entityId: imageId,
        userId: session.id,
        detail: `Deleted gallery image from portfolio "${img.portfolio.title}"`,
      },
    });

    revalidatePublicPages();
    return NextResponse.json({ ok: true, imageId });
  } catch (e: any) {
    console.error("Gallery delete error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
