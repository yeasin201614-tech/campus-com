"use client";

import { useState } from "react";
import { Bell, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function AdminNotificationsClient({ userIds }: { userIds: string[] }) {
  const supabase = createBrowserSupabaseClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  async function broadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim() || userIds.length === 0) return;
    setSending(true);
    setMsg("");
    try {
      const rows = userIds.map((uid) => ({
        user_id: uid,
        type: "system",
        title: title.trim(),
        body: body.trim(),
      }));
      const { error } = await supabase.from("notifications").insert(rows);
      if (error) setMsg(error.message);
      else {
        setMsg(`Broadcast sent to ${rows.length} platform users!`);
        setTitle("");
        setBody("");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy dark:text-white">Platform Notifications Broadcast</h1>
        <p className="text-sm text-muted-foreground">
          Send global system alerts, release announcements, or scheduled reminders across all users.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-purple" /> Compose Broadcast ({userIds.length} recipients)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={broadcast} className="space-y-4">
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification Title" />
            <Textarea required value={body} onChange={(e) => setBody(e.target.value)} placeholder="Broadcast message content..." />
            {msg && <p className="text-xs font-semibold text-teal-600">{msg}</p>}
            <Button type="submit" disabled={sending || userIds.length === 0} className="gap-2">
              <Send className="h-4 w-4" /> {sending ? "Sending..." : "Send Broadcast"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
