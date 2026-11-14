import { requireRole } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminUsersClient } from "@/components/admin/AdminUsersClient";
import type { Profile } from "@campus/shared";

export default async function AdminUsersPage() {
  await requireRole(["super_admin"]);
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(200);
  return <AdminUsersClient initialUsers={(data as Profile[]) ?? []} />;
}
