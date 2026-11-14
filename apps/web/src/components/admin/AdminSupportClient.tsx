"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/utils";
import type { TicketStatus } from "@campus/shared";

interface TicketRow {
  id: string;
  contact_name: string;
  contact_email: string;
  subject: string;
  message: string;
  ticket_type: string;
  priority: string;
  status: TicketStatus;
  created_at: string;
}

export function AdminSupportClient({ initialTickets }: { initialTickets: TicketRow[] }) {
  const supabase = createBrowserSupabaseClient();
  const [tickets, setTickets] = useState(initialTickets);

  async function updateStatus(id: string, status: TicketStatus) {
    const { error } = await supabase
      .from("support_tickets")
      .update({
        status,
        resolved_at: status === "resolved" || status === "closed" ? new Date().toISOString() : null,
      })
      .eq("id", id);

    if (!error) {
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy dark:text-white">Support Tickets & Moderation Reports</h1>
        <p className="text-sm text-muted-foreground">
          Review public contact inquiries, billing tickets, and community/marketplace abuse reports.
        </p>
      </div>

      <div className="space-y-3">
        {tickets.map((t) => (
          <Card key={t.id}>
            <CardContent className="p-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="teal">{t.ticket_type}</Badge>
                  <Badge variant={t.status === "open" ? "warning" : t.status === "resolved" ? "teal" : "secondary"}>
                    {t.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(t.created_at)}</span>
                </div>
                <h3 className="font-bold">{t.subject}</h3>
                <p className="text-sm text-muted-foreground">{t.message}</p>
                <p className="text-xs font-medium text-foreground/80">
                  From: {t.contact_name} ({t.contact_email})
                </p>
              </div>
              <Select value={t.status} onChange={(e) => updateStatus(t.id, e.target.value as TicketStatus)} className="w-40 shrink-0">
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </Select>
            </CardContent>
          </Card>
        ))}

        {tickets.length === 0 && (
          <Card className="p-10 text-center text-sm text-muted-foreground">No support tickets submitted yet.</Card>
        )}
      </div>
    </div>
  );
}
