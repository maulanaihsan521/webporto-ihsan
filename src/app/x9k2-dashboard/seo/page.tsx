import { getSettings } from "@/lib/settings";
import { requireAdminSession } from "@/lib/admin-guard";
import { SeoManager } from "./seo-manager";

export default async function AdminSeoPage() {
  await requireAdminSession();

  const settings = await getSettings();

  return <SeoManager settings={settings} />;
}
