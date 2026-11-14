"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ROLE_LABELS, type Profile, type UserRole } from "@campus/shared";

export function AdminUsersClient({ initialUsers }: { initialUsers: Profile[] }) {
  const [users, setUsers] = useState<Profile[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");

  async function patchUser(userId: string, body: Record<string, unknown>) {
    setMsg("");
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...body }),
    });
    const json = await res.json();
    if (!res.ok) setMsg(json.error || "Update failed");
    else {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...json.user } : u)));
      setMsg("User permissions updated & logged to Audit Logs.");
    }
  }

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    return !q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy dark:text-white">Users & Role Management</h1>
          <p className="text-sm text-muted-foreground">
            Assign platform roles, verify identities, and suspend or reactivate accounts.
          </p>
        </div>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users by name or email..." className="max-w-xs" />
      </div>

      {msg && <p className="text-xs font-semibold text-teal-600">{msg}</p>}

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role Assignment</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="p-4">
                    <p className="font-bold">{u.full_name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="p-4">
                    <Select
                      value={u.global_role}
                      onChange={(e) => patchUser(u.id, { globalRole: e.target.value as UserRole })}
                      className="w-48 h-9 text-xs"
                    >
                      {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                        <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                      ))}
                    </Select>
                  </td>
                  <td className="p-4 space-x-1.5">
                    <Badge variant={u.is_verified ? "teal" : "warning"}>{u.is_verified ? "Verified" : "Unverified"}</Badge>
                    <Badge variant={u.is_active ? "secondary" : "destructive"}>{u.is_active ? "Active" : "Suspended"}</Badge>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => patchUser(u.id, { isVerified: !u.is_verified })}>
                      {u.is_verified ? "Unverify" : "Verify"}
                    </Button>
                    <Button size="sm" variant={u.is_active ? "destructive" : "teal"} onClick={() => patchUser(u.id, { isActive: !u.is_active })}>
                      {u.is_active ? "Suspend" : "Activate"}
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
