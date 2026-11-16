import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { writeAuditLog } from "@/lib/audit";

const createStudentSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  universityId: z.string().uuid(),
  studentIdNumber: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireRole(["super_admin"]);
  const body = await request.json().catch(() => ({}));
  const parsed = createStudentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid student payload" }, { status: 400 });
  }

  const { url, anonKey } = getSupabasePublicConfig();
  // Use isolated client so admin session cookies are NOT overwritten by signUp
  const isolatedAuthClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await isolatedAuthClient.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        requested_role: "student",
        university_id: parsed.data.universityId,
        student_id_number: parsed.data.studentIdNumber || "",
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (data.user) {
    const supabase = await createServerSupabaseClient();

    // Update profile with student role & verification
    await supabase
      .from("profiles")
      .update({
        full_name: parsed.data.fullName,
        global_role: "student",
        is_verified: true,
        primary_university_id: parsed.data.universityId,
      })
      .eq("id", data.user.id);

    if (parsed.data.studentIdNumber) {
      await supabase.from("student_records").insert({
        university_id: parsed.data.universityId,
        user_id: data.user.id,
        student_id_number: parsed.data.studentIdNumber,
        verification_status: "verified",
      });
    }

    await writeAuditLog({
      actorId: auth.userId,
      action: "super_admin.student.created",
      entityType: "profiles",
      entityId: data.user.id,
      newValues: { email: parsed.data.email, fullName: parsed.data.fullName },
    });
  }

  return NextResponse.json({ success: true, user: data.user });
}
