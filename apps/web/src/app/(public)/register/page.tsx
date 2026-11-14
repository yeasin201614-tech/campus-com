"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, GraduationCap, ShieldAlert } from "lucide-react";
import { CampusLogo } from "@/components/brand/CampusLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

interface UniOption {
  id: string;
  name: string;
  short_code: string;
}

const FALLBACK_UNIVERSITIES: UniOption[] = [
  { id: "33333333-3333-4333-8333-333333333301", name: "Northbridge University", short_code: "NBU" },
  { id: "33333333-3333-4333-8333-333333333302", name: "Metropolitan Institute of Technology", short_code: "MITX" },
  { id: "33333333-3333-4333-8333-333333333303", name: "Pacific Crest University", short_code: "PCU" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { isConfigured } = getSupabasePublicConfig();

  const [universities, setUniversities] = useState<UniOption[]>(FALLBACK_UNIVERSITIES);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requestedRole, setRequestedRole] = useState<"student" | "teacher" | "club_moderator">("student");
  const [universityId, setUniversityId] = useState(FALLBACK_UNIVERSITIES[0].id);
  const [studentIdNumber, setStudentIdNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isConfigured) return;
    const supabase = createBrowserSupabaseClient();
    supabase
      .from("universities")
      .select("id, name, short_code")
      .eq("status", "verified")
      .order("name")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setUniversities(data);
          setUniversityId(data[0].id);
        }
      });
  }, [isConfigured]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isConfigured) {
      setError("Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to register live accounts.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            requested_role: requestedRole,
            university_id: universityId,
            student_id_number: studentIdNumber,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpErr) {
        setError(signUpErr.message);
        return;
      }

      if (data.session) {
        if (requestedRole === "student" && studentIdNumber.trim()) {
          await supabase.from("student_records").insert({
            university_id: universityId,
            user_id: data.user!.id,
            student_id_number: studentIdNumber.trim(),
            verification_status: "pending",
          });
        }
        router.push("/portal/dashboard");
        router.refresh();
      } else {
        setSuccess("Account created! Check your inbox to confirm your email and sign in.");
      }
    } catch {
      setError("Registration failed. Verify Supabase auth configuration.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg shadow-campus-lg">
        <CardHeader className="items-center text-center space-y-2">
          <CampusLogo href="" size="md" showTagline />
          <CardTitle className="text-2xl text-navy dark:text-white pt-1">
            Create Your Campus.com Account
          </CardTitle>
          <CardDescription>
            Join your university community as a Student, Faculty member, or Club Moderator
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Rahat Karim" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role">Campus Role</Label>
                <Select
                  id="role"
                  value={requestedRole}
                  onChange={(e) => setRequestedRole(e.target.value as "student" | "teacher" | "club_moderator")}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher / Faculty</option>
                  <option value="club_moderator">Club Moderator</option>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="university">Select University</Label>
              <Select id="university" value={universityId} onChange={(e) => setUniversityId(e.target.value)}>
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.short_code})
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">University Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@northbridge.edu" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="studentId">Student / Faculty ID</Label>
                <Input id="studentId" value={studentIdNumber} onChange={(e) => setStudentIdNumber(e.target.value)} placeholder="NBU-2026-0412" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password (min 8 chars)</Label>
              <Input id="password" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a strong password" />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-destructive/12 p-3 text-xs font-medium text-destructive">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2 rounded-xl bg-teal/15 p-3 text-xs font-medium text-teal-600">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-11 gap-2">
              <GraduationCap className="h-4 w-4" />
              {loading ? "Creating Account..." : "Join Campus.com"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-purple hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
