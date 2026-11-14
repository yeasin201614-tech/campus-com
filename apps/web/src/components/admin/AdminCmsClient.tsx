"use client";

import { useState } from "react";
import { CheckCircle2, Globe, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { WebsitePage } from "@campus/shared";

export function AdminCmsClient({
  initialPages,
  initialSeo,
}: {
  initialPages: WebsitePage[];
  initialSeo: { title: string; description: string };
}) {
  const [pages, setPages] = useState<WebsitePage[]>(initialPages);
  const [selectedSlug, setSelectedSlug] = useState(initialPages[0]?.slug ?? "home");
  const current = pages.find((p) => p.slug === selectedSlug) ?? pages[0];

  const [title, setTitle] = useState(current?.title ?? "Home");
  const [heroTitle, setHeroTitle] = useState(current?.hero_title ?? "");
  const [heroDescription, setHeroDescription] = useState(current?.hero_description ?? "");
  const [heroCtaText, setHeroCtaText] = useState(current?.hero_cta_text ?? "Join Campus.com");
  const [heroCtaUrl, setHeroCtaUrl] = useState(current?.hero_cta_url ?? "/register");
  const [seoTitle, setSeoTitle] = useState(current?.seo_title ?? initialSeo.title);
  const [seoDesc, setSeoDesc] = useState(current?.seo_description ?? initialSeo.description);
  const [msg, setMsg] = useState("");

  function selectPage(slug: string) {
    setSelectedSlug(slug);
    const p = pages.find((x) => x.slug === slug);
    if (p) {
      setTitle(p.title);
      setHeroTitle(p.hero_title);
      setHeroDescription(p.hero_description);
      setHeroCtaText(p.hero_cta_text);
      setHeroCtaUrl(p.hero_cta_url);
      setSeoTitle(p.seo_title ?? "");
      setSeoDesc(p.seo_description ?? "");
    }
  }

  async function savePage(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/admin/cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "page",
        slug: selectedSlug,
        title,
        heroTitle,
        heroDescription,
        heroCtaText,
        heroCtaUrl,
        seoTitle,
        seoDescription: seoDesc,
        isPublished: true,
      }),
    });
    const json = await res.json();
    if (!res.ok) setMsg(json.error || "Failed to save CMS page");
    else {
      setPages((prev) => prev.map((p) => (p.slug === selectedSlug ? json.page : p)));
      setMsg("Website CMS page published dynamically!");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy dark:text-white">Website CMS</h1>
          <p className="text-sm text-muted-foreground">
            Control homepage hero, page descriptions, CTAs, banners, and SEO without editing source code.
          </p>
        </div>
        <Select value={selectedSlug} onChange={(e) => selectPage(e.target.value)} className="w-56">
          {pages.map((p) => (
            <option key={p.slug} value={p.slug}>
              /{p.slug === "home" ? "" : p.slug} ({p.title})
            </option>
          ))}
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-purple" /> Edit Page: /{selectedSlug === "home" ? "" : selectedSlug}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={savePage} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Page Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Hero Headline</Label>
                <Input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Hero Description</Label>
              <Textarea value={heroDescription} onChange={(e) => setHeroDescription(e.target.value)} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Primary CTA Text</Label>
                <Input value={heroCtaText} onChange={(e) => setHeroCtaText(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Primary CTA URL</Label>
                <Input value={heroCtaUrl} onChange={(e) => setHeroCtaUrl(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>SEO Title</Label>
                <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>SEO Description</Label>
                <Input value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} />
              </div>
            </div>

            {msg && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-teal-600">
                <CheckCircle2 className="h-4 w-4" /> {msg}
              </p>
            )}

            <Button type="submit" className="gap-2">
              <Save className="h-4 w-4" /> Publish CMS Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
