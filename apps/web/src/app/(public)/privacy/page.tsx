import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getWebsitePage } from "@/lib/cms";

export default async function PrivacyPage() {
  const cmsPage = await getWebsitePage("privacy");
  const sections = (cmsPage?.sections ?? []) as Array<{ heading?: string; body?: string }>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-2">
        <Badge>Legal & Governance</Badge>
        <h1 className="text-4xl font-extrabold text-navy dark:text-white">
          {cmsPage?.hero_title || "Privacy Policy"}
        </h1>
        <p className="text-muted-foreground">
          {cmsPage?.hero_description || "How Campus.com safeguards institutional, faculty, and student records."}
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
                <h2 className="text-lg font-bold text-foreground">1. Multi-Tenant University Isolation</h2>
                <p>
                  Campus.com enforces PostgreSQL Row Level Security across all 29+ tables so each university accesses only its own authorized student, faculty, department, and billing records.
                </p>
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-foreground">2. Private Messaging Privacy</h2>
                <p>
                  One-to-one and group chat threads and attachments in the private `chat-attachments` bucket are restricted exclusively to verified conversation participants.
                </p>
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-foreground">3. Payment Security</h2>
                <p>
                  Campus.com never stores raw credit or debit card numbers. Only non-sensitive billing status, invoice numbers, and provider references are retained.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
