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
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
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



export default function PolicyHolderDashboard() {
  const [userName, setUserName]       = useState("");
  const [userNic, setUserNic]         = useState("");
  const [vehicles, setVehicles]       = useState<Vehicle[]>([]);
  const [totalClaims, setTotalClaims] = useState(0);
  const [inProgress, setInProgress]   = useState(0);
  const [approved, setApproved]       = useState(0);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [hasDocRequest, setHasDocRequest] = useState(false);
  const contentFadeAnim  = useRef(new Animated.Value(0)).current;
  const headerSlideAnim  = useRef(new Animated.Value(-20)).current;
  const heroPulse        = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
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
            date: formatDate(claim.createdAt),
            isUrgent: true,
            actions: [
              { label: "Upload", route: "/Policy Holder/My_claims", primary: true },
              { label: "View",   route: "/Policy Holder/My_claims" },
            ],
          });
        }
        const s = (claim.status || "").toLowerCase();
        if (["approved","done","active"].some((v) => s.includes(v))) {
          notifs.push({
            id: claim.claimNumber + "-approved",
            type: "approved",
            title: `Claim ${claim.claimNumber} Approved!`,
            description: `Your claim for LKR ${claim.amount ? Number(claim.amount).toLocaleString() : "85,000"} has been approved. Payment processed within 5 days.`,
            date: formatDate(claim.createdAt),
            isUrgent: false,
            actions: [{ label: "View", route: "/Policy Holder/My_claims" }],
          });
        } else if (!claim.documentsRequested) {
          notifs.push({
            id: claim.claimNumber + "-status",
            type: "status",
            title: `Claim ${claim.claimNumber} Status: ${claim.status || "Pending"}`,
            description: `Your claim is currently in ${claim.status || "Pending"} stage. Agent is reviewing details.`,
            date: formatDate(claim.createdAt),
            isUrgent: false,
            actions: [{ label: "View", route: "/Policy Holder/My_claims" }],
          });
        }
      });

      setTotalClaims(all.length);
      setInProgress(pending.length);
      setApproved(approvedList.length);
      setHasDocRequest(docReq);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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

          {/* ── MY VEHICLES ── */}
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Vehicles</Text>
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

        </Animated.View>
      </ScrollView>

      <PolicyHolderNavbar />
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

  /* Notification cards — previous design */
  notificationList: { gap: 14 },
  notifCard: {
    borderRadius: 20, padding: 16, borderWidth: 1.5,
    shadowColor: "#0f172a", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02, shadowRadius: 8, elevation: 1,
  },
  notifHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  notifTitle: { flex: 1, fontSize: 14, fontWeight: "800" },
  notifDesc: { fontSize: 13, color: "#475569", fontWeight: "600", lineHeight: 19 },
  notifSubtext: { fontSize: 11, color: "#64748b", fontWeight: "600", marginTop: 4 },
  notifFooter: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.04)",
  },
  notifActions: { flexDirection: "row", gap: 8 },
  notifBtn: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 99 },
  notifBtnPrimary:  { backgroundColor: "#dc2626" },
  notifBtnSecondary: { backgroundColor: "#334155" },
  notifBtnText: { fontSize: 11.5, fontWeight: "800" },
  notifBtnTextPrimary:  { color: "#ffffff" },
  notifBtnTextSecondary: { color: "#ffffff" },
  notifDate: { fontSize: 11, color: "#94a3b8", fontWeight: "600" },
  notifRed:   { borderColor: "#fecaca" },
  bgRed:      { backgroundColor: "rgba(254,242,242,0.7)" },
  notifGreen: { borderColor: "#bbf7d0" },
  bgGreen:    { backgroundColor: "rgba(240,253,244,0.7)" },
  notifBlue:  { borderColor: "#bfdbfe" },
  bgBlue:     { backgroundColor: "rgba(239,246,255,0.7)" },

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



});
