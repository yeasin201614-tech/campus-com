import Link from "next/link";
import { ShoppingBag, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { formatCurrency } from "@/lib/utils";

export default async function PublicMarketplacePage() {
  const { isConfigured } = getSupabasePublicConfig();
  let dbListings: Array<Record<string, unknown>> = [];

  if (isConfigured) {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("marketplace_listings")
      .select("id, title, description, price, currency, condition, location_text")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(8);
    dbListings = data ?? [];
  }

  const fallback = [
    {
      id: "m1",
      title: "Introduction to Algorithms (4th Ed.) — Clean Hardcover",
      description: "Barely used CLRS textbook with zero highlights. Available near Engineering Library.",
      price: 45,
      currency: "USD",
      condition: "like_new",
      location_text: "Northbridge Library Quad",
    },
    {
      id: "m2",
      title: "Texas Instruments TI-84 Plus CE Graphing Calculator",
      description: "Includes USB charging cable and protective slide cover.",
      price: 65,
      currency: "USD",
      condition: "good",
      location_text: "Science Building Lobby",
    },
    {
      id: "m3",
      title: "1-on-1 Python, SQL & Calculus Tutoring (Per Hour)",
      description: "Senior honors student offering structured exam prep and assignment guidance.",
      price: 20,
      currency: "USD",
      condition: "service",
      location_text: "Student Union / Online",
    },
    {
      id: "m4",
      title: "Arduino & Sensors Robotics Starter Kit",
      description: "Complete breadboard, ultrasonic sensor, jumper wires, and stepper driver bundle.",
      price: 32,
      currency: "USD",
      condition: "like_new",
      location_text: "Tesla Wing Lab",
    },
  ];

  const items = dbListings.length > 0 ? dbListings : fallback;

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 space-y-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <Badge>Student Marketplace</Badge>
          <h1 className="text-4xl font-extrabold text-navy dark:text-white">
            Buy & Sell Safely on Campus
          </h1>
          <p className="text-muted-foreground">
            Used textbooks, study materials, electronics, and peer student services within verified university communities.
          </p>
        </div>
        <Link href="/portal/marketplace">
          <Button className="gap-2">
            <ShoppingBag className="h-4 w-4" /> Open Campus Marketplace
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <Card key={String(item.id)} className="flex flex-col justify-between">
            <CardContent className="p-5 space-y-3">
              <div className="flex h-32 items-center justify-center rounded-xl bg-gradient-to-br from-navy/10 to-purple/10">
                <Tag className="h-8 w-8 text-purple" />
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="teal" className="capitalize">
                  {String(item.condition).replace("_", " ")}
                </Badge>
                <span className="text-lg font-extrabold text-navy dark:text-white">
                  {formatCurrency(Number(item.price), String(item.currency || "USD"))}
                </span>
              </div>
              <h3 className="font-bold leading-snug">{String(item.title)}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{String(item.description)}</p>
            </CardContent>
            <div className="border-t border-border px-5 py-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{String(item.location_text)}</span>
              <Link href="/portal/marketplace">
                <Button size="sm" variant="outline">Contact</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
