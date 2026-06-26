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
  TextInput,
  Modal,
  Dimensions,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";

const { width: SCREEN_W } = Dimensions.get("window");

interface ClaimMessage {
  sender: string;
  message: string;
  sentAt: string;
  recipient?: string;
}

interface Claim {
  claimNumber: string;
  vehiclePlate: string;
  incidentDate: string;
  damageType: string;
  status: string;
  amount?: number | string | null;
  createdAt?: string;
  updatedAt?: string;
  documentsRequested?: boolean;
  requestedDocuments?: string[];
  currentStep?: number;
  description?: string;
  location?: string;
  officer?: string;
  documentRequestTo?: string;
  messages?: ClaimMessage[];
}

interface Notification {
  id: string;
  type: "urgent" | "approved" | "status";
  title: string;
  description: string;
  subText?: string;
  date: string;
  isUrgent: boolean;
  route: string;
  actionLabel: string;
  createdAt?: string;
  claim: Claim;
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

function formatDateString(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifs, setFilteredNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read" | "urgent" | "approved" | "status">("all");
  const [readIds, setReadIds] = useState<string[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  const getUserRequestedDocs = (claim: Claim): string[] => {
    const getRecipientForDoc = (name: string) => {
      const msg = [...(claim.messages || [])]
        .reverse()
        .find(m => m.message.includes(`Requested: ${name}`));
      if (msg) {
        if (msg.message.includes("[Document Request to Agent]")) return "Agent";
        if (msg.message.includes("[Document Request to User]")) return "User";
      }
      return claim.documentRequestTo || "User";
    };
    return (claim.requestedDocuments || []).filter(name => getRecipientForDoc(name) === "User");
  };

  const fetchNotifications = useCallback(async (nic: string) => {
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

      const notifs: Notification[] = [];
      all.forEach((claim) => {
        const dateFormatted = formatDate(claim.createdAt || claim.updatedAt);

        // 1. Documents Requested
        if (claim.documentsRequested) {
          notifs.push({
            id: claim.claimNumber + "-doc",
            type: "urgent",
            title: "Documents Requested – Action Required",
            description: `Staff has requested a ${
              claim.requestedDocuments && claim.requestedDocuments.length > 0
                ? claim.requestedDocuments.join(" & ")
                : "Police Report / Repair Estimate"
            } for claim ${claim.claimNumber}.`,
            subText: "Please upload within 3 working days to avoid settlement delays.",
            date: dateFormatted,
            isUrgent: true,
            createdAt: claim.createdAt,
            route: "/Policy Holder/MyDocs",
            actionLabel: "Upload Documents",
            claim: claim
          });
        }

        // 2. Claim Approved/Active/Settled
        const s = (claim.status || "").toLowerCase();
        if (s.includes("approved") || s.includes("done") || s.includes("settled")) {
          notifs.push({
            id: claim.claimNumber + "-approved",
            type: "approved",
            title: `Claim ${claim.claimNumber} Approved!`,
            description: `Your insurance claim for vehicle ${claim.vehiclePlate} has been approved. The settlement amount will be credited to your registered bank account.`,
            date: dateFormatted,
            isUrgent: false,
            createdAt: claim.createdAt,
            route: "/Policy Holder/My_claims",
            actionLabel: "View",
            claim: claim
          });
        } else if (!claim.documentsRequested) {
          // 3. Claim In-progress status updates
          notifs.push({
            id: claim.claimNumber + "-status",
            type: "status",
            title: `Claim ${claim.claimNumber} Status: ${claim.status || "Pending"}`,
            description: `Your claim is currently in "${claim.status || "Pending"}" status. Click below to view the detailed progress tracker.`,
            date: dateFormatted,
            isUrgent: false,
            createdAt: claim.createdAt,
            route: "/Policy Holder/TrackClaims",
            actionLabel: "View",
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

      setNotifications(notifs);
      setFilteredNotifs(notifs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadNotificationsData = useCallback(async () => {
    // Load user
    const userStr = await AsyncStorage.getItem("logged_in_user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.nic) {
          await fetchNotifications(user.nic);
        } else {
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }

    // Load read status from AsyncStorage
    const savedReadIds = await AsyncStorage.getItem("read_notification_ids");
    if (savedReadIds) {
      try {
        setReadIds(JSON.parse(savedReadIds));
      } catch {}
    }
  }, [fetchNotifications]);

  // 1. Load User Session and local read IDs on mount
  useEffect(() => {
    loadNotificationsData();
  }, [loadNotificationsData]);

  // Reload when screen is focused (navigated back to)
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadNotificationsData();
    });
    return unsubscribe;
  }, [navigation, loadNotificationsData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotificationsData();
    setRefreshing(false);
  }, [loadNotificationsData]);

  // 3. Read/Unread Handler Actions
  const toggleReadStatus = async (id: string) => {
    let updatedReadIds = [...readIds];
    if (readIds.includes(id)) {
      updatedReadIds = updatedReadIds.filter((item) => item !== id);
    } else {
      updatedReadIds.push(id);
    }
    setReadIds(updatedReadIds);
    await AsyncStorage.setItem("read_notification_ids", JSON.stringify(updatedReadIds));
  };

  const markAsRead = async (id: string) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      await AsyncStorage.setItem("read_notification_ids", JSON.stringify(updated));
    }
  };

  const markAllAsRead = async () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    await AsyncStorage.setItem("read_notification_ids", JSON.stringify(allIds));
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

  // 4. Tab and Query Filtering
  useEffect(() => {
    let result = notifications;

    if (activeTab === "unread") {
      result = notifications.filter((n) => !readIds.includes(n.id));
    } else if (activeTab === "read") {
      result = notifications.filter((n) => readIds.includes(n.id));
    } else if (activeTab === "urgent") {
      result = notifications.filter((n) => n.type === "urgent");
    } else if (activeTab === "approved") {
      result = notifications.filter((n) => n.type === "approved");
    } else if (activeTab === "status") {
      result = notifications.filter((n) => n.type === "status");
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q) ||
          (n.subText && n.subText.toLowerCase().includes(q))
      );
    }

    setFilteredNotifs(result);
  }, [activeTab, searchQuery, notifications, readIds]);

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

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSub}>
            {notifications.length > 0
              ? `${notifications.filter(n => !readIds.includes(n.id)).length} unread updates`
              : "All caught up"}
          </Text>
        </View>
        {notifications.some(n => !readIds.includes(n.id)) && (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={markAllAsRead}
            activeOpacity={0.7}
          >
            <Text style={styles.markAllText}>Mark Read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Controls: Search Bar */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={18} color="#94a3b8" style={{ marginLeft: 4 }} />
        <TextInput
          placeholder="Search notifications..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={{ backgroundColor: "#ffffff" }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          <TouchableOpacity
            onPress={() => setActiveTab("all")}
            style={[styles.tabButton, activeTab === "all" && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, activeTab === "all" && styles.tabTextActive]}>
              All ({notifications.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("unread")}
            style={[styles.tabButton, activeTab === "unread" && styles.tabButtonActiveUnread]}
          >
            <Text style={[styles.tabText, activeTab === "unread" && styles.tabTextActiveUnread]}>
              Unread ({notifications.filter(n => !readIds.includes(n.id)).length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("read")}
            style={[styles.tabButton, activeTab === "read" && styles.tabButtonActiveRead]}
          >
            <Text style={[styles.tabText, activeTab === "read" && styles.tabTextActiveRead]}>
              Read ({notifications.filter(n => readIds.includes(n.id)).length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("urgent")}
            style={[styles.tabButton, activeTab === "urgent" && styles.tabButtonActiveUrgent]}
          >
            <Text style={[styles.tabText, activeTab === "urgent" && styles.tabTextActiveUrgent]}>
              Urgent ({notifications.filter(n => n.type === "urgent").length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("approved")}
            style={[styles.tabButton, activeTab === "approved" && styles.tabButtonActiveApproved]}
          >
            <Text style={[styles.tabText, activeTab === "approved" && styles.tabTextActiveApproved]}>
              Approved ({notifications.filter(n => n.type === "approved").length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("status")}
            style={[styles.tabButton, activeTab === "status" && styles.tabButtonActiveStatus]}
          >
            <Text style={[styles.tabText, activeTab === "status" && styles.tabTextActiveStatus]}>
              Status Updates ({notifications.filter(n => n.type === "status").length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0ea5e9"]} />
          }
        >
          {filteredNotifs.length > 0 ? (
            <View style={{ gap: 14 }}>
               {filteredNotifs.map((n) => {
                 const isUrgent = n.type === "urgent";
                 const isApproved = n.type === "approved";
                 const isRead = readIds.includes(n.id);

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
                         <TouchableOpacity
                           style={[
                             styles.notifBtn,
                             isUrgent ? styles.notifBtnUrgent : isApproved ? styles.notifBtnApproved : styles.notifBtnPrimary,
                           ]}
                           onPress={() => {
                             markAsRead(n.id);
                             if (n.actionLabel === "View") {
                               setSelectedClaim(n.claim);
                             } else {
                               if (n.route.includes("TrackClaims")) {
                                 router.push({
                                   pathname: "/Policy Holder/TrackClaims",
                                   params: { id: n.claim.claimNumber }
                                 } as any);
                               } else {
                                 router.push(n.route as any);
                               }
                             }
                           }}
                         >
                           <Text style={styles.notifBtnTextPrimary}>
                             {n.actionLabel}
                           </Text>
                         </TouchableOpacity>
                         
                         <TouchableOpacity
                           style={styles.notifBtnSecondary}
                           onPress={() => toggleReadStatus(n.id)}
                         >
                           <Text style={styles.notifBtnTextSecondary}>
                             {isRead ? "Mark Unread" : "Mark Read"}
                           </Text>
                         </TouchableOpacity>
                       </View>
                       <Text style={styles.notifDate}>{n.date}</Text>
                     </View>
                   </TouchableOpacity>
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
                No notifications match the active filter.
              </Text>
            </View>
          )}
        </ScrollView>
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
                          {filteredMessages.map((msg, index) => (
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
                      {getUserRequestedDocs(selectedClaim).map((doc) => (
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
  
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: "#f1f5f9",
  },
  markAllText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
  },

  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 99,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    gap: 8,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: "#0f172a",
    fontWeight: "600",
    padding: 0,
  },

  tabsScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 8,
  },
  tabButton: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  tabButtonActive: {
    backgroundColor: "#0d2a3a",
    borderColor: "#0d2a3a",
  },
  tabButtonActiveUnread: {
    backgroundColor: "#0ea5e9",
    borderColor: "#0ea5e9",
  },
  tabButtonActiveUrgent: {
    backgroundColor: "#dc2626",
    borderColor: "#dc2626",
  },
  tabButtonActiveApproved: {
    backgroundColor: "#16a34a",
    borderColor: "#16a34a",
  },
  tabButtonActiveStatus: {
    backgroundColor: "#eab308",
    borderColor: "#eab308",
  },
  tabButtonActiveRead: {
    backgroundColor: "#64748b",
    borderColor: "#64748b",
  },
  tabText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#64748b",
  },
  tabTextActive: { color: "#ffffff" },
  tabTextActiveUnread: { color: "#ffffff" },
  tabTextActiveUrgent: { color: "#ffffff" },
  tabTextActiveApproved: { color: "#ffffff" },
  tabTextActiveStatus: { color: "#ffffff" },
  tabTextActiveRead: { color: "#ffffff" },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, color: "#64748b", fontWeight: "600" },

  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#3b82f6",
    alignSelf: "center",
  },

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
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: 18,
    flex: 1,
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
    alignItems: "center",
    justifyContent: "center",
  },
  notifBtnPrimary: {
    backgroundColor: "#0d2a3a",
  },
  notifBtnUrgent: {
    backgroundColor: "#dc2626",
  },
  notifBtnApproved: {
    backgroundColor: "#16a34a",
  },
  notifBtnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 99,
  },
  notifBtnTextPrimary: {
    fontSize: 11,
    fontWeight: "800",
    color: "#ffffff",
  },
  notifBtnTextSecondary: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "800",
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
  detailsVal: { fontSize: 13, color: "#0f172a", fontWeight: "800", maxWidth: "60%", textAlign: "right" },

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
