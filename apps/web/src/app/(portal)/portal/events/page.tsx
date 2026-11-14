import { requireAuthContext } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EventsClient, type EventRow } from "@/components/portal/EventsClient";

export default async function PortalEventsPage() {
  const auth = await requireAuthContext();
  const supabase = await createServerSupabaseClient();

  const [{ data: events }, { data: regs }] = await Promise.all([
    supabase.from("events").select("*").order("starts_at", { ascending: true }),
    supabase.from("event_registrations").select("*").eq("user_id", auth.userId),
  ]);

  const regMap = new Map((regs ?? []).map((r) => [r.event_id, r]));
  const rows: EventRow[] = (events ?? []).map((ev) => {
    const r = regMap.get(ev.id);
    return {
      id: ev.id,
      title: ev.title,
      description: ev.description ?? "",
      category: ev.category,
      location: ev.location,
      starts_at: ev.starts_at,
      ends_at: ev.ends_at,
      capacity: ev.capacity,
      registered_count: ev.registered_count,
      my_status: r?.status ?? null,
      my_favorite: Boolean(r?.is_favorite),
      my_qr_token: r?.qr_token ?? null,
    };
  });

  return (
    <EventsClient
      userId={auth.userId}
      universityId={auth.profile.primary_university_id}
      userRole={auth.effectiveRole}
      initialEvents={rows}
    />
  );
}
