"use client";

import { useState } from "react";
import { Building2, CheckCircle2, FolderTree, GraduationCap, Plus, Save, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import type { AcademicProgram, Department, University } from "@campus/shared";

interface MemberRow {
  id: string;
  user_id: string;
  role: string;
  status: string;
  full_name: string;
  email: string;
}

export function UniversityAdminClient({
  university,
  initialDepartments,
  initialPrograms,
  initialMembers,
}: {
  university: University | null;
  initialDepartments: Department[];
  initialPrograms: AcademicProgram[];
  initialMembers: MemberRow[];
}) {
  const supabase = createBrowserSupabaseClient();
  const [uniName, setUniName] = useState(university?.name ?? "");
  const [uniDesc, setUniDesc] = useState(university?.description ?? "");
  const [brandColor, setBrandColor] = useState(university?.brand_color ?? "#101B62");
  const [academicYear, setAcademicYear] = useState(university?.current_academic_year ?? "2026-2027");
  const [statusMsg, setStatusMsg] = useState("");

  const [departments, setDepartments] = useState(initialDepartments);
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [deptBuilding, setDeptBuilding] = useState("");

  const [members, setMembers] = useState(initialMembers);

  if (!university) {
    return (
      <Card className="mx-auto max-w-2xl p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No primary university is linked to your account yet. Contact Super Admin to assign your University Admin seat.
        </p>
      </Card>
    );
  }

  async function saveUniversityProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!university) return;
    const { error } = await supabase
      .from("universities")
      .update({
        name: uniName.trim(),
        description: uniDesc.trim(),
        brand_color: brandColor,
        current_academic_year: academicYear.trim(),
      })
      .eq("id", university.id);
    setStatusMsg(error ? error.message : "University profile & academic year saved!");
  }

  async function addDepartment(e: React.FormEvent) {
    e.preventDefault();
    if (!university || !deptName.trim() || !deptCode.trim()) return;
    const { data, error } = await supabase
      .from("departments")
      .insert({
        university_id: university.id,
        name: deptName.trim(),
        code: deptCode.trim().toUpperCase(),
        slug: slugify(deptName),
        building: deptBuilding.trim() || null,
      })
      .select()
      .single();

    if (!error && data) {
      setDepartments((prev) => [...prev, data as Department]);
      setDeptName("");
      setDeptCode("");
      setDeptBuilding("");
    }
  }

  async function verifyMember(memberId: string, nextStatus: "verified" | "suspended") {
    const { error } = await supabase
      .from("university_members")
      .update({ status: nextStatus, verified_at: nextStatus === "verified" ? new Date().toISOString() : null })
      .eq("id", memberId);

    if (!error) {
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, status: nextStatus } : m)));
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Badge variant="teal" className="mb-1">University Management System</Badge>
          <h1 className="text-2xl font-extrabold text-navy dark:text-white">{university.name}</h1>
          <p className="text-sm text-muted-foreground">
            Isolated tenant administration • Academic Year {academicYear}
          </p>
        </div>
        <Badge variant="navy">{university.short_code}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Departments</p><p className="text-2xl font-extrabold">{departments.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Academic Programs</p><p className="text-2xl font-extrabold">{initialPrograms.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Total Members</p><p className="text-2xl font-extrabold">{members.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Pending Verification</p><p className="text-2xl font-extrabold text-purple">{members.filter((m) => m.status === "pending").length}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile"><Building2 className="mr-1.5 h-3.5 w-3.5" /> Profile & Branding</TabsTrigger>
          <TabsTrigger value="departments"><FolderTree className="mr-1.5 h-3.5 w-3.5" /> Departments</TabsTrigger>
          <TabsTrigger value="members"><UserCheck className="mr-1.5 h-3.5 w-3.5" /> Student & Faculty Verification</TabsTrigger>
          <TabsTrigger value="programs"><GraduationCap className="mr-1.5 h-3.5 w-3.5" /> Programs</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Campus Profile, Branding & Academic Year</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveUniversityProfile} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>University Name</Label>
                    <Input value={uniName} onChange={(e) => setUniName(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Academic Year</Label>
                    <Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Campus Description</Label>
                  <Textarea value={uniDesc} onChange={(e) => setUniDesc(e.target.value)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label>Primary Brand Color</Label>
                  <Input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="h-10 w-16 p-1" />
                </div>
                {statusMsg && (
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-teal-600">
                    <CheckCircle2 className="h-4 w-4" /> {statusMsg}
                  </p>
                )}
                <Button type="submit" className="gap-2"><Save className="h-4 w-4" /> Save Campus Settings</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Department</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addDepartment} className="grid gap-3 sm:grid-cols-4">
                <Input required value={deptName} onChange={(e) => setDeptName(e.target.value)} placeholder="Department Name" className="sm:col-span-2" />
                <Input required value={deptCode} onChange={(e) => setDeptCode(e.target.value)} placeholder="Code (e.g. CSE)" />
                <Button type="submit" className="gap-1.5"><Plus className="h-4 w-4" /> Add</Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            {departments.map((d) => (
              <Card key={d.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-bold">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.building || "Main Campus"}</p>
                  </div>
                  <Badge>{d.code}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Campus Directory & Verification Queue</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {members.map((m) => (
                <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-bold text-sm">{m.full_name}</p>
                    <p className="text-xs text-muted-foreground">{m.email} • <span className="capitalize">{m.role.replace("_", " ")}</span></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={m.status === "verified" ? "teal" : m.status === "suspended" ? "destructive" : "warning"}>
                      {m.status}
                    </Badge>
                    {m.status !== "verified" && (
                      <Button size="sm" variant="teal" onClick={() => verifyMember(m.id, "verified")}>
                        Verify
                      </Button>
                    )}
                    {m.status === "verified" && (
                      <Button size="sm" variant="outline" onClick={() => verifyMember(m.id, "suspended")}>
                        Suspend
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="programs">
          <div className="grid gap-4 md:grid-cols-2">
            {initialPrograms.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="font-bold">{p.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {p.degree_level} • {p.duration_years} yrs • {p.total_credits} credits
                    </p>
                  </div>
                  <Badge variant="outline">{p.code}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
