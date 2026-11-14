"use client";

import { useState } from "react";
import { Crown, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import type { BillingCycle, SubscriptionPlan, SubscriptionStatus } from "@campus/shared";

interface SubRow {
  id: string;
  university_id: string;
  university_name: string;
  plan_id: string;
  plan_name: string;
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  current_period_end: string;
}

export function AdminSubscriptionsClient({
  plans,
  universities,
  initialSubs,
}: {
  plans: SubscriptionPlan[];
  universities: Array<{ id: string; name: string }>;
  initialSubs: SubRow[];
}) {
  const supabase = createBrowserSupabaseClient();
  const [subs, setSubs] = useState<SubRow[]>(initialSubs);
  const [uniId, setUniId] = useState(universities[0]?.id ?? "");
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [status, setStatus] = useState<SubscriptionStatus>("active");
  const [msg, setMsg] = useState("");

  async function assignSubscription(e: React.FormEvent) {
    e.preventDefault();
    if (!uniId || !planId) return;
    const { data, error } = await supabase
      .from("subscriptions")
      .upsert(
        {
          university_id: uniId,
          plan_id: planId,
          billing_cycle: cycle,
          status,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + (cycle === "yearly" ? 365 : 30) * 86400_000).toISOString(),
        },
        { onConflict: "university_id" }
      )
      .select()
      .single();

    if (error) setMsg(error.message);
    else if (data) {
      const uniName = universities.find((u) => u.id === uniId)?.name ?? "University";
      const planName = plans.find((p) => p.id === planId)?.name ?? "Plan";
      setSubs((prev) => {
        const nextRow: SubRow = {
          id: data.id,
          university_id: uniId,
          university_name: uniName,
          plan_id: planId,
          plan_name: planName,
          billing_cycle: cycle,
          status,
          current_period_end: data.current_period_end,
        };
        const exists = prev.some((s) => s.university_id === uniId);
        return exists ? prev.map((s) => (s.university_id === uniId ? nextRow : s)) : [nextRow, ...prev];
      });
      setMsg("University subscription plan updated!");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy dark:text-white">Subscriptions & Plans</h1>
        <p className="text-sm text-muted-foreground">
          Manage Free, Standard, Premium, and Enterprise tiers, trial status, and institutional upgrades/downgrades.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-navy dark:text-white">{p.name}</span>
                {p.is_popular && <Badge>Popular</Badge>}
              </div>
              <p className="text-xl font-extrabold">
                {formatCurrency(p.price_monthly)}/mo • {formatCurrency(p.price_yearly)}/yr
              </p>
              <p className="text-xs text-muted-foreground">{p.storage_limit_gb} GB storage</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-purple" /> Assign / Upgrade University Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={assignSubscription} className="grid gap-3 sm:grid-cols-5">
            <Select value={uniId} onChange={(e) => setUniId(e.target.value)} className="sm:col-span-2">
              {universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
            <Select value={planId} onChange={(e) => setPlanId(e.target.value)}>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
            <Select value={cycle} onChange={(e) => setCycle(e.target.value as BillingCycle)}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}>
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="past_due">Past Due</option>
              <option value="cancelled">Cancelled</option>
            </Select>
            <Button type="submit" className="sm:col-span-5 sm:w-fit gap-2">
              <Crown className="h-4 w-4" /> Save Subscription
            </Button>
          </form>
          {msg && <p className="mt-2 text-xs font-semibold text-teal-600">{msg}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-4">University</th>
                <th className="p-4">Plan</th>
                <th className="p-4">Billing Cycle</th>
                <th className="p-4">Status</th>
                <th className="p-4">Renewal Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subs.map((s) => (
                <tr key={s.id}>
                  <td className="p-4 font-bold">{s.university_name}</td>
                  <td className="p-4"><Badge>{s.plan_name}</Badge></td>
                  <td className="p-4 capitalize">{s.billing_cycle}</td>
                  <td className="p-4">
                    <Badge variant={s.status === "active" ? "teal" : s.status === "trialing" ? "default" : "destructive"}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {new Date(s.current_period_end).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
