"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  Crown,
  GraduationCap,
  Home,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Search,
  Settings,
  ShoppingBag,
  User,
  Users,
  X,
} from "lucide-react";
import { CampusLogo } from "@/components/brand/CampusLogo";
import { ThemeToggle } from "@/components/brand/ThemeToggle";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, type Profile, type University, type UserRole } from "@campus/shared";

interface PortalShellProps {
  profile: Profile;
  university: University | null;
  effectiveRole: UserRole;
  unreadNotifications: number;
  unreadMessages: number;
  children: React.ReactNode;
}

export function PortalShell({
  profile,
  university,
  effectiveRole,
  unreadNotifications,
  unreadMessages,
  children,
}: PortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const isStaff =
    effectiveRole === "super_admin" ||
    effectiveRole === "university_admin" ||
    effectiveRole === "department_admin" ||
    effectiveRole === "teacher";

  const isUniAdmin = effectiveRole === "university_admin" || effectiveRole === "super_admin";

  const navItems = [
    { label: "Home", href: "/portal/dashboard", icon: Home },
    { label: "Community", href: "/portal/community", icon: Users },
    { label: "Groups", href: "/portal/groups", icon: GraduationCap },
    { label: "Events", href: "/portal/events", icon: CalendarDays },
    { label: "Notice Board", href: "/portal/notices", icon: Megaphone },
    { label: "Marketplace", href: "/portal/marketplace", icon: ShoppingBag },
    { label: "Messages", href: "/portal/messages", icon: MessageSquare, badge: unreadMessages },
    ...(isStaff ? [{ label: "Department & Classes", href: "/portal/department", icon: BookOpen }] : []),
    ...(isUniAdmin ? [{ label: "University Admin", href: "/portal/university", icon: Building2 }] : []),
    { label: "Profile", href: "/portal/profile", icon: User },
    { label: "Settings", href: "/portal/settings", icon: Settings },
  ];

  async function handleLogout() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchTerm.trim().length >= 2) {
      router.push(`/portal/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-navy text-white px-4 py-6">
      <div className="space-y-6">
        <div className="px-2">
          <CampusLogo href="/portal/dashboard" variant="light" size="md" />
          {university && (
            <div className="mt-4 rounded-xl bg-white/10 px-3 py-2 text-xs">
              <p className="font-bold truncate text-white">{university.name}</p>
              <p className="text-[11px] text-teal font-medium">{ROLE_LABELS[effectiveRole]}</p>
            </div>
          )}
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "campus-btn-gradient text-white shadow-md font-semibold"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {item.badge && item.badge > 0 ? (
                  <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}

          {effectiveRole === "super_admin" && (
            <Link
              href="/admin"
              className="mt-3 flex items-center gap-3 rounded-xl border border-teal/40 bg-teal/15 px-3.5 py-2.5 text-sm font-semibold text-teal hover:bg-teal/25"
            >
              <Crown className="h-4 w-4" />
              <span>Super Admin Panel</span>
            </Link>
          )}
        </nav>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
      >
        <LogOut className="h-4 w-4" />
        <span>Log Out</span>
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 w-64 h-full">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-white/80 hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-card/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-border p-2 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search on Campus... (universities, peers, events, groups)"
                className="pl-10 bg-muted/50"
              />
            </form>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/portal/notifications"
              className="relative rounded-xl p-2 hover:bg-muted"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-foreground" />
              {unreadNotifications > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
              )}
            </Link>
            <Link href="/portal/profile" className="flex items-center gap-2.5 rounded-xl px-2 py-1 hover:bg-muted">
              <Avatar src={profile.avatar_url} name={profile.full_name} size="sm" />
              <div className="hidden text-left sm:block">
                <p className="text-xs font-bold leading-tight">{profile.full_name}</p>
                <Badge className="mt-0.5 px-1.5 py-0 text-[10px]">{ROLE_LABELS[effectiveRole]}</Badge>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
