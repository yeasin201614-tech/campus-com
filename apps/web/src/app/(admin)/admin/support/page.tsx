import { requireRole } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminSupportClient } from "@/components/admin/AdminSupportClient";

export default async function AdminSupportPage() {
  await requireRole(["super_admin"]);
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("support_tickets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return <AdminSupportClient initialTickets={data ?? []} />;
}
