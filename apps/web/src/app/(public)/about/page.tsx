import Link from "next/link";
import { ArrowRight, Building2, Globe, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getWebsitePage } from "@/lib/cms";

export default async function AboutPage() {
  const cmsPage = await getWebsitePage("about");

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 space-y-14">
      <div className="mx-auto max-w-3xl text-center space-y-4">
        <Badge>About Campus.com</Badge>
        <h1 className="text-4xl font-extrabold text-navy dark:text-white">
          {cmsPage?.hero_title || "Reimagining the Connected Digital Campus"}
        </h1>
        <p className="text-base text-muted-foreground sm:text-lg">
          {cmsPage?.hero_description ||
            "Campus.com brings together institutional administration, academic communication, and vibrant student communities under one secure roof."}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            icon: Users,
            title: "Student-First Collaboration",
            desc: "Clubs, peer study feeds, real-time messaging, and peer marketplace built around real campus life.",
          },
          {
            icon: Building2,
            title: "Multi-University Isolation",
            desc: "Every university runs inside isolated PostgreSQL Row Level Security policies with custom branding and departments.",
          },
          {
            icon: ShieldCheck,
            title: "Enterprise Governance",
            desc: "Role-based access across Super Admin, University Admin, Department Admin, Faculty, Club Moderators, and Students.",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title}>
              <CardContent className="p-6 space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple/10 text-purple">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-navy dark:text-white">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="rounded-3xl campus-gradient p-8 text-white sm:p-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal">
            <Globe className="h-4 w-4" /> Connect • Collaborate • Grow
          </div>
          <h2 className="text-2xl font-extrabold">Ready to onboard your institution?</h2>
          <p className="text-sm text-white/80 max-w-xl">
            Register as a campus partner or explore active verified universities on Campus.com.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/universities">
            <Button variant="teal" className="gap-2">
              Explore Universities <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
