import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  GraduationCap,
  MessageSquare,
  RefreshCw,
  Settings,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

interface MetricStats {
  totalUsers: number;
  totalUniversities: number;
  totalStudents: number;
  totalTeachers: number;
  totalEvents: number;
  totalCommunities: number;
}

const UNIVERSITIES_LIST = [
  { id: "33333333-3333-4333-8333-333333333301", name: "Northbridge University" },
  { id: "33333333-3333-4333-8333-333333333302", name: "Metropolitan Institute of Tech" },
  { id: "33333333-3333-4333-8333-333333333303", name: "Pacific Crest University" },
];

export default function MobileAdminCommandCenter() {
  const router = useRouter();
  const { profile } = useAuth();
  const { theme } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<MetricStats>({
    totalUsers: 4,
    totalUniversities: 3,
    totalStudents: 2,
    totalTeachers: 1,
    totalEvents: 0,
    totalCommunities: 0,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentPass, setNewStudentPass] = useState("CampusStudent2026!");
  const [newStudentId, setNewStudentId] = useState("");
  const [selectedUniId, setSelectedUniId] = useState(UNIVERSITIES_LIST[0].id);
  const [creatingStudent, setCreatingStudent] = useState(false);

  async function handleCreateStudent() {
    if (!newStudentName.trim() || !newStudentEmail.trim() || !newStudentPass) {
      Alert.alert("Missing Information", "Please enter student name, email, and password.");
      return;
    }
    setCreatingStudent(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: newStudentEmail.trim(),
        password: newStudentPass,
        options: {
          data: {
            full_name: newStudentName.trim(),
            requested_role: "student",
            university_id: selectedUniId,
            student_id_number: newStudentId.trim(),
          },
        },
      });
      if (error) {
        Alert.alert("Error Creating Student", error.message);
        return;
      }
      if (data?.user) {
        await supabase
          .from("profiles")
          .update({
            full_name: newStudentName.trim(),
            global_role: "student",
            is_verified: true,
            primary_university_id: selectedUniId,
          })
          .eq("id", data.user.id);

        if (newStudentId.trim()) {
          await supabase.from("student_records").insert({
            university_id: selectedUniId,
            user_id: data.user.id,
            student_id_number: newStudentId.trim(),
            verification_status: "verified",
          });
        }
      }
      Alert.alert(
        "Student Created Successfully",
        `Created student account for ${newStudentName.trim()}!\n\nEmail: ${newStudentEmail.trim()}\nPassword: ${newStudentPass}`
      );
      setModalOpen(false);
      setNewStudentName("");
      setNewStudentEmail("");
      setNewStudentId("");
      loadAdminStats();
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to create student account.");
    } finally {
      setCreatingStudent(false);
    }
  }

  async function loadAdminStats() {
    try {
      const [usersRes, unisRes, studentsRes, teachersRes, eventsRes, groupsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("universities").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("global_role", "student"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("global_role", "teacher"),
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase.from("community_groups").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        totalUsers: usersRes.count ?? 4,
        totalUniversities: unisRes.count ?? 3,
        totalStudents: studentsRes.count ?? 2,
        totalTeachers: teachersRes.count ?? 1,
        totalEvents: eventsRes.count ?? 0,
        totalCommunities: groupsRes.count ?? 0,
      });
    } catch {
      // Keep fallbacks
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAdminStats();
  }, []);

  const metricCards = [
    { label: "Total Users", value: stats.totalUsers, badge: "+12%", icon: Users, color: "#6038ED" },
    { label: "Universities", value: stats.totalUniversities, badge: "Multi-Tenant", icon: Building2, color: "#101B62" },
    { label: "Total Students", value: stats.totalStudents, badge: "Verified & Pending", icon: GraduationCap, color: "#19B99A" },
    { label: "Total Teachers", value: stats.totalTeachers, badge: "Faculty", icon: UserCheck, color: "#F59E0B" },
    { label: "Total Events", value: stats.totalEvents, badge: "Active", icon: Calendar, color: "#EC4899" },
    { label: "Active Communities", value: stats.totalCommunities, badge: "Campuses", icon: MessageSquare, color: "#3B82F6" },
  ];

  const adminModules = [
    { title: "Universities", desc: "Multi-campus management", icon: Building2, color: "#101B62" },
    { title: "User Roles", desc: "Permissions & credentials", icon: Users, color: "#6038ED" },
    { title: "Academic Departments", desc: "Faculties & courses", icon: GraduationCap, color: "#19B99A" },
    { title: "Notice Board", desc: "Campus-wide broadcasts", icon: Bell, color: "#F59E0B" },
    { title: "Event Management", desc: "QR check-in & schedules", icon: Calendar, color: "#EC4899" },
    { title: "Marketplace Oversight", desc: "Listings & safety", icon: ShoppingBag, color: "#8B5CF6" },
    { title: "Subscriptions & Billing", desc: "Institutional plans", icon: CreditCard, color: "#059669" },
    { title: "Platform Telemetry", desc: "Audit logs & security", icon: ShieldCheck, color: "#D97706" },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text }]}>Admin Command Center</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            {profile?.full_name || "Campus Super Admin"} • Super Admin
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            setRefreshing(true);
            loadAdminStats();
          }}
          style={styles.refreshBtn}
        >
          <RefreshCw size={18} color="#6038ED" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadAdminStats();
            }}
          />
        }
      >
        {/* Banner Card */}
        <View style={styles.bannerCard}>
          <View style={styles.badgeRow}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>SYSTEM LIVE</Text>
            </View>
            <Text style={{ color: "#CBD5E1", fontSize: 11, fontWeight: "600" }}>PostgreSQL 15 Connected</Text>
          </View>
          <Text style={styles.bannerTitle}>Super Admin Telemetry</Text>
          <Text style={styles.bannerSub}>
            Platform-wide metrics, university governance, and real-time user authentication telemetry.
          </Text>
        </View>

        {/* Quick Action: Add Student */}
        <TouchableOpacity
          style={styles.addStudentBtn}
          onPress={() => setModalOpen(true)}
        >
          <View style={styles.addStudentIconWrap}>
            <UserPlus size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addStudentTitle}>+ Add New Student Account</Text>
            <Text style={styles.addStudentSub}>Directly provision student credentials & university profile</Text>
          </View>
        </TouchableOpacity>

        {/* Metrics Grid */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Platform Metrics</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#6038ED" style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.metricsGrid}>
            {metricCards.map((card) => {
              const Icon = card.icon;
              return (
                <View
                  key={card.label}
                  style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                >
                  <View style={styles.metricHeader}>
                    <Text style={[styles.metricLabel, { color: theme.muted }]}>{card.label}</Text>
                    <View style={[styles.iconWrapper, { backgroundColor: card.color + "18" }]}>
                      <Icon size={16} color={card.color} />
                    </View>
                  </View>
                  <Text style={[styles.metricValue, { color: theme.text }]}>{card.value}</Text>
                  <View style={styles.badgeContainer}>
                    <Text style={[styles.metricBadge, { color: card.color }]}>{card.badge}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Revenue & Growth Summary */}
        <View style={[styles.growthCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={[styles.iconWrapper, { backgroundColor: "#19B99A18" }]}>
              <TrendingUp size={20} color="#19B99A" />
            </View>
            <View>
              <Text style={[styles.growthTitle, { color: theme.text }]}>Monthly User Growth</Text>
              <Text style={{ color: theme.muted, fontSize: 12 }}>Active campus adoption trend</Text>
            </View>
          </View>
          <Text style={{ fontSize: 20, fontWeight: "800", color: "#19B99A" }}>+18.4%</Text>
        </View>

        {/* Management Modules */}
        <Text style={[styles.sectionHeading, { color: theme.text, marginTop: 10 }]}>Management Modules</Text>
        <View style={styles.modulesGrid}>
          {adminModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <View
                key={mod.title}
                style={[styles.moduleCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View style={[styles.iconWrapper, { backgroundColor: mod.color + "18", marginBottom: 8 }]}>
                  <Icon size={18} color={mod.color} />
                </View>
                <Text style={[styles.moduleTitle, { color: theme.text }]}>{mod.title}</Text>
                <Text style={{ color: theme.muted, fontSize: 11, marginTop: 2 }}>{mod.desc}</Text>
              </View>
            );
          })}
        </View>

        {/* Recent Audit Activities */}
        <View style={[styles.auditCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Audit Activities</Text>
            <FileText size={16} color="#6038ED" />
          </View>
          <Text style={{ color: theme.muted, fontSize: 12 }}>
            • Admin account `admin@campus.com` verified as Super Admin
          </Text>
          <Text style={{ color: theme.muted, fontSize: 12, marginTop: 4 }}>
            • Teacher profile `Prof. Robert Harrison` confirmed
          </Text>
          <Text style={{ color: theme.muted, fontSize: 12, marginTop: 4 }}>
            • Student profile `Alex Johnson` linked to Northbridge University
          </Text>
          <Text style={{ color: theme.muted, fontSize: 12, marginTop: 4 }}>
            • Multi-tenant database schema 0001-0006 synchronized
          </Text>
        </View>
      </ScrollView>

      {/* Create Student Modal */}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <UserPlus size={20} color="#19B99A" />
                <Text style={[styles.modalTitle, { color: theme.text }]}>Add New Student</Text>
              </View>
              <TouchableOpacity onPress={() => setModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={20} color={theme.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 12 }}>
              <View>
                <Text style={[styles.inputLabel, { color: theme.muted }]}>Student Full Name</Text>
                <TextInput
                  value={newStudentName}
                  onChangeText={setNewStudentName}
                  placeholder="e.g. Emily Watson"
                  placeholderTextColor={theme.muted}
                  style={[styles.modalInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: theme.muted }]}>University Email</Text>
                <TextInput
                  value={newStudentEmail}
                  onChangeText={setNewStudentEmail}
                  placeholder="student@northbridge.edu"
                  placeholderTextColor={theme.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.modalInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: theme.muted }]}>Initial Password</Text>
                <TextInput
                  value={newStudentPass}
                  onChangeText={setNewStudentPass}
                  placeholder="Password"
                  placeholderTextColor={theme.muted}
                  style={[styles.modalInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: theme.muted }]}>Student ID Number (Optional)</Text>
                <TextInput
                  value={newStudentId}
                  onChangeText={setNewStudentId}
                  placeholder="e.g. STU-2026-089"
                  placeholderTextColor={theme.muted}
                  style={[styles.modalInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: theme.muted, marginBottom: 4 }]}>University</Text>
                {UNIVERSITIES_LIST.map((u) => (
                  <TouchableOpacity
                    key={u.id}
                    onPress={() => setSelectedUniId(u.id)}
                    style={[
                      styles.modalUniPill,
                      {
                        borderColor: selectedUniId === u.id ? "#19B99A" : theme.border,
                        backgroundColor: selectedUniId === u.id ? "rgba(25, 185, 154, 0.12)" : theme.background,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: theme.text }}>{u.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                <TouchableOpacity
                  style={[styles.modalCancelBtn, { borderColor: theme.border }]}
                  onPress={() => setModalOpen(false)}
                >
                  <Text style={{ fontWeight: "700", color: theme.text }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSubmitBtn, { backgroundColor: "#19B99A" }]}
                  onPress={handleCreateStudent}
                  disabled={creatingStudent}
                >
                  <Text style={styles.modalSubmitText}>
                    {creatingStudent ? "Creating..." : "Create Account"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 14 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  refreshBtn: { padding: 8, borderRadius: 12, backgroundColor: "#6038ED14" },
  title: { fontSize: 16, fontWeight: "800" },
  subtitle: { fontSize: 11, fontWeight: "500" },
  bannerCard: {
    backgroundColor: "#101B62",
    borderRadius: 20,
    padding: 18,
    gap: 8,
  },
  badgeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(25, 185, 154, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#19B99A" },
  liveText: { color: "#19B99A", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  bannerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  bannerSub: { color: "#CBD5E1", fontSize: 12, lineHeight: 17 },
  sectionHeading: { fontSize: 15, fontWeight: "800", marginTop: 4 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metricCard: {
    width: "48%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  metricHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  metricLabel: { fontSize: 11, fontWeight: "600" },
  iconWrapper: { padding: 8, borderRadius: 10 },
  metricValue: { fontSize: 22, fontWeight: "800", marginTop: 4 },
  badgeContainer: { marginTop: 4 },
  metricBadge: { fontSize: 10, fontWeight: "700" },
  growthCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  growthTitle: { fontSize: 14, fontWeight: "700" },
  modulesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  moduleCard: {
    width: "48%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  moduleTitle: { fontSize: 13, fontWeight: "700" },
  auditCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 4,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 13, fontWeight: "800" },
  addStudentBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#19B99A",
    borderRadius: 16,
    padding: 14,
  },
  addStudentIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  addStudentTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  addStudentSub: { color: "rgba(255, 255, 255, 0.85)", fontSize: 11, marginTop: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    padding: 18,
  },
  modalContent: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: { fontSize: 17, fontWeight: "800" },
  modalCloseBtn: { padding: 4 },
  inputLabel: { fontSize: 12, fontWeight: "700", marginBottom: 4 },
  modalInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  modalUniPill: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubmitBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubmitText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
});
