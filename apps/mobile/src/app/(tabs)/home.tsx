import React, { useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Bell, CalendarDays, Megaphone, ShoppingBag, Users } from "lucide-react-native";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

export default function MobileHomeScreen() {
  const router = useRouter();
  const { profile, university } = useAuth();
  const { theme } = useAppTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [nextEvent, setNextEvent] = useState<{ title: string; location: string; starts_at: string } | null>(null);
  const [notices, setNotices] = useState<Array<{ id: string; title: string; category: string }>>([]);
  const [posts, setPosts] = useState<Array<{ id: string; content: string }>>([]);

  async function loadDashboard() {
    setRefreshing(true);
    try {
      const [evRes, notRes, postRes] = await Promise.all([
        supabase.from("events").select("title, location, starts_at").order("starts_at", { ascending: true }).limit(1),
        supabase.from("notices").select("id, title, category").order("published_at", { ascending: false }).limit(3),
        supabase.from("campus_posts").select("id, content").order("created_at", { ascending: false }).limit(3),
      ]);
      setNextEvent(evRes.data?.[0] ?? null);
      setNotices(notRes.data ?? []);
      setPosts(postRes.data ?? []);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const firstName = (profile?.full_name || "Student").split(" ")[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadDashboard} />}
      >
        <View style={styles.header}>
          <BrandLogo size={32} />
          <TouchableOpacity onPress={() => router.push("/notifications")} style={[styles.iconBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Bell size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroGreeting}>Hello, {firstName}!</Text>
          <Text style={styles.heroSub}>{university?.name || "Welcome back to Campus.com"}</Text>

          <View style={styles.nextEventBox}>
            <Text style={styles.nextEventLabel}>Next Event</Text>
            <Text style={styles.nextEventTitle}>{nextEvent?.title || "Tech Fest 2026"}</Text>
            <Text style={styles.nextEventMeta}>
              {nextEvent ? `${nextEvent.location} • ${new Date(nextEvent.starts_at).toLocaleDateString()}` : "University Auditorium"}
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/events")} style={styles.heroBtn}>
              <Text style={styles.heroBtnText}>View Details →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Tiles */}
        <View style={styles.tileRow}>
          {[
            { label: "Events", icon: CalendarDays, route: "/(tabs)/events" as const, color: "#6038ED" },
            { label: "Groups", icon: Users, route: "/groups" as const, color: "#101B62" },
            { label: "Notices", icon: Megaphone, route: "/notices" as const, color: "#19B99A" },
            { label: "Market", icon: ShoppingBag, route: "/marketplace" as const, color: "#F59E0B" },
          ].map((tile) => {
            const Icon = tile.icon;
            return (
              <TouchableOpacity
                key={tile.label}
                onPress={() => router.push(tile.route)}
                style={[styles.tile, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <Icon size={20} color={tile.color} />
                <Text style={[styles.tileText, { color: theme.text }]}>{tile.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Latest Announcements */}
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Latest Announcements</Text>
            <TouchableOpacity onPress={() => router.push("/notices")}>
              <Text style={{ color: "#6038ED", fontWeight: "700", fontSize: 12 }}>See All</Text>
            </TouchableOpacity>
          </View>
          {notices.length > 0 ? (
            notices.map((n) => (
              <View key={n.id} style={[styles.listRow, { borderColor: theme.border }]}>
                <Text style={{ fontWeight: "700", color: theme.text, fontSize: 13 }}>{n.title}</Text>
                <Text style={{ color: "#19B99A", fontSize: 11, textTransform: "capitalize", marginTop: 2 }}>{n.category}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: theme.muted, fontSize: 13 }}>No announcements posted yet.</Text>
          )}
        </View>

        {/* Recent Community Posts */}
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Community Posts</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/community")}>
              <Text style={{ color: "#6038ED", fontWeight: "700", fontSize: 12 }}>Open Feed</Text>
            </TouchableOpacity>
          </View>
          {posts.length > 0 ? (
            posts.map((p) => (
              <View key={p.id} style={[styles.listRow, { borderColor: theme.border }]}>
                <Text numberOfLines={2} style={{ color: theme.text, fontSize: 13 }}>{p.content}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: theme.muted, fontSize: 13 }}>Join the discussion in the Community tab!</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  heroCard: { backgroundColor: "#101B62", borderRadius: 22, padding: 18 },
  heroGreeting: { color: "#FFFFFF", fontSize: 22, fontWeight: "800" },
  heroSub: { color: "#CBD5E1", fontSize: 13, marginTop: 2 },
  nextEventBox: { marginTop: 14, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 16, padding: 14 },
  nextEventLabel: { color: "#19B99A", fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  nextEventTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", marginTop: 4 },
  nextEventMeta: { color: "#E2E8F0", fontSize: 12, marginTop: 2 },
  heroBtn: { marginTop: 10, backgroundColor: "#6038ED", alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  heroBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 12 },
  tileRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  tile: { flex: 1, borderRadius: 16, borderWidth: 1, paddingVertical: 14, alignItems: "center", gap: 6 },
  tileText: { fontSize: 11, fontWeight: "700" },
  sectionCard: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 10 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 15, fontWeight: "800" },
  listRow: { borderTopWidth: 1, paddingTop: 10 },
});
