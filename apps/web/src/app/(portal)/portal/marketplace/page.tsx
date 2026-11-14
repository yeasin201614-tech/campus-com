import { requireAuthContext } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MarketplaceClient, type ListingRow } from "@/components/portal/MarketplaceClient";

export default async function PortalMarketplacePage() {
  const auth = await requireAuthContext();
  const supabase = await createServerSupabaseClient();

  const [{ data: categories }, { data: listings }] = await Promise.all([
    supabase.from("marketplace_categories").select("id, name").eq("is_active", true).order("sort_order"),
    supabase
      .from("marketplace_listings")
      .select("*, profiles(full_name), marketplace_categories(name)")
      .eq("status", "active")
      .order("created_at", { ascending: false }),
  ]);

  const rows: ListingRow[] = (listings ?? []).map((item) => ({
    id: item.id,
    seller_id: item.seller_id,
    seller_name: (item.profiles as { full_name?: string } | null)?.full_name ?? "Student Seller",
    category_id: item.category_id,
    category_name: (item.marketplace_categories as { name?: string } | null)?.name ?? "General",
    title: item.title,
    description: item.description,
    price: Number(item.price),
    currency: item.currency,
    condition: item.condition,
    images: (item.images as string[]) ?? [],
    location_text: item.location_text ?? "Main Campus",
    status: item.status,
  }));

  return (
    <MarketplaceClient
      userId={auth.userId}
      universityId={auth.profile.primary_university_id}
      categories={categories ?? []}
      initialListings={rows}
    />
  );
}
