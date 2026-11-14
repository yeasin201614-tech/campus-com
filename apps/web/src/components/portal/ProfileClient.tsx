"use client";

import { useState } from "react";
import { Camera, CheckCircle2, Save } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { ROLE_LABELS, type Profile, type StudentRecord, type University, type UserRole } from "@campus/shared";

export function ProfileClient({
  profile,
  university,
  effectiveRole,
  studentRecord,
}: {
  profile: Profile;
  university: University | null;
  effectiveRole: UserRole;
  studentRecord: StudentRecord | null;
}) {
  const supabase = createBrowserSupabaseClient();
  const [fullName, setFullName] = useState(profile.full_name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [skillsText, setSkillsText] = useState((profile.skills ?? []).join(", "));
  const [interestsText, setInterestsText] = useState((profile.interests ?? []).join(", "));
  const [linkedin, setLinkedin] = useState(profile.social_links?.linkedin ?? "");
  const [github, setGithub] = useState(profile.social_links?.github ?? "");
  const [visibility, setVisibility] = useState<"public" | "university" | "private">(
    profile.privacy_settings?.profile_visibility ?? "university"
  );
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  async function handleAvatarChange(file: File | null) {
    if (!file) return;
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      if (data.publicUrl) {
        setAvatarUrl(data.publicUrl);
        await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", profile.id);
        setStatus("Avatar updated!");
      }
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus("");
    try {
      const skills = skillsText.split(",").map((s) => s.trim()).filter(Boolean);
      const interests = interestsText.split(",").map((s) => s.trim()).filter(Boolean);

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          bio: bio.trim(),
          skills,
          interests,
          social_links: { linkedin: linkedin.trim(), github: github.trim() },
          privacy_settings: {
            ...profile.privacy_settings,
            profile_visibility: visibility,
          },
        })
        .eq("id", profile.id);

      setStatus(error ? error.message : "Profile updated successfully!");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="overflow-hidden">
        <div className="h-28 campus-gradient" />
        <CardContent className="px-6 pb-6">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="relative">
                <Avatar src={avatarUrl} name={fullName} size="xl" className="ring-4 ring-card" />
                <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-purple text-white shadow">
                  <Camera className="h-4 w-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)} />
                </label>
              </div>
              <div className="pb-1">
                <h1 className="text-xl font-extrabold text-navy dark:text-white">{fullName}</h1>
                <p className="text-xs text-muted-foreground">{profile.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>{ROLE_LABELS[effectiveRole]}</Badge>
              {university && <Badge variant="teal">{university.name}</Badge>}
              {studentRecord && (
                <Badge variant="outline">ID: {studentRecord.student_id_number}</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Details, Skills & Privacy</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Profile Visibility</Label>
                <Select value={visibility} onChange={(e) => setVisibility(e.target.value as "public" | "university" | "private")}>
                  <option value="university">University Members Only</option>
                  <option value="public">Public Across Campus.com</option>
                  <option value="private">Private</option>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Academic interests, projects, and club roles..." />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Skills (comma-separated)</Label>
                <Input value={skillsText} onChange={(e) => setSkillsText(e.target.value)} placeholder="React, Python, Robotics" />
              </div>
              <div className="space-y-1.5">
                <Label>Interests (comma-separated)</Label>
                <Input value={interestsText} onChange={(e) => setInterestsText(e.target.value)} placeholder="AI Research, Hackathons" />
              </div>
              <div className="space-y-1.5">
                <Label>LinkedIn URL</Label>
                <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." />
              </div>
              <div className="space-y-1.5">
                <Label>GitHub / Portfolio URL</Label>
                <Input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/..." />
              </div>
            </div>

            {status && (
              <div className="flex items-center gap-2 text-xs font-semibold text-teal-600">
                <CheckCircle2 className="h-4 w-4" /> {status}
              </div>
            )}

            <Button type="submit" disabled={saving} className="gap-2">
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
