import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";

const settingSchema = z.object({
  kind: z.literal("setting"),
  settingKey: z.string().min(2),
  settingValue: z.record(z.unknown()),
});

const pageSchema = z.object({
  kind: z.literal("page"),
  slug: z.string().min(1),
  title: z.string().min(1),
  heroTitle: z.string().optional(),
  heroDescription: z.string().optional(),
  heroCtaText: z.string().optional(),
  heroCtaUrl: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  isPublished: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireRole(["super_admin"]);
  const body = await request.json().catch(() => ({}));
  const supabase = await createServerSupabaseClient();

  if (body.kind === "setting") {
    const parsed = settingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid setting payload" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("platform_settings")
      .upsert(
        {
          setting_key: parsed.data.settingKey,
          setting_value: parsed.data.settingValue,
          updated_by: auth.userId,
        },
        { onConflict: "setting_key" }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    await writeAuditLog({
      actorId: auth.userId,
      action: "super_admin.cms.setting_updated",
      entityType: "platform_settings",
      entityId: parsed.data.settingKey,
      newValues: parsed.data.settingValue,
    });

    return NextResponse.json({ setting: data });
  }

  const parsedPage = pageSchema.safeParse(body);
  if (!parsedPage.success) {
    return NextResponse.json({ error: "Invalid CMS page payload" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("website_pages")
    .upsert(
      {
        slug: parsedPage.data.slug,
        title: parsedPage.data.title,
        hero_title: parsedPage.data.heroTitle ?? "",
        hero_description: parsedPage.data.heroDescription ?? "",
        hero_cta_text: parsedPage.data.heroCtaText ?? "Join Campus.com",
        hero_cta_url: parsedPage.data.heroCtaUrl ?? "/register",
        seo_title: parsedPage.data.seoTitle ?? parsedPage.data.title,
        seo_description: parsedPage.data.seoDescription ?? "",
        is_published: parsedPage.data.isPublished ?? true,
        updated_by: auth.userId,
      },
      { onConflict: "slug" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await writeAuditLog({
    actorId: auth.userId,
    action: "super_admin.cms.page_updated",
    entityType: "website_pages",
    entityId: parsedPage.data.slug,
  });

  return NextResponse.json({ page: data });
}
