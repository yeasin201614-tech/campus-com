import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { slugify } from "@/lib/utils";

const createUniSchema = z.object({
  name: z.string().min(2).max(160),
  shortCode: z.string().min(2).max(16),
  city: z.string().optional(),
  country: z.string().optional(),
  domain: z.string().optional(),
  description: z.string().optional(),
  brandColor: z.string().default("#101B62"),
});

const patchUniSchema = z.object({
  universityId: z.string().uuid(),
  status: z.enum(["pending", "verified", "suspended", "rejected"]).optional(),
  isVerified: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireRole(["super_admin"]);
  const parsed = createUniSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid university payload" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("universities")
    .insert({
      name: parsed.data.name,
      slug: slugify(parsed.data.name),
      short_code: parsed.data.shortCode.toUpperCase(),
      city: parsed.data.city ?? null,
      country: parsed.data.country ?? null,
      domain: parsed.data.domain ?? null,
      description: parsed.data.description ?? "",
      brand_color: parsed.data.brandColor,
      status: "verified",
      is_verified: true,
      created_by: auth.userId,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await writeAuditLog({
    actorId: auth.userId,
    universityId: data.id,
    action: "super_admin.university.created",
    entityType: "universities",
    entityId: data.id,
    newValues: data,
  });

  return NextResponse.json({ university: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireRole(["super_admin"]);
  const parsed = patchUniSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update payload" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (parsed.data.status) {
    patch.status = parsed.data.status;
    patch.is_verified = parsed.data.status === "verified";
  }
  if (typeof parsed.data.isVerified === "boolean") patch.is_verified = parsed.data.isVerified;
  if (typeof parsed.data.isFeatured === "boolean") patch.is_featured = parsed.data.isFeatured;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("universities")
    .update(patch)
    .eq("id", parsed.data.universityId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await writeAuditLog({
    actorId: auth.userId,
    universityId: parsed.data.universityId,
    action: "super_admin.university.updated",
    entityType: "universities",
    entityId: parsed.data.universityId,
    newValues: patch,
  });

  return NextResponse.json({ university: data });
}
