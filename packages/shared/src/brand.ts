export const CAMPUS_BRAND = {
  name: "Campus.com",
  tagline: "Connect • Collaborate • Grow",
  colors: {
    primary: "#101B62",      // Navy Blue
    secondary: "#6038ED",    // Royal Purple
    accent: "#19B99A",       // Teal
    background: "#F7F8FC",   // Soft Ice Background
    white: "#FFFFFF",
    darkBg: "#090D24",
    darkSurface: "#11173B",
    darkBorder: "#232C5C",
    mutedText: "#64748B",
    danger: "#EF4444",
    warning: "#F59E0B",
  },
} as const;

export const SUPER_ADMIN_NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { key: "universities", label: "Universities", href: "/admin/universities", icon: "Building2" },
  { key: "users", label: "Users", href: "/admin/users", icon: "Users" },
  { key: "departments", label: "Departments", href: "/admin/departments", icon: "FolderTree" },
  { key: "students", label: "Students", href: "/admin/students", icon: "GraduationCap" },
  { key: "teachers", label: "Teachers", href: "/admin/teachers", icon: "BookUser" },
  { key: "events", label: "Events", href: "/admin/events", icon: "CalendarDays" },
  { key: "communities", label: "Communities", href: "/admin/communities", icon: "UsersRound" },
  { key: "marketplace", label: "Marketplace", href: "/admin/marketplace", icon: "ShoppingBag" },
  { key: "notices", label: "Notice Board", href: "/admin/notices", icon: "Megaphone" },
  { key: "subscriptions", label: "Subscriptions", href: "/admin/subscriptions", icon: "Crown" },
  { key: "payments", label: "Payments", href: "/admin/payments", icon: "CreditCard" },
  { key: "analytics", label: "Analytics", href: "/admin/analytics", icon: "BarChart3" },
  { key: "notifications", label: "Notifications", href: "/admin/notifications", icon: "Bell" },
  { key: "cms", label: "Website CMS", href: "/admin/cms", icon: "Globe" },
  { key: "settings", label: "App Settings", href: "/admin/settings", icon: "Settings" },
  { key: "features", label: "Feature Management", href: "/admin/features", icon: "SlidersHorizontal" },
  { key: "support", label: "Support Tickets", href: "/admin/support", icon: "LifeBuoy" },
  { key: "audit", label: "Audit Logs", href: "/admin/audit-logs", icon: "ShieldCheck" },
] as const;
