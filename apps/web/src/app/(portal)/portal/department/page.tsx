import { requireRole } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DepartmentClient } from "@/components/portal/DepartmentClient";
import type { Department } from "@campus/shared";

export default async function PortalDepartmentPage() {
  const auth = await requireRole(["teacher", "department_admin", "university_admin", "super_admin"]);
  const supabase = await createServerSupabaseClient();
  const uniId = auth.profile.primary_university_id;

  if (!uniId) {
    return (
      <DepartmentClient
        userId={auth.userId}
        universityId={null}
        departments={[]}
        initialResources={[]}
        studentsCount={0}
        facultyCount={0}
      />
    );
  }

  const [deptRes, resPosts, stuCount, facCount] = await Promise.all([
    supabase.from("departments").select("*").eq("university_id", uniId).order("name"),
    supabase
      .from("campus_posts")
      .select("id, title, content, resource_url, created_at")
      .eq("university_id", uniId)
      .eq("post_type", "resource")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("student_records").select("*", { count: "exact", head: true }).eq("university_id", uniId),
    supabase.from("faculty_records").select("*", { count: "exact", head: true }).eq("university_id", uniId),
  ]);

  return (
    <DepartmentClient
      userId={auth.userId}
      universityId={uniId}
      departments={(deptRes.data as Department[]) ?? []}
      initialResources={resPosts.data ?? []}
      studentsCount={stuCount.count ?? 0}
      facultyCount={facCount.count ?? 0}
    />
  );
}
