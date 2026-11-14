import { requireRole } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminEntityDirectory } from "@/components/admin/AdminEntityDirectory";

export default async function AdminDepartmentsPage() {
  await requireRole(["super_admin"]);
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("departments")
    .select("id, name, code, building, is_active, created_at, universities(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    code: d.code,
    university: (d.universities as { name?: string } | null)?.name ?? "—",
    building: d.building ?? "Main Campus",
    status: d.is_active ? "active" : "inactive",
  }));

  return (
    <AdminEntityDirectory
      title="Departments Directory"
      subtitle="All academic departments registered across partner universities."
      columns={[
        { key: "name", label: "Department" },
        { key: "code", label: "Code", kind: "badge" },
        { key: "university", label: "University" },
        { key: "building", label: "Building" },
        { key: "status", label: "Status", kind: "badge" },
      ]}
      rows={rows}
    />
  );
}
