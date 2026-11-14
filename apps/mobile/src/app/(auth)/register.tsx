import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { BrandLogo } from "@/components/BrandLogo";
import { useAppTheme } from "@/context/ThemeContext";
import { isMobileSupabaseConfigured, supabase } from "@/lib/supabase";

const UNIVERSITIES = [
  { id: "33333333-3333-4333-8333-333333333301", name: "Northbridge University" },
  { id: "33333333-3333-4333-8333-333333333302", name: "Metropolitan Institute of Technology" },
  { id: "33333333-3333-4333-8333-333333333303", name: "Pacific Crest University" },
];

export default function MobileRegisterScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentId, setStudentId] = useState("");
  const [universityId, setUniversityId] = useState(UNIVERSITIES[0].id);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!isMobileSupabaseConfigured) {
      Alert.alert("Configuration Required", "Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            requested_role: "student",
            university_id: universityId,
            student_id_number: studentId.trim(),
          },
        },
      });
      if (error) {
        Alert.alert("Registration Failed", error.message);
      } else {
        Alert.alert("Welcome to Campus.com", "Account created! Sign in to continue.");
        router.replace("/(auth)/login");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={{ alignItems: "center", marginBottom: 18 }}>
          <BrandLogo size={42} showTagline />
          <Text style={[styles.title, { color: theme.text }]}>Join Your Campus</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full Name"
            placeholderTextColor={theme.muted}
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
          />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="University Email"
            placeholderTextColor={theme.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
          />
          <TextInput
            value={studentId}
            onChangeText={setStudentId}
            placeholder="Student ID (e.g. NBU-2026-0412)"
            placeholderTextColor={theme.muted}
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
          />

          <Text style={{ fontSize: 12, fontWeight: "700", color: theme.muted }}>Select University</Text>
          {UNIVERSITIES.map((u) => (
            <TouchableOpacity
              key={u.id}
              onPress={() => setUniversityId(u.id)}
              style={[
                styles.uniPill,
                {
                  borderColor: universityId === u.id ? "#6038ED" : theme.border,
                  backgroundColor: universityId === u.id ? "rgba(96, 56, 237, 0.1)" : theme.background,
                },
              ]}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: theme.text }}>{u.name}</Text>
            </TouchableOpacity>
          ))}

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password (min 8 chars)"
            placeholderTextColor={theme.muted}
            secureTextEntry
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: "#6038ED" }]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>{loading ? "Creating Account..." : "Join Campus.com"}</Text>
          </TouchableOpacity>

          <Link href="/(auth)/login" style={{ textAlign: "center", color: "#6038ED", fontWeight: "700", marginTop: 6 }}>
            Already have an account? Login
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: 20 },
  title: { marginTop: 12, fontSize: 20, fontWeight: "800" },
  card: { borderRadius: 24, borderWidth: 1, padding: 20, gap: 10 },
  input: { height: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
  uniPill: { borderWidth: 1, borderRadius: 12, padding: 10 },
  primaryBtn: { height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 6 },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
});
