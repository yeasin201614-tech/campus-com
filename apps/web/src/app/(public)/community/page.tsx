import Link from "next/link";
import { ArrowRight, Heart, MessageCircle, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { formatRelativeTime } from "@/lib/utils";

export default async function PublicCommunityPage() {
  const { isConfigured } = getSupabasePublicConfig();
  let posts: Array<Record<string, unknown>> = [];

  if (isConfigured) {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("campus_posts")
      .select("id, title, content, post_type, likes_count, comments_count, created_at, profiles(full_name)")
      .eq("visibility", "public")
      .eq("moderation_status", "approved")
      .order("created_at", { ascending: false })
      .limit(9);
    posts = data ?? [];
  }

  const fallback = [
    {
      id: "1",
      title: "Open-Source Campus Hackathon 2026 Teams Forming!",
      content: "Looking for UI/UX designers and Supabase engineers for our Smart Accessibility Campus Navigator build.",
      post_type: "discussion",
      likes_count: 42,
      comments_count: 11,
      created_at: new Date(Date.now() - 15 * 60000).toISOString(),
      author: "Rifat Ahmed",
    },
    {
      id: "2",
      title: "Spring Semester Study Notes: Distributed Systems",
      content: "Uploaded clean diagrams covering Raft consensus, vector clocks, and PostgreSQL MVCC internals.",
      post_type: "resource",
      likes_count: 68,
      comments_count: 19,
      created_at: new Date(Date.now() - 90 * 60000).toISOString(),
      author: "Prof. Nadia Lin",
    },
    {
      id: "3",
      title: "Robotics Society Weekly Lab Session",
      content: "New LiDAR & ROS2 kits arrived! Join us Friday 4 PM in Engineering Lab B.",
      post_type: "announcement",
      likes_count: 31,
      comments_count: 7,
      created_at: new Date(Date.now() - 240 * 60000).toISOString(),
      author: "Marcus Chen",
    },
  ];

  const items =
    posts.length > 0
      ? posts.map((p) => ({
          id: String(p.id),
          title: String(p.title ?? "Campus Discussion"),
          content: String(p.content),
          post_type: String(p.post_type),
          likes_count: Number(p.likes_count ?? 0),
          comments_count: Number(p.comments_count ?? 0),
          created_at: String(p.created_at),
          author: ((p.profiles as { full_name?: string } | null)?.full_name) ?? "Campus Member",
        }))
      : fallback;

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 space-y-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <Badge>Campus Community</Badge>
          <h1 className="text-4xl font-extrabold text-navy dark:text-white">
            Conversations Across Campuses
          </h1>
          <p className="text-muted-foreground">
            Preview public discussions, study resources, and club announcements. Sign in to post and join groups.
          </p>
        </div>
        <Link href="/portal/community">
          <Button className="gap-2">
            Open Full Community <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {items.map((post) => (
          <Card key={post.id} className="flex flex-col justify-between">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="teal" className="capitalize">{post.post_type}</Badge>
                <span className="text-xs text-muted-foreground">{formatRelativeTime(post.created_at)}</span>
              </div>
              <h3 className="text-lg font-bold text-navy dark:text-white">{post.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3">{post.content}</p>
            </CardContent>
            <div className="flex items-center justify-between border-t border-border px-6 py-3.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                <Users className="h-3.5 w-3.5 text-purple" /> {post.author}
              </span>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5 text-rose-500" /> {post.likes_count}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5 text-purple" /> {post.comments_count}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
