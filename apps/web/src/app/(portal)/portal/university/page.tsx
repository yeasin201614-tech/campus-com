import { requireRole } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { UniversityAdminClient } from "@/components/portal/UniversityAdminClient";
import type { AcademicProgram, Department } from "@campus/shared";

export default async function PortalUniversityPage() {
  const auth = await requireRole(["university_admin", "super_admin"]);
  const supabase = await createServerSupabaseClient();
  const uniId = auth.profile.primary_university_id;

  if (!uniId) {
    return (
      <UniversityAdminClient
        university={null}
        initialDepartments={[]}
        initialPrograms={[]}
        initialMembers={[]}
      />
    );
  }

  const [deptRes, progRes, memRes] = await Promise.all([
    supabase.from("departments").select("*").eq("university_id", uniId).order("name"),
    supabase.from("academic_programs").select("*").eq("university_id", uniId).order("name"),
    supabase
      .from("university_members")
      .select("id, user_id, role, status, profiles(full_name, email)")
      .eq("university_id", uniId)
      .order("created_at", { ascending: false }),
  ]);

  const members = (memRes.data ?? []).map((m) => {
    const prof = m.profiles as { full_name?: string; email?: string } | null;
    return {
      id: m.id,
      user_id: m.user_id,
      role: m.role,
      status: m.status,
      full_name: prof?.full_name ?? "Member",
      email: prof?.email ?? "",
    };
  });

  return (
    <UniversityAdminClient
      university={auth.university}
      initialDepartments={(deptRes.data as Department[]) ?? []}
      initialPrograms={(progRes.data as AcademicProgram[]) ?? []}
      initialMembers={members}
    />
  );
}
