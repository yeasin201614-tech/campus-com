import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "./config";

const PROTECTED_PORTAL_PREFIXES = [
  "/dashboard",
  "/community",
  "/groups",
  "/events",
  "/notices",
  "/marketplace",
  "/messages",
  "/notifications",
  "/profile",
  "/search",
  "/university",
  "/department",
  "/settings",
];

// Public website routes share /events, /community, /marketplace only as explicit public previews under /explore/*?
// Wait: let's keep public routes separate cleanly or inspect!
// Public routes from Section 5:
// /, /about, /features, /universities, /community (public preview), /events (public preview), /marketplace (public preview),
// /pricing, /contact, /help, /login, /register, /privacy, /terms
// Portal routes: /app/* or /portal/* OR exact paths? Let's check!
// Wait: if /community, /events, /marketplace are BOTH listed in Section 5 (Public Website Pages) AND Section 6/Portal,
// putting Portal routes under `/portal/*` (e.g., `/portal/dashboard`, `/portal/community`, `/portal/events`, `/portal/groups`,
// `/portal/notices`, `/portal/marketplace`, `/portal/messages`, `/portal/profile`, `/portal/university`, `/portal/department`,
// `/portal/search`, `/portal/notifications`, `/portal/settings`) AND Super Admin under `/admin/*` eliminates route collisions!
// Let's also allow `/dashboard` to redirect to `/portal/dashboard` cleanly!

export async function updateSession(request: NextRequest) {
  const { url, anonKey, isConfigured } = getSupabasePublicConfig();
  let supabaseResponse = NextResponse.next({ request });

  if (!isConfigured) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPortal = pathname.startsWith("/portal") || pathname === "/dashboard";
  const isAdmin = pathname.startsWith("/admin");

  if ((isPortal || isAdmin) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Maintenance mode check for public/portal routes (Super Admin always bypasses)
  if (!isAdmin && !pathname.startsWith("/login") && !pathname.startsWith("/maintenance") && !pathname.startsWith("/api")) {
    const { data: maint } = await supabase
      .from("platform_settings")
      .select("setting_value")
      .eq("setting_key", "maintenance_mode")
      .maybeSingle();

    const maintEnabled = Boolean((maint?.setting_value as { enabled?: boolean } | null)?.enabled);
    if (maintEnabled) {
      let isSuper = false;
      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("global_role")
          .eq("id", user.id)
          .maybeSingle();
        isSuper = prof?.global_role === "super_admin";
      }
      if (!isSuper) {
        const maintUrl = request.nextUrl.clone();
        maintUrl.pathname = "/maintenance";
        return NextResponse.redirect(maintUrl);
      }
    }
  }

  if (isAdmin && user) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("global_role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (!prof || prof.global_role !== "super_admin" || !prof.is_active) {
      const portalUrl = request.nextUrl.clone();
      portalUrl.pathname = "/portal/dashboard";
      return NextResponse.redirect(portalUrl);
    }
  }

  return supabaseResponse;
}

export { PROTECTED_PORTAL_PREFIXES };
