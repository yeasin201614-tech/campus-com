"use client";

import { useState } from "react";
import { Megaphone, Pin, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/utils";
import { isStaffRole, type NoticeCategory, type NoticePriority, type UserRole } from "@campus/shared";

export interface NoticeRow {
  id: string;
  title: string;
  content: string;
  category: NoticeCategory;
  priority: NoticePriority;
  is_pinned: boolean;
  is_global: boolean;
  published_at: string;
  author_name: string;
}

export function NoticesClient({
  userId,
  universityId,
  userRole,
  initialNotices,
}: {
  userId: string;
  universityId: string | null;
  userRole: UserRole;
  initialNotices: NoticeRow[];
}) {
  const supabase = createBrowserSupabaseClient();
  const [notices, setNotices] = useState<NoticeRow[]>(initialNotices);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<NoticeCategory>("university");
  const [priority, setPriority] = useState<NoticePriority>("normal");
  const [isPinned, setIsPinned] = useState(false);

  const canPublish = isStaffRole(userRole);

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!universityId && userRole !== "super_admin") return;

    const { data, error } = await supabase
      .from("notices")
      .insert({
        university_id: universityId,
        author_id: userId,
        title: title.trim(),
        content: content.trim(),
        category,
        priority,
        is_pinned: isPinned,
        is_global: !universityId && userRole === "super_admin",
      })
      .select("*, profiles(full_name)")
      .single();

    if (!error && data) {
      setNotices((prev) => [
        {
          id: data.id,
          title: data.title,
          content: data.content,
          category: data.category,
          priority: data.priority,
          is_pinned: data.is_pinned,
          is_global: data.is_global,
          published_at: data.published_at,
          author_name: (data.profiles as { full_name?: string } | null)?.full_name ?? "You",
        },
        ...prev,
      ]);
      setTitle("");
      setContent("");
      setShowCreate(false);
    }
  }

  const filtered = notices.filter((n) => {
    const matchCat = categoryFilter === "all" || n.category === categoryFilter;
    const q = search.trim().toLowerCase();
    const matchQ = !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy dark:text-white">
            University & Department Notice Board
          </h1>
          <p className="text-sm text-muted-foreground">
            Official campus announcements, exam timetables, academic circulars, and deadline alerts.
          </p>
        </div>
        {canPublish && (
          <Button onClick={() => setShowCreate((v) => !v)} className="gap-2">
            <Plus className="h-4 w-4" /> Publish Notice
          </Button>
        )}
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Publish Official Notice</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePublish} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notice Headline" className="sm:col-span-2" />
                <Select value={category} onChange={(e) => setCategory(e.target.value as NoticeCategory)}>
                  <option value="university">University</option>
                  <option value="department">Department</option>
                  <option value="academic">Academic</option>
                  <option value="exam">Exam</option>
                  <option value="deadline">Deadline</option>
                  <option value="general">General</option>
                </Select>
              </div>
              <Textarea required value={content} onChange={(e) => setContent(e.target.value)} placeholder="Notice body and instructions..." />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Select value={priority} onChange={(e) => setPriority(e.target.value as NoticePriority)} className="w-40">
                    <option value="normal">Normal Priority</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </Select>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold">
                    <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} />
                    Pin to top
                  </label>
                </div>
                <Button type="submit">Publish Notice</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {["all", "university", "department", "academic", "exam", "deadline"].map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={categoryFilter === cat ? "default" : "outline"}
              onClick={() => setCategoryFilter(cat)}
              className="capitalize"
            >
              {cat}
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notices..." className="pl-9" />
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((n) => (
          <Card key={n.id} className={n.is_pinned ? "border-purple/40" : ""}>
            <CardContent className="p-6 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-purple" />
                  <Badge className="capitalize">{n.category}</Badge>
                  <Badge variant={n.priority === "urgent" ? "destructive" : n.priority === "important" ? "warning" : "secondary"}>
                    {n.priority}
                  </Badge>
                  {n.is_pinned && (
                    <Badge variant="teal">
                      <Pin className="h-3 w-3" /> Pinned
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{formatRelativeTime(n.published_at)}</span>
              </div>
              <h3 className="text-lg font-bold text-navy dark:text-white">{n.title}</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">{n.content}</p>
              <p className="pt-1 text-xs font-semibold text-foreground/70">Posted by {n.author_name}</p>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            No notices found matching your filters.
          </Card>
        )}
      </div>
    </div>
  );
}
