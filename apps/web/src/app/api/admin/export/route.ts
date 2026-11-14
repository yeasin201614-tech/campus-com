import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function toCsv(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return "empty\n";
  const headers = Object.keys(rows[0]);
  const escape = (val: unknown) => {
    const s = typeof val === "object" && val !== null ? JSON.stringify(val) : String(val ?? "");
    return `"${s.replace(/"/g, '""')}"`;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

export async function GET(request: Request) {
  await requireRole(["super_admin"]);
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "universities";
  const supabase = await createServerSupabaseClient();

  let data: Array<Record<string, unknown>> = [];
  if (type === "users") {
    const res = await supabase.from("profiles").select("id, email, full_name, global_role, is_verified, is_active, created_at").limit(1000);
    data = res.data ?? [];
  } else if (type === "payments") {
    const res = await supabase.from("payments").select("id, university_id, invoice_number, amount, currency, status, provider, paid_at").limit(1000);
    data = res.data ?? [];
  } else if (type === "audit_logs") {
    const res = await supabase.from("audit_logs").select("id, actor_id, university_id, action, entity_type, entity_id, created_at").order("created_at", { ascending: false }).limit(1000);
    data = res.data ?? [];
  } else {
    const res = await supabase.from("universities").select("id, name, short_code, city, country, status, is_verified, student_capacity, created_at").limit(1000);
    data = res.data ?? [];
  }

  const csv = toCsv(data);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="campus-${type}-report.csv"`,
    },
  });
}
