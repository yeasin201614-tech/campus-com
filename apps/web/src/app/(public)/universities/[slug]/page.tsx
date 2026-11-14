import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, CheckCircle2, Globe, Mail, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export default async function UniversityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { isConfigured } = getSupabasePublicConfig();

  let university: Record<string, unknown> | null = null;
  let departments: Array<Record<string, unknown>> = [];
  let events: Array<Record<string, unknown>> = [];

  if (isConfigured) {
    const supabase = await createServerSupabaseClient();
    const { data: uni } = await supabase
      .from("universities")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (uni) {
      university = uni;
      const [deptRes, evRes] = await Promise.all([
        supabase.from("departments").select("*").eq("university_id", uni.id).eq("is_active", true),
        supabase
          .from("events")
          .select("*")
          .eq("university_id", uni.id)
          .eq("visibility", "public")
          .order("starts_at", { ascending: true })
          .limit(6),
      ]);
      departments = deptRes.data ?? [];
      events = evRes.data ?? [];
    }
  }

  if (!university) {
    if (slug === "northbridge-university" || slug === "metropolitan-tech" || slug === "pacific-crest-university") {
      university = {
        name:
          slug === "northbridge-university"
            ? "Northbridge University"
            : slug === "metropolitan-tech"
            ? "Metropolitan Institute of Technology"
            : "Pacific Crest University",
        short_code: slug === "northbridge-university" ? "NBU" : slug === "metropolitan-tech" ? "MITX" : "PCU",
        city: slug === "metropolitan-tech" ? "Toronto" : slug === "pacific-crest-university" ? "Seattle" : "Cambridge",
        country: slug === "metropolitan-tech" ? "Canada" : "United States",
        description: "Verified multi-department university connected to Campus.com.",
        brand_color: "#101B62",
        current_academic_year: "2026-2027",
      };
    } else {
      notFound();
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <Link href="/universities" className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Universities
      </Link>

      <div
        className="rounded-3xl p-8 text-white shadow-campus-lg sm:p-10"
        style={{
          background: `linear-gradient(135deg, ${String(university.brand_color || "#101B62")}, #6038ED)`,
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-white/15 text-white">{String(university.short_code)}</Badge>
          <Badge variant="teal">
            <CheckCircle2 className="h-3 w-3" /> Verified Institution
          </Badge>
        </div>
        <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">{String(university.name)}</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/85">{String(university.description || "")}</p>
        <div className="mt-5 flex flex-wrap gap-5 text-xs text-white/85">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" /> {String(university.city || "")}, {String(university.country || "")}
          </span>
          {Boolean(university.contact_email) && (
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-4 w-4" /> {String(university.contact_email)}
            </span>
          )}
          {Boolean(university.website_url) && (
            <span className="inline-flex items-center gap-1.5">
              <Globe className="h-4 w-4" /> {String(university.website_url)}
            </span>
          )}
        </div>
        <div className="mt-6">
          <Link href="/register">
            <Button variant="teal">Join This Campus</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple" /> Academic Departments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {departments.length > 0 ? (
              departments.map((d) => (
                <div key={String(d.id)} className="rounded-xl border border-border p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="font-bold">{String(d.name)}</p>
                    <Badge>{String(d.code)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{String(d.description || "")}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Departments are visible inside the authenticated university workspace.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-teal" /> Public Campus Events
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.length > 0 ? (
              events.map((ev) => (
                <div key={String(ev.id)} className="rounded-xl border border-border p-3.5">
                  <p className="font-bold">{String(ev.title)}</p>
                  <p className="text-xs text-muted-foreground">{String(ev.location)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Sign in to view all campus-only workshops, seminars, and student club events.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
