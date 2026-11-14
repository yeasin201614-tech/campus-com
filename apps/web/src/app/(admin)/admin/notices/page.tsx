import { requireRole } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminEntityDirectory } from "@/components/admin/AdminEntityDirectory";

export default async function AdminNoticesPage() {
  await requireRole(["super_admin"]);
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("notices")
    .select("id, title, category, priority, is_global, published_at")
    .order("published_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []).map((n) => ({
    ...n,
    scope: n.is_global ? "Global" : "University",
  }));

  return (
    <AdminEntityDirectory
      title="Global & Campus Notice Board"
      subtitle="Audit published university and global announcements across Campus.com."
      columns={[
        { key: "title", label: "Notice Headline" },
        { key: "category", label: "Category", kind: "badge" },
        { key: "priority", label: "Priority", kind: "badge" },
        { key: "scope", label: "Scope", kind: "badge" },
        { key: "published_at", label: "Published", kind: "date" },
      ]}
      rows={rows}
    />
  );
}
