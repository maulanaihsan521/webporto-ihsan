import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { MediaManager } from "./media-manager";

export default async function AdminMediaPage() {
  await requireAdminSession();

  const media = await db.media.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const data = media.map((m) => ({
    id: m.id,
    name: m.name,
    url: m.url,
    type: m.type,
    mimeType: m.mimeType,
    size: m.size,
    folder: m.folder,
    width: m.width,
    height: m.height,
    alt: m.alt,
    createdAt: m.createdAt.toISOString(),
  }));

  return <MediaManager data={data} />;
}
