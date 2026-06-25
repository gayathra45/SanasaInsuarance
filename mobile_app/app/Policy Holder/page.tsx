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
  Modal,
  Linking,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import PolicyHolderNavbar from "../Components/policy holder/page";
import { API_BASE_URL } from "../config";

const { width: SCREEN_W } = Dimensions.get("window");

interface Vehicle {
  vehicleType: string;
  numberPlate: string;
  company: string;
  model: string;
  year: string | number;
}

interface Claim {
  claimNumber: string;
  status: string;
  amount?: number | null;
  createdAt?: string;
  documentsRequested?: boolean;
  requestedDocuments?: string[];
}

interface Notification {
  id: string;
  type: "urgent" | "approved" | "status";
  title: string;
  description: string;
  subText?: string;
  date: string;
  isUrgent: boolean;
  actions?: { label: string; route: string; primary?: boolean }[];
  createdAt?: string;
  claim: any;
}

function formatPlate(plate: string) {
  if (!plate) return "";
  const cleaned = plate.trim();
  if (cleaned.includes("-")) return cleaned.toUpperCase();
  const m = cleaned.match(/^(.*[A-Za-z]+)(\d+)$/);
  if (m) return `${m[1].trim().toUpperCase()}-${m[2]}`;
  return cleaned.toUpperCase();
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "Today";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch { return dateStr; }
}

function vehicleIcon(type: string) {
  const t = (type || "").toLowerCase().trim();
  if (t.includes("bike") || t.includes("motorcycle") || t.includes("scooter")) return "motorbike";
  if (t.includes("van") || t.includes("minibus")) return "van-utility";
  if (t.includes("bus")) return "bus";
  if (t.includes("truck") || t.includes("lorry")) return "truck";
  if (t.includes("suv")) return "car-estate";
  if (t.includes("tuk") || t.includes("three") || t.includes("rickshaw")) return "rickshaw";
  if (t.includes("tractor")) return "tractor";
  return "car-side";
}

/* Quick actions — moved to bottom, clean minimal design */
const QUICK_ACTIONS = [
  { label: "New Claim",   icon: "add-circle-outline",   route: "/Policy Holder/New_Claim",   color: "#0f172a" },
  { label: "My Claims",   icon: "document-text-outline", route: "/Policy Holder/My_claims",   color: "#0f172a" },
  { label: "Track Claim", icon: "locate-outline",        route: "/Policy Holder/TrackClaims", color: "#0f172a" },
  { label: "My Vehicles", icon: "car-outline",           route: "/Policy Holder/MyVehicles",  color: "#0f172a" },
  { label: "My Docs",     icon: "folder-open-outline",   route: "/Policy Holder/MyDocs",      color: "#0f172a" },
  { label: "Support",     icon: "headset-outline",       route: "support",                    color: "#0f172a" },
];

