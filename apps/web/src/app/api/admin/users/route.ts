import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";

const patchSchema = z.object({
  userId: z.string().uuid(),
  globalRole: z.enum(["super_admin", "university_admin", "department_admin", "teacher", "student", "club_moderator"]).optional(),
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const auth = await requireRole(["super_admin"]);
  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid user update payload" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const patch: Record<string, unknown> = {};
  if (parsed.data.globalRole) patch.global_role = parsed.data.globalRole;
  if (typeof parsed.data.isVerified === "boolean") patch.is_verified = parsed.data.isVerified;
  if (typeof parsed.data.isActive === "boolean") patch.is_active = parsed.data.isActive;

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", parsed.data.userId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await writeAuditLog({
    actorId: auth.userId,
    action: "super_admin.user.updated",
    entityType: "profiles",
    entityId: parsed.data.userId,
    newValues: patch,
  });

  return NextResponse.json({ user: data });
}
