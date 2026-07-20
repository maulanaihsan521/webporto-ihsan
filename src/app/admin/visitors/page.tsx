import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { VisitorsManager } from "./visitors-manager";

export default async function AdminVisitorsPage() {
  await requireAdminSession();

  const visitors = await db.visitor.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const data = visitors.map((v) => ({
    id: v.id,
    path: v.path,
    referrer: v.referrer,
    device: v.device,
    browser: v.browser,
    createdAt: v.createdAt.toISOString(),
  }));

  return <VisitorsManager data={data} />;
}
