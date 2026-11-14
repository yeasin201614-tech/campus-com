// Supabase Edge Function: global-search
// Performs RLS-enforced multi-entity discovery across Universities, Students,
// Teachers, Departments, Events, Groups, and Community Posts.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 8), 1), 25);

    if (q.length < 2) {
      return new Response(
        JSON.stringify({ universities: [], students: [], teachers: [], departments: [], events: [], groups: [], posts: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      authHeader ? { global: { headers: { Authorization: authHeader } } } : undefined
    );

    const pattern = `%${q}%`;

    const [universities, departments, events, groups, posts, students, teachers] = await Promise.all([
      supabase.from("universities").select("id, name, slug, city, country, logo_url, is_verified").ilike("name", pattern).limit(limit),
      supabase.from("departments").select("id, name, code, university_id").ilike("name", pattern).limit(limit),
      supabase.from("events").select("id, title, starts_at, location, category, university_id").ilike("title", pattern).limit(limit),
      supabase.from("community_groups").select("id, name, category, members_count, university_id").ilike("name", pattern).limit(limit),
      supabase.from("campus_posts").select("id, title, content, post_type, created_at").or(`title.ilike.${pattern},content.ilike.${pattern}`).limit(limit),
      supabase.from("profiles").select("id, full_name, avatar_url, primary_university_id").eq("global_role", "student").ilike("full_name", pattern).limit(limit),
      supabase.from("profiles").select("id, full_name, avatar_url, primary_university_id").eq("global_role", "teacher").ilike("full_name", pattern).limit(limit),
    ]);

    return new Response(
      JSON.stringify({
        universities: universities.data ?? [],
        departments: departments.data ?? [],
        events: events.data ?? [],
        groups: groups.data ?? [],
        posts: posts.data ?? [],
        students: students.data ?? [],
        teachers: teachers.data ?? [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
