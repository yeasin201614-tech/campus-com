import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const rate = checkRateLimit(`search:${ip}`, 45, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 10), 1), 25);

  if (q.length < 2) {
    return NextResponse.json({
      universities: [],
      students: [],
      teachers: [],
      departments: [],
      events: [],
      groups: [],
      posts: [],
    });
  }

  const { isConfigured } = getSupabasePublicConfig();
  if (!isConfigured) {
    return NextResponse.json({
      universities: [],
      students: [],
      teachers: [],
      departments: [],
      events: [],
      groups: [],
      posts: [],
    });
  }

  const supabase = await createServerSupabaseClient();
  const pattern = `%${q}%`;

  const [universities, departments, events, groups, posts, students, teachers] = await Promise.all([
    supabase.from("universities").select("id, name, slug, short_code, city, country").ilike("name", pattern).limit(limit),
    supabase.from("departments").select("id, name, code, university_id").ilike("name", pattern).limit(limit),
    supabase.from("events").select("id, title, starts_at, location, category").ilike("title", pattern).limit(limit),
    supabase.from("community_groups").select("id, name, category, members_count").ilike("name", pattern).limit(limit),
    supabase.from("campus_posts").select("id, title, content, post_type, created_at").or(`title.ilike.${pattern},content.ilike.${pattern}`).limit(limit),
    supabase.from("profiles").select("id, full_name, avatar_url, primary_university_id").eq("global_role", "student").ilike("full_name", pattern).limit(limit),
    supabase.from("profiles").select("id, full_name, avatar_url, primary_university_id").eq("global_role", "teacher").ilike("full_name", pattern).limit(limit),
  ]);

  return NextResponse.json({
    universities: universities.data ?? [],
    departments: departments.data ?? [],
    events: events.data ?? [],
    groups: groups.data ?? [],
    posts: posts.data ?? [],
    students: students.data ?? [],
    teachers: teachers.data ?? [],
  });
}
