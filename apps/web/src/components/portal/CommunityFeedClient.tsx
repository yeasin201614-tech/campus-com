"use client";

import { useState } from "react";
import {
  Flag,
  Heart,
  ImagePlus,
  MessageCircle,
  Send,
  Share2,
  UserPlus,
  UserCheck,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/utils";
import type { PostType } from "@campus/shared";

export interface PostItem {
  id: string;
  author_id: string;
  title: string | null;
  content: string;
  post_type: PostType;
  media_urls: string[];
  tags: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  author_name: string;
  author_avatar: string | null;
  liked_by_me: boolean;
  following_author: boolean;
}

interface CommentItem {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
  author_name: string;
}

export function CommunityFeedClient({
  userId,
  universityId,
  initialPosts,
}: {
  userId: string;
  universityId: string | null;
  initialPosts: PostItem[];
}) {
  const supabase = createBrowserSupabaseClient();
  const [posts, setPosts] = useState<PostItem[]>(initialPosts);
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<PostType>("discussion");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const [feedback, setFeedback] = useState("");

  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, CommentItem[]>>({});
  const [commentDraft, setCommentDraft] = useState("");

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !universityId) {
      setFeedback(!universityId ? "Join or select a university in your profile first." : "");
      return;
    }

    setPosting(true);
    setFeedback("");
    try {
      const mediaUrls: string[] = [];
      if (imageFile) {
        const ext = imageFile.name.split(".").pop() || "jpg";
        const path = `${userId}/posts/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("campus-media")
          .upload(path, imageFile, { upsert: false });
        if (!uploadErr) {
          const { data: pub } = supabase.storage.from("campus-media").getPublicUrl(path);
          if (pub.publicUrl) mediaUrls.push(pub.publicUrl);
        }
      }

      const { data, error } = await supabase
        .from("campus_posts")
        .insert({
          university_id: universityId,
          author_id: userId,
          title: title.trim() || null,
          content: content.trim(),
          post_type: postType,
          visibility: "university",
          media_urls: mediaUrls,
        })
        .select("*, profiles(full_name, avatar_url)")
        .single();

      if (error) {
        setFeedback(error.message);
        return;
      }

      const prof = data.profiles as { full_name?: string; avatar_url?: string } | null;
      const newPost: PostItem = {
        id: data.id,
        author_id: data.author_id,
        title: data.title,
        content: data.content,
        post_type: data.post_type,
        media_urls: (data.media_urls as string[]) ?? [],
        tags: data.tags ?? [],
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        created_at: data.created_at,
        author_name: prof?.full_name ?? "You",
        author_avatar: prof?.avatar_url ?? null,
        liked_by_me: false,
        following_author: false,
      };
      setPosts((prev) => [newPost, ...prev]);
      setTitle("");
      setContent("");
      setImageFile(null);
      setFeedback("Published to campus feed!");
    } finally {
      setPosting(false);
    }
  }

  async function toggleLike(post: PostItem) {
    if (post.liked_by_me) {
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", userId);
    } else {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: userId });
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              liked_by_me: !p.liked_by_me,
              likes_count: Math.max(0, p.likes_count + (p.liked_by_me ? -1 : 1)),
            }
          : p
      )
    );
  }

  async function toggleFollow(authorId: string, currentlyFollowing: boolean) {
    if (authorId === userId) return;
    if (currentlyFollowing) {
      await supabase.from("user_follows").delete().eq("follower_id", userId).eq("following_id", authorId);
    } else {
      await supabase.from("user_follows").insert({ follower_id: userId, following_id: authorId });
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.author_id === authorId ? { ...p, following_author: !currentlyFollowing } : p
      )
    );
  }

  async function loadComments(postId: string) {
    if (openCommentsPostId === postId) {
      setOpenCommentsPostId(null);
      return;
    }
    setOpenCommentsPostId(postId);
    const { data } = await supabase
      .from("post_comments")
      .select("id, post_id, content, created_at, profiles(full_name)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    const mapped = (data ?? []).map((c) => ({
      id: c.id,
      post_id: c.post_id,
      content: c.content,
      created_at: c.created_at,
      author_name: (c.profiles as { full_name?: string } | null)?.full_name ?? "Member",
    }));
    setCommentsByPost((prev) => ({ ...prev, [postId]: mapped }));
  }

  async function handleAddComment(postId: string) {
    if (!commentDraft.trim()) return;
    const { data, error } = await supabase
      .from("post_comments")
      .insert({ post_id: postId, author_id: userId, content: commentDraft.trim() })
      .select("id, post_id, content, created_at, profiles(full_name)")
      .single();

    if (!error && data) {
      const item: CommentItem = {
        id: data.id,
        post_id: data.post_id,
        content: data.content,
        created_at: data.created_at,
        author_name: (data.profiles as { full_name?: string } | null)?.full_name ?? "You",
      };
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] ?? []), item],
      }));
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p))
      );
      setCommentDraft("");
    }
  }

  async function reportPost(post: PostItem) {
    await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactName: "Community Member Report",
        contactEmail: "moderation@campus.com",
        subject: `Reported Post: ${post.title || post.id}`,
        message: `User reported post ${post.id} for review: "${post.content.slice(0, 200)}"`,
        ticketType: "post_report",
        targetType: "campus_posts",
        targetId: post.id,
      }),
    });
    setFeedback("Report submitted to campus moderators.");
  }

  const filtered = posts.filter((p) => {
    const matchType = filterType === "all" || p.post_type === filterType;
    const q = search.trim().toLowerCase();
    const matchQ =
      !q ||
      p.content.toLowerCase().includes(q) ||
      (p.title ?? "").toLowerCase().includes(q) ||
      p.author_name.toLowerCase().includes(q);
    return matchType && matchQ;
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Share with Your Campus Community</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreatePost} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Optional headline..."
                className="sm:col-span-2"
              />
              <Select value={postType} onChange={(e) => setPostType(e.target.value as PostType)}>
                <option value="discussion">Discussion</option>
                <option value="announcement">Announcement</option>
                <option value="resource">Study Resource</option>
                <option value="achievement">Achievement</option>
              </Select>
            </div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ask a question, share study notes, or celebrate a milestone..."
              rows={3}
              required
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-muted">
                <ImagePlus className="h-4 w-4 text-purple" />
                <span>{imageFile ? imageFile.name : "Attach Image"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <Button type="submit" disabled={posting} className="gap-2">
                <Send className="h-4 w-4" />
                {posting ? "Posting..." : "Publish Post"}
              </Button>
            </div>
            {feedback && <p className="text-xs font-medium text-teal-600">{feedback}</p>}
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {["all", "discussion", "resource", "announcement", "achievement"].map((t) => (
            <Button
              key={t}
              size="sm"
              variant={filterType === t ? "default" : "outline"}
              onClick={() => setFilterType(t)}
              className="capitalize"
            >
              {t}
            </Button>
          ))}
        </div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter posts..."
          className="max-w-xs"
        />
      </div>

      <div className="space-y-4">
        {filtered.map((post) => (
          <Card key={post.id}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar src={post.author_avatar} name={post.author_name} />
                  <div>
                    <p className="font-bold text-navy dark:text-white">{post.author_name}</p>
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(post.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="teal" className="capitalize">{post.post_type}</Badge>
                  {post.author_id !== userId && (
                    <Button
                      size="sm"
                      variant={post.following_author ? "secondary" : "outline"}
                      onClick={() => toggleFollow(post.author_id, post.following_author)}
                      className="h-7 px-2.5 text-xs gap-1"
                    >
                      {post.following_author ? (
                        <>
                          <UserCheck className="h-3 w-3" /> Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3 w-3" /> Follow
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {post.title && <h3 className="text-lg font-bold">{post.title}</h3>}
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{post.content}</p>

              {post.media_urls.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {post.media_urls.map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={url} src={url} alt="Post media" className="max-h-72 w-full rounded-xl object-cover" />
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleLike(post)}
                    className={post.liked_by_me ? "text-rose-500" : ""}
                  >
                    <Heart className="h-4 w-4" /> {post.likes_count}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => loadComments(post.id)}>
                    <MessageCircle className="h-4 w-4" /> {post.comments_count}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      setFeedback("Post link copied!");
                    }}
                  >
                    <Share2 className="h-4 w-4" /> Share
                  </Button>
                </div>
                <Button size="sm" variant="ghost" onClick={() => reportPost(post)} className="text-muted-foreground">
                  <Flag className="h-3.5 w-3.5" /> Report
                </Button>
              </div>

              {openCommentsPostId === post.id && (
                <div className="space-y-3 rounded-xl bg-muted/50 p-4">
                  <div className="space-y-2">
                    {(commentsByPost[post.id] ?? []).map((c) => (
                      <div key={c.id} className="rounded-lg bg-card p-2.5 text-xs">
                        <span className="font-bold">{c.author_name}</span>{" "}
                        <span className="text-muted-foreground">• {formatRelativeTime(c.created_at)}</span>
                        <p className="mt-1 text-foreground">{c.content}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={commentDraft}
                      onChange={(e) => setCommentDraft(e.target.value)}
                      placeholder="Write a comment..."
                      className="h-9 text-xs"
                    />
                    <Button size="sm" onClick={() => handleAddComment(post.id)}>
                      Reply
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            No community posts match your filter yet. Start the first discussion above!
          </Card>
        )}
      </div>
    </div>
  );
}
