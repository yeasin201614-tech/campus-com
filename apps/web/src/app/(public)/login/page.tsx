"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ArrowRight, Lock, Mail, ShieldAlert } from "lucide-react";
import { CampusLogo } from "@/components/brand/CampusLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/portal/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { isConfigured } = getSupabasePublicConfig();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isConfigured) {
      setError("Supabase environment variables are not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        setError(signInErr.message);
        return;
      }
      if (data.user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("global_role")
          .eq("id", data.user.id)
          .maybeSingle();

        if (prof?.global_role === "super_admin" && nextPath === "/portal/dashboard") {
          router.push("/admin");
        } else {
          router.push(nextPath);
        }
        router.refresh();
      }
    } catch {
      setError("Authentication request failed. Check your network and Supabase settings.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: "google" | "apple") {
    if (!isConfigured) {
      setError("Configure Supabase OAuth credentials before using social sign-in.");
      return;
    }
    const supabase = createBrowserSupabaseClient();
    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });
    if (oauthErr) setError(oauthErr.message);
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-border/90 shadow-campus-lg">
        <CardHeader className="items-center text-center space-y-2 pb-4">
          <CampusLogo href="" size="lg" showTagline />
          <CardTitle className="pt-2 text-2xl text-navy dark:text-white">
            Your Campus, Our Community
          </CardTitle>
          <CardDescription>Sign in to access your university portal</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" onClick={() => handleOAuth("google")}>
              Continue with Google
            </Button>
            <Button type="button" variant="outline" onClick={() => handleOAuth("apple")}>
              Continue with Apple
            </Button>
          </div>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-border" />
            <span className="mx-3 text-xs uppercase text-muted-foreground">or email</span>
            <div className="flex-grow border-t border-border" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@northbridge.edu"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-destructive/12 p-3 text-xs font-medium text-destructive">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-11 text-base gap-2">
              {loading ? "Signing in..." : "Login"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <Link href="/register" className="block">
            <Button type="button" variant="outline" className="w-full h-11">
              Create Account
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted-foreground">Loading login...</div>}>
      <LoginFormInner />
    </Suspense>
  );
}
