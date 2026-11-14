"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Search, X, ArrowRight } from "lucide-react";
import { CampusLogo } from "@/components/brand/CampusLogo";
import { ThemeToggle } from "@/components/brand/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PlatformCmsConfig } from "@/lib/cms";

export function PublicNavbar({
  cms,
  isAuthenticated,
  userRole,
}: {
  cms: PlatformCmsConfig;
  isAuthenticated: boolean;
  userRole?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const portalHref = userRole === "super_admin" ? "/admin" : "/portal/dashboard";

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 campus-glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <CampusLogo href="/" size="md" />

        <nav className="hidden items-center gap-1 lg:flex">
          {cms.navigation.items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-purple/10 text-purple font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/universities"
            aria-label="Explore Universities"
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Search className="h-4 w-4" />
          </Link>
          <ThemeToggle />
          {isAuthenticated ? (
            <Link href={portalHref}>
              <Button size="sm" className="gap-1.5">
                Open Workspace <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Join Campus.com</Button>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            className="rounded-xl border border-border p-2 text-foreground"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-card px-4 py-4 lg:hidden">
          <div className="flex flex-col space-y-1">
            {cms.navigation.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
            {isAuthenticated ? (
              <Link href={portalHref} onClick={() => setOpen(false)}>
                <Button className="w-full">Open Workspace</Button>
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setOpen(false)}>
                  <Button className="w-full">Join Campus.com</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
