import { requireAuthContext } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CommunityFeedClient, type PostItem } from "@/components/portal/CommunityFeedClient";

export default async function PortalCommunityPage() {
  const auth = await requireAuthContext();
  const supabase = await createServerSupabaseClient();

  const [{ data: rawPosts }, { data: myLikes }, { data: myFollows }] = await Promise.all([
    supabase
      .from("campus_posts")
      .select("*, profiles(full_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase.from("post_likes").select("post_id").eq("user_id", auth.userId),
    supabase.from("user_follows").select("following_id").eq("follower_id", auth.userId),
  ]);

  const likedSet = new Set((myLikes ?? []).map((l) => l.post_id));
  const followSet = new Set((myFollows ?? []).map((f) => f.following_id));

  const initialPosts: PostItem[] = (rawPosts ?? []).map((p) => {
    const prof = p.profiles as { full_name?: string; avatar_url?: string } | null;
    return {
      id: p.id,
      author_id: p.author_id,
      title: p.title,
      content: p.content,
      post_type: p.post_type,
      media_urls: (p.media_urls as string[]) ?? [],
      tags: p.tags ?? [],
      likes_count: p.likes_count,
      comments_count: p.comments_count,
      shares_count: p.shares_count,
      created_at: p.created_at,
      author_name: prof?.full_name ?? "Campus Member",
      author_avatar: prof?.avatar_url ?? null,
      liked_by_me: likedSet.has(p.id),
      following_author: followSet.has(p.author_id),
    };
  });

  return (
    <CommunityFeedClient
      userId={auth.userId}
      universityId={auth.profile.primary_university_id}
      initialPosts={initialPosts}
    />
  );
}
