import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { EducationManager } from "./education-manager";

export default async function AdminEducationPage() {
  await requireAdminSession();

  const educations = await db.education.findMany({
    orderBy: { order: "asc" },
  });

  const data = educations.map((e) => ({
    id: e.id,
    institution: e.institution,
    logo: e.logo,
    degree: e.degree,
    field: e.field,
    grade: e.grade,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate ? e.endDate.toISOString() : null,
    current: e.current,
    description: e.description,
    achievements: e.achievements,
    organization: e.organization,
    order: e.order,
  }));

  return <EducationManager data={data} />;
}
