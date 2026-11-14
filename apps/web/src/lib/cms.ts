import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { SubscriptionPlan, University, WebsitePage } from "@campus/shared";

export interface PlatformCmsConfig {
  branding: {
    name: string;
    tagline: string;
    logo_url: string | null;
    support_email: string;
    copyright: string;
  };
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
  };
  navigation: {
    items: Array<{ label: string; href: string }>;
  };
  footer: {
    description: string;
    columns: Array<{ title: string; links: Array<{ label: string; href: string }> }>;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
    office_hours: string;
  };
  social: {
    twitter: string;
    linkedin: string;
    github: string;
    youtube: string;
  };
  seo: {
    title: string;
    description: string;
  };
  feature_flags: Record<string, boolean>;
  maintenance_mode: {
    enabled: boolean;
    message: string;
  };
  isSupabaseConfigured: boolean;
}

export const DEFAULT_CMS_CONFIG: PlatformCmsConfig = {
  branding: {
    name: "Campus.com",
    tagline: "Connect • Collaborate • Grow",
    logo_url: null,
    support_email: "support@campus.com",
    copyright: "© 2026 Campus.com Inc. All rights reserved.",
  },
  theme: {
    primary: "#101B62",
    secondary: "#6038ED",
    accent: "#19B99A",
    background: "#F7F8FC",
    surface: "#FFFFFF",
  },
  navigation: {
    items: [
      { label: "Home", href: "/" },
      { label: "Features", href: "/features" },
      { label: "Universities", href: "/universities" },
      { label: "Events", href: "/events" },
      { label: "Community", href: "/community" },
      { label: "Marketplace", href: "/marketplace" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  footer: {
    description:
      "A unified multi-university digital campus connecting students, faculty, clubs, and institutional administrators.",
    columns: [
      {
        title: "Platform",
        links: [
          { label: "About Campus.com", href: "/about" },
          { label: "Features", href: "/features" },
          { label: "Universities", href: "/universities" },
          { label: "Pricing", href: "/pricing" },
        ],
      },
      {
        title: "Community",
        links: [
          { label: "Campus Community", href: "/community" },
          { label: "Upcoming Events", href: "/events" },
          { label: "Marketplace", href: "/marketplace" },
          { label: "Help Center", href: "/help" },
        ],
      },
      {
        title: "Legal & Support",
        links: [
          { label: "Contact Us", href: "/contact" },
          { label: "Privacy Policy", href: "/privacy" },
          { label: "Terms & Conditions", href: "/terms" },
        ],
      },
    ],
  },
  contact: {
    email: "hello@campus.com",
    phone: "+1 (800) 555-0199",
    address: "420 University Innovation Way, Cambridge, MA 02139",
    office_hours: "Mon–Fri, 9:00 AM – 6:00 PM EST",
  },
  social: {
    twitter: "https://x.com/campuscom",
    linkedin: "https://linkedin.com/company/campuscom",
    github: "https://github.com/campuscom",
    youtube: "https://youtube.com/@campuscom",
  },
  seo: {
    title: "Campus.com — Connect • Collaborate • Grow",
    description:
      "Your Complete Multi-University Campus Community and Institutional Management Platform.",
  },
  feature_flags: {
    marketplace_enabled: true,
    realtime_chat_enabled: true,
    qr_checkin_enabled: true,
    public_university_signup: true,
    mobile_offline_cache: true,
  },
  maintenance_mode: {
    enabled: false,
    message:
      "Campus.com is undergoing scheduled maintenance to upgrade your campus experience.",
  },
  isSupabaseConfigured: false,
};

export async function getPlatformCmsConfig(): Promise<PlatformCmsConfig> {
  const { isConfigured } = getSupabasePublicConfig();
  if (!isConfigured) {
    return DEFAULT_CMS_CONFIG;
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("platform_settings")
      .select("setting_key, setting_value")
      .eq("is_public", true);

    if (error || !data) {
      return { ...DEFAULT_CMS_CONFIG, isSupabaseConfigured: true };
    }

    const map = new Map<string, Record<string, unknown>>();
    for (const row of data) {
      map.set(row.setting_key, row.setting_value as Record<string, unknown>);
    }

    return {
      branding: { ...DEFAULT_CMS_CONFIG.branding, ...(map.get("branding") ?? {}) },
      theme: { ...DEFAULT_CMS_CONFIG.theme, ...(map.get("theme") ?? {}) },
      navigation: {
        items:
          (map.get("navigation")?.items as Array<{ label: string; href: string }>) ??
          DEFAULT_CMS_CONFIG.navigation.items,
      },
      footer: { ...DEFAULT_CMS_CONFIG.footer, ...(map.get("footer") ?? {}) },
      contact: { ...DEFAULT_CMS_CONFIG.contact, ...(map.get("contact") ?? {}) },
      social: { ...DEFAULT_CMS_CONFIG.social, ...(map.get("social") ?? {}) },
      seo: { ...DEFAULT_CMS_CONFIG.seo, ...(map.get("seo") ?? {}) },
      feature_flags: {
        ...DEFAULT_CMS_CONFIG.feature_flags,
        ...((map.get("feature_flags") as Record<string, boolean>) ?? {}),
      },
      maintenance_mode: {
        ...DEFAULT_CMS_CONFIG.maintenance_mode,
        ...((map.get("maintenance_mode") as { enabled?: boolean; message?: string }) ?? {}),
      },
      isSupabaseConfigured: true,
    };
  } catch {
    return DEFAULT_CMS_CONFIG;
  }
}

export async function getWebsitePage(slug: string): Promise<WebsitePage | null> {
  const { isConfigured } = getSupabasePublicConfig();
  if (!isConfigured) return null;
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("website_pages")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    return (data as WebsitePage | null) ?? null;
  } catch {
    return null;
  }
}

export async function getPublicPricingPlans(): Promise<SubscriptionPlan[]> {
  const fallback: SubscriptionPlan[] = [
    {
      id: "11111111-1111-4111-8111-111111111101",
      name: "Free",
      slug: "free",
      description: "Essential digital campus starter for emerging clubs and pilot institutions.",
      price_monthly: 0,
      price_yearly: 0,
      currency: "USD",
      max_students: 500,
      max_departments: 5,
      storage_limit_gb: 5,
      features: ["Basic campus profile", "Limited community feed", "Basic announcements", "Up to 500 students"],
      enabled_modules: { community: true, events: true, notices: true, marketplace: false },
      is_popular: false,
      is_active: true,
      sort_order: 1,
    },
    {
      id: "11111111-1111-4111-8111-111111111102",
      name: "Standard",
      slug: "standard",
      description: "Complete campus community, events with QR check-in, and department workflows.",
      price_monthly: 99,
      price_yearly: 990,
      currency: "USD",
      max_students: 5000,
      max_departments: 25,
      storage_limit_gb: 50,
      features: ["Full community & clubs", "Events & QR check-in", "Campus marketplace", "Enhanced analytics"],
      enabled_modules: { community: true, events: true, notices: true, marketplace: true },
      is_popular: false,
      is_active: true,
      sort_order: 2,
    },
    {
      id: "11111111-1111-4111-8111-111111111103",
      name: "Premium",
      slug: "premium",
      description: "Multi-department governance, advanced analytics, custom campus branding, and priority SLA.",
      price_monthly: 249,
      price_yearly: 2490,
      currency: "USD",
      max_students: 25000,
      max_departments: 100,
      storage_limit_gb: 250,
      features: ["Advanced analytics & exports", "Extended management tools", "Custom university branding", "Priority 24/7 support"],
      enabled_modules: { community: true, events: true, notices: true, marketplace: true, custom_branding: true },
      is_popular: true,
      is_active: true,
      sort_order: 3,
    },
    {
      id: "11111111-1111-4111-8111-111111111104",
      name: "Enterprise",
      slug: "enterprise",
      description: "Unlimited multi-campus architecture, SSO, dedicated support engineer, and custom SLAs.",
      price_monthly: 599,
      price_yearly: 5990,
      currency: "USD",
      max_students: null,
      max_departments: null,
      storage_limit_gb: 1024,
      features: ["Unlimited students & departments", "Custom institutional features", "Dedicated support", "Compliance audit exports"],
      enabled_modules: { community: true, events: true, notices: true, marketplace: true, custom_branding: true },
      is_popular: false,
      is_active: true,
      sort_order: 4,
    },
  ];

  const { isConfigured } = getSupabasePublicConfig();
  if (!isConfigured) return fallback;

  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    return data && data.length > 0 ? (data as SubscriptionPlan[]) : fallback;
  } catch {
    return fallback;
  }
}

export async function getPublicUniversities(): Promise<University[]> {
  const { isConfigured } = getSupabasePublicConfig();
  if (!isConfigured) return [];
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("universities")
      .select("*")
      .eq("status", "verified")
      .order("is_featured", { ascending: false })
      .order("name", { ascending: true });
    return (data as University[]) ?? [];
  } catch {
    return [];
  }
}
