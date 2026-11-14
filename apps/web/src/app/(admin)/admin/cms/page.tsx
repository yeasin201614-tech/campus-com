import { requireRole } from "@/lib/auth";
import { getPlatformCmsConfig } from "@/lib/cms";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminCmsClient } from "@/components/admin/AdminCmsClient";
import type { WebsitePage } from "@campus/shared";

export default async function AdminCmsPage() {
  await requireRole(["super_admin"]);
  const [cms, supabase] = await Promise.all([getPlatformCmsConfig(), createServerSupabaseClient()]);
  const { data: pages } = await supabase.from("website_pages").select("*").order("nav_order");

  return (
    <AdminCmsClient
      initialPages={(pages as WebsitePage[]) ?? []}
      initialSeo={cms.seo}
    />
  );
}
