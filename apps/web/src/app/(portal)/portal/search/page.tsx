import Link from "next/link";
import { Building2, CalendarDays, FolderTree, GraduationCap, MessageSquare, Search, Users } from "lucide-react";
import { requireAuthContext } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function GlobalSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAuthContext();
  const { q = "" } = await searchParams;
  const query = q.trim();
  const supabase = await createServerSupabaseClient();

  let results = {
    universities: [] as Array<Record<string, unknown>>,
    students: [] as Array<Record<string, unknown>>,
    teachers: [] as Array<Record<string, unknown>>,
    departments: [] as Array<Record<string, unknown>>,
    events: [] as Array<Record<string, unknown>>,
    groups: [] as Array<Record<string, unknown>>,
    posts: [] as Array<Record<string, unknown>>,
  };

  if (query.length >= 2) {
    const pattern = `%${query}%`;
    const [u, s, t, d, e, g, p] = await Promise.all([
      supabase.from("universities").select("id, name, slug, city, country").ilike("name", pattern).limit(10),
      supabase.from("profiles").select("id, full_name, email").eq("global_role", "student").ilike("full_name", pattern).limit(10),
      supabase.from("profiles").select("id, full_name, email").eq("global_role", "teacher").ilike("full_name", pattern).limit(10),
      supabase.from("departments").select("id, name, code").ilike("name", pattern).limit(10),
      supabase.from("events").select("id, title, location, starts_at").ilike("title", pattern).limit(10),
      supabase.from("community_groups").select("id, name, category, members_count").ilike("name", pattern).limit(10),
      supabase.from("campus_posts").select("id, title, content, post_type").or(`title.ilike.${pattern},content.ilike.${pattern}`).limit(10),
    ]);
    results = {
      universities: u.data ?? [],
      students: s.data ?? [],
      teachers: t.data ?? [],
      departments: d.data ?? [],
      events: e.data ?? [],
      groups: g.data ?? [],
      posts: p.data ?? [],
    };
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-navy dark:text-white">Global Campus Search</h1>
        <p className="text-sm text-muted-foreground">
          Discover Universities, Students, Teachers, Departments, Events, Groups, and Community Discussions.
        </p>
        <form className="flex max-w-xl gap-2 pt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input name="q" defaultValue={query} placeholder="Search at least 2 characters..." className="pl-10" />
          </div>
          <Button type="submit">Search</Button>
        </form>
      </div>

      {query.length >= 2 && (
        <div className="grid gap-5 md:grid-cols-2">
          {[
            { title: "Universities", icon: Building2, rows: results.universities, href: "/universities", field: "name" },
            { title: "Students", icon: GraduationCap, rows: results.students, href: "/portal/messages", field: "full_name" },
            { title: "Teachers / Faculty", icon: Users, rows: results.teachers, href: "/portal/messages", field: "full_name" },
            { title: "Departments", icon: FolderTree, rows: results.departments, href: "/portal/department", field: "name" },
            { title: "Events", icon: CalendarDays, rows: results.events, href: "/portal/events", field: "title" },
            { title: "Groups & Clubs", icon: Users, rows: results.groups, href: "/portal/groups", field: "name" },
            { title: "Community Posts", icon: MessageSquare, rows: results.posts, href: "/portal/community", field: "content" },
          ].map((sec) => {
            const Icon = sec.icon;
            return (
              <Card key={sec.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-4 w-4 text-purple" /> {sec.title}
                  </CardTitle>
                  <Badge variant="secondary">{sec.rows.length}</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sec.rows.length > 0 ? (
                    sec.rows.map((r) => (
                      <Link
                        key={String(r.id)}
                        href={sec.href}
                        className="block rounded-xl border border-border p-3 text-sm hover:bg-muted/40"
                      >
                        <p className="font-semibold line-clamp-1">{String(r[sec.field] ?? r.title ?? r.name ?? "")}</p>
                      </Link>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No matches found.</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
