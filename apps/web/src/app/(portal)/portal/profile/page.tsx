import { requireAuthContext } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProfileClient } from "@/components/portal/ProfileClient";
import type { StudentRecord } from "@campus/shared";

export default async function PortalProfilePage() {
  const auth = await requireAuthContext();
  const supabase = await createServerSupabaseClient();

  const { data: studentRec } = await supabase
    .from("student_records")
    .select("*")
    .eq("user_id", auth.userId)
    .maybeSingle();

  return (
    <ProfileClient
      profile={auth.profile}
      university={auth.university}
      effectiveRole={auth.effectiveRole}
      studentRecord={(studentRec as StudentRecord | null) ?? null}
    />
  );
}
