import { requireAuthContext } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NoticesClient, type NoticeRow } from "@/components/portal/NoticesClient";

export default async function PortalNoticesPage() {
  const auth = await requireAuthContext();
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("notices")
    .select("*, profiles(full_name)")
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(50);

  const rows: NoticeRow[] = (data ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    category: n.category,
    priority: n.priority,
    is_pinned: n.is_pinned,
    is_global: n.is_global,
    published_at: n.published_at,
    author_name: (n.profiles as { full_name?: string } | null)?.full_name ?? "University Administration",
  }));

  return (
    <NoticesClient
      userId={auth.userId}
      universityId={auth.profile.primary_university_id}
      userRole={auth.effectiveRole}
      initialNotices={rows}
    />
  );
}
