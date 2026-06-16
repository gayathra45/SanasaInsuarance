import React, { useState, useEffect, useCallback } from "react";
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
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
}

function formatPlate(plate: string) {
  if (!plate) return "";
  const cleaned = plate.trim();
  if (cleaned.includes("-")) return cleaned;
  const m = cleaned.match(/^(.*[A-Za-z]+)(\d+)$/);
  if (m) return `${m[1].trim().toUpperCase()}-${m[2]}`;
  return cleaned;
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
  const t = (type || "").toLowerCase();
  if (t.includes("bike") || t.includes("motorcycle") || t.includes("scooter")) return "motorbike";
  if (t.includes("van") || t.includes("minibus")) return "van-utility";
  if (t.includes("bus")) return "bus";
  if (t.includes("truck") || t.includes("lorry")) return "truck";
  if (t.includes("suv")) return "car-estate";
  if (t.includes("tuk") || t.includes("three")) return "rickshaw";
  return "car-side";
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function PolicyHolderDashboard() {
  const [userName, setUserName] = useState("");
  const [userNic, setUserNic] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [totalClaims, setTotalClaims] = useState(0);
  const [inProgress, setInProgress] = useState(0);
  const [approved, setApproved] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasDocRequest, setHasDocRequest] = useState(false);

  useEffect(() => {
    (async () => {
      const userStr = await AsyncStorage.getItem("logged_in_user");
      if (!userStr) { router.replace("/login/page"); return; }
      try {
        const user = JSON.parse(userStr);
        setUserName(user.firstName || "");
        setUserNic(user.nic || "");
        if (user.vehicles && Array.isArray(user.vehicles)) setVehicles(user.vehicles);
        if (user.nic) fetchClaims(user.nic);
      } catch { router.replace("/login/page"); }
    })();
  }, []);

  const fetchClaims = useCallback(async (nic: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/policy-holder/user-claims?nic=${encodeURIComponent(nic)}`);
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
      const pending = all.filter((c) => !["approved","done","rejected"].some((v) => (c.status||"Pending").toLowerCase().includes(v)));
      const approvedList = all.filter((c) => ["approved","done","active"].some((v) => (c.status||"").toLowerCase().includes(v)));
      const docReq = all.some((c) => c.documentsRequested === true);
      const notifs: Notification[] = [];
      all.forEach((claim) => {
        if (claim.documentsRequested) {
          notifs.push({ id: claim.claimNumber+"-doc", type: "urgent", title: "Documents Required", description: `Please upload documents for claim ${claim.claimNumber} within 3 days.`, subText: "Tap to upload", date: formatDate(claim.createdAt), isUrgent: true });
        }
        const s = (claim.status || "").toLowerCase();
        if (["approved","done","active"].some((v) => s.includes(v))) {
          notifs.push({ id: claim.claimNumber+"-approved", type: "approved", title: "Claim Approved", description: `Claim ${claim.claimNumber} — LKR ${claim.amount ? Number(claim.amount).toLocaleString() : "—"} approved.`, date: formatDate(claim.createdAt), isUrgent: false });
        } else if (!claim.documentsRequested) {
          notifs.push({ id: claim.claimNumber+"-status", type: "status", title: "Claim Under Review", description: `${claim.claimNumber} is being reviewed by our team.`, date: formatDate(claim.createdAt), isUrgent: false });
        }
      });
      notifs.sort((a, b) => (a.isUrgent === b.isUrgent ? 0 : a.isUrgent ? -1 : 1));
      setTotalClaims(all.length);
      setInProgress(pending.length);
      setApproved(approvedList.length);
      setHasDocRequest(docReq);
      setNotifications(notifs);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); if (userNic) fetchClaims(userNic); }, [userNic, fetchClaims]);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => { await AsyncStorage.removeItem("logged_in_user"); router.replace("/login/page"); } },
    ]);
  };

  const notifStyle: Record<string, { dot: string; icon: any }> = {
    urgent:   { dot: "#ef4444", icon: "alert-circle-outline" },
    approved: { dot: "#22c55e", icon: "checkmark-circle-outline" },
    status:   { dot: "#3b82f6", icon: "time-outline" },
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
        <ActivityIndicator size="large" color="#0d9488" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0d9488" colors={["#0d9488"]} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{userName} 👋</Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn} onPress={handleLogout}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* ── STATS ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderTopColor: "#f97316" }]}>
            <Text style={[styles.statNum, { color: "#f97316" }]}>{totalClaims}</Text>
            <Text style={styles.statLbl}>Total</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: "#3b82f6" }]}>
            <Text style={[styles.statNum, { color: "#3b82f6" }]}>{inProgress}</Text>
            <Text style={styles.statLbl}>In Progress</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: "#22c55e" }]}>
            <Text style={[styles.statNum, { color: "#22c55e" }]}>{approved}</Text>
            <Text style={styles.statLbl}>Approved</Text>
          </View>
        </View>

        {/* ── QUICK ACTIONS ── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/Policy Holder/New_Claim")}>
            <View style={[styles.actionIcon, { backgroundColor: "#fff7ed" }]}>
              <Ionicons name="add" size={22} color="#f97316" />
            </View>
            <Text style={styles.actionLbl}>New Claim</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/Policy Holder/My_claims")}>
            <View style={[styles.actionIcon, { backgroundColor: "#eff6ff" }]}>
              <Ionicons name="document-text-outline" size={22} color="#3b82f6" />
            </View>
            <Text style={styles.actionLbl}>My Claims</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/Policy Holder/TrackClaims")}>
            <View style={[styles.actionIcon, { backgroundColor: "#f0fdf4" }]}>
              <Ionicons name="search-outline" size={22} color="#22c55e" />
            </View>
            <Text style={styles.actionLbl}>Track</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert("Support", "Hotline: +94 112 003 000")}>
            <View style={[styles.actionIcon, { backgroundColor: "#fdf4ff" }]}>
              <Ionicons name="headset-outline" size={22} color="#a855f7" />
            </View>
            <Text style={styles.actionLbl}>Support</Text>
          </TouchableOpacity>
        </View>

        {/* ── NOTIFICATIONS ── */}
        {notifications.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Notifications</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notifications.length}</Text>
              </View>
            </View>
            <View style={styles.cardList}>
              {notifications.map((n) => {
                const cfg = notifStyle[n.type];
                return (
                  <TouchableOpacity key={n.id} style={styles.listItem} activeOpacity={0.7}>
                    <View style={[styles.dot, { backgroundColor: cfg.dot }]} />
                    <Ionicons name={cfg.icon} size={20} color={cfg.dot} style={{ marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{n.title}</Text>
                      <Text style={styles.itemSub} numberOfLines={2}>{n.description}</Text>
                      <Text style={styles.itemDate}>{n.date}</Text>
                    </View>
                    {n.isUrgent && (
                      <View style={styles.urgentTag}>
                        <Text style={styles.urgentTagText}>Action</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* ── VEHICLES ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>My Vehicles</Text>
        </View>
        <View style={styles.cardList}>
          {vehicles.length === 0 ? (
            <View style={styles.emptyItem}>
              <Ionicons name="car-outline" size={28} color="#d1d5db" />
              <Text style={styles.emptyText}>No vehicles registered</Text>
            </View>
          ) : (
            vehicles.map((v, idx) => (
              <View key={idx} style={styles.listItem}>
                <View style={styles.vehicleIconBox}>
                  <MaterialCommunityIcons name={vehicleIcon(v.vehicleType) as any} size={22} color="#0d9488" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.plateText}>{formatPlate(v.numberPlate).toUpperCase()}</Text>
                  <Text style={styles.itemSub}>{[v.company, v.model, v.year].filter(Boolean).join(" · ")}</Text>
                </View>
                <View style={styles.typePill}>
                  <Text style={styles.typePillText}>{(v.vehicleType || "Car")}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ── EMPTY NOTIFICATIONS ── */}
        {notifications.length === 0 && (
          <View style={[styles.cardList, { marginTop: 16 }]}>
            <View style={styles.emptyItem}>
              <Ionicons name="checkmark-circle-outline" size={28} color="#d1d5db" />
              <Text style={styles.emptyText}>All caught up!</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <PolicyHolderNavbar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f9fafb" },

  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f9fafb", gap: 12 },
  loadingText: { fontSize: 14, color: "#9ca3af", fontWeight: "500" },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 60 : 48,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#f9fafb",
  },
  greeting: { fontSize: 13, color: "#9ca3af", fontWeight: "500", marginBottom: 3 },
  userName: { fontSize: 24, color: "#111827", fontWeight: "800" },
  avatarBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#0d9488",
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 17, fontWeight: "800" },

  /* Stats */
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    borderTopWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statNum: { fontSize: 28, fontWeight: "900" },
  statLbl: { fontSize: 11, color: "#9ca3af", fontWeight: "600", marginTop: 2 },

  /* Quick Actions */
  actionsRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 28 },
  actionBtn: { alignItems: "center", gap: 8 },
  actionIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  actionLbl: { fontSize: 11.5, color: "#374151", fontWeight: "600" },

  /* Section */
  sectionRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  badge: { backgroundColor: "#0d9488", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  /* Card list */
  cardList: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 24,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12, flexShrink: 0 },
  itemTitle: { fontSize: 13.5, color: "#111827", fontWeight: "700", marginBottom: 2 },
  itemSub: { fontSize: 12, color: "#6b7280", fontWeight: "400", lineHeight: 17 },
  itemDate: { fontSize: 10.5, color: "#9ca3af", marginTop: 4, fontWeight: "500" },
  urgentTag: { backgroundColor: "#fef2f2", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: "#fecaca" },
  urgentTagText: { fontSize: 10.5, color: "#ef4444", fontWeight: "700" },

  /* Vehicle */
  vehicleIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#f0fdfa", alignItems: "center", justifyContent: "center", marginRight: 12 },
  plateText: { fontSize: 14, fontWeight: "800", color: "#111827", letterSpacing: 0.5 },
  typePill: { backgroundColor: "#f3f4f6", borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  typePillText: { fontSize: 10.5, color: "#6b7280", fontWeight: "600" },

  /* Empty */
  emptyItem: { alignItems: "center", paddingVertical: 28, gap: 8 },
  emptyText: { fontSize: 13, color: "#9ca3af", fontWeight: "500" },
});
