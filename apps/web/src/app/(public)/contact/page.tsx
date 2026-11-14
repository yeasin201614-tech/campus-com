"use client";

import { useState } from "react";
import { CheckCircle2, Mail, MapPin, Phone, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ ok?: boolean; text?: string }>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setStatus({});
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: name,
          contactEmail: email,
          subject,
          message,
          ticketType: "contact",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus({ ok: false, text: json.error || "Unable to send message" });
      } else {
        setStatus({ ok: true, text: "Ticket received! Our institutional team will respond shortly." });
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      }
    } catch {
      setStatus({ ok: false, text: "Network error submitting request." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 space-y-10">
      <div className="max-w-2xl space-y-2">
        <Badge>Contact & Institutional Onboarding</Badge>
        <h1 className="text-4xl font-extrabold text-navy dark:text-white">Get in Touch</h1>
        <p className="text-muted-foreground">
          Have questions about onboarding your university, enterprise SSO, or student support? Send us a message directly.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5 space-y-4">
          {[
            { icon: Mail, label: "Email Support", value: "hello@campus.com" },
            { icon: Phone, label: "Phone Desk", value: "+1 (800) 555-0199" },
            { icon: MapPin, label: "Headquarters", value: "420 University Innovation Way, Cambridge, MA" },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.label}>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple/10 text-purple">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{c.label}</p>
                    <p className="font-bold text-navy dark:text-white">{c.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Send Support / Inquiry Ticket</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Elena Vance" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="elena@university.edu" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="University Onboarding Inquiry" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" required rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us about your campus goals..." />
              </div>

              {status.text && (
                <div
                  className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
                    status.ok ? "bg-teal/15 text-teal-600" : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {status.ok && <CheckCircle2 className="h-4 w-4" />}
                  <span>{status.text}</span>
                </div>
              )}

              <Button type="submit" disabled={submitting} className="gap-2">
                <Send className="h-4 w-4" /> {submitting ? "Sending..." : "Submit Inquiry"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
