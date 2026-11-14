import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

export default function MobileNotificationsScreen() {
  const { session } = useAuth();
  const { theme } = useAppTheme();
  const [items, setItems] = useState<Array<{ id: string; title: string; body: string; created_at: string }>>([]);

  useEffect(() => {
    if (!session?.user) return;
    supabase
      .from("notifications")
      .select("id, title, body, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setItems(data ?? []));
  }, [session?.user]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      {items.map((n) => (
        <View key={n.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={{ fontWeight: "800", color: theme.text, fontSize: 15 }}>{n.title}</Text>
          <Text style={{ color: theme.muted, fontSize: 13, marginTop: 4 }}>{n.body}</Text>
        </View>
      ))}
      {items.length === 0 && (
        <Text style={{ color: theme.muted, textAlign: "center", marginTop: 24 }}>
          You have no new notifications.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16 },
});
