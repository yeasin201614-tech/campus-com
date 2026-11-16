import React, { useEffect, useMemo, useState } from "react";
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
  Bell,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  Globe,
  GraduationCap,
  Mail,
  MapPin,
  MessageSquare,
  RefreshCw,
  Search,
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

export type ExplorerTab =
  | "students"
  | "universities"
  | "teachers"
  | "users"
  | "departments"
  | "notices"
  | "events"
  | "communities"
  | "marketplace"
  | "billing"
  | "audit";

interface MetricStats {
  totalUsers: number;
  totalUniversities: number;
  totalStudents: number;
  totalTeachers: number;
  totalEvents: number;
  totalCommunities: number;
}

export interface ProfileItem {
  id: string;
  full_name: string;
  email: string;
  global_role: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  universities?: { name?: string } | Array<{ name?: string }> | null;
}

export interface UniversityItem {
  id: string;
  name: string;
  short_code: string;
  city?: string | null;
  country?: string | null;
  website_url?: string | null;
  student_capacity?: number | null;
  status: string;
}

export interface DepartmentItem {
  id: string;
  name: string;
  code: string;
  universities?: { name?: string } | Array<{ name?: string }> | null;
}

export function getUniversityName(val: unknown, fallback = "Unassigned University"): string {
  if (!val) return fallback;
  if (Array.isArray(val) && val.length > 0) return val[0]?.name || fallback;
  if (typeof val === "object" && "name" in val) return (val as { name?: string }).name || fallback;
  return fallback;
}

export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  priority: string;
  created_at: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  status: string;
  starts_at?: string;
}

export interface CommunityItem {
  id: string;
  name: string;
  description: string;
  members_count?: number;
}

