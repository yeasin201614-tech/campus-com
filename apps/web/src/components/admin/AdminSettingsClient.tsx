"use client";

import { useState } from "react";
import { CheckCircle2, Save, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { PlatformCmsConfig } from "@/lib/cms";

export function AdminSettingsClient({ cms }: { cms: PlatformCmsConfig }) {
  const [name, setName] = useState(cms.branding.name);
  const [tagline, setTagline] = useState(cms.branding.tagline);
  const [supportEmail, setSupportEmail] = useState(cms.branding.support_email);
  const [primary, setPrimary] = useState(cms.theme.primary);
  const [secondary, setSecondary] = useState(cms.theme.secondary);
  const [accent, setAccent] = useState(cms.theme.accent);
  const [maintenance, setMaintenance] = useState(cms.maintenance_mode.enabled);
  const [maintenanceMsg, setMaintenanceMsg] = useState(cms.maintenance_mode.message);
  const [statusMsg, setStatusMsg] = useState("");

  async function saveSetting(settingKey: string, settingValue: Record<string, unknown>) {
    const res = await fetch("/api/admin/cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "setting", settingKey, settingValue }),
    });
    return res.ok;
  }

  async function handleSaveAll(e: React.FormEvent) {
    e.preventDefault();
    setStatusMsg("");
    const ok1 = await saveSetting("branding", { ...cms.branding, name, tagline, support_email: supportEmail });
    const ok2 = await saveSetting("theme", { ...cms.theme, primary, secondary, accent });
    const ok3 = await saveSetting("maintenance_mode", { enabled: maintenance, message: maintenanceMsg });
    setStatusMsg(ok1 && ok2 && ok3 ? "App settings, branding & maintenance config updated!" : "Failed to save one or more settings");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy dark:text-white">App Settings & Branding</h1>
        <p className="text-sm text-muted-foreground">
          Configure global platform branding, theme colors, contact channels, and maintenance mode.
        </p>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Platform Identity & Theme Colors</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5"><Label>Brand Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Tagline</Label><Input value={tagline} onChange={(e) => setTagline(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Support Email</Label><Input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5"><Label>Primary Color</Label><Input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-10 p-1" /></div>
              <div className="space-y-1.5"><Label>Secondary Color</Label><Input type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)} className="h-10 p-1" /></div>
              <div className="space-y-1.5"><Label>Accent Teal</Label><Input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-10 p-1" /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2"><Wrench className="h-4 w-4 text-purple" /> Maintenance Mode</span>
              <Switch checked={maintenance} onCheckedChange={setMaintenance} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={maintenanceMsg} onChange={(e) => setMaintenanceMsg(e.target.value)} placeholder="Public maintenance banner message..." />
          </CardContent>
        </Card>

        {statusMsg && (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-teal-600">
            <CheckCircle2 className="h-4 w-4" /> {statusMsg}
          </p>
        )}

        <Button type="submit" className="gap-2"><Save className="h-4 w-4" /> Save App Settings</Button>
      </form>
    </div>
  );
}
