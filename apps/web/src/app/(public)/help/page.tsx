import Link from "next/link";
import { BookOpen, LifeBuoy, QrCode, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FAQAccordion } from "@/components/public/FAQAccordion";

export default function HelpCenterPage() {
  const helpFaqs = [
    {
      q: "How do I verify my student account after signing up?",
      a: "Select your university during registration and add your Student ID number. Your University Admin or Department Admin will mark your membership as verified.",
    },
    {
      q: "Where do I find my Event QR Check-in ticket?",
      a: "Open Events in the Web Portal or Mobile App, click My Registrations / Ticket, and show the QR pass at the event check-in desk.",
    },
    {
      q: "How do Club Moderators approve member requests?",
      a: "Open Groups, select your club, and review pending join requests in the Club Moderation panel.",
    },
    {
      q: "Are private chats visible to university admins?",
      a: "No. Row Level Security restricts conversations and messages strictly to members of that conversation.",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center space-y-3">
        <Badge variant="teal">Help Center</Badge>
        <h1 className="text-4xl font-extrabold text-navy dark:text-white">How Can We Help You?</h1>
        <p className="text-muted-foreground">Guides for Students, Faculty, Club Moderators, and University Admins.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {[
          { icon: BookOpen, title: "Getting Started", desc: "Account creation, university selection, and profile privacy." },
          { icon: QrCode, title: "Events & QR Tickets", desc: "Registering for campus events and scanning check-in codes." },
          { icon: ShieldCheck, title: "Safety & Moderation", desc: "Reporting marketplace listings or inappropriate community posts." },
        ].map((g) => {
          const Icon = g.icon;
          return (
            <Card key={g.title}>
              <CardHeader>
                <Icon className="h-6 w-6 text-purple mb-1" />
                <CardTitle className="text-base">{g.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{g.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <FAQAccordion items={helpFaqs} />

      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row">
        <div className="flex items-center gap-3">
          <LifeBuoy className="h-8 w-8 text-purple" />
          <div>
            <p className="font-bold">Still need assistance?</p>
            <p className="text-sm text-muted-foreground">Open a direct support ticket with our team.</p>
          </div>
        </div>
        <Link href="/contact">
          <Button>Contact Support</Button>
        </Link>
      </div>
    </div>
  );
}
