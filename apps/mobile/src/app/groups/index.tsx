import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

export default function MobileGroupsScreen() {
  const { session } = useAuth();
  const { theme } = useAppTheme();
  const [groups, setGroups] = useState<Array<{ id: string; name: string; category: string; description: string; members_count: number }>>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase
      .from("community_groups")
      .select("id, name, category, description, members_count")
      .eq("is_active", true)
      .then(({ data }) => setGroups(data ?? []));

    if (session?.user) {
      supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", session.user.id)
        .then(({ data }) => setJoinedIds(new Set((data ?? []).map((g) => g.group_id))));
    }
  }, [session?.user]);

  async function joinGroup(groupId: string) {
    if (!session?.user) return;
    await supabase.from("group_members").insert({ group_id: groupId, user_id: session.user.id, role: "member", status: "approved" });
    setJoinedIds((prev) => new Set(prev).add(groupId));
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      {groups.map((g) => {
        const joined = joinedIds.has(g.id);
        return (
          <View key={g.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={{ color: "#19B99A", fontSize: 11, fontWeight: "800" }}>{g.category}</Text>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: "800", marginTop: 4 }}>{g.name}</Text>
            <Text style={{ color: theme.muted, fontSize: 13, marginTop: 4 }}>{g.description}</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <Text style={{ color: theme.muted, fontSize: 12 }}>{g.members_count} members</Text>
              <TouchableOpacity
                onPress={() => !joined && joinGroup(g.id)}
                style={[styles.btn, { backgroundColor: joined ? "#19B99A" : "#6038ED" }]}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 12 }}>
                  {joined ? "Joined" : "Join Group"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16 },
  btn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
});
