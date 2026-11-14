import { requireRole } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminEntityDirectory } from "@/components/admin/AdminEntityDirectory";

export default async function AdminStudentsPage() {
  await requireRole(["super_admin"]);
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, is_verified, is_active, created_at, universities(name)")
    .eq("global_role", "student")
    .order("created_at", { ascending: false })
    .limit(150);

  const rows = (data ?? []).map((s) => ({
    id: s.id,
    full_name: s.full_name,
    email: s.email,
    university: (s.universities as { name?: string } | null)?.name ?? "Unassigned",
    verified: s.is_verified ? "verified" : "pending",
    created_at: s.created_at,
  }));

  return (
    <AdminEntityDirectory
      title="Students Directory"
      subtitle="Monitor student onboarding and institutional verification across all universities."
      columns={[
        { key: "full_name", label: "Student Name" },
        { key: "email", label: "Email" },
        { key: "university", label: "University" },
        { key: "verified", label: "Verification", kind: "badge" },
        { key: "created_at", label: "Joined", kind: "date" },
      ]}
      rows={rows}
    />
  );
}
