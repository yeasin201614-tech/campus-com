import { requireAuthContext } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NotificationsClient } from "@/components/portal/NotificationsClient";

export default async function PortalNotificationsPage() {
  const auth = await requireAuthContext();
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, body, is_read, created_at")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false })
    .limit(50);

  return <NotificationsClient userId={auth.userId} initialNotifications={data ?? []} />;
}
