import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { ExperienceManager } from "./experience-manager";

export default async function AdminExperiencePage() {
  await requireAdminSession();

  const experiences = await db.experience.findMany({
    orderBy: { order: "asc" },
  });

  const data = experiences.map((e) => ({
    id: e.id,
    company: e.company,
    logo: e.logo,
    position: e.position,
    location: e.location,
    type: e.type,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate ? e.endDate.toISOString() : null,
    current: e.current,
    description: e.description,
    technologies: e.technologies,
    order: e.order,
  }));

  return <ExperienceManager data={data} />;
}
