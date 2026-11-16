import React from "react";
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LogOut, Moon, ShieldCheck } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { ROLE_LABELS } from "@campus/shared";

export default function MobileProfileScreen() {
  const router = useRouter();
  const { profile, university, signOut } = useAuth();
  const { theme, toggleTheme } = useAppTheme();

  async function handleLogout() {
    await signOut();
    router.replace("/(auth)/login");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{(profile?.full_name || "C")[0]}</Text>
          </View>
          <Text style={styles.name}>{profile?.full_name || "Campus Student"}</Text>
          <Text style={styles.email}>{profile?.email || "student@campus.com"}</Text>
          <View style={styles.badge}>
            <ShieldCheck size={13} color="#19B99A" />
            <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "700" }}>
              {profile ? ROLE_LABELS[profile.global_role] : "Student"} • {university?.short_code || "Campus.com"}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>About & Skills</Text>
          <Text style={{ color: theme.muted, fontSize: 13 }}>
            {profile?.bio || "Update your student bio, academic year, and skills in your profile settings."}
          </Text>
          {(profile?.skills?.length ?? 0) > 0 && (
            <Text style={{ color: "#6038ED", fontSize: 12, fontWeight: "700", marginTop: 6 }}>
              Skills: {profile?.skills.join(" • ")}
            </Text>
          )}
        </View>

        {profile?.global_role === "super_admin" && (
          <TouchableOpacity
            onPress={() => router.push("/admin" as any)}
            style={[styles.card, { backgroundColor: "#101B62", borderColor: "#6038ED", borderWidth: 1.5 }]}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={20} color="#19B99A" />
                <Text style={{ fontWeight: "800", color: "#FFFFFF", fontSize: 14 }}>Admin Command Center</Text>
              </View>
              <Text style={{ color: "#19B99A", fontSize: 12, fontWeight: "800" }}>Manage →</Text>
            </View>
            <Text style={{ color: "#CBD5E1", fontSize: 12, marginTop: 4 }}>
              Access full 20 modules, university telemetry & user roles.
            </Text>
          </TouchableOpacity>
        )}

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Moon size={18} color="#6038ED" />
            <Text style={{ fontWeight: "700", color: theme.text }}>Dark Theme</Text>
          </View>
          <Switch value={theme.isDark} onValueChange={toggleTheme} />
        </View>

        <TouchableOpacity onPress={handleLogout} style={[styles.logoutBtn, { borderColor: theme.danger }]}>
          <LogOut size={16} color={theme.danger} />
          <Text style={{ color: theme.danger, fontWeight: "800" }}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 14 },
  headerCard: { backgroundColor: "#101B62", borderRadius: 24, padding: 22, alignItems: "center" },
  avatarCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#6038ED", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontSize: 26, fontWeight: "800" },
  name: { color: "#FFFFFF", fontSize: 20, fontWeight: "800", marginTop: 10 },
  email: { color: "#CBD5E1", fontSize: 12, marginTop: 2 },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, backgroundColor: "rgba(255,255,255,0.14)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 6 },
  sectionTitle: { fontSize: 14, fontWeight: "800" },
  logoutBtn: { borderWidth: 1, borderRadius: 16, paddingVertical: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
});
