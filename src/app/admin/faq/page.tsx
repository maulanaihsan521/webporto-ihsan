import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { FaqManager } from "./faq-manager";

export default async function AdminFaqPage() {
  await requireAdminSession();

  const faqs = await db.faq.findMany({
    orderBy: { order: "asc" },
  });

  const data = faqs.map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
    category: f.category,
    order: f.order,
    published: f.published,
  }));

  return <FaqManager data={data} />;
}
