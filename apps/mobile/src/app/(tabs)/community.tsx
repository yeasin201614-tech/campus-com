import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Heart, MessageCircle, Send, Users } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

interface MobilePost {
  id: string;
  title: string | null;
  content: string;
  post_type: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export default function MobileCommunityScreen() {
  const router = useRouter();
  const { session, profile } = useAuth();
  const { theme } = useAppTheme();
  const [posts, setPosts] = useState<MobilePost[]>([]);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");

  async function loadPosts() {
    const { data } = await supabase
      .from("campus_posts")
      .select("id, title, content, post_type, likes_count, comments_count, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    setPosts((data as MobilePost[]) ?? []);
  }

  useEffect(() => {
    loadPosts();
  }, []);

  async function submitPost() {
    if (!draft.trim() || !session?.user || !profile?.primary_university_id) {
      Alert.alert("Sign In Required", "Please sign in and link a university to post.");
      return;
    }
    const { data, error } = await supabase
      .from("campus_posts")
      .insert({
        university_id: profile.primary_university_id,
        author_id: session.user.id,
        content: draft.trim(),
        post_type: "discussion",
        visibility: "university",
      })
      .select("id, title, content, post_type, likes_count, comments_count, created_at")
      .single();

    if (error) {
      Alert.alert("Post Failed", error.message);
    } else if (data) {
      setPosts((prev) => [data as MobilePost, ...prev]);
      setDraft("");
    }
  }

  async function likePost(postId: string) {
    if (!session?.user) return;
    await supabase.from("post_likes").upsert({ post_id: postId, user_id: session.user.id }, { onConflict: "post_id,user_id" });
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p)));
  }

  const filtered = posts.filter((p) => !search.trim() || p.content.toLowerCase().includes(search.toLowerCase()));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topBar}>
          <Text style={[styles.heading, { color: theme.text }]}>Community</Text>
          <TouchableOpacity onPress={() => router.push("/groups")} style={styles.groupBtn}>
            <Users size={15} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 12 }}>Groups</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search campus posts..."
          placeholderTextColor={theme.muted}
          style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
        />

        <View style={[styles.composer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Share an update with your campus..."
            placeholderTextColor={theme.muted}
            multiline
            style={{ color: theme.text, minHeight: 54, fontSize: 14 }}
          />
          <TouchableOpacity onPress={submitPost} style={styles.postBtn}>
            <Send size={14} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 12 }}>Post</Text>
          </TouchableOpacity>
        </View>

        {filtered.map((p) => (
          <View key={p.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={{ color: "#19B99A", fontSize: 11, fontWeight: "800", textTransform: "uppercase" }}>
              {p.post_type}
            </Text>
            {p.title && <Text style={{ color: theme.text, fontWeight: "800", fontSize: 15, marginTop: 4 }}>{p.title}</Text>}
            <Text style={{ color: theme.text, fontSize: 14, marginTop: 6, lineHeight: 20 }}>{p.content}</Text>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => likePost(p.id)} style={styles.actionItem}>
                <Heart size={16} color="#F43F5E" />
                <Text style={{ color: theme.muted, fontSize: 12 }}>{p.likes_count}</Text>
              </TouchableOpacity>
              <View style={styles.actionItem}>
                <MessageCircle size={16} color="#6038ED" />
                <Text style={{ color: theme.muted, fontSize: 12 }}>{p.comments_count}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 14 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heading: { fontSize: 24, fontWeight: "800" },
  groupBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#101B62", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  input: { height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
  composer: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 10 },
  postBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-end", backgroundColor: "#6038ED", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16 },
  actions: { flexDirection: "row", gap: 18, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(148,163,184,0.2)" },
  actionItem: { flexDirection: "row", alignItems: "center", gap: 5 },
});
