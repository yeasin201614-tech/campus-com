"use client";

import { useState } from "react";
import { CheckCircle2, Save, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

const FLAG_META: Record<string, { label: string; desc: string }> = {
  marketplace_enabled: { label: "Campus Marketplace", desc: "Allow students to list used books, gear, and tutoring services." },
  realtime_chat_enabled: { label: "Real-Time Messaging", desc: "Enable Supabase Realtime 1-to-1 and group chats." },
  qr_checkin_enabled: { label: "QR Event Check-In", desc: "Generate cryptographic QR passes for registered event attendees." },
  public_university_signup: { label: "Public Registration", desc: "Allow self-service onboarding on /register." },
  mobile_offline_cache: { label: "Mobile Offline Cache", desc: "Persist recent notices and passes in mobile local storage." },
};

export function AdminFeaturesClient({ initialFlags }: { initialFlags: Record<string, boolean> }) {
  const [flags, setFlags] = useState<Record<string, boolean>>(initialFlags);
  const [msg, setMsg] = useState("");

  async function saveFlags() {
    setMsg("");
    const res = await fetch("/api/admin/cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "setting", settingKey: "feature_flags", settingValue: flags }),
    });
    setMsg(res.ok ? "Platform feature toggles updated!" : "Failed to update flags");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy dark:text-white">Feature Management</h1>
        <p className="text-sm text-muted-foreground">
          Control platform module availability globally across web and mobile clients.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <SlidersHorizontal className="h-4 w-4 text-purple" /> Module Feature Switches
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {Object.keys(FLAG_META).map((key) => {
            const meta = FLAG_META[key];
            return (
              <div key={key} className="flex items-center justify-between py-4">
                <div>
                  <p className="font-bold text-sm">{meta.label}</p>
                  <p className="text-xs text-muted-foreground">{meta.desc}</p>
                </div>
                <Switch
                  checked={Boolean(flags[key])}
                  onCheckedChange={(val) => setFlags((prev) => ({ ...prev, [key]: val }))}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {msg && (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-teal-600">
          <CheckCircle2 className="h-4 w-4" /> {msg}
        </p>
      )}

      <Button onClick={saveFlags} className="gap-2"><Save className="h-4 w-4" /> Save Feature Flags</Button>
    </div>
  );
}
