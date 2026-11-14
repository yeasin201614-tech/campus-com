import { requireAuthContext } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { GroupsClient, type GroupRow } from "@/components/portal/GroupsClient";

export default async function PortalGroupsPage() {
  const auth = await requireAuthContext();
  const supabase = await createServerSupabaseClient();

  const [{ data: groups }, { data: myMemberships }] = await Promise.all([
    supabase.from("community_groups").select("*").eq("is_active", true).order("members_count", { ascending: false }),
    supabase.from("group_members").select("group_id, status, role").eq("user_id", auth.userId),
  ]);

  const memMap = new Map((myMemberships ?? []).map((m) => [m.group_id, m]));
  const rows: GroupRow[] = (groups ?? []).map((g) => {
    const m = memMap.get(g.id);
    return {
      id: g.id,
      name: g.name,
      description: g.description ?? "",
      category: g.category,
      is_private: g.is_private,
      requires_approval: g.requires_approval,
      members_count: g.members_count,
      my_status: (m?.status as "approved" | "pending") ?? null,
      my_role: m?.role ?? null,
    };
  });

  return (
    <GroupsClient
      userId={auth.userId}
      universityId={auth.profile.primary_university_id}
      initialGroups={rows}
    />
  );
}
