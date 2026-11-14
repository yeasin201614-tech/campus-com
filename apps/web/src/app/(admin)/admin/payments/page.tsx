import { Download } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { AdminEntityDirectory } from "@/components/admin/AdminEntityDirectory";

export default async function AdminPaymentsPage() {
  await requireRole(["super_admin"]);
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("payments")
    .select("id, invoice_number, amount, currency, status, provider, payment_method_summary, paid_at, universities(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []).map((p) => ({
    id: p.id,
    invoice_number: p.invoice_number,
    university: (p.universities as { name?: string } | null)?.name ?? "—",
    total: `${p.currency} ${p.amount}`,
    method: p.payment_method_summary ?? p.provider,
    status: p.status,
    paid_at: p.paid_at,
  }));

  return (
    <AdminEntityDirectory
      title="Payments & Invoices"
      subtitle="Verified billing history and invoice ledger (raw card details are never stored)."
      columns={[
        { key: "invoice_number", label: "Invoice #" },
        { key: "university", label: "University" },
        { key: "total", label: "Amount" },
        { key: "method", label: "Method" },
        { key: "status", label: "Status", kind: "badge" },
        { key: "paid_at", label: "Paid Date", kind: "date" },
      ]}
      rows={rows}
      actionSlot={
        <a href="/api/admin/export?type=payments">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export Payments CSV
          </Button>
        </a>
      }
    />
  );
}
