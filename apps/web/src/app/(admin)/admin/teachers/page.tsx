import { requireRole } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminEntityDirectory } from "@/components/admin/AdminEntityDirectory";

export default async function AdminTeachersPage() {
  await requireRole(["super_admin"]);
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, is_verified, created_at, universities(name)")
    .eq("global_role", "teacher")
    .order("created_at", { ascending: false })
    .limit(150);

  const rows = (data ?? []).map((t) => ({
    id: t.id,
    full_name: t.full_name,
    email: t.email,
    university: (t.universities as { name?: string } | null)?.name ?? "Unassigned",
    verified: t.is_verified ? "verified" : "pending",
    created_at: t.created_at,
  }));

  return (
    <AdminEntityDirectory
      title="Teachers & Faculty Directory"
      subtitle="All faculty and instructors across Campus.com institutions."
      columns={[
        { key: "full_name", label: "Faculty Name" },
        { key: "email", label: "Email" },
        { key: "university", label: "University" },
        { key: "verified", label: "Verification", kind: "badge" },
        { key: "created_at", label: "Joined", kind: "date" },
      ]}
      rows={rows}
    />
  );
}
