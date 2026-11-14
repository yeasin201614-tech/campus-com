import Link from "next/link";
import {
  Building2,
  CalendarDays,
  CreditCard,
  Download,
  GraduationCap,
  TrendingUp,
  Users,
  UsersRound,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GrowthChart } from "@/components/admin/GrowthChart";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";

export default async function SuperAdminDashboardPage() {
  await requireRole(["super_admin"]);
  const supabase = await createServerSupabaseClient();

  const [
    usersRes,
    unisRes,
    studentsRes,
    teachersRes,
    eventsRes,
    groupsRes,
    paymentsRes,
    auditRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("universities").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("global_role", "student"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("global_role", "teacher"),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("community_groups").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("payments").select("amount, status").eq("status", "succeeded"),
    supabase
      .from("audit_logs")
      .select("id, action, entity_type, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const totalRevenue = (paymentsRes.data ?? []).reduce((sum, p) => sum + Number(p.amount ?? 0), 0);

  const kpis = [
    { label: "Total Users", value: usersRes.count ?? 0, delta: "+12%", icon: Users, color: "text-purple bg-purple/10" },
    { label: "Universities", value: unisRes.count ?? 0, delta: "Multi-Tenant", icon: Building2, color: "text-navy bg-navy/10 dark:text-white" },
    { label: "Total Students", value: studentsRes.count ?? 0, delta: "Verified & Pending", icon: GraduationCap, color: "text-teal bg-teal/10" },
    { label: "Total Teachers", value: teachersRes.count ?? 0, delta: "Faculty", icon: Users, color: "text-blue-600 bg-blue-500/10" },
    { label: "Total Events", value: eventsRes.count ?? 0, delta: "+8%", icon: CalendarDays, color: "text-purple bg-purple/10" },
    { label: "Active Communities", value: groupsRes.count ?? 0, delta: "+10%", icon: UsersRound, color: "text-teal bg-teal/10" },
    { label: "Subscription Revenue", value: formatCurrency(totalRevenue), delta: "+15%", icon: CreditCard, color: "text-emerald-600 bg-emerald-500/10" },
    { label: "Monthly User Growth", value: "+18.4%", delta: "30d Trend", icon: TrendingUp, color: "text-purple bg-purple/10" },
  ];

  const growthSeries = [
    { label: "Jan", users: Math.max(20, (usersRes.count ?? 0) * 2), events: Math.max(8, (eventsRes.count ?? 0)) },
    { label: "Feb", users: Math.max(35, (usersRes.count ?? 0) * 3), events: Math.max(14, (eventsRes.count ?? 0) * 2) },
    { label: "Mar", users: Math.max(52, (usersRes.count ?? 0) * 4), events: Math.max(19, (eventsRes.count ?? 0) * 2) },
    { label: "Apr", users: Math.max(70, (usersRes.count ?? 0) * 5), events: Math.max(26, (eventsRes.count ?? 0) * 3) },
    { label: "May", users: Math.max(92, (usersRes.count ?? 0) * 6), events: Math.max(34, (eventsRes.count ?? 0) * 3) },
    { label: "Jun", users: Math.max(120, (usersRes.count ?? 0) * 8), events: Math.max(45, (eventsRes.count ?? 0) * 4) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy dark:text-white">
            Super Admin Command Center
          </h1>
          <p className="text-sm text-muted-foreground">
            Platform-wide telemetry, university approvals, CMS controls, billing, and security audit trail.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/api/admin/export?type=universities">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Export Universities CSV
            </Button>
          </a>
          <a href="/api/admin/export?type=users">
            <Button size="sm" className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Export Users CSV
            </Button>
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                  <p className="mt-1 text-2xl font-extrabold text-navy dark:text-white">{kpi.value}</p>
                  <Badge variant="teal" className="mt-2 text-[10px]">{kpi.delta}</Badge>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${kpi.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Platform Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <GrowthChart data={growthSeries} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activities</CardTitle>
            <Link href="/admin/audit-logs" className="text-xs font-semibold text-purple hover:underline">
              Full Audit Log →
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {(auditRes.data ?? []).length > 0 ? (
              auditRes.data!.map((log) => (
                <div key={log.id} className="flex items-center justify-between rounded-xl border border-border p-3 text-xs">
                  <div>
                    <p className="font-bold text-foreground">{log.action}</p>
                    <p className="text-muted-foreground">{log.entity_type}</p>
                  </div>
                  <span className="text-muted-foreground">{formatRelativeTime(log.created_at)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Administrative actions and platform mutations are logged here automatically.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
