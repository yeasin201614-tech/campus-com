import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Send } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

interface MobileMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export default function MobileChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { theme } = useAppTheme();
  const [messages, setMessages] = useState<MobileMessage[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!id) return;
    supabase
      .from("messages")
      .select("id, sender_id, content, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setMessages((data as MobileMessage[]) ?? []));

    const channel = supabase
      .channel(`mobile-conv:${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        (payload) => {
          const msg = payload.new as MobileMessage;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  async function send() {
    if (!id || !session?.user || !draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    await supabase.from("messages").insert({
      conversation_id: id,
      sender_id: session.user.id,
      content: text,
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        {messages.map((m) => {
          const mine = m.sender_id === session?.user?.id;
          return (
            <View
              key={m.id}
              style={[
                styles.bubble,
                {
                  alignSelf: mine ? "flex-end" : "flex-start",
                  backgroundColor: mine ? "#6038ED" : theme.card,
                  borderColor: theme.border,
                  borderWidth: mine ? 0 : 1,
                },
              ]}
            >
              <Text style={{ color: mine ? "#FFFFFF" : theme.text, fontSize: 14 }}>{m.content}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.composer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Message..."
          placeholderTextColor={theme.muted}
          style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
        />
        <TouchableOpacity onPress={send} style={styles.sendBtn}>
          <Send size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: "78%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  composer: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderTopWidth: 1 },
  input: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  sendBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#6038ED", alignItems: "center", justifyContent: "center" },
});
