"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Bell,
  BookUser,
  Building2,
  CalendarDays,
  CreditCard,
  Crown,
  FolderTree,
  Globe,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { CampusLogo } from "@/components/brand/CampusLogo";
import { ThemeToggle } from "@/components/brand/ThemeToggle";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { SUPER_ADMIN_NAV_ITEMS, type Profile } from "@campus/shared";

const ICON_MAP = {
  LayoutDashboard,
  Building2,
  Users,
  FolderTree,
  GraduationCap,
  BookUser,
  CalendarDays,
  UsersRound,
  ShoppingBag,
  Megaphone,
  Crown,
  CreditCard,
  BarChart3,
  Bell,
  Globe,
  Settings,
  SlidersHorizontal,
  LifeBuoy,
  ShieldCheck,
} as const;

export function AdminShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-navy text-white px-3 py-5 overflow-y-auto">
      <div className="px-2 pb-4 border-b border-white/10">
        <CampusLogo href="/admin" variant="light" size="sm" />
        <div className="mt-3 flex items-center justify-between">
          <Badge variant="teal" className="text-[10px]">Super Admin</Badge>
          <Link href="/portal/dashboard" className="text-[11px] text-slate-300 hover:text-white underline">
            Portal View
          </Link>
        </div>
      </div>

      <nav className="mt-4 flex-1 space-y-0.5">
        {SUPER_ADMIN_NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all",
                active
                  ? "campus-btn-gradient text-white shadow font-semibold"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Item #20: Logout */}
      <button
        type="button"
        onClick={handleLogout}
        className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
      >
        <LogOut className="h-4 w-4" />
        <span>Logout</span>
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 lg:block sticky top-0 h-screen">{sidebar}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 w-64 h-full">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1 text-white"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-border p-2 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search Admin Control Center..." className="pl-10 bg-muted/40" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/admin/notifications" className="rounded-xl p-2 hover:bg-muted" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Avatar src={profile.avatar_url} name={profile.full_name} size="sm" />
              <div className="hidden sm:block">
                <p className="text-xs font-bold">{profile.full_name}</p>
                <p className="text-[10px] text-purple font-semibold">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
