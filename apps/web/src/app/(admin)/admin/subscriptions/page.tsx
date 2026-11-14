import { requireRole } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminSubscriptionsClient } from "@/components/admin/AdminSubscriptionsClient";
import type { SubscriptionPlan } from "@campus/shared";

export default async function AdminSubscriptionsPage() {
  await requireRole(["super_admin"]);
  const supabase = await createServerSupabaseClient();

  const [{ data: plans }, { data: unis }, { data: subs }] = await Promise.all([
    supabase.from("subscription_plans").select("*").order("sort_order"),
    supabase.from("universities").select("id, name").order("name"),
    supabase
      .from("subscriptions")
      .select("id, university_id, plan_id, billing_cycle, status, current_period_end, universities(name), subscription_plans(name)")
      .order("created_at", { ascending: false }),
  ]);

  const initialSubs = (subs ?? []).map((s) => ({
    id: s.id,
    university_id: s.university_id,
    university_name: (s.universities as { name?: string } | null)?.name ?? "University",
    plan_id: s.plan_id,
    plan_name: (s.subscription_plans as { name?: string } | null)?.name ?? "Plan",
    billing_cycle: s.billing_cycle,
    status: s.status,
    current_period_end: s.current_period_end,
  }));

  return (
    <AdminSubscriptionsClient
      plans={(plans as SubscriptionPlan[]) ?? []}
      universities={unis ?? []}
      initialSubs={initialSubs}
    />
  );
}
