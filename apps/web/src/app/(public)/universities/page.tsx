import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, MapPin, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPublicUniversities } from "@/lib/cms";

export default async function UniversitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();
  const dbUniversities = await getPublicUniversities();

  const fallback = [
    {
      id: "33333333-3333-4333-8333-333333333301",
      name: "Northbridge University",
      slug: "northbridge-university",
      short_code: "NBU",
      city: "Cambridge",
      country: "United States",
      description: "A premier research institution uniting engineering, liberal arts, and vibrant student innovation labs.",
      brand_color: "#101B62",
      student_capacity: 18000,
      is_verified: true,
    },
    {
      id: "33333333-3333-4333-8333-333333333302",
      name: "Metropolitan Institute of Technology",
      slug: "metropolitan-tech",
      short_code: "MITX",
      city: "Toronto",
      country: "Canada",
      description: "Leading STEM and digital entrepreneurship university empowering hands-on builders and clubs.",
      brand_color: "#6038ED",
      student_capacity: 12500,
      is_verified: true,
    },
    {
      id: "33333333-3333-4333-8333-333333333303",
      name: "Pacific Crest University",
      slug: "pacific-crest-university",
      short_code: "PCU",
      city: "Seattle",
      country: "United States",
      description: "Coastal multidisciplinary campus known for marine sciences, design, and global exchange communities.",
      brand_color: "#19B99A",
      student_capacity: 9500,
      is_verified: true,
    },
  ];

  const source = dbUniversities.length > 0 ? dbUniversities : fallback;
  const filtered = query
    ? source.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          (u.city ?? "").toLowerCase().includes(query) ||
          (u.country ?? "").toLowerCase().includes(query) ||
          u.short_code.toLowerCase().includes(query)
      )
    : source;

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 space-y-10">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <Badge variant="teal">Campus Directory</Badge>
          <h1 className="text-4xl font-extrabold text-navy dark:text-white">
            Explore Universities on Campus.com
          </h1>
          <p className="text-muted-foreground">
            Discover verified institutions, academic departments, campus clubs, and upcoming events.
          </p>
        </div>

        <form className="flex w-full max-w-sm gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search university, city, or code..."
              className="pl-9"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((uni) => (
          <Card key={uni.id} className="overflow-hidden flex flex-col justify-between">
            <div>
              <div
                className="p-6 text-white"
                style={{
                  background: `linear-gradient(135deg, ${uni.brand_color || "#101B62"}, #6038ED)`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-xl bg-white/15 px-3 py-1 text-xs font-extrabold">
                    {uni.short_code}
                  </span>
                  {uni.is_verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal px-2.5 py-0.5 text-[11px] font-bold text-white">
                      <CheckCircle2 className="h-3 w-3" /> Verified
                    </span>
                  )}
                </div>
                <h2 className="mt-4 text-xl font-bold">{uni.name}</h2>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-white/80">
                  <MapPin className="h-3.5 w-3.5" /> {uni.city}, {uni.country}
                </p>
              </div>
              <CardContent className="p-6 space-y-3">
                <p className="text-sm text-muted-foreground">{uni.description}</p>
                <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                  <Building2 className="h-4 w-4 text-purple" />
                  <span>Capacity: {uni.student_capacity?.toLocaleString()} students</span>
                </div>
              </CardContent>
            </div>
            <div className="px-6 pb-6">
              <Link href={`/universities/${uni.slug}`}>
                <Button variant="outline" className="w-full gap-1.5">
                  View Campus Profile <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
