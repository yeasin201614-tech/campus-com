import { requireRole } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminEntityDirectory } from "@/components/admin/AdminEntityDirectory";

export default async function AdminCommunitiesPage() {
  await requireRole(["super_admin"]);
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("community_groups")
    .select("id, name, category, members_count, is_private, is_active, created_at")
    .order("members_count", { ascending: false })
    .limit(100);

  const rows = (data ?? []).map((g) => ({
    ...g,
    privacy: g.is_private ? "private" : "public",
    status: g.is_active ? "active" : "archived",
  }));

  return (
    <AdminEntityDirectory
      title="Communities & Clubs"
      subtitle="Manage student societies, academic clubs, and discussion groups."
      columns={[
        { key: "name", label: "Group Name" },
        { key: "category", label: "Category", kind: "badge" },
        { key: "members_count", label: "Members" },
        { key: "privacy", label: "Visibility", kind: "badge" },
        { key: "status", label: "Status", kind: "badge" },
      ]}
      rows={rows}
    />
  );
}
