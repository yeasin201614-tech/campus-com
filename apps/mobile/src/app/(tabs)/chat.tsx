import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MessageSquare } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

interface MobileConv {
  id: string;
  title: string | null;
  last_message_preview: string | null;
  last_message_at: string;
}

export default function MobileChatListScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { theme } = useAppTheme();
  const [convs, setConvs] = useState<MobileConv[]>([]);

  useEffect(() => {
    if (!session?.user) return;
    supabase
      .from("conversation_members")
      .select("conversations(id, title, last_message_preview, last_message_at)")
      .eq("user_id", session.user.id)
      .then(({ data }) => {
        const list = (data ?? [])
          .map((m) => m.conversations as unknown as MobileConv | null)
          .filter((x): x is MobileConv => Boolean(x));
        setConvs(list);
      });
  }, [session?.user]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.heading, { color: theme.text }]}>Messages</Text>

        {convs.map((c) => (
          <TouchableOpacity
            key={c.id}
            onPress={() => router.push(`/chat/${c.id}`)}
            style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <View style={styles.avatar}>
              <MessageSquare size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "800", color: theme.text, fontSize: 15 }}>{c.title || "Campus Chat"}</Text>
              <Text numberOfLines={1} style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>
                {c.last_message_preview || "Tap to open conversation"}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {convs.length === 0 && (
          <Text style={{ color: theme.muted, textAlign: "center", marginTop: 24 }}>
            No active conversations yet. Start a chat from Marketplace or Community!
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  heading: { fontSize: 24, fontWeight: "800", marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 18, borderWidth: 1, padding: 14 },
  avatar: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#6038ED", alignItems: "center", justifyContent: "center" },
});
