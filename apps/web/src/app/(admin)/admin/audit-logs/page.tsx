import { Download } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { AdminEntityDirectory } from "@/components/admin/AdminEntityDirectory";

export default async function AdminAuditLogsPage() {
  await requireRole(["super_admin"]);
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, created_at, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(150);

  const rows = (data ?? []).map((l) => ({
    id: l.id,
    actor: (l.profiles as { full_name?: string } | null)?.full_name ?? "System",
    action: l.action,
    entity_type: l.entity_type,
    entity_id: l.entity_id ?? "—",
    created_at: l.created_at,
  }));

  return (
    <AdminEntityDirectory
      title="Security & Compliance Audit Logs"
      subtitle="Immutable trail of administrative mutations, role updates, CMS changes, and QR event check-ins."
      columns={[
        { key: "actor", label: "Actor" },
        { key: "action", label: "Action", kind: "badge" },
        { key: "entity_type", label: "Target Table" },
        { key: "entity_id", label: "Target ID" },
        { key: "created_at", label: "Timestamp", kind: "date" },
      ]}
      rows={rows}
      actionSlot={
        <a href="/api/admin/export?type=audit_logs">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export Audit CSV
          </Button>
        </a>
      }
    />
  );
}