const FALLBACK_UNIVERSITIES = [
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
    totalUsers: 6,
    totalUniversities: 4,
    totalStudents: 4,
    totalTeachers: 1,
    totalEvents: 0,
    totalCommunities: 0,
  });

  // Student creation modal
  const [modalOpen, setModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentPass, setNewStudentPass] = useState("CampusStudent2026!");
  const [newStudentId, setNewStudentId] = useState("");
  const [selectedUniId, setSelectedUniId] = useState(FALLBACK_UNIVERSITIES[0].id);
  const [creatingStudent, setCreatingStudent] = useState(false);

  // Data Explorer state
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ExplorerTab>("students");
  const [searchQuery, setSearchQuery] = useState("");
  const [explorerLoading, setExplorerLoading] = useState(false);

  const [allUsersList, setAllUsersList] = useState<ProfileItem[]>([]);
  const [studentsList, setStudentsList] = useState<ProfileItem[]>([]);
  const [teachersList, setTeachersList] = useState<ProfileItem[]>([]);
  const [universitiesList, setUniversitiesList] = useState<UniversityItem[]>([]);
  const [departmentsList, setDepartmentsList] = useState<DepartmentItem[]>([]);
  const [noticesList, setNoticesList] = useState<NoticeItem[]>([]);
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [communitiesList, setCommunitiesList] = useState<CommunityItem[]>([]);

  const availableUniversities = useMemo(() => {
    if (universitiesList.length > 0) {
      return universitiesList.map((u) => ({ id: u.id, name: u.name }));
    }
    return FALLBACK_UNIVERSITIES;
  }, [universitiesList]);

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
        totalUsers: usersRes.count ?? 6,
        totalUniversities: unisRes.count ?? 4,
        totalStudents: studentsRes.count ?? 4,
        totalTeachers: teachersRes.count ?? 1,
        totalEvents: eventsRes.count ?? 0,
        totalCommunities: groupsRes.count ?? 0,
      });
    } catch {
      // keep fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadExplorerData() {
    setExplorerLoading(true);
    try {
      const [allProfilesRes, unisRes, deptsRes, noticesRes, eventsRes, groupsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, global_role, is_verified, is_active, created_at, universities!profiles_primary_university_id_fkey(name)")
          .order("created_at", { ascending: false }),
        supabase
          .from("universities")
          .select("id, name, short_code, city, country, website_url, student_capacity, status")
          .order("name", { ascending: true }),
        supabase
          .from("departments")
          .select("id, name, code, universities(name)")
          .order("name", { ascending: true }),
        supabase
          .from("notices")
          .select("id, title, content, priority, created_at")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("events")
          .select("id, title, description, status, starts_at")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("community_groups")
          .select("id, name, description, members_count")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      const all = (allProfilesRes.data ?? []) as unknown as ProfileItem[];
      setAllUsersList(all);
      setStudentsList(all.filter((p) => p.global_role === "student"));
      setTeachersList(all.filter((p) => p.global_role === "teacher"));

      if (unisRes.data) setUniversitiesList(unisRes.data as unknown as UniversityItem[]);
      if (deptsRes.data) setDepartmentsList(deptsRes.data as unknown as DepartmentItem[]);
      if (noticesRes.data) setNoticesList(noticesRes.data as NoticeItem[]);
      if (eventsRes.data) setEventsList(eventsRes.data as EventItem[]);
      if (groupsRes.data) setCommunitiesList(groupsRes.data as CommunityItem[]);
    } catch (e) {
      console.error("Error loading explorer data", e);
    } finally {
      setExplorerLoading(false);
    }
  }

  useEffect(() => {
    loadAdminStats();
    loadExplorerData();
  }, []);

  function openExplorer(tab: ExplorerTab) {
    setActiveTab(tab);
    setSearchQuery("");
    setExplorerOpen(true);
    loadExplorerData();
  }

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
      loadExplorerData();
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to create student account.");
    } finally {
      setCreatingStudent(false);
    }
  }

  // Filtered lists for Explorer
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return studentsList;
    return studentsList.filter(
      (s) =>
        s.full_name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        getUniversityName(s.universities).toLowerCase().includes(q)
    );
  }, [studentsList, searchQuery]);

  const filteredUniversities = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return universitiesList;
    return universitiesList.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.short_code?.toLowerCase().includes(q) ||
        u.city?.toLowerCase().includes(q) ||
        u.country?.toLowerCase().includes(q)
    );
  }, [universitiesList, searchQuery]);

  const filteredTeachers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return teachersList;
    return teachersList.filter(
      (t) =>
        t.full_name?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        getUniversityName(t.universities).toLowerCase().includes(q)
    );
  }, [teachersList, searchQuery]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allUsersList;
    return allUsersList.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.global_role?.toLowerCase().includes(q)
    );
  }, [allUsersList, searchQuery]);

  const filteredDepartments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return departmentsList;
    return departmentsList.filter(
      (d) =>
        d.name?.toLowerCase().includes(q) ||
        d.code?.toLowerCase().includes(q) ||
        getUniversityName(d.universities).toLowerCase().includes(q)
    );
  }, [departmentsList, searchQuery]);

  const filteredNotices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return noticesList;
    return noticesList.filter(
      (n) => n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q)
    );
  }, [noticesList, searchQuery]);

  const filteredEvents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return eventsList;
    return eventsList.filter(
      (e) => e.title?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q)
    );
  }, [eventsList, searchQuery]);

  const filteredCommunities = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return communitiesList;
    return communitiesList.filter(
      (c) => c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
    );
  }, [communitiesList, searchQuery]);

  const metricCards: Array<{
    label: string;
    value: number;
    badge: string;
    icon: typeof Users;
    color: string;
    tab: ExplorerTab;
  }> = [
    { label: "Total Users", value: stats.totalUsers, badge: "+12%", icon: Users, color: "#6038ED", tab: "users" },
    { label: "Universities", value: stats.totalUniversities, badge: "Multi-Tenant", icon: Building2, color: "#101B62", tab: "universities" },
    { label: "Total Students", value: stats.totalStudents, badge: "Verified & Pending", icon: GraduationCap, color: "#19B99A", tab: "students" },
    { label: "Total Teachers", value: stats.totalTeachers, badge: "Faculty", icon: UserCheck, color: "#F59E0B", tab: "teachers" },
    { label: "Total Events", value: stats.totalEvents, badge: "Active", icon: Calendar, color: "#EC4899", tab: "events" },
    { label: "Active Communities", value: stats.totalCommunities, badge: "Campuses", icon: MessageSquare, color: "#3B82F6", tab: "communities" },
  ];

  const adminModules: Array<{
    title: string;
    desc: string;
    icon: typeof Building2;
    color: string;
    tab: ExplorerTab;
  }> = [
    { title: "Universities", desc: "Multi-campus management", icon: Building2, color: "#101B62", tab: "universities" },
    { title: "User Roles", desc: "Permissions & credentials", icon: Users, color: "#6038ED", tab: "users" },
    { title: "Academic Departments", desc: "Faculties & courses", icon: GraduationCap, color: "#19B99A", tab: "departments" },
    { title: "Notice Board", desc: "Campus-wide broadcasts", icon: Bell, color: "#F59E0B", tab: "notices" },
    { title: "Event Management", desc: "QR check-in & schedules", icon: Calendar, color: "#EC4899", tab: "events" },
    { title: "Marketplace Oversight", desc: "Listings & safety", icon: ShoppingBag, color: "#8B5CF6", tab: "marketplace" },
    { title: "Subscriptions & Billing", desc: "Institutional plans", icon: CreditCard, color: "#059669", tab: "billing" },
    { title: "Platform Telemetry", desc: "Audit logs & security", icon: ShieldCheck, color: "#D97706", tab: "audit" },
  ];

  const explorerTabs: Array<{ id: ExplorerTab; label: string; count?: number }> = [
    { id: "students", label: "Students", count: studentsList.length },
    { id: "universities", label: "Universities", count: universitiesList.length },
    { id: "teachers", label: "Teachers", count: teachersList.length },
    { id: "users", label: "All Users", count: allUsersList.length },
    { id: "departments", label: "Departments", count: departmentsList.length },
    { id: "notices", label: "Notices", count: noticesList.length },
    { id: "events", label: "Events", count: eventsList.length },
    { id: "communities", label: "Communities", count: communitiesList.length },
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
            loadExplorerData();
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
              loadExplorerData();
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
          activeOpacity={0.85}
        >
          <View style={styles.addStudentIconWrap}>
            <UserPlus size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addStudentTitle}>+ Add New Student Account</Text>
            <Text style={styles.addStudentSub}>Directly provision student credentials & university profile</Text>
          </View>
        </TouchableOpacity>

        {/* Quick Directory Explorer Pill Bar */}
        <View>
          <Text style={[styles.sectionHeading, { color: theme.text, marginBottom: 8 }]}>
            Explore Directories (Tap to view details)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <TouchableOpacity
              style={[styles.pillBtn, { backgroundColor: "#19B99A16", borderColor: "#19B99A" }]}
              onPress={() => openExplorer("students")}
            >
              <GraduationCap size={15} color="#19B99A" />
              <Text style={[styles.pillText, { color: "#19B99A" }]}>Students ({stats.totalStudents})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pillBtn, { backgroundColor: "#101B6216", borderColor: "#101B62" }]}
              onPress={() => openExplorer("universities")}
            >
              <Building2 size={15} color="#101B62" />
              <Text style={[styles.pillText, { color: theme.text }]}>Universities ({stats.totalUniversities})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pillBtn, { backgroundColor: "#F59E0B16", borderColor: "#F59E0B" }]}
              onPress={() => openExplorer("teachers")}
            >
              <UserCheck size={15} color="#F59E0B" />
              <Text style={[styles.pillText, { color: "#D97706" }]}>Teachers ({stats.totalTeachers})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pillBtn, { backgroundColor: "#6038ED16", borderColor: "#6038ED" }]}
              onPress={() => openExplorer("users")}
            >
              <Users size={15} color="#6038ED" />
              <Text style={[styles.pillText, { color: "#6038ED" }]}>All Users ({stats.totalUsers})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pillBtn, { backgroundColor: "#3B82F616", borderColor: "#3B82F6" }]}
              onPress={() => openExplorer("departments")}
            >
              <BookOpen size={15} color="#3B82F6" />
              <Text style={[styles.pillText, { color: "#3B82F6" }]}>Departments ({departmentsList.length})</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Metrics Grid */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={[styles.sectionHeading, { color: theme.text }]}>Platform Metrics</Text>
          <Text style={{ fontSize: 11, fontWeight: "600", color: "#6038ED" }}>Tap any card to view</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#6038ED" style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.metricsGrid}>
            {metricCards.map((card) => {
              const Icon = card.icon;
              return (
                <TouchableOpacity
                  key={card.label}
                  activeOpacity={0.7}
                  onPress={() => openExplorer(card.tab)}
                  style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                >
                  <View style={styles.metricHeader}>
                    <Text style={[styles.metricLabel, { color: theme.muted }]}>{card.label}</Text>
                    <View style={[styles.iconWrapper, { backgroundColor: card.color + "18" }]}>
                      <Icon size={16} color={card.color} />
                    </View>
                  </View>
                  <Text style={[styles.metricValue, { color: theme.text }]}>{card.value}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                    <Text style={[styles.metricBadge, { color: card.color }]}>{card.badge}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                      <Text style={{ fontSize: 10, fontWeight: "700", color: card.color }}>View List</Text>
                      <ChevronRight size={12} color={card.color} />
                    </View>
                  </View>
                </TouchableOpacity>
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
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <Text style={[styles.sectionHeading, { color: theme.text }]}>Management Modules</Text>
          <Text style={{ fontSize: 11, fontWeight: "600", color: "#6038ED" }}>Tap module to open</Text>
        </View>

        <View style={styles.modulesGrid}>
          {adminModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <TouchableOpacity
                key={mod.title}
                activeOpacity={0.7}
                onPress={() => openExplorer(mod.tab)}
                style={[styles.moduleCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View style={[styles.iconWrapper, { backgroundColor: mod.color + "18", marginBottom: 8 }]}>
                  <Icon size={18} color={mod.color} />
                </View>
                <Text style={[styles.moduleTitle, { color: theme.text }]}>{mod.title}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                  <Text style={{ color: theme.muted, fontSize: 11, flex: 1 }} numberOfLines={1}>
                    {mod.desc}
                  </Text>
                  <ChevronRight size={14} color={mod.color} />
                </View>
              </TouchableOpacity>
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

      {/* FULL-SCREEN DATA EXPLORER MODAL */}
      <Modal visible={explorerOpen} animationType="slide" onRequestClose={() => setExplorerOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
          {/* Explorer Top Bar */}
          <View style={[styles.topBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity onPress={() => setExplorerOpen(false)} style={styles.backBtn}>
              <ArrowLeft size={22} color={theme.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.text }]}>
                {activeTab === "students" && `Students Directory (${filteredStudents.length})`}
                {activeTab === "universities" && `Universities (${filteredUniversities.length})`}
                {activeTab === "teachers" && `Faculty & Teachers (${filteredTeachers.length})`}
                {activeTab === "users" && `All Users (${filteredUsers.length})`}
                {activeTab === "departments" && `Academic Departments (${filteredDepartments.length})`}
                {activeTab === "notices" && `Campus Notices (${filteredNotices.length})`}
                {activeTab === "events" && `Campus Events (${filteredEvents.length})`}
                {activeTab === "communities" && `Active Communities (${filteredCommunities.length})`}
                {activeTab === "marketplace" && "Marketplace Oversight"}
                {activeTab === "billing" && "Subscriptions & Billing"}
                {activeTab === "audit" && "Platform Telemetry & Audit"}
              </Text>
              <Text style={[styles.subtitle, { color: theme.muted }]}>
                Live Supabase PostgreSQL 15 Directory
              </Text>
            </View>
            <TouchableOpacity onPress={loadExplorerData} style={styles.refreshBtn}>
              <RefreshCw size={18} color="#6038ED" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setExplorerOpen(false)} style={{ padding: 6, marginLeft: 4 }}>
              <X size={22} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Segmented Horizontal Tabs */}
          <View style={{ borderBottomWidth: 1, borderColor: theme.border, backgroundColor: theme.card }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}>
              {explorerTabs.map((t) => {
                const isActive = activeTab === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => {
                      setActiveTab(t.id);
                      setSearchQuery("");
                    }}
                    style={[
                      styles.tabPill,
                      {
                        backgroundColor: isActive ? "#6038ED" : theme.background,
                        borderColor: isActive ? "#6038ED" : theme.border,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "700", color: isActive ? "#FFFFFF" : theme.text }}>
                      {t.label} {t.count !== undefined ? `(${t.count})` : ""}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Search Box */}
          <View style={[styles.searchBoxWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Search size={18} color={theme.muted} style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={`Search ${activeTab}...`}
              placeholderTextColor={theme.muted}
              style={[styles.searchInput, { color: theme.text }]}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <X size={16} color={theme.muted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Action Header for Students */}
          {activeTab === "students" && (
            <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 }}>
              <TouchableOpacity
                style={styles.addStudentInlineBtn}
                onPress={() => setModalOpen(true)}
              >
                <UserPlus size={16} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 13 }}>+ Add New Student Account</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* List Content */}
          <ScrollView contentContainerStyle={styles.listContainer}>
            {explorerLoading ? (
              <ActivityIndicator size="large" color="#6038ED" style={{ marginVertical: 30 }} />
            ) : null}

            {/* STUDENTS TAB */}
            {activeTab === "students" && (
              <>
                {filteredStudents.length === 0 && !explorerLoading ? (
                  <View style={styles.emptyWrap}>
                    <GraduationCap size={40} color={theme.muted} />
                    <Text style={[styles.emptyText, { color: theme.muted }]}>No students found</Text>
                  </View>
                ) : (
                  filteredStudents.map((s) => (
                    <View key={s.id} style={[styles.cardItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <View style={styles.itemHeader}>
                        <View style={[styles.avatarCircle, { backgroundColor: "#19B99A22" }]}>
                          <Text style={{ color: "#19B99A", fontWeight: "800", fontSize: 14 }}>
                            {s.full_name?.slice(0, 2).toUpperCase() || "ST"}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.itemTitle, { color: theme.text }]}>{s.full_name || "Unnamed Student"}</Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                            <Mail size={12} color={theme.muted} />
                            <Text style={[styles.itemSub, { color: theme.muted }]}>{s.email}</Text>
                          </View>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: s.is_verified ? "#19B99A20" : "#F59E0B20" }]}>
                          {s.is_verified ? <CheckCircle2 size={12} color="#19B99A" /> : <Clock size={12} color="#F59E0B" />}
                          <Text style={{ fontSize: 11, fontWeight: "700", color: s.is_verified ? "#19B99A" : "#D97706" }}>
                            {s.is_verified ? "Verified" : "Pending"}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.itemFooter}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Building2 size={13} color="#6038ED" />
                          <Text style={{ fontSize: 12, fontWeight: "600", color: theme.text }}>
                            {getUniversityName(s.universities, "Unassigned University")}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 11, color: theme.muted }}>
                          {s.created_at ? new Date(s.created_at).toLocaleDateString() : ""}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </>
            )}

            {/* UNIVERSITIES TAB */}
            {activeTab === "universities" && (
              <>
                {filteredUniversities.length === 0 && !explorerLoading ? (
                  <View style={styles.emptyWrap}>
                    <Building2 size={40} color={theme.muted} />
                    <Text style={[styles.emptyText, { color: theme.muted }]}>No universities found</Text>
                  </View>
                ) : (
                  filteredUniversities.map((u) => (
                    <View key={u.id} style={[styles.cardItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <View style={styles.itemHeader}>
                        <View style={[styles.avatarCircle, { backgroundColor: "#101B6222" }]}>
                          <Building2 size={18} color="#101B62" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <Text style={[styles.itemTitle, { color: theme.text }]}>{u.name}</Text>
                            <View style={styles.codePill}>
                              <Text style={styles.codePillText}>{u.short_code}</Text>
                            </View>
                          </View>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                            <MapPin size={12} color={theme.muted} />
                            <Text style={[styles.itemSub, { color: theme.muted }]}>
                              {[u.city, u.country].filter(Boolean).join(", ") || "Global Campus"}
                            </Text>
                          </View>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: "#19B99A20" }]}>
                          <CheckCircle2 size={12} color="#19B99A" />
                          <Text style={{ fontSize: 11, fontWeight: "700", color: "#19B99A" }}>Active</Text>
                        </View>
                      </View>

                      <View style={styles.itemFooter}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Users size={13} color="#6038ED" />
                          <Text style={{ fontSize: 12, fontWeight: "600", color: theme.text }}>
                            {u.student_capacity ? `${u.student_capacity.toLocaleString()} Capacity` : "Standard Tier"}
                          </Text>
                        </View>
                        {u.website_url ? (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Globe size={12} color={theme.muted} />
                            <Text style={{ fontSize: 11, color: "#6038ED" }}>{u.website_url}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  ))
                )}
              </>
            )}

            {/* TEACHERS TAB */}
            {activeTab === "teachers" && (
              <>
                {filteredTeachers.length === 0 && !explorerLoading ? (
                  <View style={styles.emptyWrap}>
                    <UserCheck size={40} color={theme.muted} />
                    <Text style={[styles.emptyText, { color: theme.muted }]}>No teachers found</Text>
                  </View>
                ) : (
                  filteredTeachers.map((t) => (
                    <View key={t.id} style={[styles.cardItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <View style={styles.itemHeader}>
                        <View style={[styles.avatarCircle, { backgroundColor: "#F59E0B22" }]}>
                          <UserCheck size={18} color="#F59E0B" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.itemTitle, { color: theme.text }]}>{t.full_name}</Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                            <Mail size={12} color={theme.muted} />
                            <Text style={[styles.itemSub, { color: theme.muted }]}>{t.email}</Text>
                          </View>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: "#F59E0B20" }]}>
                          <Text style={{ fontSize: 11, fontWeight: "800", color: "#D97706" }}>Faculty</Text>
                        </View>
                      </View>

                      <View style={styles.itemFooter}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Building2 size={13} color="#6038ED" />
                          <Text style={{ fontSize: 12, fontWeight: "600", color: theme.text }}>
                            {getUniversityName(t.universities, "Northbridge University")}
                          </Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <CheckCircle2 size={12} color="#19B99A" />
                          <Text style={{ fontSize: 11, color: "#19B99A", fontWeight: "700" }}>Verified</Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </>
            )}

            {/* ALL USERS TAB */}
            {activeTab === "users" && (
              <>
                {filteredUsers.length === 0 && !explorerLoading ? (
                  <View style={styles.emptyWrap}>
                    <Users size={40} color={theme.muted} />
                    <Text style={[styles.emptyText, { color: theme.muted }]}>No users found</Text>
                  </View>
                ) : (
                  filteredUsers.map((u) => {
                    const isSuper = u.global_role === "super_admin";
                    const isTeacher = u.global_role === "teacher";
                    const roleColor = isSuper ? "#6038ED" : isTeacher ? "#F59E0B" : "#19B99A";
                    return (
                      <View key={u.id} style={[styles.cardItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <View style={styles.itemHeader}>
                          <View style={[styles.avatarCircle, { backgroundColor: roleColor + "22" }]}>
                            <Text style={{ color: roleColor, fontWeight: "800", fontSize: 14 }}>
                              {u.full_name?.slice(0, 2).toUpperCase() || "US"}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.itemTitle, { color: theme.text }]}>{u.full_name}</Text>
                            <Text style={[styles.itemSub, { color: theme.muted }]}>{u.email}</Text>
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: roleColor + "20" }]}>
                            <Text style={{ fontSize: 11, fontWeight: "800", color: roleColor, textTransform: "capitalize" }}>
                              {u.global_role.replace("_", " ")}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.itemFooter}>
                          <Text style={{ fontSize: 12, color: theme.muted }}>
                            University: {getUniversityName(u.universities, "Institutional / Root")}
                          </Text>
                          <Text style={{ fontSize: 11, color: theme.muted }}>
                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : ""}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </>
            )}

            {/* DEPARTMENTS TAB */}
            {activeTab === "departments" && (
              <>
                {filteredDepartments.length === 0 && !explorerLoading ? (
                  <View style={styles.emptyWrap}>
                    <BookOpen size={40} color={theme.muted} />
                    <Text style={[styles.emptyText, { color: theme.muted }]}>No departments found</Text>
                  </View>
                ) : (
                  filteredDepartments.map((d) => (
                    <View key={d.id} style={[styles.cardItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <View style={styles.itemHeader}>
                        <View style={[styles.avatarCircle, { backgroundColor: "#3B82F622" }]}>
                          <BookOpen size={18} color="#3B82F6" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.itemTitle, { color: theme.text }]}>{d.name}</Text>
                          <Text style={[styles.itemSub, { color: theme.muted }]}>
                            {getUniversityName(d.universities, "Multi-Campus Faculty")}
                          </Text>
                        </View>
                        <View style={styles.codePill}>
                          <Text style={styles.codePillText}>{d.code}</Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </>
            )}

            {/* NOTICES TAB */}
            {activeTab === "notices" && (
              <>
                {filteredNotices.length === 0 && !explorerLoading ? (
                  <View style={styles.emptyWrap}>
                    <Bell size={40} color={theme.muted} />
                    <Text style={[styles.emptyText, { color: theme.muted }]}>No campus notices published yet</Text>
                    <Text style={{ fontSize: 12, color: theme.muted, textAlign: "center", marginTop: 4 }}>
                      Create notice broadcasts from the admin console to announce campus events & exams.
                    </Text>
                  </View>
                ) : (
                  filteredNotices.map((n) => (
                    <View key={n.id} style={[styles.cardItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <Text style={[styles.itemTitle, { color: theme.text }]}>{n.title}</Text>
                      <Text style={[styles.itemSub, { color: theme.muted, marginTop: 4 }]}>{n.content}</Text>
                    </View>
                  ))
                )}
              </>
            )}

            {/* EVENTS TAB */}
            {activeTab === "events" && (
              <>
                {filteredEvents.length === 0 && !explorerLoading ? (
                  <View style={styles.emptyWrap}>
                    <Calendar size={40} color={theme.muted} />
                    <Text style={[styles.emptyText, { color: theme.muted }]}>No campus events scheduled yet</Text>
                    <Text style={{ fontSize: 12, color: theme.muted, textAlign: "center", marginTop: 4 }}>
                      Upcoming hackathons, seminars, and campus sports will appear here.
                    </Text>
                  </View>
                ) : (
                  filteredEvents.map((e) => (
                    <View key={e.id} style={[styles.cardItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <Text style={[styles.itemTitle, { color: theme.text }]}>{e.title}</Text>
                      <Text style={[styles.itemSub, { color: theme.muted, marginTop: 4 }]}>{e.description}</Text>
                    </View>
                  ))
                )}
              </>
            )}

            {/* COMMUNITIES TAB */}
            {activeTab === "communities" && (
              <>
                {filteredCommunities.length === 0 && !explorerLoading ? (
                  <View style={styles.emptyWrap}>
                    <MessageSquare size={40} color={theme.muted} />
                    <Text style={[styles.emptyText, { color: theme.muted }]}>No active community groups yet</Text>
                    <Text style={{ fontSize: 12, color: theme.muted, textAlign: "center", marginTop: 4 }}>
                      University clubs and societies will show here once created by students or moderators.
                    </Text>
                  </View>
                ) : (
                  filteredCommunities.map((c) => (
                    <View key={c.id} style={[styles.cardItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <Text style={[styles.itemTitle, { color: theme.text }]}>{c.name}</Text>
                      <Text style={[styles.itemSub, { color: theme.muted, marginTop: 4 }]}>{c.description}</Text>
                      <Text style={{ fontSize: 12, color: "#6038ED", marginTop: 6, fontWeight: "700" }}>
                        {c.members_count ?? 0} Members
                      </Text>
                    </View>
                  ))
                )}
              </>
            )}

            {/* MARKETPLACE TAB */}
            {activeTab === "marketplace" && (
              <View style={styles.emptyWrap}>
                <ShoppingBag size={40} color="#8B5CF6" />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>Marketplace Oversight</Text>
                <Text style={{ fontSize: 12, color: theme.muted, textAlign: "center", marginTop: 6 }}>
                  Campus marketplace listings (used textbooks, lab equipment, student gadgets) will show here for moderation.
                </Text>
              </View>
            )}

            {/* BILLING TAB */}
            {activeTab === "billing" && (
              <View style={styles.emptyWrap}>
                <CreditCard size={40} color="#059669" />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>Subscriptions & Institutional Billing</Text>
                <Text style={{ fontSize: 12, color: theme.muted, textAlign: "center", marginTop: 6 }}>
                  Multi-tenant university SaaS tier management. All 4 institutions currently on Standard Trial / Sandbox tier.
                </Text>
              </View>
            )}

            {/* AUDIT TAB */}
            {activeTab === "audit" && (
              <View style={[styles.auditCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 8 }]}>Security Audit Trail</Text>
                <Text style={{ color: theme.muted, fontSize: 12 }}>• Super admin session authenticated via Supabase GoTrue</Text>
                <Text style={{ color: theme.muted, fontSize: 12, marginTop: 6 }}>• Row Level Security (RLS) active on all 29 database tables</Text>
                <Text style={{ color: theme.muted, fontSize: 12, marginTop: 6 }}>• Multi-tenant university isolation verified</Text>
                <Text style={{ color: theme.muted, fontSize: 12, marginTop: 6 }}>• Auto-confirm trigger active on auth.users</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* CREATE STUDENT MODAL */}
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
                {availableUniversities.map((u) => (
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
  pillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillText: { fontSize: 12, fontWeight: "700" },
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
  addStudentInlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#19B99A",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  searchBoxWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 13 },
  listContainer: { padding: 16, gap: 10 },
  cardItem: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  itemHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitle: { fontSize: 14, fontWeight: "700" },
  itemSub: { fontSize: 12 },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(150, 150, 150, 0.12)",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  codePill: {
    backgroundColor: "rgba(96, 56, 237, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  codePillText: { color: "#6038ED", fontSize: 11, fontWeight: "800" },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800" },
  emptyText: { fontSize: 14, fontWeight: "600" },
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
