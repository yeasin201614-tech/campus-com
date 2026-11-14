"use client";

import { useState } from "react";
import { Building2, CheckCircle2, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { University, VerificationStatus } from "@campus/shared";

export function AdminUniversitiesClient({ initialUniversities }: { initialUniversities: University[] }) {
  const supabase = createBrowserSupabaseClient();
  const [unis, setUnis] = useState<University[]>(initialUniversities);
  const [name, setName] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [msg, setMsg] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/admin/universities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, shortCode, city, country }),
    });
    const json = await res.json();
    if (!res.ok) setMsg(json.error || "Failed to create university");
    else {
      setUnis((prev) => [json.university, ...prev]);
      setName("");
      setShortCode("");
      setCity("");
      setCountry("");
      setMsg("University onboarded!");
    }
  }

  async function updateStatus(universityId: string, status: VerificationStatus) {
    const res = await fetch("/api/admin/universities", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ universityId, status }),
    });
    if (res.ok) {
      setUnis((prev) =>
        prev.map((u) => (u.id === universityId ? { ...u, status, is_verified: status === "verified" } : u))
      );
    }
  }

  async function deleteUniversity(universityId: string) {
    const { error } = await supabase.from("universities").delete().eq("id", universityId);
    if (!error) setUnis((prev) => prev.filter((u) => u.id !== universityId));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy dark:text-white">Manage Universities</h1>
        <p className="text-sm text-muted-foreground">
          Create, verify, suspend, or remove university tenants across Campus.com.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-purple" /> Onboard New University
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-5">
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="University Name" className="sm:col-span-2" />
            <Input required value={shortCode} onChange={(e) => setShortCode(e.target.value)} placeholder="Code (e.g. OXF)" />
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
            <Button type="submit">Create University</Button>
          </form>
          {msg && <p className="mt-2 text-xs font-semibold text-teal-600">{msg}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-4">University</th>
                <th className="p-4">Code</th>
                <th className="p-4">Location</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {unis.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="p-4 font-bold flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-purple" /> {u.name}
                  </td>
                  <td className="p-4">{u.short_code}</td>
                  <td className="p-4 text-muted-foreground">{[u.city, u.country].filter(Boolean).join(", ") || "—"}</td>
                  <td className="p-4">
                    <Badge variant={u.status === "verified" ? "teal" : u.status === "suspended" ? "destructive" : "warning"}>
                      {u.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {u.status !== "verified" && (
                      <Button size="sm" variant="teal" onClick={() => updateStatus(u.id, "verified")} className="gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Verify
                      </Button>
                    )}
                    {u.status !== "suspended" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(u.id, "suspended")} className="gap-1">
                        <ShieldAlert className="h-3.5 w-3.5" /> Suspend
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => deleteUniversity(u.id)} aria-label="Delete university">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
