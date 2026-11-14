import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getWebsitePage } from "@/lib/cms";

export default async function TermsPage() {
  const cmsPage = await getWebsitePage("terms");
  const sections = (cmsPage?.sections ?? []) as Array<{ heading?: string; body?: string }>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-2">
        <Badge>Terms</Badge>
        <h1 className="text-4xl font-extrabold text-navy dark:text-white">
          {cmsPage?.hero_title || "Terms & Conditions"}
        </h1>
        <p className="text-muted-foreground">
          {cmsPage?.hero_description || "Platform guidelines for universities, faculty, clubs, and students."}
        </p>
      </div>

      <Card>
        <CardContent className="p-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          {sections.length > 0 ? (
            sections.map((s, i) => (
              <div key={i} className="space-y-2">
                <h2 className="text-lg font-bold text-foreground">{s.heading}</h2>
                <p>{s.body}</p>
              </div>
            ))
          ) : (
            <>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-foreground">1. Institutional & Member Conduct</h2>
                <p>
                  Members must provide accurate institutional affiliation details, respect campus moderation policies, and refrain from posting harmful or fraudulent marketplace listings.
                </p>
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-foreground">2. Subscriptions & Trials</h2>
                <p>
                  Universities may start on Free or Trial plans and upgrade or cancel at the end of any monthly or yearly billing period.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
