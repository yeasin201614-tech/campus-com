"use client";

import { useState } from "react";
import { BookOpen, FileUp, Megaphone, Plus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/utils";
import type { Department } from "@campus/shared";

export function DepartmentClient({
  userId,
  universityId,
  departments,
  initialResources,
  studentsCount,
  facultyCount,
}: {
  userId: string;
  universityId: string | null;
  departments: Department[];
  initialResources: Array<{ id: string; title: string | null; content: string; resource_url: string | null; created_at: string }>;
  studentsCount: number;
  facultyCount: number;
}) {
  const supabase = createBrowserSupabaseClient();
  const [resources, setResources] = useState(initialResources);
  const [deptId, setDeptId] = useState(departments[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [status, setStatus] = useState("");

  async function handleShareResource(e: React.FormEvent) {
    e.preventDefault();
    if (!universityId) return;
    setStatus("");
    const { data, error } = await supabase
      .from("campus_posts")
      .insert({
        university_id: universityId,
        department_id: deptId || null,
        author_id: userId,
        post_type: "resource",
        visibility: "department",
        title: title.trim(),
        content: content.trim(),
        resource_url: resourceUrl.trim() || null,
      })
      .select("id, title, content, resource_url, created_at")
      .single();

    if (!error && data) {
      setResources((prev) => [data, ...prev]);
      setTitle("");
      setContent("");
      setResourceUrl("");
      setStatus("Academic resource shared with department!");
    } else if (error) {
      setStatus(error.message);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy dark:text-white">
          Department & Faculty Academic Workspace
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage department resources, share class materials, and monitor department rosters.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <BookOpen className="h-7 w-7 text-purple" />
            <div>
              <p className="text-xs text-muted-foreground">Departments</p>
              <p className="text-2xl font-extrabold">{departments.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Users className="h-7 w-7 text-teal" />
            <div>
              <p className="text-xs text-muted-foreground">Department Students</p>
              <p className="text-2xl font-extrabold">{studentsCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Megaphone className="h-7 w-7 text-navy dark:text-white" />
            <div>
              <p className="text-xs text-muted-foreground">Faculty Members</p>
              <p className="text-2xl font-extrabold">{facultyCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-purple" /> Share Educational Resource / Class Material
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleShareResource} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Course / Lecture Title" className="sm:col-span-2" />
              <Select value={deptId} onChange={(e) => setDeptId(e.target.value)}>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </Select>
            </div>
            <Input value={resourceUrl} onChange={(e) => setResourceUrl(e.target.value)} placeholder="Optional Resource / Slides URL (https://...)" />
            <Textarea required value={content} onChange={(e) => setContent(e.target.value)} placeholder="Reading instructions, assignment brief, or syllabus notes..." />
            <Button type="submit" className="gap-2">
              <FileUp className="h-4 w-4" /> Publish Resource
            </Button>
            {status && <p className="text-xs font-semibold text-teal-600">{status}</p>}
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {resources.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="teal">Resource</Badge>
                <span className="text-xs text-muted-foreground">{formatRelativeTime(r.created_at)}</span>
              </div>
              <h3 className="font-bold">{r.title || "Class Material"}</h3>
              <p className="text-sm text-muted-foreground">{r.content}</p>
              {r.resource_url && (
                <a href={r.resource_url} target="_blank" rel="noreferrer" className="inline-block text-xs font-semibold text-purple hover:underline">
                  Open Attached Link →
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
