import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { SkillsManager } from "./skills-manager";

export default async function AdminSkillsPage() {
  await requireAdminSession();

  const skills = await db.skill.findMany({
    orderBy: { order: "asc" },
  });

  const data = skills.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    category: s.category,
    percentage: s.percentage,
    level: s.level,
    icon: s.icon,
    description: s.description,
    color: s.color,
    featured: s.featured,
    order: s.order,
  }));

  return <SkillsManager data={data} />;
}