export default function PolicyHolderDashboard() {
  const [userName, setUserName]       = useState("");
  const [userNic, setUserNic]         = useState("");
  const [vehicles, setVehicles]       = useState<Vehicle[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  const [totalClaims, setTotalClaims] = useState(0);
  const [inProgress, setInProgress]   = useState(0);
  const [approved, setApproved]       = useState(0);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [hasDocRequest, setHasDocRequest] = useState(false);
  const [readIds, setReadIds]         = useState<string[]>([]);
  const [customAlert, setCustomAlert] = useState<{
    title: string;
    message: string;
    type?: "success" | "warning" | "info";
    onClose?: () => void;
  } | null>(null);

  const navigation = useNavigation();

  const loadReadStatus = async () => {
    const saved = await AsyncStorage.getItem("read_notification_ids");
    if (saved) {
      try {
        setReadIds(JSON.parse(saved));
      } catch {}
    }
  };

  const markAsRead = async (id: string) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      await AsyncStorage.setItem("read_notification_ids", JSON.stringify(updated));
    }
  };

  const fetchClaims = useCallback(async (nic: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/policy-holder/user-claims?nic=${encodeURIComponent(nic)}&_=${Date.now()}`);
      let dbClaims: Claim[] = [];
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.claims)) dbClaims = data.claims;
      }
      const lastStr = await AsyncStorage.getItem("last_submitted_claim");
      let localClaims: Claim[] = [];
      if (lastStr) {
        const parsed = JSON.parse(lastStr);
        if (!dbClaims.some((c) => c.claimNumber === parsed.claimNumber)) localClaims.push(parsed);
      }
      const all = [...localClaims, ...dbClaims];
      const pending     = all.filter((c) => !["approved","done","rejected"].some((v) => (c.status||"Pending").toLowerCase().includes(v)));
      const approvedList = all.filter((c) => ["approved","done","active"].some((v) => (c.status||"").toLowerCase().includes(v)));
      const docReq      = all.some((c) => c.documentsRequested === true);

      const notifs: Notification[] = [];
      all.forEach((claim) => {
        const dateFormatted = formatDate(claim.createdAt);
        if (claim.documentsRequested) {
          notifs.push({
            id: claim.claimNumber + "-doc",
            type: "urgent",
            title: "Documents Requested – Action Required",
            description: `Staff has requested a ${
              claim.requestedDocuments && claim.requestedDocuments.length > 0
                ? claim.requestedDocuments.join(" & ")
                : "Police Report & Repair Estimate"
            } for claim ${claim.claimNumber}.`,
            subText: "Please upload within 3 days...",
            date: dateFormatted,
            isUrgent: true,
            createdAt: claim.createdAt,
            actions: [
              { label: "Upload", route: "/Policy Holder/MyDocs", primary: true },
              { label: "View",   route: "/Policy Holder/TrackClaims" },
            ],
            claim: claim
          });
        }
        const s = (claim.status || "").toLowerCase();
        if (["approved","done","active"].some((v) => s.includes(v))) {
          notifs.push({
            id: claim.claimNumber + "-approved",
            type: "approved",
            title: `Claim ${claim.claimNumber} Approved!`,
            description: `Your claim for LKR ${claim.amount ? Number(claim.amount).toLocaleString() : "85,000"} has been approved. Payment processed within 5 days.`,
            date: dateFormatted,
            isUrgent: false,
            createdAt: claim.createdAt,
            actions: [{ label: "View", route: "/Policy Holder/TrackClaims" }],
            claim: claim
          });
        } else if (!claim.documentsRequested) {
          notifs.push({
            id: claim.claimNumber + "-status",
            type: "status",
            title: `Claim ${claim.claimNumber} Status: ${claim.status || "Pending"}`,
            description: `Your claim is currently in ${claim.status || "Pending"} stage. Agent is reviewing details.`,
            date: dateFormatted,
            isUrgent: false,
            createdAt: claim.createdAt,
            actions: [{ label: "View", route: "/Policy Holder/TrackClaims" }],
            claim: claim
          });
        }
      });

      notifs.sort((a, b) => {
        if (a.isUrgent && !b.isUrgent) return -1;
        if (!a.isUrgent && b.isUrgent) return 1;
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      setTotalClaims(all.length);
      setInProgress(pending.length);
      setApproved(approvedList.length);
      setHasDocRequest(docReq);
      setNotifications(notifs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const showCustomAlert = (title: string, message: string, type: "success" | "warning" | "info" = "info", onClose?: () => void) => {
    setCustomAlert({ title, message, type, onClose });
  };

  const contentFadeAnim  = useRef(new Animated.Value(0)).current;
  const headerSlideAnim  = useRef(new Animated.Value(-20)).current;
  const heroPulse        = useRef(new Animated.Value(1)).current;
  const bellScale        = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      await loadReadStatus();
      const userStr = await AsyncStorage.getItem("logged_in_user");
      if (!userStr) { router.replace("/login/page"); return; }
      try {
        const user = JSON.parse(userStr);
        setUserName(user.firstName || "User");
        setUserNic(user.nic || "");
        if (user.vehicles && Array.isArray(user.vehicles)) setVehicles(user.vehicles);
        if (user.nic) fetchClaims(user.nic);
      } catch { router.replace("/login/page"); }
    })();
  }, []);

  // Reload read status and claims when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadReadStatus();
      if (userNic) fetchClaims(userNic);
    });
    return unsubscribe;
  }, [navigation, userNic, fetchClaims]);

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

  const formatDateString = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const formatNumberPlate = (plate?: string): string => {
    if (!plate) return "";
    const cleaned = plate.trim();
    if (cleaned.includes("-")) return cleaned.toUpperCase();
    const lastNumbersMatch = cleaned.match(/^(.*[A-Za-z]+)(\d+)$/);
    if (lastNumbersMatch) {
      return `${lastNumbersMatch[1].trim().toUpperCase()}-${lastNumbersMatch[2]}`;
    }
    return cleaned.toUpperCase();
  };

  const getUserRequestedDocs = (claim: any): string[] => {
    const getRecipientForDoc = (name: string) => {
      const msg = [...(claim.messages || [])]
        .reverse()
        .find((m: any) => m.message.includes(`Requested: ${name}`));
      if (msg) {
        if (msg.message.includes("[Document Request to Agent]")) return "Agent";
        if (msg.message.includes("[Document Request to User]")) return "User";
      }
      return claim.documentRequestTo || "User";
    };
    return (claim.requestedDocuments || []).filter((name: string) => getRecipientForDoc(name) === "User");
  };

  const renderClaimProgress = (status: string, dbStep?: number) => {
    let currentStep = dbStep || 1;
    if (!dbStep) {
      const s = status.toLowerCase();
      if (s.includes("pending") || s.includes("progress")) currentStep = 3;
      else if (s.includes("review")) currentStep = 4;
      else if (s.includes("approved") || s.includes("done")) currentStep = 6;
    }

    const isRejected = status.toLowerCase() === "rejected";

    const steps = [
      { num: "01", label: "Submitted" },
      { num: "02", label: "Assigned" },
      { num: "03", label: "Inspection" },
      { num: "04", label: "Review" },
      { num: "05", label: "Decision" },
      { num: "06", label: "Payment" }
    ];

    return (
      <View style={styles.wizardContainer}>
        <View style={styles.wizardBgLine} />
        <View
          style={[
            styles.wizardProgressLine,
            isRejected && { backgroundColor: "#ef4444" },
            { width: `${((currentStep - 1) / 5) * 82}%` }
          ]}
        />
        <View style={styles.wizardStepsRow}>
          {steps.map((step, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentStep;
            const isActive = stepNum === currentStep;

            let circleStyle: any = styles.stepCircleInactive;
            let textStyle: any = styles.stepTextInactive;

            if (isCompleted) {
              circleStyle = isRejected ? { borderColor: "#ef4444" } : styles.stepCircleCompleted;
              textStyle = isRejected ? { color: "#ef4444" } : styles.stepTextCompleted;
            } else if (isActive) {
              circleStyle = isRejected ? { borderColor: "#ef4444", backgroundColor: "#fef2f2" } : styles.stepCircleActive;
              textStyle = isRejected ? { color: "#ef4444", fontWeight: "800" } : styles.stepTextActive;
            }

            return (
              <View key={step.num} style={styles.stepItem}>
                <View style={[styles.stepCircle, circleStyle]}>
                  <Text style={styles.stepNumber}>{step.num}</Text>
                </View>
                <Text style={[styles.stepLabel, textStyle]}>{step.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (userNic) fetchClaims(userNic);
  }, [userNic, fetchClaims]);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout", style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("logged_in_user");
          router.replace("/login/page");
        },
      },
    ]);
  };

  const showSupportAlert = () => {
    showCustomAlert(
      "Sanasa Support 📞",
      "We are available 24/7 to assist you.\n\nHotline: +94 112 003 000\nEmail: claims@sanasainsurance.lk\nAddress: No: 172, Elvitigala Mv, Colombo 8",
      "info"
    );
  };

  const openNotifications = () => {
    Animated.sequence([
      Animated.timing(bellScale, { toValue: 0.8, duration: 70, useNativeDriver: true }),
      Animated.timing(bellScale, { toValue: 1.15, duration: 90, useNativeDriver: true }),
      Animated.timing(bellScale, { toValue: 1,   duration: 70, useNativeDriver: true }),
    ]).start(() => router.push("/Policy Holder/Notifications" as any));
  };

  const handleQuickAction = (route: string) => {
    if (route === "support") { showSupportAlert(); return; }
    router.push(route as any);
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Verifying credentials...</Text>
      </View>
    );
  }

  const hasAlerts  = inProgress > 0 || hasDocRequest;
  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" colors={["#0ea5e9"]} />
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ── HERO HEADER ── */}
        <Animated.View style={{ transform: [{ translateY: headerSlideAnim }] }}>
          <ImageBackground
            source={require("../../assets/images/policy1.jpg")}
            style={styles.heroBackground}
            imageStyle={styles.heroImageStyle}
          >
            <LinearGradient
              colors={["rgba(15,23,42,0.96)", "rgba(15,23,42,0.82)", "rgba(15,23,42,0.6)"]}
              style={styles.heroGradient}
            >
              {/* Top bar */}
              <View style={styles.topBar}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.welcomeLabel}>Welcome back,</Text>
                  <Text style={styles.welcomeName}>{userName} 👋</Text>
                </View>

                {/* Bell → opens Notifications page */}
                <Animated.View style={{ transform: [{ scale: bellScale }], marginRight: 10 }}>
                  <TouchableOpacity
                    style={[styles.headerIconBtn, unreadCount > 0 && styles.headerIconBtnAlert]}
                    onPress={openNotifications}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={unreadCount > 0 ? "notifications" : "notifications-outline"}
                      size={22}
                      color={unreadCount > 0 ? "#fbbf24" : "#ffffff"}
                    />
                    {unreadCount > 0 && (
                      <View style={styles.notifBadge}>
                        <Text style={styles.notifBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>

                {/* Avatar / logout */}
                <TouchableOpacity style={styles.avatarButton} onPress={handleLogout} activeOpacity={0.85}>
                  <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
                </TouchableOpacity>
              </View>

              {/* Status banner */}
              <View style={styles.subtitleBanner}>
                <View style={[styles.dotIndicator, hasAlerts && { backgroundColor: "#fb923c" }]} />
                <Text style={styles.subtitleText} numberOfLines={2}>
                  {hasAlerts ? (
                    <>
                      {"Policy active. "}
                      {inProgress > 0 && (
                        <Text style={styles.highlightTextOrange}>
                          {inProgress} pending claim{inProgress > 1 ? "s" : ""}
                        </Text>
                      )}
                      {inProgress > 0 && hasDocRequest && " · "}
                      {hasDocRequest && (
                        <Text style={styles.highlightTextOrange}>documents awaiting action</Text>
                      )}
                      {"."}
                    </>
                  ) : (
                    "Your policy is active and up to date. No pending actions."
                  )}
                </Text>
              </View>

              {/* Callout */}
              <Animated.View style={[styles.compensationCallout, { transform: [{ scale: heroPulse }] }]}>
                <Text style={styles.calloutTitle}>
                  An accident claim with Sanasa General Insurance Company Limited is a request for compensation after an accident.
                </Text>
              </Animated.View>

              {/* Action buttons */}
              <View style={styles.neonButtonsContainer}>
                <TouchableOpacity
                  style={[styles.neonButton, styles.neonButtonRed]}
                  onPress={() => router.push("/Policy Holder/New_Claim")}
                  activeOpacity={0.9}
                >
                  <Ionicons name="add" size={20} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.neonButtonText}>New Claim</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.neonButton, styles.neonButtonCyan]}
                  onPress={() => router.push("/Policy Holder/TrackClaims")}
                  activeOpacity={0.9}
                >
                  <Ionicons name="search" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.neonButtonText}>Track Claim</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </ImageBackground>
        </Animated.View>

        {/* ── STAT CARDS ── */}
        <View style={styles.statsCardRow}>
          <TouchableOpacity style={styles.statItem} activeOpacity={0.7} onPress={() => router.push("/Policy Holder/My_claims")}>
            <View style={[styles.statIconWrap, { backgroundColor: "#fff7ed" }]}>
              <Ionicons name="stats-chart" size={20} color="#f97316" />
            </View>
            <Text style={styles.statNumber}>{totalClaims}</Text>
            <Text style={styles.statLabel}>Total Claims</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.statItem} activeOpacity={0.7} onPress={() => router.push("/Policy Holder/My_claims")}>
            <View style={[styles.statIconWrap, { backgroundColor: "#ecfeff" }]}>
              <Ionicons name="time" size={20} color="#06b6d4" />
            </View>
            <Text style={styles.statNumber}>{inProgress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.statItem} activeOpacity={0.7} onPress={() => router.push("/Policy Holder/My_claims")}>
            <View style={[styles.statIconWrap, { backgroundColor: "#f0fdf4" }]}>
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
            </View>
            <Text style={styles.statNumber}>{approved}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </TouchableOpacity>
        </View>

        <Animated.View style={{ opacity: contentFadeAnim }}>

          {/* ── MY DOCUMENTS HIGHLIGHT ── */}
          <View style={{ paddingHorizontal: 16, marginTop: 22 }}>
            <TouchableOpacity
              style={styles.myDocsCard}
              onPress={() => router.push("/Policy Holder/MyDocs")}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={["#1e3a8a", "#2563eb"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.myDocsGradient}
              >
                <View style={styles.myDocsLeft}>
                  <View style={styles.myDocsIconWrap}>
                    <Ionicons name="folder-open" size={26} color="#ffffff" />
                  </View>
                  <View>
                    <Text style={styles.myDocsLabel}>My Documents</Text>
                    <Text style={styles.myDocsSub}>Policy files, NIC, License & more</Text>
                  </View>
                </View>
                <View style={styles.myDocsArrow}>
                  <Ionicons name="arrow-forward" size={16} color="#ffffff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ── NOTIFICATIONS & REMINDERS ── */}
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={openNotifications}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionTitle}>Notifications & Reminders</Text>
              <Ionicons name="chevron-forward" size={18} color="#64748b" />
            </TouchableOpacity>

            {notifications.length > 0 ? (
              <View style={styles.notificationList}>
                {notifications.slice(0, 3).map((n) => {
                  const isUrgent   = n.type === "urgent";
                  const isApproved = n.type === "approved";
                  const isRead     = readIds.includes(n.id);

                  let leftBorderColor = "#2563eb";
                  let iconBgColor     = "#eff6ff";
                  let iconColor       = "#2563eb";
                  let iconName: "time" | "alert-circle" | "checkmark-circle" = "time";

                  if (isUrgent) {
                    leftBorderColor = "#dc2626";
                    iconBgColor     = "#fef2f2";
                    iconColor       = "#dc2626";
                    iconName        = "alert-circle" as const;
                  } else if (isApproved) {
                    leftBorderColor = "#16a34a";
                    iconBgColor     = "#f0fdf4";
                    iconColor       = "#16a34a";
                    iconName        = "checkmark-circle" as const;
                  }

                  if (isRead) {
                    leftBorderColor = "#cbd5e1";
                  }

                  return (
                    <TouchableOpacity
                      key={n.id}
                      activeOpacity={0.9}
                      onPress={() => {
                        setSelectedClaim(n.claim);
                        markAsRead(n.id);
                      }}
                      style={[styles.notifCard, { borderLeftColor: leftBorderColor }]}
                    >
                      <View style={styles.notifCardBody}>
                        <View style={styles.notifHeader}>
                          <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
                            <Ionicons name={iconName} size={16} color={iconColor} />
                          </View>
                          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text style={[styles.notifTitle, isRead && { opacity: 0.65 }]}>{n.title}</Text>
                            {!isRead && (
                              <View style={styles.unreadDot} />
                            )}
                          </View>
                        </View>
                        <Text style={[styles.notifDesc, isRead && { opacity: 0.7 }]}>{n.description}</Text>
                        {n.subText && <Text style={styles.notifSubtext}>{n.subText}</Text>}
                      </View>

                      <View style={styles.notifCardFooter}>
                        <View style={styles.notifActions}>
                          {n.actions?.map((act, i) => (
                            <TouchableOpacity
                              key={i}
                              style={[
                                styles.notifBtn,
                                act.primary ? styles.notifBtnPrimary : styles.notifBtnSecondary,
                              ]}
                              onPress={() => {
                                markAsRead(n.id);
                                if (act.route.includes("TrackClaims")) {
                                  router.push({
                                    pathname: "/Policy Holder/TrackClaims",
                                    params: { id: n.claim.claimNumber }
                                  } as any);
                                } else {
                                  router.push(act.route as any);
                                }
                              }}
                            >
                              <Text
                                style={[
                                  styles.notifBtnText,
                                  act.primary ? styles.notifBtnTextPrimary : styles.notifBtnTextSecondary,
                                ]}
                              >
                                {act.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <Text style={styles.notifDate}>{n.date}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="notifications-off-outline" size={32} color="#cbd5e1" />
                <Text style={styles.emptyText}>No notifications or reminders at this time.</Text>
              </View>
            )}
          </View>

          {/* ── MY VEHICLES ── */}
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Vehicles</Text>
              <TouchableOpacity onPress={() => router.push("/Policy Holder/MyVehicles")}>
                <Ionicons name="chevron-forward" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {vehicles.length > 0 ? (
              <View style={styles.vehiclesList}>
                {vehicles.map((v, idx) => (
                  <View key={idx} style={styles.vehicleRow}>
                    <View style={styles.vehicleIconContainer}>
                      <MaterialCommunityIcons name={vehicleIcon(v.vehicleType) as any} size={24} color="#0284c7" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.vehiclePlate}>{formatPlate(v.numberPlate)}</Text>
                      <Text style={styles.vehicleDetails}>{[v.company, v.model, v.year].filter(Boolean).join(" · ")}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.vehicleViewBtn}
                      onPress={() => router.push("/Policy Holder/MyVehicles")}
                    >
                      <Text style={styles.vehicleViewBtnText}>View</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="car-outline" size={32} color="#cbd5e1" />
                <Text style={styles.emptyText}>No vehicles registered under this policy.</Text>
              </View>
            )}
          </View>
          {/* ── CONTACT SUPPORT ── */}
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Contact Support</Text>
            </View>
            <TouchableOpacity style={styles.supportCard} onPress={showSupportAlert} activeOpacity={0.8}>
              <View style={styles.supportContent}>
                <Ionicons name="headset-outline" size={24} color="#0f172a" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.supportLabel}>Support</Text>
                  <Text style={styles.supportSub}>Phone: +94 112 003 000{`\n`}Email: claims@sanasainsurance.lk</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── QUICK ACTIONS — bottom, clean minimal design ── */}
          <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>

            <View style={styles.quickGrid}>
              {QUICK_ACTIONS.map((action, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickItem}
                  onPress={() => handleQuickAction(action.route)}
                  activeOpacity={0.75}
                >
                  <View style={styles.quickIconBox}>
                    <Ionicons name={action.icon as any} size={24} color="#0f172a" />
                  </View>
                  <Text style={styles.quickLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </Animated.View>
      </ScrollView>

      {/* Floating support */}
      <TouchableOpacity style={styles.floatingSupport} onPress={showSupportAlert} activeOpacity={0.8}>
        <Ionicons name="chatbubble-ellipses" size={26} color="#ffffff" />
      </TouchableOpacity>

      <PolicyHolderNavbar />

      {/* Unified Custom Alert Overlay Modal */}
      {customAlert && (
        <Modal
          transparent
          animationType="fade"
          visible={!!customAlert}
          onRequestClose={() => setCustomAlert(null)}
        >
          <View style={styles.alertOverlay}>
            <View style={styles.alertCard}>
              <View style={[
                styles.alertIconCircle,
                customAlert.type === "success" && { backgroundColor: "rgba(74, 222, 128, 0.12)", borderColor: "rgba(74, 222, 128, 0.3)" },
                customAlert.type === "warning" && { backgroundColor: "rgba(239, 68, 68, 0.12)", borderColor: "rgba(239, 68, 68, 0.3)" },
              ]}>
                <Ionicons
                  name={
                    customAlert.type === "success"
                      ? "checkmark-circle-outline"
                      : customAlert.type === "warning"
                        ? "alert-circle-outline"
                        : "information-circle-outline"
                  }
                  size={38}
                  color={
                    customAlert.type === "success"
                      ? "#4ade80"
                      : customAlert.type === "warning"
                        ? "#f87171"
                        : "#ff9800"
                  }
                />
              </View>
              <Text style={styles.alertTitle}>{customAlert.title}</Text>

              {customAlert.title.includes("Support") ? (
                /* Interactive support list buttons inside modal */
                <View style={styles.supportAlertContainer}>
                  {/* Phone Item */}
                  <TouchableOpacity
                    style={styles.alertSupportItem}
                    onPress={() => {
                      setCustomAlert(null);
                      Linking.openURL("tel:+94112003000").catch(() => {});
                    }}
                  >
                    <Ionicons name="call" size={18} color="#0ea5e9" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.alertSupportLabel}>Call Hotline</Text>
                      <Text style={styles.alertSupportValue}>+94 112 003 000</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Email Item */}
                  <TouchableOpacity
                    style={styles.alertSupportItem}
                    onPress={() => {
                      setCustomAlert(null);
                      Linking.openURL("mailto:claims@sanasainsurance.lk").catch(() => {});
                    }}
                  >
                    <Ionicons name="mail" size={18} color="#0ea5e9" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.alertSupportLabel}>Email Support</Text>
                      <Text style={styles.alertSupportValue}>claims@sanasainsurance.lk</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Chat Item */}
                  <TouchableOpacity
                    style={styles.alertSupportItem}
                    onPress={() => {
                      setCustomAlert({
                        title: "Live Chat 💬",
                        message: "The live chat feature is currently being developed and will be available soon!",
                        type: "info",
                      });
                    }}
                  >
                    <Ionicons name="chatbubbles" size={18} color="#0ea5e9" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.alertSupportLabel}>Live Chat</Text>
                      <Text style={styles.alertSupportValue}>Coming Soon</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.alertMsg}>{customAlert.message}</Text>
              )}

              {customAlert.title.includes("Support") ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setCustomAlert(null)}
                  style={[styles.alertButton, { backgroundColor: "#475569", shadowColor: "#475569", marginTop: 8 }]}
                >
                  <Text style={styles.alertButtonText}>Close</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    const cb = customAlert.onClose;
                    setCustomAlert(null);
                    if (cb) cb();
                  }}
                  style={styles.alertButton}
                >
                  <Text style={styles.alertButtonText}>OK</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Claim Detail Modal */}
      <Modal
        visible={!!selectedClaim}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedClaim(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeaderTitleArea}>
              <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                Claim Details – {selectedClaim?.claimNumber}
              </Text>
              <TouchableOpacity onPress={() => setSelectedClaim(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedClaim ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
              >
                {/* Progress tracker wizard */}
                {renderClaimProgress(selectedClaim.status, selectedClaim.currentStep)}

                {/* Details Table */}
                <View style={styles.detailsCard}>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Vehicle Plate:</Text>
                    <Text style={styles.detailsVal}>{formatNumberPlate(selectedClaim.vehiclePlate)}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Damage Type:</Text>
                    <Text style={styles.detailsVal}>{selectedClaim.damageType}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Est. Amount:</Text>
                    <Text style={styles.detailsVal}>
                      {selectedClaim.amount
                        ? (typeof selectedClaim.amount === "string"
                          ? (selectedClaim.amount.startsWith("Rs.") ? "LKR " + selectedClaim.amount.substring(4) : selectedClaim.amount)
                          : "LKR " + Number(selectedClaim.amount).toLocaleString())
                        : "Pending"}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Incident Date:</Text>
                    <Text style={styles.detailsVal}>{formatDateString(selectedClaim.incidentDate)}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Officer Assigned:</Text>
                    <Text style={styles.detailsVal}>{selectedClaim.officer || "Agent Saman"}</Text>
                  </View>
                  <View style={styles.detailsRowNoBorder}>
                    <Text style={styles.detailsLabel}>Location:</Text>
                    <Text style={styles.detailsVal}>{selectedClaim.location || "N/A"}</Text>
                  </View>
                </View>

                {/* Incident Description */}
                {selectedClaim.description ? (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionHeader}>Incident Description</Text>
                    <Text style={styles.descriptionText}>"{selectedClaim.description}"</Text>
                  </View>
                ) : null}

                {/* Messages & Logs */}
                <View style={styles.messagesSection}>
                  <Text style={styles.messagesHeader}>Messages & Notifications</Text>
                  {(() => {
                    const filteredMessages = (selectedClaim.messages || []).filter((msg: any) => msg.recipient !== "Agent");
                    if (filteredMessages.length > 0) {
                      return (
                        <View style={styles.messagesList}>
                          {filteredMessages.map((msg: any, index: number) => (
                            <View key={index} style={styles.messageBox}>
                              <View style={styles.messageSubHeader}>
                                <Text style={styles.messageSender}>{msg.sender}</Text>
                                <Text style={styles.messageTime}>{formatDateString(msg.sentAt)}</Text>
                              </View>
                              <Text style={styles.messageBody}>{msg.message}</Text>
                            </View>
                          ))}
                        </View>
                      );
                    }
                    return <Text style={styles.noMessagesText}>No messages or notifications for this claim.</Text>;
                  })()}
                </View>

                {/* Warning Alert & Upload Docs Direct Link */}
                {selectedClaim.documentsRequested && getUserRequestedDocs(selectedClaim).length > 0 && (
                  <View style={styles.docRequestAlert}>
                    <View style={styles.docAlertTitleRow}>
                      <Ionicons name="warning" size={16} color="#dc2626" />
                      <Text style={styles.docAlertTitle}>Documents Requested</Text>
                    </View>
                    <Text style={styles.docAlertDesc}>
                      Please upload the following files via the Documents page:
                    </Text>
                    <View style={styles.docItems}>
                      {getUserRequestedDocs(selectedClaim).map((doc: string) => (
                        <View key={doc} style={styles.docDotItem}>
                          <View style={styles.bulletDot} />
                          <Text style={styles.docDotText}>{doc}</Text>
                        </View>
                      ))}
                    </View>
                    <TouchableOpacity
                      style={styles.uploadDocBtn}
                      onPress={() => {
                        setSelectedClaim(null);
                        router.push("/Policy Holder/MyDocs" as any);
                      }}
                    >
                      <Text style={styles.uploadDocBtnText}>Go to Documents</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            ) : null}

            {/* Modal Footer */}
            <View style={styles.modalFooterRow}>
              <TouchableOpacity
                style={styles.modalTrackBtn}
                onPress={() => {
                  const claimNum = selectedClaim?.claimNumber;
                  setSelectedClaim(null);
                  if (claimNum) {
                    router.push({
                      pathname: "/Policy Holder/TrackClaims",
                      params: { id: claimNum }
                    } as any);
                  }
                }}
              >
                <Text style={styles.modalTrackBtnText}>Track Claim</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalCloseFooterBtn}
                onPress={() => setSelectedClaim(null)}
              >
                <Text style={styles.modalCloseFooterBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc", gap: 12 },
  loadingText: { fontSize: 14, color: "#64748b", fontWeight: "600" },

  /* ── Hero ── */
  heroBackground: { width: "100%", minHeight: 390 },
  heroImageStyle: { borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  heroGradient: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 58 : 46,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    justifyContent: "space-between",
  },

  /* Top Bar */
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  welcomeLabel: { fontSize: 14, color: "#94a3b8", fontWeight: "600" },
  welcomeName: { fontSize: 24, color: "#ffffff", fontWeight: "800", marginTop: 2 },

  headerIconBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  headerIconBtnAlert: {
    borderColor: "rgba(251,191,36,0.5)",
    backgroundColor: "rgba(251,191,36,0.15)",
  },
  notifBadge: {
    position: "absolute", top: -4, right: -4,
    backgroundColor: "#dc2626",
    width: 18, height: 18, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "#0f172a",
  },
  notifBadgeText: { color: "#ffffff", fontSize: 9, fontWeight: "800" },

  avatarButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#ffffff", fontSize: 18, fontWeight: "800" },

  subtitleBanner: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    marginVertical: 10,
  },
  dotIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e", marginRight: 10 },
  subtitleText: { flex: 1, fontSize: 12, color: "#e2e8f0", fontWeight: "600", lineHeight: 18 },
  highlightTextOrange: { color: "#fb923c", fontWeight: "800" },

  compensationCallout: {
    backgroundColor: "rgba(15,23,42,0.45)",
    borderLeftWidth: 3, borderLeftColor: "#38bdf8",
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 8, marginVertical: 12,
  },
  calloutTitle: { fontSize: 12.5, color: "#cbd5e1", fontWeight: "700", lineHeight: 18, fontStyle: "italic" },

  neonButtonsContainer: { flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 8 },
  neonButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 12, paddingHorizontal: 22, borderRadius: 99, minWidth: 140,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  neonButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  neonButtonRed:  { backgroundColor: "#dc2626", shadowColor: "rgba(220,38,38,0.6)" },
  neonButtonCyan: { backgroundColor: "#0ea5e9", shadowColor: "rgba(14,165,233,0.6)" },

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

  /* My Docs highlight — navy/blue */
  myDocsCard: {
    borderRadius: 20, overflow: "hidden",
    shadowColor: "#1e3a8a",
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 5,
  },
  myDocsGradient: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingVertical: 18, paddingHorizontal: 20,
  },
  myDocsLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  myDocsIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  myDocsLabel: { fontSize: 16, fontWeight: "800", color: "#ffffff" },
  myDocsSub: { fontSize: 11.5, color: "rgba(255,255,255,0.75)", fontWeight: "600", marginTop: 2 },
  myDocsArrow: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },

  /* Sections */
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#0f172a", letterSpacing: -0.2 },

  /* Notification cards */
  notificationList: { gap: 14 },
  notifCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderLeftWidth: 6,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  notifCardBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  notifHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  notifTitle: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: 19,
  },
  notifDesc: {
    fontSize: 12.5,
    color: "#475569",
    fontWeight: "600",
    lineHeight: 18,
    paddingLeft: 42,
  },
  notifSubtext: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 4,
    fontStyle: "italic",
    paddingLeft: 42,
  },
  notifCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    backgroundColor: "#ffffff",
  },
  notifActions: {
    flexDirection: "row",
    gap: 8,
    paddingLeft: 42,
  },
  notifBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "transparent",
  },
  notifBtnPrimary: {
    backgroundColor: "#0d2a3a",
  },
  notifBtnSecondary: {
    backgroundColor: "transparent",
    borderColor: "#cbd5e1",
  },
  notifBtnText: {
    fontSize: 11,
    fontWeight: "800",
  },
  notifBtnTextPrimary: {
    color: "#ffffff",
  },
  notifBtnTextSecondary: {
    color: "#475569",
  },
  notifDate: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#3b82f6",
    alignSelf: "center",
  },

  /* Vehicles */
  vehiclesList: { gap: 10 },
  vehicleRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e2e8f0",
    borderRadius: 18, padding: 14,
    shadowColor: "#0f172a", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01, shadowRadius: 4, elevation: 1,
  },
  vehicleIconContainer: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: "#f0f9ff", alignItems: "center", justifyContent: "center", marginRight: 14,
  },
  vehiclePlate: { fontSize: 14.5, fontWeight: "800", color: "#0f172a", letterSpacing: 0.3 },
  vehicleDetails: { fontSize: 11.5, color: "#64748b", fontWeight: "600", marginTop: 2 },
  vehicleViewBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 99, borderWidth: 1.5, borderColor: "#cbd5e1" },
  vehicleViewBtnText: { fontSize: 11.5, color: "#475569", fontWeight: "800" },

  /* Quick Actions — minimal clean grid */
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  quickItem: {
    width: (SCREEN_W - 32 - 24) / 3,
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    gap: 8,
  },
  quickIconBox: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: "#f1f5f9",
    alignItems: "center", justifyContent: "center",
  },
  quickLabel: { fontSize: 11.5, fontWeight: "700", color: "#334155", textAlign: "center" },

  /* Empty */
  emptyCard: {
    backgroundColor: "#ffffff", borderRadius: 20, borderWidth: 1, borderColor: "#e2e8f0",
    paddingVertical: 32, alignItems: "center", justifyContent: "center", gap: 10,
    shadowColor: "#0f172a", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.01, shadowRadius: 6, elevation: 1,
  },
  emptyText: { fontSize: 12.5, color: "#64748b", fontWeight: "700" },

  /* Floating support */
  floatingSupport: {
    /* existing floating support styles */
    position: "absolute",
    bottom: 96,
    right: 18,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#0ea5e9",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 99,
  },
  supportCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  supportContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  supportLabel: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  supportSub: { fontSize: 12, color: "#64748b", marginTop: 2 },

  /* Unified Alert Styles */
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  alertCard: {
    width: "85%",
    maxWidth: 340,
    backgroundColor: "#ffffff",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 24,
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  alertIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(14, 165, 233, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(14, 165, 233, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  },
  alertMsg: {
    fontSize: 13.5,
    color: "#475569",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  alertButton: {
    backgroundColor: "#0d2a3a",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 32,
    shadowColor: "#0d2a3a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  alertButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  supportAlertContainer: {
    width: "100%",
    gap: 12,
    marginBottom: 16,
  },
  alertSupportItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 12,
    width: "100%",
  },
  alertSupportLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0f172a",
  },
  alertSupportValue: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
    fontWeight: "500",
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "85%",
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeaderTitleArea: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    flex: 1,
    marginRight: 10,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Wizard progress tracker */
  wizardContainer: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderRadius: 20,
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
    position: "relative",
  },
  wizardBgLine: {
    position: "absolute",
    top: 30,
    left: 28,
    right: 28,
    height: 3,
    backgroundColor: "#e2e8f0",
  },
  wizardProgressLine: {
    position: "absolute",
    top: 30,
    left: 28,
    height: 3,
    backgroundColor: "#00b050",
  },
  wizardStepsRow: { flexDirection: "row", justifyContent: "space-between" },
  stepItem: { flex: 1, alignItems: "center" },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  stepCircleInactive: { borderColor: "#cbd5e1" },
  stepCircleCompleted: { borderColor: "#00b050" },
  stepCircleActive: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  stepNumber: { fontSize: 10.5, fontWeight: "800", color: "#64748b" },
  stepLabel: { fontSize: 9.5, fontWeight: "700", marginTop: 6 },
  stepTextInactive: { color: "#94a3b8" },
  stepTextCompleted: { color: "#475569" },
  stepTextActive: { color: "#2563eb", fontWeight: "800" },

  /* Details Table Card */
  detailsCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  detailsRowNoBorder: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  detailsLabel: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  detailsVal: { fontSize: 13, color: "#0f172a", fontWeight: "800", maxWidth: "65%", textAlign: "right" },

  /* Description Card */
  descriptionContainer: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  descriptionHeader: { fontSize: 11, color: "#64748b", fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 6 },
  descriptionText: { fontSize: 13, color: "#475569", fontWeight: "600", fontStyle: "italic", lineHeight: 18 },

  /* Requested Docs alert */
  docRequestAlert: {
    backgroundColor: "rgba(254, 242, 242, 0.8)",
    borderWidth: 1.5,
    borderColor: "#fecaca",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  docAlertTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  docAlertTitle: { fontSize: 13.5, fontWeight: "800", color: "#991b1b" },
  docAlertDesc: { fontSize: 12.5, color: "#b91c1c", fontWeight: "600", lineHeight: 17, marginBottom: 10 },
  docItems: { gap: 6, marginBottom: 12 },
  docDotItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  bulletDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#dc2626" },
  docDotText: { fontSize: 12, color: "#b91c1c", fontWeight: "800" },
  uploadDocBtn: {
    backgroundColor: "#dc2626",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadDocBtnText: { fontSize: 12, color: "#ffffff", fontWeight: "800" },

  /* Messages updates list */
  messagesSection: { marginBottom: 20 },
  messagesHeader: { fontSize: 11, color: "#64748b", fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 10 },
  messagesList: { gap: 8 },
  messageBox: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 12,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  messageSubHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  messageSender: { fontSize: 11.5, fontWeight: "800", color: "#0f172a" },
  messageTime: { fontSize: 10, color: "#94a3b8", fontWeight: "600" },
  messageBody: { fontSize: 12, color: "#475569", fontWeight: "600", lineHeight: 17 },
  noMessagesText: { fontSize: 12, color: "#94a3b8", fontWeight: "600", fontStyle: "italic" },

  /* Modal Bottom Action Row */
  modalFooterRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  modalTrackBtn: {
    flex: 1,
    backgroundColor: "#0d2a3a",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTrackBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
  modalCloseFooterBtn: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseFooterBtnText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "800",
  },
});
