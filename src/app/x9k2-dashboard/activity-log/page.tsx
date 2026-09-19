import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { ActivityLogManager } from "./activity-log-manager";

export default async function AdminActivityLogPage() {
  await requireAdminSession();

  const logs = await db.activityLog.findMany({
    take: 200,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, image: true } } },
  });

  const data = logs.map((l) => ({
    id: l.id,
    action: l.action,
    entity: l.entity,
    detail: l.detail,
    user: l.user ? { name: l.user.name } : null,
    createdAt: l.createdAt.toISOString(),
  }));

  return <ActivityLogManager data={data} />;
}
