import { requireRole } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminEntityDirectory } from "@/components/admin/AdminEntityDirectory";

export default async function AdminMarketplacePage() {
  await requireRole(["super_admin"]);
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("marketplace_listings")
    .select("id, title, price, currency, condition, status, report_count, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []).map((m) => ({
    ...m,
    amount: `${m.currency} ${m.price}`,
  }));

  return (
    <AdminEntityDirectory
      title="Marketplace Moderation"
      subtitle="Monitor campus listings, flagged items, and trade activity."
      columns={[
        { key: "title", label: "Listing Title" },
        { key: "amount", label: "Price" },
        { key: "condition", label: "Condition", kind: "badge" },
        { key: "status", label: "Status", kind: "badge" },
        { key: "report_count", label: "Reports" },
        { key: "created_at", label: "Listed", kind: "date" },
      ]}
      rows={rows}
    />
  );
}
