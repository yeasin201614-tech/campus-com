"use client";

import { useState } from "react";
import QRCode from "qrcode";
import {
  Bookmark,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Plus,
  QrCode,
  ScanLine,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { formatEventDate, slugify } from "@/lib/utils";
import { isStaffRole, type UserRole } from "@campus/shared";

export interface EventRow {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  starts_at: string;
  ends_at: string;
  capacity: number | null;
  registered_count: number;
  my_status: "registered" | "attended" | "cancelled" | "saved" | null;
  my_favorite: boolean;
  my_qr_token: string | null;
}

export function EventsClient({
  userId,
  universityId,
  userRole,
  initialEvents,
}: {
  userId: string;
  universityId: string | null;
  userRole: UserRole;
  initialEvents: EventRow[];
}) {
  const supabase = createBrowserSupabaseClient();
  const [events, setEvents] = useState<EventRow[]>(initialEvents);
  const [tab, setTab] = useState<"all" | "upcoming" | "past" | "saved">("all");
  const [qrModal, setQrModal] = useState<{ title: string; token: string; svgUrl: string } | null>(null);
  const [scanToken, setScanToken] = useState("");
  const [scanResult, setScanResult] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Technology");
  const [location, setLocation] = useState("Main Auditorium");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [description, setDescription] = useState("");

  const canOrganize = isStaffRole(userRole) || userRole === "club_moderator";

  async function registerEvent(ev: EventRow) {
    if (!universityId) return;
    const { data, error } = await supabase
      .from("event_registrations")
      .upsert(
        {
          event_id: ev.id,
          user_id: userId,
          university_id: universityId,
          status: "registered",
        },
        { onConflict: "event_id,user_id" }
      )
      .select()
      .single();

    if (!error && data) {
      setEvents((prev) =>
        prev.map((item) =>
          item.id === ev.id
            ? {
                ...item,
                my_status: "registered",
                my_qr_token: data.qr_token,
                registered_count: item.my_status === "registered" ? item.registered_count : item.registered_count + 1,
              }
            : item
        )
      );
    }
  }

  async function toggleFavorite(ev: EventRow) {
    if (!universityId) return;
    const nextFav = !ev.my_favorite;
    const { data, error } = await supabase
      .from("event_registrations")
      .upsert(
        {
          event_id: ev.id,
          user_id: userId,
          university_id: universityId,
          status: ev.my_status ?? "saved",
          is_favorite: nextFav,
        },
        { onConflict: "event_id,user_id" }
      )
      .select()
      .single();

    if (!error && data) {
      setEvents((prev) =>
        prev.map((item) =>
          item.id === ev.id
            ? { ...item, my_favorite: nextFav, my_status: data.status, my_qr_token: data.qr_token }
            : item
        )
      );
    }
  }

  async function openQrPass(ev: EventRow) {
    if (!ev.my_qr_token) return;
    const svgUrl = await QRCode.toDataURL(ev.my_qr_token, {
      color: { dark: "#101B62", light: "#FFFFFF" },
      width: 240,
      margin: 2,
    });
    setQrModal({ title: ev.title, token: ev.my_qr_token, svgUrl });
  }

  async function handleCheckIn(e: React.FormEvent) {
    e.preventDefault();
    if (!scanToken.trim()) return;
    setScanResult("Verifying QR pass...");
    const res = await fetch("/api/events/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qrToken: scanToken.trim() }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      setScanResult(json.error || "Check-in failed");
    } else if (json.already_checked_in) {
      setScanResult("Attendee was already checked in.");
    } else {
      setScanResult(`Checked in successfully for ${json.event_title}!`);
      setScanToken("");
    }
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!universityId) return;
    const { data, error } = await supabase
      .from("events")
      .insert({
        university_id: universityId,
        organizer_id: userId,
        title,
        slug: `${slugify(title)}-${Date.now().toString().slice(-4)}`,
        description,
        category,
        location,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt || startsAt).toISOString(),
        status: "published",
        visibility: "public",
      })
      .select()
      .single();

    if (!error && data) {
      setEvents((prev) => [
        {
          id: data.id,
          title: data.title,
          description: data.description,
          category: data.category,
          location: data.location,
          starts_at: data.starts_at,
          ends_at: data.ends_at,
          capacity: data.capacity,
          registered_count: 0,
          my_status: null,
          my_favorite: false,
          my_qr_token: null,
        },
        ...prev,
      ]);
      setShowCreate(false);
      setTitle("");
      setDescription("");
    }
  }

  const now = Date.now();
  const visible = events.filter((ev) => {
    const startMs = new Date(ev.starts_at).getTime();
    if (tab === "upcoming") return startMs >= now;
    if (tab === "past") return startMs < now;
    if (tab === "saved") return ev.my_favorite || ev.my_status === "registered" || ev.my_status === "attended";
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy dark:text-white">
            Events & QR Attendance
          </h1>
          <p className="text-sm text-muted-foreground">
            Discover campus events, save favorites, generate QR tickets, and track attendance.
          </p>
        </div>
        {canOrganize && (
          <Button onClick={() => setShowCreate((v) => !v)} className="gap-2">
            <Plus className="h-4 w-4" /> Create Event
          </Button>
        )}
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Publish New Campus Event</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateEvent} className="grid gap-3 sm:grid-cols-2">
              <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event Title" />
              <Input required value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (Tech, Career, Sports)" />
              <Input required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Venue / Auditorium" />
              <Input required type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
              <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
              <Textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Agenda and event details..." className="sm:col-span-2" />
              <Button type="submit">Publish Event</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {canOrganize && (
        <Card className="border-purple/30 bg-purple/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm font-bold text-navy dark:text-white">
              <ScanLine className="h-5 w-5 text-purple" /> QR Check-In Desk:
            </div>
            <form onSubmit={handleCheckIn} className="flex flex-1 gap-2">
              <Input
                value={scanToken}
                onChange={(e) => setScanToken(e.target.value)}
                placeholder="Enter or scan attendee QR token (e.g. CMP-9A2F...)"
                className="bg-card"
              />
              <Button type="submit" variant="teal">Verify Check-In</Button>
            </form>
            {scanResult && <span className="text-xs font-semibold text-purple">{scanResult}</span>}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "All Events" },
          { key: "upcoming", label: "Upcoming" },
          { key: "past", label: "Past" },
          { key: "saved", label: "My Tickets & Saved" },
        ].map((t) => (
          <Button
            key={t.key}
            size="sm"
            variant={tab === t.key ? "default" : "outline"}
            onClick={() => setTab(t.key as typeof tab)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((ev) => (
          <Card key={ev.id} className="overflow-hidden flex flex-col justify-between">
            <div>
              <div className="h-28 campus-gradient p-5 text-white flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <Badge className="bg-white/20 text-white">{ev.category}</Badge>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(ev)}
                    aria-label="Toggle favorite event"
                    className="rounded-lg p-1 hover:bg-white/15"
                  >
                    <Bookmark className={`h-4 w-4 ${ev.my_favorite ? "fill-teal text-teal" : "text-white"}`} />
                  </button>
                </div>
                <h3 className="font-bold leading-snug line-clamp-1">{ev.title}</h3>
              </div>
              <CardContent className="p-5 space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{ev.description}</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-purple" /> {formatEventDate(ev.starts_at)}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-teal" /> {ev.location}
                  </p>
                </div>
              </CardContent>
            </div>
            <div className="flex items-center justify-between border-t border-border px-5 py-3.5">
              <span className="text-xs font-semibold text-muted-foreground">
                {ev.registered_count} registered
              </span>
              {ev.my_status === "registered" || ev.my_status === "attended" ? (
                <div className="flex items-center gap-2">
                  {ev.my_status === "attended" && (
                    <Badge variant="teal">
                      <CheckCircle2 className="h-3 w-3" /> Checked In
                    </Badge>
                  )}
                  <Button size="sm" variant="outline" onClick={() => openQrPass(ev)} className="gap-1.5">
                    <QrCode className="h-3.5 w-3.5" /> QR Pass
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => registerEvent(ev)}>
                  Register
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(qrModal)} onOpenChange={() => setQrModal(null)}>
        <DialogHeader>
          <DialogTitle>Event QR Check-In Pass</DialogTitle>
          <DialogDescription>{qrModal?.title}</DialogDescription>
        </DialogHeader>
        {qrModal && (
          <div className="flex flex-col items-center gap-4 py-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrModal.svgUrl} alt="Event QR Ticket" className="h-56 w-56 rounded-2xl border border-border p-2 bg-white" />
            <code className="rounded-xl bg-muted px-4 py-2 text-sm font-bold tracking-wider">
              {qrModal.token}
            </code>
          </div>
        )}
      </Dialog>
    </div>
  );
}
