import React, { useEffect, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bookmark, CalendarDays, MapPin, QrCode } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

interface MobileEvent {
  id: string;
  title: string;
  location: string;
  category: string;
  starts_at: string;
}

export default function MobileEventsScreen() {
  const { session, profile } = useAuth();
  const { theme } = useAppTheme();
  const [events, setEvents] = useState<MobileEvent[]>([]);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const [qrPass, setQrPass] = useState<{ title: string; token: string } | null>(null);

  useEffect(() => {
    supabase
      .from("events")
      .select("id, title, location, category, starts_at")
      .order("starts_at", { ascending: true })
      .then(({ data }) => setEvents((data as MobileEvent[]) ?? []));
  }, []);

  async function registerAndViewQr(ev: MobileEvent) {
    if (!session?.user || !profile?.primary_university_id) {
      Alert.alert("Sign In Required", "Sign in to register for campus events.");
      return;
    }
    const { data, error } = await supabase
      .from("event_registrations")
      .upsert(
        {
          event_id: ev.id,
          user_id: session.user.id,
          university_id: profile.primary_university_id,
          status: "registered",
        },
        { onConflict: "event_id,user_id" }
      )
      .select("qr_token")
      .single();

    if (error) {
      Alert.alert("Error", error.message);
    } else if (data?.qr_token) {
      setQrPass({ title: ev.title, token: data.qr_token });
    }
  }

  const now = Date.now();
  const visible = events.filter((ev) => {
    const ms = new Date(ev.starts_at).getTime();
    if (filter === "upcoming") return ms >= now;
    if (filter === "past") return ms < now;
    return true;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.heading, { color: theme.text }]}>Events</Text>

        <View style={styles.tabRow}>
          {(["all", "upcoming", "past"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setFilter(t)}
              style={[
                styles.tabPill,
                {
                  backgroundColor: filter === t ? "#6038ED" : theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={{ color: filter === t ? "#FFFFFF" : theme.text, fontWeight: "700", fontSize: 12, textTransform: "capitalize" }}>
                {t} Events
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {visible.map((ev) => (
          <View key={ev.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.banner}>
              <Text style={styles.bannerTag}>{ev.category}</Text>
              <Bookmark size={16} color="#19B99A" />
            </View>
            <View style={{ padding: 14, gap: 6 }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: theme.text }}>{ev.title}</Text>
              <View style={styles.metaRow}>
                <CalendarDays size={13} color="#6038ED" />
                <Text style={{ color: theme.muted, fontSize: 12 }}>{new Date(ev.starts_at).toLocaleString()}</Text>
              </View>
              <View style={styles.metaRow}>
                <MapPin size={13} color="#19B99A" />
                <Text style={{ color: theme.muted, fontSize: 12 }}>{ev.location}</Text>
              </View>
              <TouchableOpacity onPress={() => registerAndViewQr(ev)} style={styles.joinBtn}>
                <QrCode size={15} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 13 }}>Join & Get QR Ticket</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {visible.length === 0 && (
          <Text style={{ color: theme.muted, textAlign: "center", marginTop: 20 }}>
            No events available in this view yet.
          </Text>
        )}
      </ScrollView>

      <Modal visible={Boolean(qrPass)} transparent animationType="fade" onRequestClose={() => setQrPass(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
            <QrCode size={72} color="#101B62" />
            <Text style={{ fontSize: 18, fontWeight: "800", color: theme.text, marginTop: 12, textAlign: "center" }}>
              {qrPass?.title}
            </Text>
            <Text style={{ fontSize: 13, color: theme.muted, marginTop: 4 }}>Show this check-in token at entry</Text>
            <View style={styles.tokenBox}>
              <Text style={{ fontWeight: "800", fontSize: 16, color: "#101B62", letterSpacing: 1 }}>{qrPass?.token}</Text>
            </View>
            <TouchableOpacity onPress={() => setQrPass(null)} style={styles.closeBtn}>
              <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Close Pass</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 14 },
  heading: { fontSize: 24, fontWeight: "800" },
  tabRow: { flexDirection: "row", gap: 8 },
  tabPill: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  card: { borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  banner: { backgroundColor: "#101B62", padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bannerTag: { color: "#FFFFFF", fontSize: 11, fontWeight: "700", backgroundColor: "rgba(255,255,255,0.16)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  joinBtn: { marginTop: 8, backgroundColor: "#6038ED", borderRadius: 12, paddingVertical: 10, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalCard: { width: "100%", borderRadius: 24, padding: 24, alignItems: "center" },
  tokenBox: { marginTop: 16, backgroundColor: "#F1F5F9", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  closeBtn: { marginTop: 18, backgroundColor: "#6038ED", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
});
