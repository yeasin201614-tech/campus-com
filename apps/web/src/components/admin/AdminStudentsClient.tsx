"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, UserPlus } from "lucide-react";
import { AdminEntityDirectory, type DirectoryColumn } from "./AdminEntityDirectory";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

interface UniversityOption {
  id: string;
  name: string;
}

export function AdminStudentsClient({
  columns,
  rows,
  universities,
}: {
  columns: DirectoryColumn[];
  rows: Array<Record<string, unknown>>;
  universities: UniversityOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("CampusStudent2026!");
  const [universityId, setUniversityId] = useState(universities[0]?.id || "");
  const [studentIdNumber, setStudentIdNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleCreateStudent(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          password,
          universityId,
          studentIdNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create student account");
      }

      setSuccess(`Student account for ${fullName} created successfully!`);
      setTimeout(() => {
        setOpen(false);
        setFullName("");
        setEmail("");
        setStudentIdNumber("");
        router.refresh();
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create student account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AdminEntityDirectory
        title="Students Directory"
        subtitle="Monitor student onboarding, active credentials, and institutional verification across all universities."
        columns={columns}
        rows={rows}
        actionSlot={
          <Button onClick={() => setOpen(true)} className="gap-2 bg-teal hover:bg-teal-600 text-white font-semibold">
            <UserPlus className="h-4 w-4" />
            Add New Student
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-teal" />
            Create Student Account
          </DialogTitle>
          <DialogDescription>
            Register a verified student credentials profile directly into the university system.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateStudent} className="space-y-4 pt-2">
          {error && (
            <div className="rounded-xl bg-destructive/15 p-3 text-xs font-semibold text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl bg-teal/15 p-3 text-xs font-semibold text-teal">
              {success}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="stu-name">Student Full Name</Label>
            <Input
              id="stu-name"
              placeholder="e.g. Emily Watson"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stu-email">Institutional Email</Label>
            <Input
              id="stu-email"
              type="email"
              placeholder="student@northbridge.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stu-pass">Initial Password</Label>
            <Input
              id="stu-pass"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stu-uni">University</Label>
            <Select
              id="stu-uni"
              value={universityId}
              onChange={(e) => setUniversityId(e.target.value)}
            >
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stu-id">Student ID Number (Optional)</Label>
            <Input
              id="stu-id"
              placeholder="e.g. STU-2026-089"
              value={studentIdNumber}
              onChange={(e) => setStudentIdNumber(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-teal hover:bg-teal-600 text-white font-semibold">
              {loading ? "Creating..." : "Create Student Account"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
