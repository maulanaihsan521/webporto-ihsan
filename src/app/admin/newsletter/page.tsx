import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { NewsletterManager } from "./newsletter-manager";

export default async function AdminNewsletterPage() {
  await requireAdminSession();
  const subscribers = await db.newsletter.findMany({ orderBy: { createdAt: "desc" } });
  const data = subscribers.map((s) => ({
    id: s.id,
    email: s.email,
    active: s.active,
    createdAt: s.createdAt.toISOString(),
  }));
  return <NewsletterManager data={data} />;
}
