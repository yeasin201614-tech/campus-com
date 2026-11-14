import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { MessageSquare } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

interface MobileListing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  condition: string;
  location_text: string;
}

export default function MobileMarketplaceScreen() {
  const router = useRouter();
  const { session, profile } = useAuth();
  const { theme } = useAppTheme();
  const [listings, setListings] = useState<MobileListing[]>([]);

  useEffect(() => {
    supabase
      .from("marketplace_listings")
      .select("id, seller_id, title, description, price, currency, condition, location_text")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .then(({ data }) => setListings((data as MobileListing[]) ?? []));
  }, []);

  async function contactSeller(item: MobileListing) {
    if (!session?.user || item.seller_id === session.user.id) {
      Alert.alert("Notice", "Sign in to message the seller.");
      return;
    }
    const { data: conv } = await supabase
      .from("conversations")
      .insert({
        university_id: profile?.primary_university_id ?? null,
        is_group: false,
        title: `Listing: ${item.title}`,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (conv) {
      await supabase.from("conversation_members").insert([
        { conversation_id: conv.id, user_id: session.user.id, role: "member" },
        { conversation_id: conv.id, user_id: item.seller_id, role: "member" },
      ]);
      router.push(`/chat/${conv.id}`);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      {listings.map((item) => (
        <View key={item.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#19B99A", fontWeight: "700", fontSize: 12, textTransform: "capitalize" }}>
              {item.condition.replace("_", " ")}
            </Text>
            <Text style={{ fontWeight: "800", fontSize: 16, color: theme.text }}>
              {item.currency} {item.price}
            </Text>
          </View>
          <Text style={{ fontWeight: "800", fontSize: 15, color: theme.text, marginTop: 6 }}>{item.title}</Text>
          <Text style={{ color: theme.muted, fontSize: 13, marginTop: 4 }}>{item.description}</Text>
          <TouchableOpacity onPress={() => contactSeller(item)} style={styles.btn}>
            <MessageSquare size={14} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 13 }}>Contact Seller</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16 },
  btn: { marginTop: 12, backgroundColor: "#6038ED", borderRadius: 12, paddingVertical: 10, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
});
