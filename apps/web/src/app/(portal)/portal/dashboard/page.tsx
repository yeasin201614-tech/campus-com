import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  GraduationCap,
  Megaphone,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import { requireAuthContext } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { formatEventDate, formatRelativeTime } from "@/lib/utils";
import { ROLE_LABELS } from "@campus/shared";

export default async function PortalDashboardPage() {
  const auth = await requireAuthContext();
  const supabase = await createServerSupabaseClient();
  const uniId = auth.profile.primary_university_id;

  const [eventsRes, postsRes, noticesRes, groupsRes] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, starts_at, location, category, registered_count")
      .order("starts_at", { ascending: true })
      .limit(3),
    supabase
      .from("campus_posts")
      .select("id, title, content, post_type, created_at, profiles(full_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("notices")
      .select("id, title, category, priority, published_at")
      .order("is_pinned", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(4),
    uniId
      ? supabase
          .from("community_groups")
          .select("id, name, category, members_count")
          .eq("university_id", uniId)
          .eq("is_active", true)
          .limit(3)
      : supabase
          .from("community_groups")
          .select("id, name, category, members_count")
          .eq("is_active", true)
          .limit(3),
  ]);

  const events = eventsRes.data ?? [];
  const posts = postsRes.data ?? [];
  const notices = noticesRes.data ?? [];
  const groups = groupsRes.data ?? [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Banner matching Mockup 1 Laptop Screen */}
      <div className="relative overflow-hidden rounded-3xl campus-gradient p-7 text-white shadow-campus-lg sm:p-9">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-white/15 text-white">
              <Sparkles className="h-3 w-3 text-teal" /> {auth.university?.name || "Campus.com Network"}
            </Badge>
            <Badge variant="teal">{ROLE_LABELS[auth.effectiveRole]}</Badge>
          </div>
          <h1 className="text-2xl font-extrabold sm:text-4xl">
            Welcome to Campus.com, {auth.profile.full_name.split(" ")[0]}!
          </h1>
          <p className="text-sm text-white/85 sm:text-base">
            Connect with your campus community, stay updated with verified notices, and grow together.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link href="/portal/community">
              <Button variant="teal" className="gap-2">
                Explore Now <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/portal/events">
              <Button variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white/20">
                Browse Events
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Quick Action Cards matching Mockup 1 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Events",
            desc: "Join campus events & QR passes",
            href: "/portal/events",
            icon: CalendarDays,
            bg: "bg-purple/10 text-purple",
          },
          {
            title: "Groups",
            desc: "Be part of clubs & societies",
            href: "/portal/groups",
            icon: Users,
            bg: "bg-blue-500/10 text-blue-600",
          },
          {
            title: "Marketplace",
            desc: "Buy & sell textbooks easily",
            href: "/portal/marketplace",
            icon: ShoppingBag,
            bg: "bg-teal/10 text-teal-600",
          },
          {
            title: "Notice Board",
            desc: "Get important campus updates",
            href: "/portal/notices",
            icon: Megaphone,
            bg: "bg-amber-500/10 text-amber-600",
          },
        ].map((tile) => {
          const Icon = tile.icon;
          return (
            <Link key={tile.title} href={tile.href}>
              <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-purple/40">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tile.bg}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy dark:text-white">{tile.title}</h3>
                    <p className="text-xs text-muted-foreground">{tile.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* 2-Column Main Workspace: Upcoming Events + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-6">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>Upcoming Events</CardTitle>
            <Link href="/portal/events" className="text-xs font-semibold text-purple hover:underline">
              See All →
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.length > 0 ? (
              events.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border p-4"
                >
                  <div>
                    <Badge variant="teal" className="mb-1">{ev.category}</Badge>
                    <p className="font-bold text-navy dark:text-white">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatEventDate(ev.starts_at)} • {ev.location}
                    </p>
                  </div>
                  <Link href="/portal/events">
                    <Button size="sm">Join Event</Button>
                  </Link>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No upcoming events scheduled yet.{" "}
                <Link href="/portal/events" className="font-semibold text-purple hover:underline">
                  Create or explore events →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-6">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>Recent Activity</CardTitle>
            <Link href="/portal/community" className="text-xs font-semibold text-purple hover:underline">
              See All →
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {posts.length > 0 ? (
              posts.map((p) => {
                const author = (p.profiles as { full_name?: string; avatar_url?: string } | null);
                return (
                  <div key={p.id} className="flex items-start gap-3 rounded-xl border border-border p-3.5">
                    <Avatar src={author?.avatar_url} name={author?.full_name || "Member"} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold truncate">{author?.full_name || "Campus Member"}</p>
                        <span className="text-[11px] text-muted-foreground">{formatRelativeTime(p.created_at)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{p.content}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Start the conversation!{" "}
                <Link href="/portal/community" className="font-semibold text-purple hover:underline">
                  Post to your campus feed →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Latest Notices & Recommended Groups */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>Latest Notices & Announcements</CardTitle>
            <Link href="/portal/notices" className="text-xs font-semibold text-purple hover:underline">
              Notice Board →
            </Link>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {notices.length > 0 ? (
              notices.map((n) => (
                <div key={n.id} className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold">{n.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {n.category} • {formatRelativeTime(n.published_at)}
                    </p>
                  </div>
                  <Badge variant={n.priority === "urgent" ? "destructive" : n.priority === "important" ? "warning" : "secondary"}>
                    {n.priority}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No announcements posted yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>Recommended Groups</CardTitle>
            <Link href="/portal/groups" className="text-xs font-semibold text-purple hover:underline">
              Explore Clubs →
            </Link>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {groups.length > 0 ? (
              groups.map((g) => (
                <Link
                  key={g.id}
                  href="/portal/groups"
                  className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple/10 text-purple">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{g.name}</p>
                      <p className="text-xs text-muted-foreground">{g.category}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{g.members_count} members</Badge>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No groups created yet — start one in Groups!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
