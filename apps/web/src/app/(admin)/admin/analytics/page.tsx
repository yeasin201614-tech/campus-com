import { Download } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GrowthChart } from "@/components/admin/GrowthChart";

export default async function AdminAnalyticsPage() {
  await requireRole(["super_admin"]);
  const supabase = await createServerSupabaseClient();

  const [postsCount, msgsCount, regsCount, listingsCount] = await Promise.all([
    supabase.from("campus_posts").select("*", { count: "exact", head: true }),
    supabase.from("messages").select("*", { count: "exact", head: true }),
    supabase.from("event_registrations").select("*", { count: "exact", head: true }),
    supabase.from("marketplace_listings").select("*", { count: "exact", head: true }),
  ]);

  const series = [
    { label: "W1", users: 18, events: 6 },
    { label: "W2", users: 29, events: 11 },
    { label: "W3", users: 41, events: 15 },
    { label: "W4", users: 54, events: 22 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy dark:text-white">Platform Analytics & Reports</h1>
          <p className="text-sm text-muted-foreground">Engagement metrics across community, messaging, events, and marketplace.</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/admin/export?type=universities">
            <Button size="sm" variant="outline" className="gap-1.5"><Download className="h-3.5 w-3.5" /> Universities CSV</Button>
          </a>
          <a href="/api/admin/export?type=audit_logs">
            <Button size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" /> Audit Logs CSV</Button>
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Community Posts</p><p className="text-2xl font-extrabold">{postsCount.count ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Messages Sent</p><p className="text-2xl font-extrabold">{msgsCount.count ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Event Registrations</p><p className="text-2xl font-extrabold">{regsCount.count ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Marketplace Listings</p><p className="text-2xl font-extrabold">{listingsCount.count ?? 0}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Monthly Engagement Trajectory</CardTitle></CardHeader>
        <CardContent><GrowthChart data={series} /></CardContent>
      </Card>
    </div>
  );
}
