import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";

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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const userStr = await AsyncStorage.getItem("logged_in_user");
      if (!userStr) return;
      try {
        const user = JSON.parse(userStr);
        if (user.nic) await fetchNotifications(user.nic);
      } catch {}
    })();
  }, []);

  const fetchNotifications = useCallback(async (nic: string) => {
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
            subText: "Please upload within 3 days to avoid delays.",
            date: formatDate(claim.createdAt),
            isUrgent: true,
            createdAt: claim.createdAt,
            actions: [
              { label: "Upload", route: "/Policy Holder/MyDocs", primary: true },
              { label: "View", route: "/Policy Holder/MyDocs" },
            ],
          });
        }
        const s = (claim.status || "").toLowerCase();
        if (["approved", "done", "active"].some((v) => s.includes(v))) {
          notifs.push({
            id: claim.claimNumber + "-approved",
            type: "approved",
            title: `Claim ${claim.claimNumber} Approved!`,
            description: `Your claim for LKR ${
              claim.amount ? Number(claim.amount).toLocaleString() : "85,000"
            } has been approved. Payment will be processed within 5 working days.`,
            date: formatDate(claim.createdAt),
            isUrgent: false,
            createdAt: claim.createdAt,
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
            createdAt: claim.createdAt,
            actions: [{ label: "Track", route: "/Policy Holder/TrackClaims" }],
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
      setNotifications(notifs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSub}>
            {notifications.length > 0
              ? `${notifications.length} notification${notifications.length > 1 ? "s" : ""}`
              : "All caught up"}
          </Text>
        </View>
        {notifications.filter((n) => n.isUrgent).length > 0 && (
          <View style={styles.urgentBadge}>
            <Ionicons name="alert-circle" size={14} color="#dc2626" />
            <Text style={styles.urgentBadgeText}>
              {notifications.filter((n) => n.isUrgent).length} Urgent
            </Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 }}
        >
          {notifications.length > 0 ? (
            <View style={{ gap: 14 }}>
               {notifications.map((n) => {
                 const isUrgent = n.type === "urgent";
                 const isApproved = n.type === "approved";
 
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
 
                 return (
                   <View key={n.id} style={[styles.notifCard, { borderLeftColor: leftBorderColor }]}>
                     <View style={styles.notifCardBody}>
                       <View style={styles.notifHeader}>
                         <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
                           <Ionicons name={iconName} size={16} color={iconColor} />
                         </View>
                         <View style={{ flex: 1 }}>
                           <Text style={styles.notifTitle}>{n.title}</Text>
                         </View>
                       </View>
                       <Text style={styles.notifDesc}>{n.description}</Text>
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
                             onPress={() => router.push(act.route as any)}
                           >
                             <Text
                               style={[
                                 styles.notifBtnText,
                                 act.primary
                                   ? styles.notifBtnTextPrimary
                                   : styles.notifBtnTextSecondary,
                               ]}
                             >
                               {act.label}
                             </Text>
                           </TouchableOpacity>
                         ))}
                       </View>
                       <Text style={styles.notifDate}>{n.date}</Text>
                     </View>
                   </View>
                 );
               })}
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="notifications-off-outline" size={38} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptyDesc}>
                You're all caught up! Check back later for updates on your claims and policy.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 56 : 44,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    gap: 12,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  headerSub: { fontSize: 12, color: "#64748b", fontWeight: "600", marginTop: 1 },
  urgentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  urgentBadgeText: { fontSize: 11.5, fontWeight: "800", color: "#dc2626" },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, color: "#64748b", fontWeight: "600" },

  /* Notification cards */
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

  /* Empty state */
  emptyWrap: { flex: 1, alignItems: "center", paddingTop: 80, gap: 14 },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  emptyDesc: { fontSize: 13, color: "#64748b", fontWeight: "600", textAlign: "center", lineHeight: 20, paddingHorizontal: 32 },
});
