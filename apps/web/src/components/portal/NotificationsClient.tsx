"use client";

import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/utils";

export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export function NotificationsClient({
  userId,
  initialNotifications,
}: {
  userId: string;
  initialNotifications: NotificationRow[];
}) {
  const supabase = createBrowserSupabaseClient();
  const [items, setItems] = useState(initialNotifications);

  async function markAllRead() {
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("is_read", false);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function markOne(id: string) {
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-navy dark:text-white">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Event reminders, new announcements, messages, and community interactions.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={markAllRead} className="gap-1.5">
          <CheckCheck className="h-4 w-4" /> Mark All Read
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((n) => (
          <Card
            key={n.id}
            onClick={() => !n.is_read && markOne(n.id)}
            className={`cursor-pointer transition-colors ${!n.is_read ? "border-purple/40 bg-purple/5" : ""}`}
          >
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple/10 text-purple">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{n.title}</p>
                    {!n.is_read && <Badge>New</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                </div>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(n.created_at)}</span>
            </CardContent>
          </Card>
        ))}

        {items.length === 0 && (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            You are all caught up — no notifications right now.
          </Card>
        )}
      </div>
    </div>
  );
}
