import Link from "next/link";
import { CalendarDays, MapPin, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { formatEventDate } from "@/lib/utils";

export default async function PublicEventsPage() {
  const { isConfigured } = getSupabasePublicConfig();
  let dbEvents: Array<Record<string, unknown>> = [];

  if (isConfigured) {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("events")
      .select("id, title, description, category, location, starts_at, registered_count, capacity")
      .eq("visibility", "public")
      .in("status", ["published", "ongoing"])
      .order("starts_at", { ascending: true })
      .limit(12);
    dbEvents = data ?? [];
  }

  const fallback = [
    {
      id: "ev-1",
      title: "Tech Fest 2026: AI & Campus Innovation",
      description: "Keynotes, startup pitches, robotics demos, and inter-university coding sprints.",
      category: "Technology",
      location: "University Main Auditorium",
      starts_at: new Date(Date.now() + 3 * 86400_000).toISOString(),
      registered_count: 312,
      capacity: 500,
    },
    {
      id: "ev-2",
      title: "Career Guidance & Alumni Mentorship Fair",
      description: "Resume reviews, live portfolio feedback, and internship networking with alumni.",
      category: "Career",
      location: "Innovation Seminar Hall",
      starts_at: new Date(Date.now() + 7 * 86400_000).toISOString(),
      registered_count: 185,
      capacity: 250,
    },
    {
      id: "ev-3",
      title: "Inter-Department Sports & E-Sports Cup",
      description: "Opening ceremony and team brackets across basketball, chess, and Valorant.",
      category: "Sports",
      location: "Campus Athletic Arena",
      starts_at: new Date(Date.now() + 11 * 86400_000).toISOString(),
      registered_count: 420,
      capacity: 600,
    },
  ];

  const items = dbEvents.length > 0 ? dbEvents : fallback;

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 space-y-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <Badge variant="teal">Campus Events</Badge>
          <h1 className="text-4xl font-extrabold text-navy dark:text-white">
            Upcoming Campus Events & Activities
          </h1>
          <p className="text-muted-foreground">
            Register in one click and get an instant QR pass inside your Campus.com portal and mobile app.
          </p>
        </div>
        <Link href="/portal/events">
          <Button>Register & Get QR Pass</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {items.map((ev) => (
          <Card key={String(ev.id)} className="overflow-hidden flex flex-col justify-between">
            <div>
              <div className="h-32 campus-gradient p-5 text-white flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <Badge className="bg-white/20 text-white">{String(ev.category)}</Badge>
                  <QrCode className="h-4 w-4 text-teal" />
                </div>
                <h3 className="text-lg font-bold leading-snug">{String(ev.title)}</h3>
              </div>
              <CardContent className="p-6 space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{String(ev.description)}</p>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-purple" />
                    {formatEventDate(String(ev.starts_at))}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-teal" />
                    {String(ev.location)}
                  </p>
                </div>
              </CardContent>
            </div>
            <div className="flex items-center justify-between border-t border-border px-6 py-4">
              <span className="text-xs font-semibold text-muted-foreground">
                {String(ev.registered_count)} {ev.capacity ? `/ ${String(ev.capacity)}` : ""} going
              </span>
              <Link href="/portal/events">
                <Button size="sm">Join Event</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
