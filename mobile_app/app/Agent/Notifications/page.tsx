import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Platform,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
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

interface NotificationItem {
  id: string;
  claimId: string;
  claimNumber: string;
  title: string;
  message: string;
  type: "assignment" | "inspection" | "document" | "message" | "approval" | "welcome";
  priority: "high" | "medium" | "info" | "success" | "low";
  timeText: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

const formatNumberPlate = (plate: string): string => {
  if (!plate) return "";
  const cleaned = plate.trim();
  if (cleaned.includes("-")) return cleaned.toUpperCase();
  const lastNumbersMatch = cleaned.match(/^(.*[A-Za-z]+)(\d+)$/);
  if (lastNumbersMatch) {
    return `${lastNumbersMatch[1].trim().toUpperCase()}-${lastNumbersMatch[2]}`;
  }
  return cleaned.toUpperCase();
};

export default function AgentNotificationsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [clearedIds, setClearedIds] = useState<string[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [agentEmail, setAgentEmail] = useState("");

  // Load Cleared IDs from AsyncStorage
  const loadClearedIds = async () => {
    try {
      const stored = await AsyncStorage.getItem("@sanasa_agent_cleared_notifs");
      if (stored) {
        setClearedIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error loading cleared notifications:", e);
    }
  };

  // Load Read IDs from AsyncStorage
  const loadReadIds = async () => {
    try {
      const stored = await AsyncStorage.getItem("@sanasa_agent_read_notifs");
      if (stored) {
        setReadIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error loading read notifications:", e);
    }
  };

  // Save Cleared ID
  const handleClearOne = async (id: string) => {
    try {
      const updated = [...clearedIds, id];
      setClearedIds(updated);
      await AsyncStorage.setItem("@sanasa_agent_cleared_notifs", JSON.stringify(updated));
    } catch (e) {
      console.error("Error clearing notification:", e);
    }
  };

  // Clear All Notifications
  const handleClearAll = async (items: NotificationItem[]) => {
    try {
      const idsToClear = items.map(item => item.id);
      const updated = Array.from(new Set([...clearedIds, ...idsToClear]));
      setClearedIds(updated);
      await AsyncStorage.setItem("@sanasa_agent_cleared_notifs", JSON.stringify(updated));
      Alert.alert("Success", "All notifications cleared.");
    } catch (e) {
      console.error("Error clearing all notifications:", e);
    }
  };

  // Mark a Notification as Read
  const markAsRead = async (id: string) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      await AsyncStorage.setItem("@sanasa_agent_read_notifs", JSON.stringify(updated));
    }
  };

  // Toggle Read/Unread Status
  const toggleReadStatus = async (id: string) => {
    let updated = [];
    if (readIds.includes(id)) {
      updated = readIds.filter(x => x !== id);
    } else {
      updated = [...readIds, id];
    }
    setReadIds(updated);
    await AsyncStorage.setItem("@sanasa_agent_read_notifs", JSON.stringify(updated));
  };

  // Mark All as Read
  const markAllAsRead = async (items: NotificationItem[]) => {
    const allIds = items.map(item => item.id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    await AsyncStorage.setItem("@sanasa_agent_read_notifs", JSON.stringify(updated));
    Alert.alert("Success", "All notifications marked as read.");
  };

  // Load Cached Claims from AsyncStorage
  const loadCachedClaims = async () => {
    try {
      const cached = await AsyncStorage.getItem("@sanasa_agent_cached_claims");
      if (cached) {
        const data = JSON.parse(cached);
        if (Array.isArray(data) && data.length > 0) {
          setClaims(data);
          setLoading(false);
        }
      }
    } catch (e) {
      console.error("Error loading cached claims in notifications:", e);
    }
  };

  // Fetch Claims from Server
  const fetchClaims = useCallback(async (email: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/agent/claims?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error("Failed to fetch claims");
      const data = await res.json();
      if (Array.isArray(data)) {
        setClaims(data);
        await AsyncStorage.setItem("@sanasa_agent_cached_claims", JSON.stringify(data));
      }
    } catch (e) {
      console.error("Fetch claims in notifications error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Boot Setup
  useEffect(() => {
    (async () => {
      await loadClearedIds();
      await loadReadIds();
      await loadCachedClaims();
      const agentStr = await AsyncStorage.getItem("logged_in_agent");
      if (!agentStr) {
        router.replace("/login/page");
        return;
      }
      try {
        const agent = JSON.parse(agentStr);
        if (agent.email) {
          setAgentEmail(agent.email);
          fetchClaims(agent.email);
        } else {
          setLoading(false);
        }
      } catch {
        router.replace("/login/page");
      }
    })();
  }, [fetchClaims]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (agentEmail) {
      fetchClaims(agentEmail);
    } else {
      setRefreshing(false);
    }
  }, [agentEmail, fetchClaims]);

  // Compile Dynamic Notifications List
  const compiledNotifications = React.useMemo(() => {
    const list: NotificationItem[] = [];

    claims.forEach(claim => {
      const formattedPlate = formatNumberPlate(claim.vehiclePlate);

      // 1. High Priority Case Assignment (Step 2 + Active status)
      if (claim.currentStep === 2 && claim.status !== "Approved" && claim.status !== "Rejected") {
        const notifId = `${claim._id}_assignment`;
        if (!clearedIds.includes(notifId)) {
          list.push({
            id: notifId,
            claimId: claim._id,
            claimNumber: claim.claimNumber,
            title: "New Case Assigned 📁",
            message: `Review and Accept claim assignment ${claim.claimNumber} for Plate: ${formattedPlate}.`,
            type: "assignment",
            priority: "high",
            timeText: formatDate(claim.createdAt),
          });
        }
      }

      // 2. Pending Physical Inspection (Step 3 + Not Submitted)
      if (claim.currentStep === 3 && !claim.inspectionSubmitted && claim.status !== "Approved" && claim.status !== "Rejected") {
        const notifId = `${claim._id}_inspection`;
        if (!clearedIds.includes(notifId)) {
          list.push({
            id: notifId,
            claimId: claim._id,
            claimNumber: claim.claimNumber,
            title: "Inspection Required 🚗",
            message: `Submit report details & damage photographs for Plate: ${formattedPlate}.`,
            type: "inspection",
            priority: "medium",
            timeText: formatDate(claim.createdAt),
          });
        }
      }

      // 3. Document upload requested from agent
      if (claim.requestedDocuments && claim.requestedDocuments.length > 0) {
        const isAgentRequest = claim.documentRequestTo === "Agent" || [...(claim.messages || [])]
          .reverse()
          .find(m => m.message && m.message.includes("[Document Request to Agent]"));

        if (isAgentRequest) {
          claim.requestedDocuments.forEach(docName => {
            const isUploaded = (claim.additionalDocuments || []).some(
              doc => doc.name.trim().toLowerCase() === docName.trim().toLowerCase() && doc.uploadedBy === "Agent"
            );
            if (!isUploaded) {
              const notifId = `${claim._id}_doc_${docName.replace(/\s+/g, "_")}`;
              if (!clearedIds.includes(notifId)) {
                list.push({
                  id: notifId,
                  claimId: claim._id,
                  claimNumber: claim.claimNumber,
                  title: "Agent Document Needed 📄",
                  message: `Upload ${docName} to complete the file for Plate: ${formattedPlate}.`,
                  type: "document",
                  priority: "medium",
                  timeText: formatDate(claim.createdAt),
                });
              }
            }
          });
        }
      }

      // 4. Unread messages from Policy Holder or Staff
      if (claim.messages && claim.messages.length > 0) {
        const lastMsg = claim.messages[claim.messages.length - 1];
        if (lastMsg.sender !== "Agent") {
          const notifId = `${claim._id}_msg_${lastMsg.sentAt}`;
          if (!clearedIds.includes(notifId)) {
            list.push({
              id: notifId,
              claimId: claim._id,
              claimNumber: claim.claimNumber,
              title: `New Message from ${lastMsg.sender} 💬`,
              message: `"${lastMsg.message}"`,
              type: "message",
              priority: "info",
              timeText: formatDate(lastMsg.sentAt),
            });
          }
        }
      }

      // 5. Approved/Resolved Claims
      if (claim.status === "Approved") {
        const notifId = `${claim._id}_approved`;
        if (!clearedIds.includes(notifId)) {
          list.push({
            id: notifId,
            claimId: claim._id,
            claimNumber: claim.claimNumber,
            title: "Claim Approved & Settled ✅",
            message: `LKR ${claim.amount?.toLocaleString() || "0"} final assessment payout authorized for ${formattedPlate}.`,
            type: "approval",
            priority: "success",
            timeText: formatDate(claim.createdAt),
          });
        }
      }
    });

    // 6. Welcome / default welcome notification
    const welcomeId = "welcome_notification";
    if (!clearedIds.includes(welcomeId)) {
      list.push({
        id: welcomeId,
        claimId: "",
        claimNumber: "",
        title: "Welcome to Sanasa Agent Portal 🛡️",
        message: "Your agent dashboard notifications and updates will appear here in real-time. Keep track of assigned claims and upload requests.",
        type: "welcome",
        priority: "low",
        timeText: "System",
      });
    }

    // Sort order: high -> medium -> info -> success -> low
    const priorityScore = { high: 5, medium: 4, info: 3, success: 2, low: 1 };
    return list.sort((a, b) => priorityScore[b.priority] - priorityScore[a.priority]);
  }, [claims, clearedIds]);

  // Filter based on active selected tab ("all", "unread" or "read")
  const displayedNotifications = React.useMemo(() => {
    if (activeTab === "unread") {
      return compiledNotifications.filter(item => !readIds.includes(item.id));
    }
    if (activeTab === "read") {
      return compiledNotifications.filter(item => readIds.includes(item.id));
    }
    return compiledNotifications;
  }, [compiledNotifications, activeTab, readIds]);

  const handleNotificationTap = async (item: NotificationItem) => {
    // Mark as read first
    await markAsRead(item.id);

    if (item.type === "welcome") {
      Alert.alert("System Notification", item.message);
      return;
    }

    // Find the claim details in current claims list to pass it instantly
    const matchedClaim = claims.find(c => c._id === item.claimId || c.claimNumber === item.claimId);
    if (matchedClaim) {
      try {
        await AsyncStorage.setItem("notification_claim_data", JSON.stringify(matchedClaim));
      } catch (e) {
        console.error("Error setting notification claim data:", e);
      }
    }

    // Navigate back to Dashboard with deep linking param
    router.replace({
      pathname: "/Agent/Dashboard/page",
      params: { claimId: item.claimId, from: "notifications" }
    });
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "high": return "#ef4444";
      case "medium": return "#f97316";
      case "success": return "#22c55e";
      case "info": return "#0ea5e9";
      default: return "#64748b";
    }
  };

  const getPriorityBg = (p: string) => {
    switch (p) {
      case "high": return "#fef2f2";
      case "medium": return "#fff7ed";
      case "success": return "#f0fdf4";
      case "info": return "#f0f9ff";
      default: return "#f8fafc";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "assignment": return "briefcase-outline";
      case "inspection": return "car-sport-outline";
      case "document": return "document-text-outline";
      case "message": return "chatbubble-ellipses-outline";
      case "approval": return "checkmark-circle-outline";
      default: return "notifications-outline";
    }
  };

  // Derive unread counts
  const unreadCount = compiledNotifications.filter(n => !readIds.includes(n.id)).length;
  const hasUnread = unreadCount > 0;

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

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
        <LinearGradient
          colors={["#0f172a", "#1e293b", "#0c1a2e"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          {/* Ambient background design effects */}
          <View style={[styles.glowCircle, { top: -60, right: -40, backgroundColor: "rgba(249,115,22,0.10)" }]} />
          <View style={[styles.glowCircle, { bottom: -40, left: -30, backgroundColor: "rgba(14,165,233,0.08)", width: 180, height: 180 }]} />

          {/* Top Back bar */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/Agent/Dashboard/page")} activeOpacity={0.8}>
              <Ionicons name="chevron-back" size={24} color="#ffffff" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Notifications</Text>

            {compiledNotifications.length > 1 ? (
              <TouchableOpacity onPress={() => handleClearAll(compiledNotifications)} activeOpacity={0.8} style={styles.clearAllBtn}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 60 }} />
            )}
          </View>

          {/* Subtitle Status Banner */}
          <View style={styles.subtitleBanner}>
            <View style={[styles.dotIndicator, unreadCount > 0 && { backgroundColor: "#f97316" }]} />
            <Text style={styles.subtitleText}>
              {unreadCount > 0 
                ? `You have ${unreadCount} unread claim alert${unreadCount !== 1 ? "s" : ""} requiring attention.`
                : "No unread alerts. All systems caught up."}
            </Text>
          </View>

          {/* Mini Action Controls */}
          {hasUnread && (
            <View style={styles.headerActionsRow}>
              <TouchableOpacity 
                onPress={() => markAllAsRead(compiledNotifications)} 
                activeOpacity={0.8} 
                style={styles.headerActionBtn}
              >
                <Ionicons name="mail-open-outline" size={14} color="#f97316" />
                <Text style={styles.headerActionBtnText}>Mark All as Read</Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>

        {/* ── SEGMENTED TAB SELECTOR (ALL / UNREAD / READ) ── */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "all" && styles.tabBtnActive]}
            onPress={() => setActiveTab("all")}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === "all" && styles.tabBtnTextActive]}>
              All ({compiledNotifications.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "unread" && styles.tabBtnActive]}
            onPress={() => setActiveTab("unread")}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === "unread" && styles.tabBtnTextActive]}>
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "read" && styles.tabBtnActive]}
            onPress={() => setActiveTab("read")}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === "read" && styles.tabBtnTextActive]}>
              Read ({compiledNotifications.length - unreadCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── NOTIFICATIONS CONTAINER ── */}
        <View style={styles.listContainer}>
          {displayedNotifications.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="notifications-off-outline" size={40} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === "unread" ? "No Unread Alerts" : activeTab === "read" ? "No Read Alerts" : "All Caught Up!"}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === "unread"
                  ? "There are no unread notifications to display right now."
                  : activeTab === "read"
                  ? "There are no read notifications to display right now."
                  : "No notifications are currently pending for your agent profile."}
              </Text>
            </View>
          ) : (
            displayedNotifications.map((item) => {
              const borderLeftColor = getPriorityColor(item.priority);
              const cardBg = getPriorityBg(item.priority);
              const iconName = getNotificationIcon(item.type);
              const iconColor = getPriorityColor(item.priority);
              const isRead = readIds.includes(item.id);

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.notificationCard, 
                    { borderLeftColor, backgroundColor: "#ffffff" },
                    isRead && { opacity: 0.85 }
                  ]}
                  onPress={() => handleNotificationTap(item)}
                  activeOpacity={0.85}
                >
                  {/* Left priority badge icon */}
                  <View style={[styles.iconWrap, { backgroundColor: cardBg }]}>
                    <Ionicons name={iconName} size={20} color={iconColor} />
                  </View>

                  {/* Middle texts */}
                  <View style={styles.textWrap}>
                    <View style={styles.cardHeaderRow}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1, paddingRight: 4 }}>
                        <Text style={[styles.cardTitle, isRead && { color: "#64748b" }]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {!isRead && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.timeText}>{item.timeText}</Text>
                    </View>
                    <Text style={[styles.cardMessage, isRead && { color: "#64748b" }]}>{item.message}</Text>

                    {item.claimNumber ? (
                      <View style={styles.claimBadge}>
                        <Ionicons name="document-text-outline" size={10} color="#94a3b8" />
                        <Text style={styles.claimBadgeText}>{item.claimNumber}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Right Action Column */}
                  <View style={styles.rightActionsColumn}>
                    {/* Read / Unread toggle */}
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => toggleReadStatus(item.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={isRead ? "mail-open-outline" : "mail-outline"} 
                        size={16} 
                        color={isRead ? "#94a3b8" : "#f97316"} 
                      />
                    </TouchableOpacity>
                    {/* Dismiss */}
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleClearOne(item.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close" size={16} color="#cbd5e1" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Persistent Agent Footer Navbar */}
      <AgentNavbar />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc", gap: 12 },
  loadingText: { fontSize: 14, color: "#64748b", fontWeight: "600" },

  /* Hero Gradient */
  heroGradient: {
    width: "100%",
    paddingTop: Platform.OS === "ios" ? 60 : 48,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: "hidden",
    gap: 14,
  },
  glowCircle: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
  },

  /* Top Bar */
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  clearAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  clearAllText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },

  /* Subtitle banner */
  subtitleBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
    marginRight: 10,
  },
  subtitleText: {
    flex: 1,
    fontSize: 12,
    color: "#e2e8f0",
    fontWeight: "600",
    lineHeight: 16,
  },

  /* Header action buttons */
  headerActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  headerActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(249, 115, 22, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.3)",
    borderRadius: 10,
  },
  headerActionBtnText: {
    color: "#f97316",
    fontSize: 11,
    fontWeight: "800",
  },

  /* Tabs Switcher */
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 10,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  tabBtnActive: {
    backgroundColor: "#fff7ed",
    borderColor: "#f97316",
  },
  tabBtnText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#475569",
  },
  tabBtnTextActive: {
    color: "#f97316",
  },

  /* List Layout */
  listContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },

  /* Notification Cards */
  notificationCard: {
    flexDirection: "row",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderLeftWidth: 4.5,
    padding: 14,
    alignItems: "flex-start",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },
  unreadDot: {
    width: 7.5,
    height: 7.5,
    borderRadius: 3.75,
    backgroundColor: "#0ea5e9",
  },
  timeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94a3b8",
  },
  cardMessage: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    lineHeight: 17,
  },
  claimBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 8,
    gap: 4,
  },
  claimBadgeText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#64748b",
  },
  rightActionsColumn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  /* Empty state */
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 48,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 16.5,
    fontWeight: "800",
    color: "#1e293b",
    marginTop: 4,
  },
  emptyText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
  },
});
