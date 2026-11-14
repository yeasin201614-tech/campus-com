"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Flag, ImagePlus, MessageSquare, Plus, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

export interface ListingRow {
  id: string;
  seller_id: string;
  seller_name: string;
  category_id: string | null;
  category_name: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  condition: string;
  images: string[];
  location_text: string;
  status: "active" | "reserved" | "sold" | "removed";
}

interface CategoryOption {
  id: string;
  name: string;
}

export function MarketplaceClient({
  userId,
  universityId,
  categories,
  initialListings,
}: {
  userId: string;
  universityId: string | null;
  categories: CategoryOption[];
  initialListings: ListingRow[];
}) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [listings, setListings] = useState<ListingRow[]>(initialListings);
  const [selectedCat, setSelectedCat] = useState("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("25");
  const [condition, setCondition] = useState("like_new");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [locationText, setLocationText] = useState("Main Campus Quad");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState("");

  async function handleCreateListing(e: React.FormEvent) {
    e.preventDefault();
    if (!universityId) return;
    setFeedback("");

    const imageUrls: string[] = [];
    if (imageFile) {
      const ext = imageFile.name.split(".").pop() || "jpg";
      const path = `${userId}/marketplace/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("campus-media").upload(path, imageFile);
      if (!upErr) {
        const { data: pub } = supabase.storage.from("campus-media").getPublicUrl(path);
        if (pub.publicUrl) imageUrls.push(pub.publicUrl);
      }
    }

    const { data, error } = await supabase
      .from("marketplace_listings")
      .insert({
        university_id: universityId,
        seller_id: userId,
        category_id: categoryId || null,
        title: title.trim(),
        description: description.trim(),
        price: Number(price || 0),
        condition,
        images: imageUrls,
        location_text: locationText.trim(),
      })
      .select("*, profiles(full_name), marketplace_categories(name)")
      .single();

    if (!error && data) {
      setListings((prev) => [
        {
          id: data.id,
          seller_id: data.seller_id,
          seller_name: (data.profiles as { full_name?: string } | null)?.full_name ?? "You",
          category_id: data.category_id,
          category_name: (data.marketplace_categories as { name?: string } | null)?.name ?? "General",
          title: data.title,
          description: data.description,
          price: Number(data.price),
          currency: data.currency,
          condition: data.condition,
          images: (data.images as string[]) ?? [],
          location_text: data.location_text,
          status: data.status,
        },
        ...prev,
      ]);
      setTitle("");
      setDescription("");
      setImageFile(null);
      setShowCreate(false);
    } else if (error) {
      setFeedback(error.message);
    }
  }

  async function contactSeller(item: ListingRow) {
    if (item.seller_id === userId) return;
    const { data: conv } = await supabase
      .from("conversations")
      .insert({
        university_id: universityId,
        is_group: false,
        title: `Marketplace: ${item.title}`,
        created_by: userId,
      })
      .select()
      .single();

    if (conv) {
      await supabase.from("conversation_members").insert([
        { conversation_id: conv.id, user_id: userId, role: "member" },
        { conversation_id: conv.id, user_id: item.seller_id, role: "member" },
      ]);
      await supabase.from("messages").insert({
        conversation_id: conv.id,
        sender_id: userId,
        content: `Hi ${item.seller_name}, is "${item.title}" (${formatCurrency(item.price, item.currency)}) still available?`,
      });
      router.push(`/portal/messages?c=${conv.id}`);
    }
  }

  async function reportListing(item: ListingRow) {
    await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactName: "Marketplace Report",
        contactEmail: "moderation@campus.com",
        subject: `Reported Listing: ${item.title}`,
        message: `Listing ID ${item.id} flagged by user for moderation review.`,
        ticketType: "listing_report",
        targetType: "marketplace_listings",
        targetId: item.id,
      }),
    });
    setFeedback("Listing reported to campus moderators.");
  }

  const filtered = listings.filter((item) => {
    const matchCat = selectedCat === "all" || item.category_id === selectedCat;
    const q = search.trim().toLowerCase();
    const matchQ =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy dark:text-white">Campus Marketplace</h1>
          <p className="text-sm text-muted-foreground">
            Buy and sell used textbooks, study materials, electronics, and peer services on campus.
          </p>
        </div>
        <Button onClick={() => setShowCreate((v) => !v)} className="gap-2">
          <Plus className="h-4 w-4" /> Post Listing
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Create Marketplace Listing</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateListing} className="grid gap-3 sm:grid-cols-2">
              <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Item or service title" />
              <Input required type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price (USD)" />
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
              <Select value={condition} onChange={(e) => setCondition(e.target.value)}>
                <option value="new">New</option>
                <option value="like_new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="service">Student Service</option>
              </Select>
              <Input value={locationText} onChange={(e) => setLocationText(e.target.value)} placeholder="Pickup location" />
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold">
                <ImagePlus className="h-4 w-4 text-purple" />
                <span>{imageFile ? imageFile.name : "Upload Product Photo"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
              </label>
              <Textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Condition notes, edition, pickup availability..." className="sm:col-span-2" />
              <Button type="submit">Publish Listing</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {feedback && <p className="text-xs font-semibold text-teal-600">{feedback}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={selectedCat === "all" ? "default" : "outline"} onClick={() => setSelectedCat("all")}>
            All Items
          </Button>
          {categories.map((c) => (
            <Button
              key={c.id}
              size="sm"
              variant={selectedCat === c.id ? "default" : "outline"}
              onClick={() => setSelectedCat(c.id)}
            >
              {c.name}
            </Button>
          ))}
        </div>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search listings..." className="max-w-xs" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <Card key={item.id} className="overflow-hidden flex flex-col justify-between">
            <div>
              {item.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.images[0]} alt={item.title} className="h-44 w-full object-cover" />
              ) : (
                <div className="flex h-36 items-center justify-center bg-gradient-to-br from-navy/10 to-purple/10">
                  <Tag className="h-8 w-8 text-purple" />
                </div>
              )}
              <CardContent className="p-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <Badge variant="teal" className="capitalize">{item.condition.replace("_", " ")}</Badge>
                  <span className="text-lg font-extrabold text-navy dark:text-white">
                    {formatCurrency(item.price, item.currency)}
                  </span>
                </div>
                <h3 className="font-bold">{item.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                <p className="text-[11px] font-medium text-foreground/80">
                  Seller: {item.seller_name} • {item.location_text}
                </p>
              </CardContent>
            </div>
            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              {item.seller_id !== userId ? (
                <Button size="sm" onClick={() => contactSeller(item)} className="gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> Contact Seller
                </Button>
              ) : (
                <Badge variant="secondary">Your Listing</Badge>
              )}
              <Button size="sm" variant="ghost" onClick={() => reportListing(item)} aria-label="Report listing">
                <Flag className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
