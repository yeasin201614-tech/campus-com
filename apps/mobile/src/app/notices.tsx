import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useAppTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

export default function MobileNoticesScreen() {
  const { theme } = useAppTheme();
  const [notices, setNotices] = useState<Array<{ id: string; title: string; content: string; category: string; priority: string }>>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase
      .from("notices")
      .select("id, title, content, category, priority")
      .order("is_pinned", { ascending: false })
      .order("published_at", { ascending: false })
      .then(({ data }) => setNotices(data ?? []));
  }, []);

  const filtered = notices.filter(
    (n) => !search.trim() || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search university, exam & deadline notices..."
        placeholderTextColor={theme.muted}
        style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
      />
      {filtered.map((n) => (
        <View key={n.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={{ color: "#19B99A", fontSize: 11, fontWeight: "800", textTransform: "uppercase" }}>
            {n.category} • {n.priority}
          </Text>
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: "800", marginTop: 4 }}>{n.title}</Text>
          <Text style={{ color: theme.muted, fontSize: 13, marginTop: 6, lineHeight: 19 }}>{n.content}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  input: { height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16 },
});
