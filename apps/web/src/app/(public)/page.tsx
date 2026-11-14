import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Lock,
  MessageSquare,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PricingGrid } from "@/components/public/PricingGrid";
import { FAQAccordion, type FaqItem } from "@/components/public/FAQAccordion";
import { getPublicPricingPlans, getPublicUniversities, getWebsitePage } from "@/lib/cms";
import { CampusLogo } from "@/components/brand/CampusLogo";

const DEFAULT_HIGHLIGHTS = [
  "Stay Updated with verified notices",
  "Make Connections across clubs & peers",
  "Manage Campus Life & QR events",
  "Build Your Future with faculty & resources",
];

const DEFAULT_TESTIMONIALS = [
  {
    quote:
      "Campus.com replaced four disconnected tools and lifted student event attendance by 42% in one semester.",
    author: "Dr. Elena Vance",
    role: "Dean of Student Life, Northbridge University",
  },
  {
    quote:
      "Finding study groups, buying semester textbooks, and checking department notices in one app changed everything.",
    author: "Rahat Karim",
    role: "Computer Science Senior, Metropolitan Tech",
  },
  {
    quote:
      "Our club approvals and QR event check-ins went from spreadsheets to instant mobile workflows.",
    author: "Sofia Mendoza",
    role: "President, Robotics Society",
  },
];

const DEFAULT_FAQS: FaqItem[] = [
  {
    q: "How does multi-university data isolation work?",
    a: "Every university operates inside strict PostgreSQL Row Level Security boundaries so student records, private notices, and admin reports stay completely isolated.",
  },
  {
    q: "Can students use both web and iOS/Android apps?",
    a: "Yes. Campus.com shares a real-time Supabase backend across Next.js web and Expo React Native mobile apps.",
  },
  {
    q: "How does QR event check-in work?",
    a: "When a student registers for an event, a unique cryptographically random QR ticket token is generated and verified at the door by event organizers.",
  },
  {
    q: "Can our university customize branding and domains?",
    a: "Premium and Enterprise plans support custom university logos, accent colors, and dedicated institutional settings.",
  },
];

