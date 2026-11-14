import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { BrandLogo } from "@/components/BrandLogo";
import { useAppTheme } from "@/context/ThemeContext";
import { isMobileSupabaseConfigured, supabase } from "@/lib/supabase";

export default function MobileLoginScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!isMobileSupabaseConfigured) {
      Alert.alert("Configuration Required", "Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        Alert.alert("Sign In Error", error.message);
      } else {
        router.replace("/(tabs)/home");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <BrandLogo size={54} showTagline />
          <Text style={[styles.subtitle, { color: theme.muted }]}>Your Campus, Our Community</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.oauthBtn, { borderColor: theme.border }]}
            onPress={() => Alert.alert("OAuth Sign-In", "Configure Google OAuth redirect for campuscom://auth-callback in Supabase.")}
          >
            <Text style={{ fontWeight: "600", color: theme.text }}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.oauthBtn, { borderColor: theme.border }]}
            onPress={() => Alert.alert("OAuth Sign-In", "Configure Apple OAuth redirect for campuscom://auth-callback in Supabase.")}
          >
            <Text style={{ fontWeight: "600", color: theme.text }}>Continue with Apple</Text>
          </TouchableOpacity>

          <Text style={{ textAlign: "center", color: theme.muted, marginVertical: 10, fontSize: 12 }}>
            or sign in with university email
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="student@northbridge.edu"
            placeholderTextColor={theme.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={theme.muted}
            secureTextEntry
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: "#6038ED" }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>{loading ? "Signing in..." : "Login"}</Text>
          </TouchableOpacity>

          <Link href="/(auth)/register" asChild>
            <TouchableOpacity style={[styles.outlineBtn, { borderColor: theme.border }]}>
              <Text style={{ fontWeight: "700", color: theme.text }}>Create Account</Text>
            </TouchableOpacity>
          </Link>

          {!isMobileSupabaseConfigured && (
            <TouchableOpacity
              style={[styles.outlineBtn, { borderColor: "#19B99A", marginTop: 10 }]}
              onPress={() => router.replace("/(tabs)/home")}
            >
              <Text style={{ fontWeight: "700", color: "#19B99A" }}>Preview App UI (Demo)</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: 20 },
  subtitle: { marginTop: 12, fontSize: 14, fontWeight: "600" },
  card: { borderRadius: 24, borderWidth: 1, padding: 20, gap: 12 },
  oauthBtn: { height: 46, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  input: { height: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
  primaryBtn: { height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 4 },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  outlineBtn: { height: 48, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
