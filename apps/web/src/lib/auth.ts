import "server-only";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { Profile, University, UniversityMember, UserRole } from "@campus/shared";

export interface AuthContext {
  userId: string;
  email: string;
  profile: Profile;
  university: University | null;
  membership: UniversityMember | null;
  effectiveRole: UserRole;
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const { isConfigured } = getSupabasePublicConfig();
  if (!isConfigured) return null;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  const typedProfile = profile as Profile;
  let university: University | null = null;
  let membership: UniversityMember | null = null;

  if (typedProfile.primary_university_id) {
    const [uniRes, memRes] = await Promise.all([
      supabase.from("universities").select("*").eq("id", typedProfile.primary_university_id).maybeSingle(),
      supabase
        .from("university_members")
        .select("*")
        .eq("university_id", typedProfile.primary_university_id)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    university = (uniRes.data as University | null) ?? null;
    membership = (memRes.data as UniversityMember | null) ?? null;
  }

  const effectiveRole: UserRole =
    typedProfile.global_role === "super_admin"
      ? "super_admin"
      : (membership?.role ?? typedProfile.global_role);

  return {
    userId: user.id,
    email: user.email ?? typedProfile.email,
    profile: typedProfile,
    university,
    membership,
    effectiveRole,
  };
}

export async function requireAuthContext(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login");
  }
  return ctx;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<AuthContext> {
  const ctx = await requireAuthContext();
  if (!allowedRoles.includes(ctx.effectiveRole)) {
    redirect("/portal/dashboard");
  }
  return ctx;
}
