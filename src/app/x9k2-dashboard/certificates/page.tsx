import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { CertificateManager } from "./certificates-manager";

export default async function AdminCertificatesPage() {
  await requireAdminSession();

  const [certs, categories] = await Promise.all([
    db.certificate.findMany({
      include: { category: true },
      orderBy: { issueDate: "desc" },
    }),
    db.category.findMany({
      where: { type: "CERTIFICATE" },
      orderBy: { name: "asc" },
    }),
  ]);

  const data = certs.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    description: c.description,
    issuer: c.issuer,
    issueDate: c.issueDate.toISOString(),
    expiryDate: c.expiryDate ? c.expiryDate.toISOString() : null,
    credentialId: c.credentialId,
    credentialUrl: c.credentialUrl,
    fileUrl: c.fileUrl,
    imageUrl: c.imageUrl,
    featured: c.featured,
    category: c.category ? { id: c.category.id, name: c.category.name } : null,
  }));

  const cats = categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));

  return <CertificateManager data={data} categories={cats} />;
}
