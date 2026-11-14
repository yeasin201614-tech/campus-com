import { requireRole } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminUniversitiesClient } from "@/components/admin/AdminUniversitiesClient";
import type { University } from "@campus/shared";

export default async function AdminUniversitiesPage() {
  await requireRole(["super_admin"]);
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("universities").select("*").order("created_at", { ascending: false });
  return <AdminUniversitiesClient initialUniversities={(data as University[]) ?? []} />;
}
