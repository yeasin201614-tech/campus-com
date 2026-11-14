import { requireRole } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminEntityDirectory } from "@/components/admin/AdminEntityDirectory";

export default async function AdminEventsPage() {
  await requireRole(["super_admin"]);
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("events")
    .select("id, title, category, location, starts_at, registered_count, status")
    .order("starts_at", { ascending: false })
    .limit(100);

  return (
    <AdminEntityDirectory
      title="Campus Events Oversight"
      subtitle="Platform-wide campus events, registration volume, and event status."
      columns={[
        { key: "title", label: "Event Title" },
        { key: "category", label: "Category", kind: "badge" },
        { key: "location", label: "Venue" },
        { key: "registered_count", label: "Registered" },
        { key: "status", label: "Status", kind: "badge" },
        { key: "starts_at", label: "Starts At", kind: "date" },
      ]}
      rows={data ?? []}
    />
  );
}
