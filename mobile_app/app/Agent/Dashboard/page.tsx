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
  Linking,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import AgentNavbar from "../../Components/Agent/page";
import { API_BASE_URL } from "../../config";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

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
  inspectionReport?: string;
  inspectionSubmitted?: boolean;
  paymentReceipt?: string;
  additionalDocuments?: { name: string; url: string; uploadedAt: string; uploadedBy?: string }[];
  requestedDocuments?: string[];
  documentRequestTo?: string;
  messages?: { sender: string; message: string; sentAt: string }[];
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
  const [activeTab, setActiveTab]     = useState<"home" | "claims" | "activity">("claims");

  // Detail modal
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [assessmentAmount, setAssessmentAmount] = useState("");
  const [savingAssessment, setSavingAssessment] = useState(false);
  const [customAlert, setCustomAlert] = useState<{ title: string; message: string } | null>(null);
  const [inspectionReportText, setInspectionReportText] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isAcceptingClaim, setIsAcceptingClaim] = useState(false);

  // Pending Requests Modal State
  const [showPendingRequestsModal, setShowPendingRequestsModal] = useState(false);

  // Agent Document Upload Redesign States & Handlers
  const [isAgentUploading, setIsAgentUploading] = useState(false);
  const [agentUploadFileBase64, setAgentUploadFileBase64] = useState<string | null>(null);
  const [agentUploadFileName, setAgentUploadFileName] = useState("");
  const [agentUploadDocName, setAgentUploadDocName] = useState("Repair Estimate");

  const getRecipientForDoc = (claim: Claim, name: string) => {
    const msg = [...(claim.messages || [])]
      .reverse()
      .find(m => m.message && typeof m.message === "string" && m.message.includes(`Requested: ${name}`));
    if (msg && msg.message) {
      if (msg.message.includes("[Document Request to Agent]")) return "Agent";
      if (msg.message.includes("[Document Request to User]")) return "User";
    }
    return claim.documentRequestTo || "User";
  };

  const getDocDetails = (claim: Claim, name: string, status: "Pending" | "Submitted") => {
    let requestedAt = "";
    let submittedAt = "";

    const msg = [...(claim.messages || [])]
      .reverse()
      .find(m => m.message && typeof m.message === "string" && m.message.includes(`Requested: ${name}`));
    if (msg) {
      requestedAt = formatDate(msg.sentAt);
    } else {
      requestedAt = formatDate(claim.createdAt);
    }

    if (status === "Submitted") {
      const doc = (claim.additionalDocuments || []).find(
        d => d.name.trim().toLowerCase() === name.trim().toLowerCase()
      );
      if (doc && doc.uploadedAt) {
        submittedAt = formatDate(doc.uploadedAt);
      }
    }

    return { requestedAt, submittedAt };
  };

  const handleViewDocument = (url?: string | null) => {
    if (!url) {
      showAlert("Error", "No document URL available.");
      return;
    }
    let fullUrl = url;
    if (!url.startsWith("http") && !url.startsWith("data:")) {
      const cleanBase = API_BASE_URL.replace("/api", "");
      fullUrl = `${cleanBase}/uploads/${url}`;
    }
    Linking.openURL(fullUrl).catch(() => {
      showAlert("Error", "Failed to open document URL.");
    });
  };

  const handlePickAgentDoc = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showAlert("Permission Required", "Allow storage permissions to select images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const prefix = "data:image/jpeg;base64,";
      const base64Data = asset.base64 ? `${prefix}${asset.base64}` : null;
      
      if (base64Data) {
        setAgentUploadFileBase64(base64Data);
        setAgentUploadFileName(asset.fileName || `agent_doc_${Date.now().toString().slice(-4)}.jpg`);
      }
    }
  };

  const handleAgentDocUploadPicker = async (docName: string, claimParam?: Claim) => {
    const claimToUse = claimParam || selectedClaim;
    if (!claimToUse) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showAlert("Permission Required", "Allow storage permissions to select images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const prefix = "data:image/jpeg;base64,";
      const base64Data = asset.base64 ? `${prefix}${asset.base64}` : null;
      
      if (base64Data) {
        uploadAgentDocImmediate(docName, base64Data, claimToUse);
      }
    }
  };

  const uploadAgentDocImmediate = async (docName: string, base64Data: string, claimParam?: Claim) => {
    const claimToUse = claimParam || selectedClaim;
    if (!claimToUse) return;
    setIsAgentUploading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/policy-holder/update-claim/${claimToUse.claimNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadedDocuments: [
            {
              documentName: docName,
              fileData: base64Data,
              uploadedBy: "Agent"
            }
          ]
        })
      });

      if (res.ok) {
        showAlert("Success", `${docName} uploaded successfully!`);
        await fetchClaims(agentEmail);
        const listRes = await fetch(`${API_BASE_URL}/api/agent/claims?email=${encodeURIComponent(agentEmail)}`);
        if (listRes.ok) {
          const data = await listRes.json();
          const freshClaim = data.find((c: Claim) => c._id === claimToUse._id);
          if (freshClaim) {
            if (selectedClaim && selectedClaim._id === claimToUse._id) {
              setSelectedClaim(freshClaim);
            }
          }
        }
      } else {
        const errData = await res.json();
        showAlert("Error", errData.error || "Failed to upload document.");
      }
    } catch (e) {
      showAlert("Error", "An error occurred during document upload.");
    } finally {
      setIsAgentUploading(false);
    }
  };

  const handleAgentDocSubmit = async () => {
    if (!selectedClaim || !agentUploadFileBase64) return;
    setIsAgentUploading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/policy-holder/update-claim/${selectedClaim.claimNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadedDocuments: [
            {
              documentName: agentUploadDocName,
              fileData: agentUploadFileBase64,
              uploadedBy: "Agent"
            }
          ]
        })
      });

      if (res.ok) {
        showAlert("Success", "Document uploaded successfully!");
        setAgentUploadFileBase64(null);
        setAgentUploadFileName("");
        await fetchClaims(agentEmail);
        const listRes = await fetch(`${API_BASE_URL}/api/agent/claims?email=${encodeURIComponent(agentEmail)}`);
        if (listRes.ok) {
          const data = await listRes.json();
          const freshClaim = data.find((c: Claim) => c._id === selectedClaim._id);
          if (freshClaim) setSelectedClaim(freshClaim);
        }
      } else {
        const errData = await res.json();
        showAlert("Error", errData.error || "Failed to upload document.");
      }
    } catch (e) {
      showAlert("Error", "An error occurred during document upload.");
    } finally {
      setIsAgentUploading(false);
    }
  };

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
      setInspectionReportText(selectedClaim.inspectionReport || "");
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

  const getAgentPendingRequests = (claim: Claim) => {
    if (!claim.requestedDocuments) return [];
    return claim.requestedDocuments.filter(name => {
      const isUploaded = (claim.additionalDocuments || []).some(
        doc => doc.name.trim().toLowerCase() === name.trim().toLowerCase() && doc.uploadedBy === "Agent"
      );
      if (isUploaded) return false;
      return getRecipientForDoc(claim, name) === "Agent";
    });
  };

  const claimsWithPendingAgentRequests = activeClaims.filter(
    claim => getAgentPendingRequests(claim).length > 0
  );

  const completedClaims = claims
    .filter(c => c.status === "Approved" || c.status === "Rejected")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);
  const urgentCount   = activeClaims.filter(c => getSeverity(c.damageType) === "Urgent").length;
  const totalAssigned = activeClaims.length;

  const displayClaims = activeTab === "activity" ? completedClaims.slice(0, 3) : activeClaims;

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

  const handleAcceptClaim = async () => {
    if (!selectedClaim) return;
    setIsAcceptingClaim(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/agent/claims/${selectedClaim._id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acceptClaim: true }),
      });
      if (!res.ok) throw new Error("Failed to accept");
      showAlert("Success", "Claim accepted successfully! Proceed with vehicle inspection.");
      // Refresh list
      await fetchClaims(agentEmail);
      // Refresh local selected claim
      const listRes = await fetch(`${API_BASE_URL}/api/agent/claims?email=${encodeURIComponent(agentEmail)}`);
      if (listRes.ok) {
        const data = await listRes.json();
        const freshClaim = data.find((c: Claim) => c._id === selectedClaim._id);
        if (freshClaim) setSelectedClaim(freshClaim);
      }
    } catch (e) {
      showAlert("Error", "Failed to accept claim assignment. Please try again.");
    } finally {
      setIsAcceptingClaim(false);
    }
  };

  const handleSubmitInspectionReport = async () => {
    if (!selectedClaim) return;
    if (!inspectionReportText.trim()) {
      showAlert("Validation Error", "Please enter inspection report details.");
      return;
    }
    setIsSubmittingReport(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/agent/claims/${selectedClaim._id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inspectionReport: inspectionReportText.trim(),
          inspectionSubmitted: true,
          status: "In Progress"
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      showAlert("Success", "Inspection report submitted successfully!");
      setSelectedClaim(null);
      fetchClaims(agentEmail);
      setInspectionReportText("");
    } catch (e) {
      showAlert("Error", "Failed to submit inspection report. Please try again.");
    } finally {
      setIsSubmittingReport(false);
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

          {/* ── PENDING DOCUMENT REQUESTS BANNER ── */}
          {claimsWithPendingAgentRequests.length > 0 && (
            <TouchableOpacity
              style={styles.alertBanner}
              activeOpacity={0.8}
              onPress={() => setShowPendingRequestsModal(true)}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                <View style={styles.alertBannerIconBox}>
                  <Ionicons name="warning" size={20} color="#f97316" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertBannerTitle}>Document Upload Required</Text>
                  <Text style={styles.alertBannerSub}>
                    Awaiting agent uploads for {claimsWithPendingAgentRequests.length} claim{claimsWithPendingAgentRequests.length > 1 ? "s" : ""}. Tap to view.
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          )}

          {/* ── TAB SELECTOR ── */}
          <View style={styles.tabRow}>
            {(["claims", "activity"] as const).map((tab) => {
              const active = tab === "claims" ? (activeTab === "claims" || activeTab === "home") : activeTab === "activity";
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabBtn, active && styles.tabBtnActive]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>
                    {tab === "claims" ? "Active Claims" : "My Activity"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── CLAIMS LIST ── */}
          <View style={{ paddingHorizontal: 16, marginTop: 4 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {activeTab === "activity" ? "Recent Completed" : "Active Claims"}
              </Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{displayClaims.length}</Text>
              </View>
            </View>

            {displayClaims.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons
                  name={(activeTab === "claims" || activeTab === "home") ? "document-text-outline" : "checkmark-done-outline"}
                  size={34}
                  color="#cbd5e1"
                />
                <Text style={styles.emptyText}>
                  {(activeTab === "claims" || activeTab === "home") ? "No active claims assigned." : "No completed claims yet."}
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
                          backgroundColor: "#ffffff",
                          borderColor: "#e2e8f0",
                          borderLeftWidth: 4,
                          borderLeftColor: isCompleted ? statusColor : "#1e3a8a",
                        },
                      ]}
                      onPress={() => setSelectedClaim(claim)}
                      activeOpacity={0.85}
                    >
                      {/* Left Side: Circular Status/Vehicle Icon Badge */}
                      <View style={[styles.claimIconWrap, { backgroundColor: "#f0f7ff" }]}>
                        <Ionicons
                          name="car-sport"
                          size={20}
                          color={isCompleted ? statusColor : "#1e3a8a"}
                        />
                      </View>

                      {/* Right Side: Claim Details */}
                      <View style={{ flex: 1, marginLeft: 12, paddingRight: 8 }}>
                        {/* Header Row: Plate Number and Status/Severity Badge */}
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <Text style={styles.claimPlateText}>{claim.vehiclePlate}</Text>
                          <View style={[styles.claimBadge, { backgroundColor: "#f0f7ff", borderColor: isCompleted ? statusColor + "30" : "#dbeafe" }]}>
                            <Text style={[styles.claimBadgeText, { color: isCompleted ? statusColor : "#1e3a8a" }]}>
                              {isCompleted ? claim.status.toUpperCase() : sev.toUpperCase()}
                            </Text>
                          </View>
                        </View>

                        {/* Claim ID & Damage */}
                        <Text style={styles.claimNumberText}>{claim.claimNumber} · {claim.damageType}</Text>

                        {/* Location and NIC info */}
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#f1f5f9" }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Ionicons name="location-outline" size={12} color="#64748b" />
                            <Text style={styles.claimLocationText} numberOfLines={1}>{claim.location}</Text>
                          </View>
                          <Text style={styles.claimNicText}>NIC: {claim.userNic}</Text>
                        </View>
                      </View>

                      {/* Far Right: Tap indicator arrow */}
                      <View style={{ justifyContent: "center", alignItems: "center" }}>
                        <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {activeTab === "activity" && completedClaims.length > 0 && (
              <TouchableOpacity
                style={styles.viewAllBtn}
                onPress={() => router.push("/Agent/Activity/page" as any)}
                activeOpacity={0.8}
              >
                <Text style={styles.viewAllBtnText}>View All Activities</Text>
                <Ionicons name="arrow-forward" size={16} color="#1e3a8a" />
              </TouchableOpacity>
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

      <AgentNavbar activeTab="home" />

      {/* ── PENDING DOCUMENT REQUESTS DETAIL MODAL ── */}
      <Modal
        visible={showPendingRequestsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPendingRequestsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ width: "100%", maxWidth: 460, alignSelf: "center", flex: 1, justifyContent: "flex-end" }}
          >
            <View style={[styles.modalCard, { height: SCREEN_H * 0.5 }]}>
              {/* Header */}
              <View style={[styles.modalHeader, { borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }]}>
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <Ionicons name="warning-outline" size={22} color="#f97316" style={{ marginRight: 8 }} />
                  <Text style={[styles.modalHeaderTitle, { color: "#0f172a", flex: 1 }]}>Pending Agent Uploads</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalHeaderClose}
                  onPress={() => setShowPendingRequestsModal(false)}
                >
                  <Ionicons name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
                {claimsWithPendingAgentRequests.map((claim) => {
                  const pendingDocs = getAgentPendingRequests(claim);
                  return (
                    <View key={claim._id} style={{ marginBottom: 20 }}>
                      <Text style={{ fontSize: 13, fontWeight: "900", color: "#475569", marginBottom: 10, paddingLeft: 4, textTransform: "uppercase", letterSpacing: 0.3 }}>
                        Claim: {claim.claimNumber} · {claim.vehiclePlate}
                      </Text>
                      {pendingDocs.map((docName, idx) => {
                        const { requestedAt } = getDocDetails(claim, docName, "Pending");
                        return (
                          <View key={idx} style={styles.agentDocCardPending}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                              <View style={styles.agentSirenIconWrap}>
                                <Ionicons name="document-text-outline" size={20} color="#1e3a8a" />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.agentDocTitlePending} numberOfLines={1}>{docName}</Text>
                                <Text style={styles.agentDocSubPending}>Requested: {requestedAt}</Text>
                              </View>
                            </View>
                            <TouchableOpacity
                              style={styles.agentUploadCardBtn}
                              onPress={() => {
                                setShowPendingRequestsModal(false);
                                handleAgentDocUploadPicker(docName, claim);
                              }}
                            >
                              <Ionicons name="cloud-upload-outline" size={14} color="#ffffff" />
                              <Text style={styles.agentUploadCardBtnText}>Upload</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </ScrollView>
              
              <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: "#f1f5f9" }}>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setShowPendingRequestsModal(false)}
                >
                  <Text style={styles.closeBtnText}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

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
            style={{ width: "100%", maxWidth: 460, alignSelf: "center", flex: 1, justifyContent: "flex-end" }}
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
                style={{ flexShrink: 1 }}
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

                      {/* Accept Claim Assignment Section */}
                      {isActive && selectedClaim.currentStep === 2 && (
                        <View style={styles.modalDescBox}>
                          <Text style={styles.modalDescLabel}>Accept Claim Assignment</Text>
                          <Text style={[styles.modalDescText, { fontSize: 11, color: '#64748b', marginBottom: 8 }]}>
                            This claim has been assigned to you. Accept the assignment to begin the vehicle inspection process.
                          </Text>
                          <TouchableOpacity
                            style={[styles.approveBtn, { backgroundColor: "#0ea5e9", paddingHorizontal: 16, height: 36, alignSelf: 'flex-start' }]}
                            onPress={handleAcceptClaim}
                            disabled={isAcceptingClaim}
                          >
                            <Text style={styles.approveBtnText}>
                              {isAcceptingClaim ? "Accepting..." : "Accept Claim Assignment"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Submit Inspection Report Section */}
                      {isActive && selectedClaim.currentStep === 3 && !selectedClaim.inspectionSubmitted && (
                        <View style={styles.modalDescBox}>
                          <Text style={styles.modalDescLabel}>Submit Inspection Report</Text>
                          <TextInput
                            style={[styles.modalAssessField, { height: 80, textAlignVertical: 'top', padding: 10, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, color: '#1e293b', marginBottom: 8 }]}
                            placeholder="Type the inspection report details (vehicle condition, damage evaluation, etc.)..."
                            placeholderTextColor="#94a3b8"
                            multiline
                            numberOfLines={4}
                            value={inspectionReportText}
                            onChangeText={setInspectionReportText}
                          />
                          <TouchableOpacity
                            style={[styles.approveBtn, { backgroundColor: "#06b6d4", marginTop: 8, alignSelf: 'flex-end', paddingHorizontal: 16, height: 36 }]}
                            onPress={handleSubmitInspectionReport}
                            disabled={isSubmittingReport || !inspectionReportText.trim()}
                          >
                            <Text style={styles.approveBtnText}>
                              {isSubmittingReport ? "Submitting..." : "Submit Report"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {selectedClaim.inspectionSubmitted ? (
                        <View style={styles.modalDescBox}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <Text style={styles.modalDescLabel}>Inspection Report</Text>
                            <Text style={{ fontSize: 10, fontWeight: '900', color: '#16a34a', backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>Submitted</Text>
                          </View>
                          <Text style={styles.modalDescText}>{selectedClaim.inspectionReport}</Text>
                        </View>
                      ) : null}

                      {/* Requested Agent Documents Status Section */}
                      {selectedClaim.requestedDocuments && selectedClaim.requestedDocuments.length > 0 && (() => {
                        const requestedDocsList = [
                          ...(selectedClaim.requestedDocuments || [])
                            .filter(name => {
                              const recipient = getRecipientForDoc(selectedClaim, name);
                              const isUploaded = (selectedClaim.additionalDocuments || []).some(
                                doc => doc.name.trim().toLowerCase() === name.trim().toLowerCase() && 
                                       ((recipient === "Agent" && doc.uploadedBy === "Agent") || 
                                        (recipient === "User" && doc.uploadedBy !== "Agent"))
                              );
                              return !isUploaded;
                            })
                            .map((name) => ({
                              name,
                              status: "Pending" as const,
                              url: null,
                              recipient: getRecipientForDoc(selectedClaim, name),
                            })),
                          ...(selectedClaim.additionalDocuments || []).map((doc) => ({
                            name: doc.name,
                            status: "Submitted" as const,
                            url: doc.url,
                            recipient: doc.uploadedBy === "Agent" ? "Agent" : "User",
                          })),
                        ];

                        const agentDocs = requestedDocsList.filter((d) => d.recipient === "Agent");

                        if (agentDocs.length === 0) return null;

                        return (
                          <View style={styles.modalDescBox}>
                            <Text style={styles.modalDescLabel}>Requested Agent Documents</Text>
                            {agentDocs.map((item, idx) => {
                              const { requestedAt, submittedAt } = getDocDetails(selectedClaim, item.name, item.status);
                              const isPending = item.status === "Pending";

                              if (isPending) {
                                return (
                                  <View key={idx} style={styles.agentDocCardPending}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                                      <View style={styles.agentSirenIconWrap}>
                                        <Ionicons name="document-text-outline" size={20} color="#1e3a8a" />
                                      </View>
                                      <View style={{ flex: 1 }}>
                                        <Text style={styles.agentDocTitlePending} numberOfLines={1}>{item.name}</Text>
                                        <Text style={styles.agentDocSubPending}>Requested: {requestedAt}</Text>
                                      </View>
                                    </View>
                                    <TouchableOpacity
                                      style={styles.agentUploadCardBtn}
                                      onPress={() => handleAgentDocUploadPicker(item.name)}
                                    >
                                      <Ionicons name="cloud-upload-outline" size={14} color="#ffffff" />
                                      <Text style={styles.agentUploadCardBtnText}>Upload</Text>
                                    </TouchableOpacity>
                                  </View>
                                );
                              } else {
                                return (
                                  <View key={idx} style={styles.agentDocCardSubmitted}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center" }}>
                                        <Ionicons name="checkmark-circle-outline" size={20} color="#16a34a" />
                                      </View>
                                      <View style={{ flex: 1 }}>
                                        <Text style={styles.agentDocTitleSubmitted} numberOfLines={1}>{item.name}</Text>
                                        <Text style={styles.agentDocSubSubmitted}>Uploaded: {submittedAt || "Recent"}</Text>
                                      </View>
                                    </View>
                                    <TouchableOpacity
                                      style={styles.agentDocViewBtn}
                                      onPress={() => handleViewDocument(item.url)}
                                    >
                                      <Text style={styles.agentDocViewBtnText}>View</Text>
                                    </TouchableOpacity>
                                  </View>
                                );
                              }
                            })}
                          </View>
                        );
                      })()}

                      {/* Uploaded Agent Documents List */}
                      {(() => {
                        const agentUploadedDocs = (selectedClaim.additionalDocuments || []).filter(
                          (doc) => doc.uploadedBy === "Agent"
                        );
                        if (agentUploadedDocs.length === 0) return null;
                        return (
                          <View style={styles.modalDescBox}>
                            <Text style={styles.modalDescLabel}>Uploaded Agent Documents</Text>
                            {agentUploadedDocs.map((doc, idx) => {
                              const submittedAt = formatDate(doc.uploadedAt);
                              return (
                                <View key={idx} style={styles.agentDocCardSubmitted}>
                                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center" }}>
                                      <Ionicons name="document-text-outline" size={20} color="#16a34a" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                      <Text style={styles.agentDocTitleSubmitted} numberOfLines={1}>{doc.name}</Text>
                                      <Text style={styles.agentDocSubSubmitted}>Uploaded: {submittedAt || "Recent"}</Text>
                                    </View>
                                  </View>
                                  <TouchableOpacity
                                    style={styles.agentDocViewBtn}
                                    onPress={() => handleViewDocument(doc.url)}
                                  >
                                    <Text style={styles.agentDocViewBtnText}>View</Text>
                                  </TouchableOpacity>
                                </View>
                              );
                            })}
                          </View>
                        );
                      })()}

                      {/* Upload new agent doc */}
                      {isActive && (
                        <View style={styles.modalDescBox}>
                          <Text style={styles.modalDescLabel}>Upload Agent Document</Text>
                          
                          {/* Selector Pills */}
                          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                            {["Repair Estimate", "Inspection Photos", "Damage Assessment", "Other"].map((type) => {
                              const isSelected = agentUploadDocName === type;
                              return (
                                <TouchableOpacity
                                  key={type}
                                  onPress={() => setAgentUploadDocName(type)}
                                  style={{
                                    paddingHorizontal: 12,
                                    paddingVertical: 7,
                                    borderRadius: 12,
                                    backgroundColor: isSelected ? "#dbeafe" : "#f1f5f9",
                                  }}
                                  activeOpacity={0.8}
                                >
                                  <Text style={{ fontSize: 11, fontWeight: "800", color: isSelected ? "#1e3a8a" : "#64748b" }}>
                                    {type}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>

                          {/* Upload Slot Design */}
                          {agentUploadFileBase64 ? (
                            <View style={styles.agentDocCardSubmitted}>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center" }}>
                                  <Ionicons name="image-outline" size={20} color="#16a34a" />
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.agentDocTitleSubmitted} numberOfLines={1}>
                                    {agentUploadFileName}
                                  </Text>
                                  <Text style={styles.agentDocSubSubmitted}>Ready to upload ({agentUploadDocName})</Text>
                                </View>
                              </View>
                              <TouchableOpacity
                                style={{ padding: 6 }}
                                onPress={() => {
                                  setAgentUploadFileBase64(null);
                                  setAgentUploadFileName("");
                                }}
                                activeOpacity={0.7}
                              >
                                <Ionicons name="trash-outline" size={20} color="#dc2626" />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={{
                                borderStyle: "dashed",
                                borderWidth: 1.5,
                                borderColor: "#1e3a8a",
                                backgroundColor: "#f0f7ff30",
                                borderRadius: 16,
                                paddingVertical: 24,
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                              }}
                              onPress={handlePickAgentDoc}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="cloud-upload" size={30} color="#1e3a8a" />
                              <Text style={{ fontSize: 13, fontWeight: "800", color: "#1e293b" }}>
                                Select document file
                              </Text>
                              <Text style={{ fontSize: 10, fontWeight: "600", color: "#64748b" }}>
                                Image (Max 5MB)
                              </Text>
                            </TouchableOpacity>
                          )}

                          {agentUploadFileBase64 && (
                            <TouchableOpacity
                              style={[
                                styles.approveBtn,
                                {
                                  backgroundColor: "#f97316",
                                  marginTop: 14,
                                  height: 44,
                                  flexDirection: "row",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 6,
                                  borderRadius: 14,
                                },
                                isAgentUploading && { opacity: 0.7 }
                              ]}
                              onPress={handleAgentDocSubmit}
                              disabled={isAgentUploading}
                            >
                              {isAgentUploading ? (
                                <ActivityIndicator color="#ffffff" size="small" />
                              ) : (
                                <>
                                  <Ionicons name="cloud-upload-outline" size={16} color="#ffffff" />
                                  <Text style={styles.approveBtnText}>Upload to Claim</Text>
                                </>
                              )}
                            </TouchableOpacity>
                          )}
                        </View>
                      )}

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
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    marginBottom: 12,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  claimIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    marginTop: 2,
  },
  claimPlateText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  claimBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  claimBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  claimNumberText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 2,
  },
  claimLocationText: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
    maxWidth: 150,
  },
  claimNicText: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
  },

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
    flexShrink: 1,
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
    paddingHorizontal: 20,
    borderRadius: 12,
    height: 48,
    backgroundColor: "#f0f7ff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    color: "#1e3a8a",
    fontSize: 14,
    fontWeight: "700",
  },

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

  /* New Agent Document Card Redesign */
  agentDocCardPending: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderLeftWidth: 4,
    borderLeftColor: "#1e3a8a",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  agentSirenIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f7ff",
    alignItems: "center",
    justifyContent: "center",
  },
  agentDocTitlePending: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1e293b",
  },
  agentDocSubPending: {
    fontSize: 10.5,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 2,
  },
  agentUploadCardBtn: {
    backgroundColor: "#1e3a8a",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  agentUploadCardBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  agentDocCardSubmitted: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderLeftWidth: 4,
    borderLeftColor: "#10b981",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  agentDocTitleSubmitted: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1e293b",
  },
  agentDocSubSubmitted: {
    fontSize: 10.5,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 2,
  },
  agentDocViewBtn: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  agentDocViewBtnText: {
    color: "#16a34a",
    fontSize: 11,
    fontWeight: "800",
  },
  /* Redesigned Pending uploads box on main screen */
  pendingReqBox: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 24,
    marginTop: 10,
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  pendingReqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 10,
  },
  pendingReqTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pendingReqBadge: {
    backgroundColor: "#fff7ed",
    borderColor: "#ffedd5",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pendingReqBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#ea580c",
  },
  pendingReqCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  pendingReqIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f7ff",
    alignItems: "center",
    justifyContent: "center",
  },
  pendingReqClaimNo: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#0f172a",
  },
  pendingReqDocBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f7ff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pendingReqDocBadgeText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#1e3a8a",
  },
  pendingReqUploadBtn: {
    backgroundColor: "#1e3a8a",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pendingReqUploadBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#f0f7ff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 16,
  },
  viewAllBtnText: {
    fontSize: 13,
    color: "#1e3a8a",
    fontWeight: "800",
  },
  /* Alert banner for pending requests notify */
  alertBanner: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginBottom: 20,
    marginTop: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderLeftWidth: 4,
    borderLeftColor: "#f97316",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  alertBannerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
  },
  alertBannerTitle: {
    color: "#1e293b",
    fontSize: 13.5,
    fontWeight: "800",
  },
  alertBannerSub: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
    lineHeight: 15,
  },
  modalHeaderClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
});
