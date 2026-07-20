import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { ServicesManager } from "./services-manager";

export default async function AdminServicesPage() {
  await requireAdminSession();

  const services = await db.service.findMany({
    orderBy: { order: "asc" },
  });

  const data = services.map((s) => ({
    id: s.id,
    title: s.title,
    slug: s.slug,
    description: s.description,
    icon: s.icon,
    color: s.color,
    features: s.features,
    order: s.order,
  }));

  return <ServicesManager data={data} />;
}
