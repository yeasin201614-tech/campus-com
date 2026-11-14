"use client";

import { useState } from "react";
import { Lock, Plus, Users, Check, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";

export interface GroupRow {
  id: string;
  name: string;
  description: string;
  category: string;
  is_private: boolean;
  requires_approval: boolean;
  members_count: number;
  my_status: "approved" | "pending" | null;
  my_role: string | null;
}

export function GroupsClient({
  userId,
  universityId,
  initialGroups,
}: {
  userId: string;
  universityId: string | null;
  initialGroups: GroupRow[];
}) {
  const supabase = createBrowserSupabaseClient();
  const [groups, setGroups] = useState<GroupRow[]>(initialGroups);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Technology");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!universityId || !name.trim()) return;
    setCreating(true);
    setMessage("");
    try {
      const { data: grp, error } = await supabase
        .from("community_groups")
        .insert({
          university_id: universityId,
          name: name.trim(),
          slug: `${slugify(name)}-${Date.now().toString().slice(-4)}`,
          description: description.trim(),
          category,
          is_private: isPrivate,
          requires_approval: isPrivate,
          created_by: userId,
        })
        .select()
        .single();

      if (error) {
        setMessage(error.message);
        return;
      }

      await supabase.from("group_members").insert({
        group_id: grp.id,
        user_id: userId,
        role: "owner",
        status: "approved",
      });

      setGroups((prev) => [
        {
          id: grp.id,
          name: grp.name,
          description: grp.description,
          category: grp.category,
          is_private: grp.is_private,
          requires_approval: grp.requires_approval,
          members_count: 1,
          my_status: "approved",
          my_role: "owner",
        },
        ...prev,
      ]);
      setName("");
      setDescription("");
      setMessage("Club / group created!");
    } finally {
      setCreating(false);
    }
  }

  async function toggleMembership(group: GroupRow) {
    if (group.my_status) {
      await supabase.from("group_members").delete().eq("group_id", group.id).eq("user_id", userId);
      setGroups((prev) =>
        prev.map((g) =>
          g.id === group.id
            ? {
                ...g,
                my_status: null,
                members_count: group.my_status === "approved" ? Math.max(0, g.members_count - 1) : g.members_count,
              }
            : g
        )
      );
    } else {
      const nextStatus = group.requires_approval ? "pending" : "approved";
      const { error } = await supabase.from("group_members").insert({
        group_id: group.id,
        user_id: userId,
        role: "member",
        status: nextStatus,
      });
      if (!error) {
        setGroups((prev) =>
          prev.map((g) =>
            g.id === group.id
              ? {
                  ...g,
                  my_status: nextStatus,
                  members_count: nextStatus === "approved" ? g.members_count + 1 : g.members_count,
                }
              : g
          )
        );
      }
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-extrabold text-navy dark:text-white">
            Campus Clubs & Study Groups
          </h1>
          <p className="text-sm text-muted-foreground">
            Join public or private university groups, collaborate with peers, and organize club activities.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-purple" /> Start a New Campus Group
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-4">
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Club or Group Name"
              className="sm:col-span-2"
            />
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Technology">Technology</option>
              <option value="Academic">Academic</option>
              <option value="Arts & Culture">Arts & Culture</option>
              <option value="Sports">Sports</option>
              <option value="Entrepreneurship">Entrepreneurship</option>
            </Select>
            <Select value={isPrivate ? "private" : "public"} onChange={(e) => setIsPrivate(e.target.value === "private")}>
              <option value="public">Public Group</option>
              <option value="private">Private (Approval Required)</option>
            </Select>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Group mission, meeting times, and goals..."
              className="sm:col-span-3 min-h-[44px]"
            />
            <Button type="submit" disabled={creating || !universityId}>
              {creating ? "Creating..." : "Create Group"}
            </Button>
          </form>
          {message && <p className="mt-2 text-xs font-medium text-teal-600">{message}</p>}
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <Card key={g.id} className="flex flex-col justify-between">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="teal">{g.category}</Badge>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  {g.is_private ? <Lock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                  {g.is_private ? "Private" : "Public"}
                </span>
              </div>
              <h3 className="text-lg font-bold text-navy dark:text-white">{g.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3">{g.description || "Official campus group."}</p>
            </CardContent>
            <div className="flex items-center justify-between border-t border-border px-6 py-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Users className="h-4 w-4 text-purple" /> {g.members_count} members
              </span>
              <Button
                size="sm"
                variant={g.my_status === "approved" ? "secondary" : g.my_status === "pending" ? "outline" : "default"}
                onClick={() => toggleMembership(g)}
                className="gap-1.5"
              >
                {g.my_status === "approved" ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Joined
                  </>
                ) : g.my_status === "pending" ? (
                  "Pending Approval"
                ) : (
                  "Join Group"
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
