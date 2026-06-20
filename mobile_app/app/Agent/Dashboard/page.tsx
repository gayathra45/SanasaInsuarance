import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform,
  Alert,
  Animated,
  Easing,
  ImageBackground,
  TextInput,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import AgentNavbar from "../../Components/Agent/page";
import { API_BASE_URL } from "../../config";

const { width: SCREEN_W } = Dimensions.get("window");

// ─── Interfaces ────────────────────────────────────────────────────────────────
interface Claim {
  _id: string;
  claimNumber: string;
  userNic: string;
  vehiclePlate: string;
  vehicleModel?: string;
  incidentDate: string;
  incidentTime: string;
  damageType: string;
  description: string;
  location: string;
  status: "Pending" | "In Progress" | "Approved" | "Rejected";
  branch: string;
  assignedAgent: string;
  amount: number | null;
  currentStep: number;
  createdAt: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getSeverity(damageType: string): "Urgent" | "Medium" | "Low" {
  const t = (damageType || "").toLowerCase();
  if (t.includes("fire")) return "Urgent";
  if (t.includes("accident") || t.includes("crash")) return "Medium";
  return "Low";
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch { return dateStr; }
}

// ─── Quick Actions for agent ──────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: "New Claims",   icon: "alert-circle-outline",   color: "#dc2626" },
  { label: "My Activity",  icon: "bar-chart-outline",      color: "#0ea5e9" },
  { label: "Support",      icon: "headset-outline",        color: "#f97316" },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function AgentDashboard() {
  const [agentName, setAgentName]     = useState("");
  const [agentEmail, setAgentEmail]   = useState("");
  const [claims, setClaims]           = useState<Claim[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [activeTab, setActiveTab]     = useState<"home" | "claims" | "activity">("home");

  // Detail modal
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [assessmentAmount, setAssessmentAmount] = useState("");
  const [savingAssessment, setSavingAssessment] = useState(false);
  const [customAlert, setCustomAlert] = useState<{ title: string; message: string } | null>(null);

  // Animations
  const contentFadeAnim = useRef(new Animated.Value(0)).current;
  const headerSlideAnim = useRef(new Animated.Value(-20)).current;
  const heroPulse       = useRef(new Animated.Value(1)).current;
  const bellScale       = useRef(new Animated.Value(1)).current;

  const showAlert = (title: string, message: string) => setCustomAlert({ title, message });

  // ── Fetch Claims ─────────────────────────────────────────────────────────
  const fetchClaims = useCallback(async (email: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/agent/claims?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error("Failed to fetch claims");
      const data = await res.json();
      if (Array.isArray(data)) setClaims(data);
    } catch (e) {
      console.error("Fetch claims error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ── Boot ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const agentStr = await AsyncStorage.getItem("logged_in_agent");
      if (!agentStr) { router.replace("/login/page"); return; }
      try {
        const agent = JSON.parse(agentStr);
        setAgentName(agent.name || "Agent");
        if (agent.email) {
          setAgentEmail(agent.email);
          fetchClaims(agent.email);
        } else {
          setLoading(false);
        }
      } catch { router.replace("/login/page"); }
    })();
  }, []);

  // ── Animations ─────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentFadeAnim, {
        toValue: 1, duration: 600,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.timing(headerSlideAnim, {
        toValue: 0, duration: 500,
        easing: Easing.out(Easing.back(1)), useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(heroPulse, { toValue: 1.02, duration: 2500, useNativeDriver: true }),
        Animated.timing(heroPulse, { toValue: 1,    duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (selectedClaim) {
      setAssessmentAmount(selectedClaim.amount ? String(selectedClaim.amount) : "");
    }
  }, [selectedClaim]);

  // ── Derived data ──────────────────────────────────────────────────────
  const activeClaims = claims
    .filter(c => c.status !== "Approved" && c.status !== "Rejected")
    .sort((a, b) => {
      const aS = getSeverity(a.damageType);
      const bS = getSeverity(b.damageType);
      if (aS === "Urgent" && bS !== "Urgent") return -1;
      if (aS !== "Urgent" && bS === "Urgent") return 1;
      return 0;
    });
  const completedClaims = claims.filter(c => c.status === "Approved" || c.status === "Rejected");
  const urgentCount   = activeClaims.filter(c => getSeverity(c.damageType) === "Urgent").length;
  const totalAssigned = activeClaims.length;

  const displayClaims = activeTab === "activity" ? completedClaims : activeClaims;

  // ── Actions ───────────────────────────────────────────────────────────
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (agentEmail) fetchClaims(agentEmail);
  }, [agentEmail, fetchClaims]);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout", style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("logged_in_agent");
          router.replace("/login/page");
        },
      },
    ]);
  };

  const handleApproveAssessment = async () => {
    if (!selectedClaim) return;
    const numAmount = parseFloat(assessmentAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showAlert("Validation Error", "Please enter a valid LKR assessment amount.");
      return;
    }
    setSavingAssessment(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/agent/claims/${selectedClaim._id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Approved", amount: numAmount }),
      });
      if (!res.ok) throw new Error("Failed to update");
      showAlert("Success", "Claim approved and assessment saved!");
      setSelectedClaim(null);
      fetchClaims(agentEmail);
    } catch (e) {
      showAlert("Error", "Failed to update claim. Please try again.");
    } finally {
      setSavingAssessment(false);
    }
  };

  const showSupportAlert = () => {
    Alert.alert(
      "Sanasa Support 📞",
      "We are available 24/7 for agent support.\n\nHotline: +94 112 003 000\nHotline: +94 112 003 001\nEmail: claims-support@sanasa.lk",
      [{ text: "OK" }]
    );
  };

  const handleQuickAction = (label: string) => {
    if (label === "New Claims") setActiveTab("claims");
    else if (label === "My Activity") setActiveTab("activity");
    else showSupportAlert();
  };

  // ── Loading Screen ────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  // ── Severity helpers ──────────────────────────────────────────────────
  const severityColor = (s: "Urgent" | "Medium" | "Low") =>
    s === "Urgent" ? "#dc2626" : s === "Medium" ? "#f59e0b" : "#22c55e";
  const severityBg = (s: "Urgent" | "Medium" | "Low") =>
    s === "Urgent" ? "#fef2f2" : s === "Medium" ? "#fffbeb" : "#f0fdf4";
  const severityBorder = (s: "Urgent" | "Medium" | "Low") =>
    s === "Urgent" ? "#fecaca" : s === "Medium" ? "#fde68a" : "#bbf7d0";

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" colors={["#f97316"]} />
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ── HERO HEADER ── */}
        <Animated.View style={{ transform: [{ translateY: headerSlideAnim }] }}>
          <LinearGradient
            colors={["#0f172a", "#1e293b", "#0c1a2e"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            {/* Ambient glow circles */}
            <View style={[styles.glowCircle, { top: -60, right: -40, backgroundColor: "rgba(249,115,22,0.10)" }]} />
            <View style={[styles.glowCircle, { bottom: -40, left: -30, backgroundColor: "rgba(14,165,233,0.08)", width: 180, height: 180 }]} />

            {/* Top bar */}
            <View style={styles.topBar}>
              <View style={{ flex: 1 }}>
                <Text style={styles.welcomeLabel}>Welcome back,</Text>
                <Text style={styles.welcomeName}>{agentName} 👋</Text>
              </View>

              {/* Bell */}
              <Animated.View style={{ transform: [{ scale: bellScale }], marginRight: 10 }}>
                <TouchableOpacity
                  style={styles.headerIconBtn}
                  onPress={showSupportAlert}
                  activeOpacity={0.8}
                >
                  <Ionicons name="headset-outline" size={21} color="#ffffff" />
                </TouchableOpacity>
              </Animated.View>

              {/* Avatar / logout */}
              <TouchableOpacity style={styles.avatarButton} onPress={handleLogout} activeOpacity={0.85}>
                <Text style={styles.avatarText}>{agentName.charAt(0).toUpperCase()}</Text>
              </TouchableOpacity>
            </View>

            {/* Status banner */}
            <View style={styles.subtitleBanner}>
              <View style={[styles.dotIndicator, urgentCount > 0 && { backgroundColor: "#ef4444" }]} />
              <Text style={styles.subtitleText}>
                {urgentCount > 0 ? (
                  <>{"Claims today: "}
                    <Text style={styles.highlightOrange}>{totalAssigned} assigned</Text>
                    {" · "}
                    <Text style={{ color: "#ef4444", fontWeight: "800" }}>{urgentCount} urgent</Text>
                  </>
                ) : (
                  `${totalAssigned} claim${totalAssigned !== 1 ? "s" : ""} assigned. No urgent cases.`
                )}
              </Text>
            </View>

            {/* Callout */}
            <Animated.View style={[styles.compensationCallout, { transform: [{ scale: heroPulse }] }]}>
              <Text style={styles.calloutTitle}>
                Review, assess and approve assigned insurance claims on behalf of Sanasa General Insurance Company Limited.
              </Text>
            </Animated.View>

            {/* Hero stat badges */}
            <View style={styles.heroBadgeRow}>
              <View style={[styles.heroBadge, { borderColor: "rgba(239,68,68,0.4)", backgroundColor: "rgba(127,29,29,0.7)" }]}>
                <Ionicons name="alert-circle" size={22} color="#fca5a5" />
                <View>
                  <Text style={styles.heroBadgeLabel}>URGENT</Text>
                  <Text style={styles.heroBadgeValue}>{urgentCount}</Text>
                </View>
              </View>
              <View style={[styles.heroBadge, { borderColor: "rgba(6,182,212,0.4)", backgroundColor: "rgba(14,116,144,0.7)" }]}>
                <Ionicons name="briefcase-outline" size={22} color="#67e8f9" />
                <View>
                  <Text style={[styles.heroBadgeLabel, { color: "#a5f3fc" }]}>ASSIGNED</Text>
                  <Text style={styles.heroBadgeValue}>{totalAssigned}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── STAT CARDS ── */}
        <View style={styles.statsCardRow}>
          <TouchableOpacity style={styles.statItem} activeOpacity={0.7} onPress={() => setActiveTab("claims")}>
            <View style={[styles.statIconWrap, { backgroundColor: "#fff7ed" }]}>
              <Ionicons name="alert-circle" size={20} color="#f97316" />
            </View>
            <Text style={styles.statNumber}>{urgentCount}</Text>
            <Text style={styles.statLabel}>Urgent</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.statItem} activeOpacity={0.7} onPress={() => setActiveTab("claims")}>
            <View style={[styles.statIconWrap, { backgroundColor: "#ecfeff" }]}>
              <Ionicons name="time" size={20} color="#06b6d4" />
            </View>
            <Text style={styles.statNumber}>{totalAssigned}</Text>
            <Text style={styles.statLabel}>Assigned</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.statItem} activeOpacity={0.7} onPress={() => setActiveTab("activity")}>
            <View style={[styles.statIconWrap, { backgroundColor: "#f0fdf4" }]}>
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
            </View>
            <Text style={styles.statNumber}>{completedClaims.length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </TouchableOpacity>
        </View>

        <Animated.View style={{ opacity: contentFadeAnim }}>

          {/* ── TAB SELECTOR ── */}
          <View style={styles.tabRow}>
            {(["claims", "activity"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                  {tab === "claims" ? "Active Claims" : "My Activity"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── CLAIMS LIST ── */}
          <View style={{ paddingHorizontal: 16, marginTop: 4 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {activeTab === "claims" ? "Active Claims" : "Completed Claims"}
              </Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{displayClaims.length}</Text>
              </View>
            </View>

            {displayClaims.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons
                  name={activeTab === "claims" ? "document-text-outline" : "checkmark-done-outline"}
                  size={34}
                  color="#cbd5e1"
                />
                <Text style={styles.emptyText}>
                  {activeTab === "claims" ? "No active claims assigned." : "No completed claims yet."}
                </Text>
              </View>
            ) : (
              <View style={styles.claimsList}>
                {displayClaims.map((claim) => {
                  const sev = getSeverity(claim.damageType);
                  const isCompleted = claim.status === "Approved" || claim.status === "Rejected";
                  const statusColor = claim.status === "Approved" ? "#16a34a"
                    : claim.status === "Rejected" ? "#dc2626"
                    : claim.status === "In Progress" ? "#0ea5e9" : "#f59e0b";

                  return (
                    <TouchableOpacity
                      key={claim._id}
                      style={[
                        styles.claimCard,
                        {
                          borderColor: isCompleted ? "#e2e8f0" : severityBorder(sev),
                          backgroundColor: isCompleted ? "#ffffff" : severityBg(sev),
                        },
                      ]}
                      onPress={() => setSelectedClaim(claim)}
                      activeOpacity={0.85}
                    >
                      {/* Left strip */}
                      <View style={[styles.claimStrip, { backgroundColor: isCompleted ? statusColor : severityColor(sev) }]} />

                      <View style={{ flex: 1, paddingLeft: 6 }}>
                        {/* Header row */}
                        <View style={styles.claimHeader}>
                          <View style={styles.claimSeverityRow}>
                            <Ionicons
                              name={sev === "Urgent" ? "alert-circle" : sev === "Medium" ? "shield-half" : "checkmark-circle"}
                              size={16}
                              color={isCompleted ? statusColor : severityColor(sev)}
                            />
                            <Text style={[styles.claimSeverityLabel, { color: isCompleted ? statusColor : severityColor(sev) }]}>
                              {isCompleted ? claim.status.toUpperCase() : `${sev.toUpperCase()} — ${claim.claimNumber}`}
                            </Text>
                          </View>
                          {!isCompleted && (
                            <Text style={styles.claimNumber}>{claim.claimNumber}</Text>
                          )}
                        </View>

                        {/* Details grid */}
                        <View style={styles.claimGrid}>
                          <View style={styles.claimGridItem}>
                            <Text style={styles.claimGridLabel}>Vehicle</Text>
                            <Text style={styles.claimGridValue}>{claim.vehiclePlate}</Text>
                          </View>
                          <View style={styles.claimGridItem}>
                            <Text style={styles.claimGridLabel}>Damage</Text>
                            <Text style={styles.claimGridValue}>{claim.damageType}</Text>
                          </View>
                          <View style={styles.claimGridItem}>
                            <Text style={styles.claimGridLabel}>Location</Text>
                            <Text style={styles.claimGridValue} numberOfLines={1}>{claim.location}</Text>
                          </View>
                        </View>

                        {/* Footer */}
                        <View style={styles.claimFooter}>
                          <Text style={styles.claimNic}>NIC: {claim.userNic}</Text>
                          <TouchableOpacity
                            style={styles.detailsBtn}
                            onPress={() => setSelectedClaim(claim)}
                          >
                            <Text style={styles.detailsBtnText}>Details</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* ── CONTACT SUPPORT ── */}
          <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Contact Support</Text>
            </View>
            <TouchableOpacity style={styles.supportCard} onPress={showSupportAlert} activeOpacity={0.8}>
              <LinearGradient
                colors={["#0e7490", "#0891b2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.supportGradient}
              >
                <View style={styles.supportLeft}>
                  <View style={styles.supportIconWrap}>
                    <Ionicons name="headset" size={24} color="#ffffff" />
                  </View>
                  <View>
                    <Text style={styles.supportLabel}>Agent Helpdesk</Text>
                    <Text style={styles.supportSub}>+94 112 003 000 · +94 112 003 001</Text>
                  </View>
                </View>
                <View style={styles.supportArrow}>
                  <Ionicons name="arrow-forward" size={16} color="#ffffff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ── QUICK ACTIONS ── */}
          <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>
            <View style={styles.quickGrid}>
              {QUICK_ACTIONS.map((action, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickItem}
                  onPress={() => handleQuickAction(action.label)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.quickIconBox, { backgroundColor: action.color + "15" }]}>
                    <Ionicons name={action.icon as any} size={24} color={action.color} />
                  </View>
                  <Text style={styles.quickLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </Animated.View>
      </ScrollView>

      {/* ── FLOATING SUPPORT ── */}
      <TouchableOpacity style={styles.floatingSupport} onPress={showSupportAlert} activeOpacity={0.8}>
        <Ionicons name="chatbubble-ellipses" size={24} color="#ffffff" />
      </TouchableOpacity>

      <AgentNavbar activeTab={activeTab} onTabPress={setActiveTab} />

      {/* ── CLAIM DETAIL MODAL ── */}
      <Modal
        visible={selectedClaim !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedClaim(null)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ width: "100%", maxWidth: 460, alignSelf: "center" }}
          >
            <View style={styles.modalCard}>
              {/* Modal header */}
              <LinearGradient
                colors={["#0f172a", "#1e293b"]}
                style={styles.modalHeader}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalHeaderTitle}>Claim Details</Text>
                  <Text style={styles.modalHeaderSub}>{selectedClaim?.claimNumber}</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedClaim(null)}
                >
                  <Ionicons name="close" size={20} color="#ffffff" />
                </TouchableOpacity>
              </LinearGradient>

              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 20, gap: 16 }}
                showsVerticalScrollIndicator={false}
              >
                {selectedClaim && (() => {
                  const sev = getSeverity(selectedClaim.damageType);
                  const isActive = selectedClaim.status !== "Approved" && selectedClaim.status !== "Rejected";
                  return (
                    <>
                      {/* Severity badge */}
                      <View style={[styles.modalSevBadge, { backgroundColor: severityBg(sev), borderColor: severityBorder(sev) }]}>
                        <Ionicons name="alert-circle" size={18} color={severityColor(sev)} />
                        <Text style={[styles.modalSevText, { color: severityColor(sev) }]}>
                          {sev} Priority · {selectedClaim.status}
                        </Text>
                      </View>

                      {/* Info grid */}
                      <View style={styles.modalInfoGrid}>
                        {[
                          { label: "User NIC",      value: selectedClaim.userNic },
                          { label: "Vehicle Plate",  value: selectedClaim.vehiclePlate },
                          { label: "Damage Type",    value: selectedClaim.damageType },
                          { label: "Location",       value: selectedClaim.location },
                          { label: "Incident Date",  value: selectedClaim.incidentDate },
                          { label: "Incident Time",  value: selectedClaim.incidentTime },
                          { label: "Assigned Agent", value: agentName || selectedClaim.assignedAgent },
                          { label: "Submitted",      value: formatDate(selectedClaim.createdAt) },
                        ].map((item, i) => (
                          <View key={i} style={styles.modalInfoItem}>
                            <Text style={styles.modalInfoLabel}>{item.label}</Text>
                            <Text style={styles.modalInfoValue}>{item.value || "—"}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Description */}
                      <View style={styles.modalDescBox}>
                        <Text style={styles.modalDescLabel}>Incident Description</Text>
                        <Text style={styles.modalDescText}>{selectedClaim.description}</Text>
                      </View>

                      {/* Assessment Amount */}
                      {isActive && (
                        <View style={styles.modalAssessBox}>
                          <Text style={styles.modalAssessLabel}>Assessment Amount (LKR)</Text>
                          <View style={styles.modalAssessInput}>
                            <Text style={styles.modalAssessCurrency}>LKR</Text>
                            <TextInput
                              style={styles.modalAssessField}
                              placeholder="Enter amount"
                              placeholderTextColor="#94a3b8"
                              keyboardType="numeric"
                              value={assessmentAmount}
                              onChangeText={setAssessmentAmount}
                            />
                          </View>
                        </View>
                      )}

                      {/* Amount display if done */}
                      {!isActive && (
                        <View style={[styles.modalAssessBox, { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }]}>
                          <Text style={[styles.modalAssessLabel, { color: "#166534" }]}>Final Claim Amount</Text>
                          <Text style={[styles.modalInfoValue, { fontSize: 20, color: "#16a34a", fontWeight: "900" }]}>
                            {selectedClaim.amount ? `LKR ${selectedClaim.amount.toLocaleString()}` : "Not Evaluated"}
                          </Text>
                        </View>
                      )}

                      {/* Action buttons */}
                      <View style={styles.modalActions}>
                        {isActive && (
                          <TouchableOpacity
                            style={[styles.approveBtn, savingAssessment && { opacity: 0.7 }]}
                            onPress={handleApproveAssessment}
                            disabled={savingAssessment}
                            activeOpacity={0.8}
                          >
                            {savingAssessment ? (
                              <ActivityIndicator color="#fff" size="small" />
                            ) : (
                              <>
                                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                                <Text style={styles.approveBtnText}>Approve Assessment</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={styles.closeBtn}
                          onPress={() => setSelectedClaim(null)}
                        >
                          <Text style={styles.closeBtnText}>Close</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  );
                })()}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── CUSTOM ALERT ── */}
      {customAlert && (
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <View style={styles.alertIconCircle}>
              <Ionicons name="information-circle-outline" size={38} color="#f97316" />
            </View>
            <Text style={styles.alertTitle}>{customAlert.title}</Text>
            <Text style={styles.alertMsg}>{customAlert.message}</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setCustomAlert(null)}
              style={styles.alertButton}
            >
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc", gap: 12 },
  loadingText: { fontSize: 14, color: "#64748b", fontWeight: "600" },

  /* Hero */
  heroGradient: {
    width: "100%",
    paddingTop: Platform.OS === "ios" ? 60 : 48,
    paddingBottom: 48,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: "hidden",
    gap: 12,
  },
  glowCircle: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
  },

  /* Top Bar */
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  welcomeLabel: { fontSize: 14, color: "#94a3b8", fontWeight: "600" },
  welcomeName: { fontSize: 24, color: "#ffffff", fontWeight: "800", marginTop: 2 },
  headerIconBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  avatarButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(249,115,22,0.25)",
    borderWidth: 1.5, borderColor: "rgba(249,115,22,0.5)",
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#ffffff", fontSize: 18, fontWeight: "800" },

  /* Subtitle banner */
  subtitleBanner: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  dotIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e", marginRight: 10 },
  subtitleText: { flex: 1, fontSize: 12, color: "#e2e8f0", fontWeight: "600", lineHeight: 18 },
  highlightOrange: { color: "#fb923c", fontWeight: "800" },

  /* Callout */
  compensationCallout: {
    backgroundColor: "rgba(15,23,42,0.45)",
    borderLeftWidth: 3, borderLeftColor: "#f97316",
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 8,
  },
  calloutTitle: { fontSize: 12.5, color: "#cbd5e1", fontWeight: "700", lineHeight: 18, fontStyle: "italic" },

  /* Hero badges */
  heroBadgeRow: { flexDirection: "row", gap: 14, marginTop: 4 },
  heroBadge: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 18, paddingVertical: 14,
    borderRadius: 18, borderWidth: 1, flex: 1,
  },
  heroBadgeLabel: { fontSize: 9, color: "#fca5a5", fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  heroBadgeValue: { fontSize: 28, color: "#ffffff", fontWeight: "900", lineHeight: 30 },

  /* Stats */
  statsCardRow: {
    flexDirection: "row", backgroundColor: "#ffffff",
    marginHorizontal: 16, marginTop: -26,
    borderRadius: 24, paddingVertical: 18, paddingHorizontal: 10,
    shadowColor: "#0f172a", shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4, zIndex: 20, alignItems: "center",
  },
  statItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  statIconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  statNumber: { fontSize: 22, fontWeight: "900", color: "#0f172a" },
  statLabel: { fontSize: 10.5, color: "#64748b", fontWeight: "700", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.3 },
  divider: { width: 1, height: 40, backgroundColor: "#f1f5f9" },

  /* Tab selector */
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 10,
  },
  tabBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 14,
    backgroundColor: "#f1f5f9",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "transparent",
  },
  tabBtnActive: {
    backgroundColor: "#fff7ed",
    borderColor: "#f97316",
  },
  tabBtnText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  tabBtnTextActive: { color: "#f97316" },

  /* Sections */
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#0f172a", letterSpacing: -0.2 },
  sectionBadge: {
    backgroundColor: "#f97316", borderRadius: 99,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  sectionBadgeText: { color: "#ffffff", fontSize: 11, fontWeight: "800" },

  /* Claims list */
  claimsList: { gap: 12 },
  claimCard: {
    flexDirection: "row",
    borderRadius: 20, borderWidth: 1.5, overflow: "hidden",
    backgroundColor: "#ffffff",
    shadowColor: "#0f172a", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
    padding: 14,
  },
  claimStrip: { width: 4, borderRadius: 4, marginRight: 12, alignSelf: "stretch" },
  claimHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  claimSeverityRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  claimSeverityLabel: { fontSize: 11.5, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4 },
  claimNumber: { fontSize: 11, color: "#64748b", fontWeight: "700" },
  claimGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  claimGridItem: { flex: 1, minWidth: "30%" },
  claimGridLabel: { fontSize: 9.5, color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 1 },
  claimGridValue: { fontSize: 13, color: "#0f172a", fontWeight: "700" },
  claimFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  claimNic: { fontSize: 11.5, color: "#64748b", fontWeight: "600" },
  detailsBtn: {
    backgroundColor: "#0f172a", borderRadius: 99,
    paddingVertical: 5, paddingHorizontal: 14,
  },
  detailsBtnText: { color: "#ffffff", fontSize: 11.5, fontWeight: "800" },

  /* Support */
  supportCard: { borderRadius: 20, overflow: "hidden", shadowColor: "#0e7490", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 },
  supportGradient: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 18, paddingHorizontal: 20 },
  supportLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  supportIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  supportLabel: { fontSize: 15, fontWeight: "800", color: "#ffffff" },
  supportSub: { fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  supportArrow: { width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },

  /* Quick actions */
  quickGrid: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  quickItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderRadius: 18, borderWidth: 1, borderColor: "#e2e8f0",
    shadowColor: "#0f172a", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 6, elevation: 1, gap: 8,
  },
  quickIconBox: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 11, fontWeight: "700", color: "#334155", textAlign: "center" },

  /* Empty */
  emptyCard: {
    backgroundColor: "#ffffff", borderRadius: 20, borderWidth: 1, borderColor: "#e2e8f0",
    paddingVertical: 36, alignItems: "center", justifyContent: "center", gap: 10,
    shadowColor: "#0f172a", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.01, shadowRadius: 6, elevation: 1,
  },
  emptyText: { fontSize: 13, color: "#64748b", fontWeight: "700" },

  /* Floating support */
  floatingSupport: {
    position: "absolute", bottom: 96, right: 18,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "#f97316",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#f97316", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6, zIndex: 99,
  },

  /* Modal */
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(2,6,23,0.7)",
    alignItems: "center", justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#ffffff", borderTopLeftRadius: 36, borderTopRightRadius: 36,
    maxHeight: "88%", width: "100%",
    shadowColor: "#000", shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25, shadowRadius: 20, elevation: 12,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 20, paddingHorizontal: 22,
  },
  modalHeaderTitle: { fontSize: 18, fontWeight: "800", color: "#ffffff" },
  modalHeaderSub: { fontSize: 12, color: "#94a3b8", fontWeight: "600", marginTop: 2 },
  modalCloseBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  modalSevBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 14, borderWidth: 1.5,
  },
  modalSevText: { fontSize: 13.5, fontWeight: "800" },
  modalInfoGrid: {
    backgroundColor: "#f8fafc", borderRadius: 18, borderWidth: 1, borderColor: "#e2e8f0",
    padding: 16, gap: 12,
  },
  modalInfoItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  modalInfoLabel: { fontSize: 11.5, color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4, flex: 1 },
  modalInfoValue: { fontSize: 13, color: "#0f172a", fontWeight: "700", flex: 1.5, textAlign: "right" },
  modalDescBox: {
    backgroundColor: "#f8fafc", borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0",
    padding: 14,
  },
  modalDescLabel: { fontSize: 11.5, color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 },
  modalDescText: { fontSize: 13.5, color: "#334155", fontWeight: "600", lineHeight: 20 },
  modalAssessBox: {
    backgroundColor: "#fff7ed", borderRadius: 14, borderWidth: 1.5, borderColor: "#fed7aa",
    padding: 14,
  },
  modalAssessLabel: { fontSize: 11.5, color: "#92400e", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 },
  modalAssessInput: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#ffffff", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0",
    paddingHorizontal: 14, height: 48,
  },
  modalAssessCurrency: { fontSize: 14, fontWeight: "800", color: "#64748b", marginRight: 8 },
  modalAssessField: { flex: 1, fontSize: 16, fontWeight: "700", color: "#0f172a" },
  modalActions: { flexDirection: "row", gap: 10, paddingTop: 6 },
  approveBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#f97316", borderRadius: 16, height: 48, gap: 8,
    shadowColor: "#f97316", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  approveBtnText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  closeBtn: {
    paddingHorizontal: 20, borderRadius: 16, height: 48, backgroundColor: "#f1f5f9",
    alignItems: "center", justifyContent: "center",
  },
  closeBtnText: { color: "#475569", fontSize: 14, fontWeight: "700" },

  /* Custom alert */
  alertOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,11,13,0.92)",
    alignItems: "center", justifyContent: "center",
    zIndex: 9999,
  },
  alertCard: {
    width: "85%", maxWidth: 340,
    backgroundColor: "rgba(15,23,42,0.98)",
    borderRadius: 32, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.1)",
    padding: 24, alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 10,
  },
  alertIconCircle: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: "rgba(249,115,22,0.12)",
    borderWidth: 1, borderColor: "rgba(249,115,22,0.3)",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  alertTitle: { fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 8, textAlign: "center" },
  alertMsg: { fontSize: 13.5, color: "rgba(255,255,255,0.75)", textAlign: "center", lineHeight: 18, marginBottom: 20 },
  alertButton: {
    backgroundColor: "#f97316", borderRadius: 20,
    paddingVertical: 10, paddingHorizontal: 32,
    shadowColor: "#f97316", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  alertButtonText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
});
