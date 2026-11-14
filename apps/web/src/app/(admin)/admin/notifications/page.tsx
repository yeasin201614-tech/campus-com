import { requireRole } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminNotificationsClient } from "@/components/admin/AdminNotificationsClient";

export default async function AdminNotificationsPage() {
  await requireRole(["super_admin"]);
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("profiles").select("id").eq("is_active", true).limit(500);
  return <AdminNotificationsClient userIds={(data ?? []).map((u) => u.id)} />;
}
