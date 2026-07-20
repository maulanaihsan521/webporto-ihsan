import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { TestimonialsManager } from "./testimonials-manager";

export default async function AdminTestimonialsPage() {
  await requireAdminSession();

  const testimonials = await db.testimonial.findMany({
    orderBy: { order: "asc" },
  });

  const data = testimonials.map((t) => ({
    id: t.id,
    name: t.name,
    position: t.position,
    company: t.company,
    avatar: t.avatar,
    rating: t.rating,
    content: t.content,
    featured: t.featured,
    order: t.order,
  }));

  return <TestimonialsManager data={data} />;
}
