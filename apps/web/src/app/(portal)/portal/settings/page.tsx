"use client";

import { useState } from "react";
import { KeyRound, Palette, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/brand/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function PortalSettingsPage() {
  const supabase = createBrowserSupabaseClient();
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setMsg(error.message);
    else {
      setMsg("Password updated securely.");
      setNewPassword("");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy dark:text-white">Account Settings</h1>
        <p className="text-sm text-muted-foreground">Customize appearance and security credentials.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4 text-purple" /> Light & Dark Mode
          </CardTitle>
          <CardDescription>Switch between clean daylight mode and high-contrast night mode.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-sm font-medium">Toggle Theme</span>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-teal" /> Update Password
          </CardTitle>
          <CardDescription>Ensure your password has at least 8 characters.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={updatePassword} className="space-y-3">
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input
                type="password"
                minLength={8}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
              />
            </div>
            {msg && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-teal-600">
                <ShieldCheck className="h-4 w-4" /> {msg}
              </p>
            )}
            <Button type="submit">Update Password</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
