import { requireRole } from "@/lib/auth";
import { getPlatformCmsConfig } from "@/lib/cms";
import { AdminSettingsClient } from "@/components/admin/AdminSettingsClient";

export default async function AdminSettingsPage() {
  await requireRole(["super_admin"]);
  const cms = await getPlatformCmsConfig();
  return <AdminSettingsClient cms={cms} />;
}