export default async function HomePage() {
  const [homePage, plans, universities] = await Promise.all([
    getWebsitePage("home"),
    getPublicPricingPlans(),
    getPublicUniversities(),
  ]);

  const sections = (homePage?.sections ?? []) as Array<{
    id?: string;
    items?: unknown[];
  }>;

  const highlights =
    (sections.find((s) => s.id === "highlights")?.items as string[]) ?? DEFAULT_HIGHLIGHTS;
  const testimonials =
    (sections.find((s) => s.id === "testimonials")?.items as typeof DEFAULT_TESTIMONIALS) ??
    DEFAULT_TESTIMONIALS;
  const faqs = (sections.find((s) => s.id === "faq")?.items as FaqItem[]) ?? DEFAULT_FAQS;

  const displayUniversities =
    universities.length > 0
      ? universities.slice(0, 3)
      : [
          {
            id: "demo-1",
            name: "Northbridge University",
            slug: "northbridge-university",
            city: "Cambridge",
            country: "United States",
            short_code: "NBU",
            description: "Research innovation, engineering, and 120+ student societies.",
            brand_color: "#101B62",
          },
          {
            id: "demo-2",
            name: "Metropolitan Institute of Technology",
            slug: "metropolitan-tech",
            city: "Toronto",
            country: "Canada",
            short_code: "MITX",
            description: "STEM excellence, robotics labs, and digital startup incubators.",
            brand_color: "#6038ED",
          },
          {
            id: "demo-3",
            name: "Pacific Crest University",
            slug: "pacific-crest-university",
            city: "Seattle",
            country: "United States",
            short_code: "PCU",
            description: "Interactive design, marine sciences, and interdisciplinary studios.",
            brand_color: "#19B99A",
          },
        ];

  return (
    <div className="overflow-x-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative bg-gradient-to-b from-purple-50/70 via-background to-background pt-12 pb-20 dark:from-navy-950 dark:via-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5 space-y-6">
              <Badge className="px-3.5 py-1 text-xs">
                <Sparkles className="h-3.5 w-3.5" /> Multi-University SaaS Platform
              </Badge>
              <h1 className="text-4xl font-extrabold tracking-tight text-navy dark:text-white sm:text-5xl leading-[1.12]">
                {homePage?.hero_title ? (
                  homePage.hero_title
                ) : (
                  <>
                    Your Complete Campus Community{" "}
                    <span className="text-purple">Platform</span>
                  </>
                )}
              </h1>
              <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                {homePage?.hero_description ||
                  "A unified platform for students, faculty, clubs, and institutions to connect, collaborate, and grow together."}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link href={homePage?.hero_cta_url || "/register"}>
                  <Button size="lg" className="gap-2">
                    {homePage?.hero_cta_text || "Join Campus.com"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/universities">
                  <Button size="lg" variant="outline">
                    Explore Universities
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="teal">
                    Get Started
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {highlights.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-xs font-medium text-foreground/85 sm:text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Multi-Device Visual Showcase matching uploaded mockups */}
            <div className="lg:col-span-7">
              <div className="relative mx-auto max-w-2xl rounded-3xl border border-border/70 bg-card/80 p-4 shadow-campus-lg backdrop-blur">
                <div className="grid gap-4 sm:grid-cols-12">
                  {/* Left Phone Mockup */}
                  <div className="sm:col-span-4 rounded-2xl border border-navy/15 bg-background p-3 shadow-md">
                    <div className="mb-3 flex items-center justify-between">
                      <CampusLogo href="" size="sm" />
                      <Bell className="h-4 w-4 text-purple" />
                    </div>
                    <div className="rounded-xl campus-gradient p-3 text-white">
                      <p className="text-xs opacity-80">Welcome back</p>
                      <p className="text-sm font-bold">Hello, Rahat!</p>
                      <div className="mt-2 rounded-lg bg-white/15 p-2 text-[11px]">
                        <p className="font-semibold">Next: Tech Fest 2026</p>
                        <p className="opacity-80">Main Auditorium • 10:00 AM</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-[10px] font-semibold">
                      <div className="rounded-lg bg-purple/10 p-2 text-purple">Events</div>
                      <div className="rounded-lg bg-teal/10 p-2 text-teal-600">Groups</div>
                      <div className="rounded-lg bg-navy/10 p-2 text-navy dark:text-white">Notices</div>
                    </div>
                  </div>

                  {/* Center Web Portal Preview */}
                  <div className="sm:col-span-8 rounded-2xl border border-border bg-card p-3 shadow-md">
                    <div className="flex gap-3">
                      <div className="hidden w-28 shrink-0 rounded-xl bg-navy p-2.5 text-[11px] text-white/80 sm:block">
                        <p className="mb-3 font-bold text-white">Campus.com</p>
                        <div className="space-y-1.5">
                          <div className="rounded-lg bg-purple px-2 py-1 font-semibold text-white">Home</div>
                          <div className="px-2 py-1">Groups</div>
                          <div className="px-2 py-1">Events</div>
                          <div className="px-2 py-1">Notice Board</div>
                          <div className="px-2 py-1">Marketplace</div>
                          <div className="px-2 py-1">Messages</div>
                        </div>
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="rounded-xl campus-gradient p-4 text-white">
                          <p className="text-base font-bold">Welcome to Campus.com</p>
                          <p className="mt-1 text-xs text-white/80">
                            Connect with your campus community, stay updated, and grow together!
                          </p>
                          <span className="mt-3 inline-flex items-center gap-1 rounded-lg bg-white/20 px-2.5 py-1 text-xs font-semibold">
                            Explore Now <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-xl border border-border bg-background p-2.5">
                            <p className="font-bold text-navy dark:text-white">Upcoming Events</p>
                            <p className="text-[11px] text-muted-foreground">AI & Robotics Expo</p>
                          </div>
                          <div className="rounded-xl border border-border bg-background p-2.5">
                            <p className="font-bold text-navy dark:text-white">Recent Activity</p>
                            <p className="text-[11px] text-muted-foreground">CS Club • 2m ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PLATFORM FEATURE PLAN (4 Columns matching Mockup 2) */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <Badge variant="teal" className="mb-2">Platform Architecture</Badge>
              <h2 className="text-3xl font-extrabold text-navy dark:text-white">
                One Ecosystem, Four Powerful Experiences
              </h2>
            </div>
            <Link href="/features" className="text-sm font-semibold text-purple hover:underline">
              Explore all capabilities →
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Mobile Application",
                badge: "Android & iOS (Expo)",
                icon: Smartphone,
                color: "bg-blue-600",
                items: [
                  "Personalized Student Dashboard",
                  "Events & QR Check-in",
                  "Clubs & Group Discussions",
                  "Notice Board & Alerts",
                  "Real-time 1:1 & Group Chat",
                  "Campus Marketplace",
                  "Dark / Light Theme",
                ],
              },
              {
                title: "Website Application",
                badge: "Next.js Web Browser",
                icon: BookOpen,
                color: "bg-teal",
                items: [
                  "Dynamic CMS Public Site",
                  "University Directory Showcase",
                  "Student & Faculty Portal",
                  "Global Multi-Entity Search",
                  "Department Resource Sharing",
                  "Secure Auth & Role Routing",
                  "Mobile-First Responsive UI",
                ],
              },
              {
                title: "Super Admin Dashboard",
                badge: "Control from One Place",
                icon: ShieldCheck,
                color: "bg-purple",
                items: [
                  "Platform Growth Analytics",
                  "University Approval & Isolation",
                  "User & Role Governance",
                  "Website CMS & Theme Editor",
                  "Feature Flag Management",
                  "Subscriptions & Invoices",
                  "Immutable Audit Logs",
                ],
              },
              {
                title: "Institutional Suite",
                badge: "University & Department",
                icon: Building2,
                color: "bg-navy",
                items: [
                  "University Custom Branding",
                  "Department & Program Setup",
                  "Student Verification Workflow",
                  "Faculty Class Assignment",
                  "Academic Year Management",
                  "Targeted Exam Notices",
                  "Institutional Reports",
                ],
              },
            ].map((col) => {
              const Icon = col.icon;
              return (
                <Card key={col.title} className="overflow-hidden border-border/90">
                  <div className={`${col.color} px-5 py-4 text-white`}>
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-5 w-5" />
                      <h3 className="font-bold">{col.title}</h3>
                    </div>
                    <p className="mt-1 text-xs text-white/80">{col.badge}</p>
                  </div>
                  <CardContent className="pt-5">
                    <ul className="space-y-2.5 text-sm">
                      {col.items.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. UNIVERSITY SHOWCASE */}
      <section className="bg-muted/40 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <Badge className="mb-2">Verified Institutions</Badge>
              <h2 className="text-3xl font-extrabold text-navy dark:text-white">
                Universities Thriving on Campus.com
              </h2>
            </div>
            <Link href="/universities">
              <Button variant="outline">View All Universities</Button>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {displayUniversities.map((uni) => (
              <Card key={uni.id} className="group overflow-hidden transition-all hover:-translate-y-1">
                <div
                  className="h-24 p-5 text-white flex items-end justify-between"
                  style={{
                    background: `linear-gradient(135deg, ${uni.brand_color || "#101B62"}, #6038ED)`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 font-extrabold backdrop-blur">
                      {uni.short_code}
                    </div>
                    <div>
                      <h3 className="font-bold leading-tight">{uni.name}</h3>
                      <p className="text-xs text-white/80">
                        {uni.city}, {uni.country}
                      </p>
                    </div>
                  </div>
                </div>
                <CardContent className="pt-4 space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">{uni.description}</p>
                  <Link
                    href={`/universities/${uni.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-purple hover:underline"
                  >
                    Explore Campus <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4. STUDENT COMMUNITY & UPCOMING EVENTS PREVIEW */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple" />
                  <h3 className="text-xl font-bold text-navy dark:text-white">Student Community</h3>
                </div>
                <Link href="/community" className="text-sm font-semibold text-purple hover:underline">
                  Explore Feed →
                </Link>
              </div>
              <div className="space-y-3">
                {[
                  {
                    club: "Computer Science Club",
                    author: "Rifat Ahmed",
                    text: "Sharing our open-source AI Hackathon starter templates & team matching spreadsheet!",
                    time: "2m ago",
                  },
                  {
                    club: "Robotics & Autonomous Systems",
                    author: "Nusrat Jahan",
                    text: "Lab orientation starts Thursday at Tesla Wing 302 — bring your student ID card.",
                    time: "18m ago",
                  },
                ].map((post) => (
                  <div key={post.author} className="rounded-xl border border-border/70 bg-background p-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-semibold text-purple">{post.club}</span>
                      <span>{post.time}</span>
                    </div>
                    <p className="mt-1 text-sm font-bold">{post.author}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{post.text}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-teal" />
                  <h3 className="text-xl font-bold text-navy dark:text-white">Upcoming Events</h3>
                </div>
                <Link href="/events" className="text-sm font-semibold text-purple hover:underline">
                  Browse Events →
                </Link>
              </div>
              <div className="space-y-3">
                {[
                  {
                    title: "Annual University Tech Fest 2026",
                    date: "Apr 25 • 10:00 AM",
                    venue: "Main Auditorium",
                    tag: "QR Check-in Enabled",
                  },
                  {
                    title: "Career Guidance & Alumni Mentorship Summit",
                    date: "Apr 28 • 2:00 PM",
                    venue: "Innovation Seminar Hall",
                    tag: "Open Registration",
                  },
                ].map((ev) => (
                  <div
                    key={ev.title}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-background p-4"
                  >
                    <div>
                      <Badge variant="teal" className="mb-1.5">{ev.tag}</Badge>
                      <p className="font-bold text-navy dark:text-white">{ev.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {ev.date} • {ev.venue}
                      </p>
                    </div>
                    <Link href="/events">
                      <Button size="sm">Join</Button>
                    </Link>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. KEY CAPABILITY HIGHLIGHTS STRIP */}
      <section className="border-y border-border bg-card py-10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 sm:grid-cols-3 lg:grid-cols-7 sm:px-6 lg:px-8">
          {[
            { icon: Zap, label: "Real-Time Updates" },
            { icon: Lock, label: "RLS Tenant Security" },
            { icon: Smartphone, label: "Web + iOS + Android" },
            { icon: TrendingUp, label: "Growth Analytics" },
            { icon: QrCode, label: "QR Event Passes" },
            { icon: MessageSquare, label: "Live Campus Chat" },
            { icon: ShoppingBag, label: "Student Marketplace" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex flex-col items-center gap-2 rounded-2xl border border-border/70 bg-background p-4 text-center"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple/10 text-purple">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold">{item.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. TESTIMONIALS */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <Badge className="mb-2">Campus Voices</Badge>
            <h2 className="text-3xl font-extrabold text-navy dark:text-white">
              Trusted by Students, Faculty & Deans
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.author} className="p-6">
                <CardHeader className="p-0 pb-3">
                  <GraduationCap className="h-6 w-6 text-purple" />
                </CardHeader>
                <p className="text-sm leading-relaxed text-muted-foreground">“{t.quote}”</p>
                <div className="mt-5 border-t border-border pt-4">
                  <p className="text-sm font-bold text-navy dark:text-white">{t.author}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 7. PRICING PLANS */}
      <section className="bg-muted/40 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center space-y-2">
            <Badge variant="teal">Institutional Plans</Badge>
            <h2 className="text-3xl font-extrabold text-navy dark:text-white">
              Flexible Plans for Every Institution
            </h2>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
              Start with a Free pilot campus and scale effortlessly across every department and student body.
            </p>
          </div>
          <PricingGrid plans={plans} />
        </div>
      </section>

      {/* 8. FAQ & BOTTOM CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-extrabold text-navy dark:text-white">
              Frequently Asked Questions
            </h2>
          </div>
          <FAQAccordion items={faqs} />

          <div className="mt-14 rounded-3xl campus-gradient p-8 text-center text-white shadow-campus-lg sm:p-12">
            <h2 className="text-2xl font-extrabold sm:text-3xl">
              Build a Connected Campus with Campus.com
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/80 sm:text-base">
              Launch your university portal, mobile student apps, and Super Admin workspace in minutes.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/register">
                <Button size="lg" variant="teal" className="gap-2">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                  Request Campus Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
