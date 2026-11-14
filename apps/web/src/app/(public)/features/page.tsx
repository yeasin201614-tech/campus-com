import Link from "next/link";
import {
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  Crown,
  Globe,
  MessageSquare,
  QrCode,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FEATURE_MODULES = [
  {
    icon: Users,
    title: "Campus Community & Clubs",
    desc: "Topic feeds, images, likes, nested comments, public/private clubs, moderator approvals, and content reporting.",
  },
  {
    icon: CalendarDays,
    title: "Events & QR Check-in",
    desc: "Browse upcoming campus events, register in one tap, save favorites, and verify attendance with unique QR passes.",
  },
  {
    icon: MessageSquare,
    title: "Real-Time Chat & Groups",
    desc: "Supabase Realtime 1-to-1 and group conversations with image attachments, online presence, and read receipts.",
  },
  {
    icon: Bell,
    title: "Official Notice Board",
    desc: "University-wide, department-specific, academic, exam, and deadline alerts with priority pins and filters.",
  },
  {
    icon: ShoppingBag,
    title: "Student Marketplace",
    desc: "Campus-scoped buying and selling for used textbooks, lab gear, study notes, and tutoring services.",
  },
  {
    icon: Building2,
    title: "University & Department Ops",
    desc: "Departments, academic programs, student verification, faculty directories, academic years, and custom branding.",
  },
  {
    icon: Crown,
    title: "Super Admin & Website CMS",
    desc: "20-module command center with live Website CMS, theme editor, feature flags, subscriptions, and audit logs.",
  },
  {
    icon: Smartphone,
    title: "Native iOS & Android Apps",
    desc: "Expo React Native student apps with dark/light theme, QR ticket wallet, push alerts, and instant sync.",
  },
  {
    icon: Search,
    title: "Global Discovery Search",
    desc: "Search universities, students, faculty, departments, events, clubs, and community discussions in one query.",
  },
  {
    icon: QrCode,
    title: "Atomic QR Verification",
    desc: "Server-authorized SQL RPC prevents duplicate check-ins and enforces organizer/staff authorization.",
  },
  {
    icon: ShieldCheck,
    title: "PostgreSQL RLS Security",
    desc: "Zero-trust database Row Level Security enforces university isolation and prevents client privilege escalation.",
  },
  {
    icon: Globe,
    title: "Multi-Tier Subscriptions",
    desc: "Free, Standard, Premium, and Enterprise billing plans with monthly/yearly cycles and invoice history.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 space-y-12">
      <div className="mx-auto max-w-3xl text-center space-y-4">
        <Badge variant="teal">Platform Capabilities</Badge>
        <h1 className="text-4xl font-extrabold text-navy dark:text-white">
          Everything Required to Run a Connected University
        </h1>
        <p className="text-base text-muted-foreground">
          Built with Next.js App Router, Supabase PostgreSQL + Realtime + RLS, and Expo React Native.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURE_MODULES.map((feat) => {
          const Icon = feat.icon;
          return (
            <Card key={feat.title} className="transition-all hover:-translate-y-1">
              <CardHeader>
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-purple/10 text-purple">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle>{feat.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-navy text-white p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">6 Granular Roles with Server-Enforced Permissions</h2>
            <div className="flex flex-wrap gap-3 pt-1 text-xs text-slate-200">
              {["Super Admin", "University Admin", "Department Admin", "Teacher / Faculty", "Club Moderator", "Student"].map((r) => (
                <span key={r} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal" /> {r}
                </span>
              ))}
            </div>
          </div>
          <Link href="/register">
            <Button variant="teal" size="lg">Get Started Now</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
