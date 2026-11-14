import { requireRole } from "@/lib/auth";
import { getPlatformCmsConfig } from "@/lib/cms";
import { AdminFeaturesClient } from "@/components/admin/AdminFeaturesClient";

export default async function AdminFeaturesPage() {
  await requireRole(["super_admin"]);
  const cms = await getPlatformCmsConfig();
  return <AdminFeaturesClient initialFlags={cms.feature_flags} />;
}
