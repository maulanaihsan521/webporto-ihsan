import { getSettings } from "@/lib/settings";
import { requireAdminSession } from "@/lib/admin-guard";
import { SettingsManager } from "./settings-manager";

export default async function AdminSettingsPage() {
  await requireAdminSession();

  const settings = await getSettings();

  return <SettingsManager settings={settings} />;
}
