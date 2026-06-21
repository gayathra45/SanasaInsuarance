import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Dimensions,
  StatusBar,
  Platform,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import AgentNavbar from "../../Components/Agent/page";
import { API_BASE_URL } from "../../config";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface Claim {
  _id: string;
  claimNumber: string;
  userNic: string;
  vehiclePlate: string;
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
}

export default function AgentActivityPage() {
  const [agentName, setAgentName] = useState("");
  const [agentEmail, setAgentEmail] = useState("");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  const fetchClaims = useCallback(async (email: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/agent/claims?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error("Failed to fetch claims");
      const data = await res.json();
      if (Array.isArray(data)) setClaims(data);
    } catch (e) {
      console.error("Fetch claims activity error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const agentStr = await AsyncStorage.getItem("logged_in_agent");
      if (!agentStr) {
        router.replace("/login/page");
        return;
      }
      try {
        const agent = JSON.parse(agentStr);
        setAgentName(agent.name || "Agent");
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
    if (agentEmail) fetchClaims(agentEmail);
  }, [agentEmail, fetchClaims]);

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

  function formatDate(dateStr?: string) {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  }

  // Filter for completed activities
  const completedClaims = claims
    .filter(c => c.status === "Approved" || c.status === "Rejected")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredClaims = completedClaims.filter(
    (claim) =>
      claim.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.damageType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusDetails = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("pending") || s.includes("progress")) {
      return { text: "Pending", color: "#f97316", bg: "#fff7ed", border: "#ffedd5" };
    }
    if (s.includes("review")) {
      return { text: "Review", color: "#2563eb", bg: "#eff6ff", border: "#dbeafe" };
    }
    if (s.includes("approved") || s.includes("active") || s.includes("done")) {
      return { text: "Approved", color: "#16a34a", bg: "#f0fdf4", border: "#dcfce7" };
    }
    if (s.includes("rejected")) {
      return { text: "Rejected", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" };
    }
    return { text: status, color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" };
  };

  const renderClaimProgress = (status: string, dbStep?: number) => {
    let currentStep = dbStep || 1;
    if (!dbStep) {
      const s = status.toLowerCase();
      if (s.includes("pending") || s.includes("progress")) currentStep = 3;
      else if (s.includes("review")) currentStep = 4;
      else if (s.includes("approved") || s.includes("done")) currentStep = 6;
      else if (s.includes("rejected")) currentStep = 5;
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
        {/* Grey background connection line */}
        <View style={styles.wizardBgLine} />
        {/* Green/Red progress connection line */}
        <View
          style={[
            styles.wizardProgressLine,
            isRejected && { backgroundColor: "#ef4444" },
            { width: `${((currentStep - 1) / 5) * 100}%` }
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
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={14} color={isRejected ? "#ef4444" : "#00b050"} />
                  ) : (
                    <Text style={[styles.stepNumber, isActive && { color: isRejected ? "#ef4444" : "#2563eb" }]}>{step.num}</Text>
                  )}
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
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Curved Background Header */}
      <ImageBackground
        source={require("../../../assets/images/myclaim.png")}
        style={styles.headerBackground}
        imageStyle={styles.headerImageStyle}
      >
        <LinearGradient
          colors={["rgba(15, 23, 42, 0.95)", "rgba(30, 41, 59, 0.88)", "rgba(15, 23, 42, 0.5)"]}
          style={styles.headerGradient}
        >
          {/* Back button */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>

          <View style={{ marginTop: 4 }}>
            <Text style={styles.headerTitle}>All Activities</Text>
            <Text style={styles.headerSubtitle}>Complete history of claim decisions & reports</Text>
          </View>
        </LinearGradient>
      </ImageBackground>

      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
        <TextInput
          placeholder="Search activities..."
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

      {/* Claims List */}
      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#1e3a8a" />
          <Text style={styles.loaderText}>Loading activity history...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1e3a8a" colors={["#1e3a8a"]} />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {filteredClaims.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="archive-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No completed activities found.</Text>
            </View>
          ) : (
            filteredClaims.map((claim) => {
              const statusCfg = getStatusDetails(claim.status);
              return (
                <View key={claim._id} style={styles.claimCard}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.claimIdText}>{claim.claimNumber}</Text>
                      <Text style={styles.claimVehicle}>{formatNumberPlate(claim.vehiclePlate)}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusCfg.bg, borderColor: statusCfg.border }
                      ]}
                    >
                      <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.text}</Text>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.cardBody}>
                    <View style={styles.bodyRow}>
                      <Ionicons name="calendar-outline" size={16} color="#64748b" />
                      <Text style={styles.bodyVal}>{formatDate(claim.createdAt)}</Text>
                    </View>
                    <View style={styles.bodyRow}>
                      <Ionicons name="construct-outline" size={16} color="#64748b" />
                      <Text style={styles.bodyVal}>{claim.damageType}</Text>
                    </View>
                    <View style={styles.bodyRow}>
                      <Ionicons name="cash-outline" size={16} color="#64748b" />
                      <Text style={styles.bodyVal}>{claim.amount ? `LKR ${Number(claim.amount).toLocaleString()}` : "Pending"}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.viewDetailsBtn}
                    onPress={() => setSelectedClaim(claim)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.viewDetailsBtnText}>View Details & Info</Text>
                    <Ionicons name="arrow-forward" size={15} color="#0284c7" />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Claim Detail Modal Popup */}
      <Modal
        visible={selectedClaim !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedClaim(null)}
      >
        {selectedClaim && (() => {
          const isApproved = selectedClaim.status === "Approved";
          const statusColor = isApproved ? "#16a34a" : "#dc2626";
          const statusCfg = getStatusDetails(selectedClaim.status);

          return (
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { height: SCREEN_H * 0.8 }]}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Activity Details</Text>
                    <Text style={styles.modalSubtitle}>{selectedClaim.claimNumber}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedClaim(null)}
                    style={styles.closeModalBtn}
                  >
                    <Ionicons name="close" size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                  {/* Visual Tracker Wizard */}
                  {renderClaimProgress(selectedClaim.status, selectedClaim.currentStep)}

                  {/* Details Card */}
                  <View style={styles.detailsCard}>
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Vehicle Plate</Text>
                      <Text style={styles.detailsVal}>{formatNumberPlate(selectedClaim.vehiclePlate)}</Text>
                    </View>
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Damage Type</Text>
                      <Text style={styles.detailsVal}>{selectedClaim.damageType}</Text>
                    </View>
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Incident Date</Text>
                      <Text style={styles.detailsVal}>{formatDate(selectedClaim.createdAt)}</Text>
                    </View>
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Assessment Amount</Text>
                      <Text style={[styles.detailsVal, { color: statusColor, fontWeight: "800" }]}>
                        {selectedClaim.amount ? `LKR ${Number(selectedClaim.amount).toLocaleString()}` : "—"}
                      </Text>
                    </View>
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>User NIC</Text>
                      <Text style={styles.detailsVal}>{selectedClaim.userNic}</Text>
                    </View>
                    <View style={styles.detailsRowNoBorder}>
                      <Text style={styles.detailsLabel}>Incident Location</Text>
                      <Text style={styles.detailsVal} numberOfLines={2}>{selectedClaim.location}</Text>
                    </View>
                  </View>

                  {/* Incident Description */}
                  {selectedClaim.description && (
                    <View style={styles.descriptionContainer}>
                      <Text style={styles.descriptionHeader}>Incident Description</Text>
                      <Text style={styles.descriptionText}>"{selectedClaim.description}"</Text>
                    </View>
                  )}

                  {/* Inspection Report */}
                  {selectedClaim.inspectionReport && (
                    <View style={styles.descriptionContainer}>
                      <Text style={styles.descriptionHeader}>Inspection Report</Text>
                      <Text style={styles.descriptionText}>{selectedClaim.inspectionReport}</Text>
                    </View>
                  )}
                </ScrollView>

                {/* Close Button */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.closeFooterBtn}
                    onPress={() => setSelectedClaim(null)}
                  >
                    <Text style={styles.closeFooterBtnText}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })()}
      </Modal>

      <AgentNavbar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 110 },
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { fontSize: 13, color: "#64748b", fontWeight: "600", marginTop: 10 },

  /* curved header */
  headerBackground: { width: "100%", height: 180 },
  headerImageStyle: { borderBottomRightRadius: 40 },
  headerGradient: {
    flex: 1,
    borderBottomRightRadius: 40,
    paddingTop: Platform.OS === "ios" ? 48 : 36,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  headerTitle: { fontSize: 26, color: "#ffffff", fontWeight: "800", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 11.5, color: "#e2e8f0", fontWeight: "600", marginTop: 2 },

  /* Search Bar */
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginTop: -22,
    marginBottom: 16,
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    zIndex: 10,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: "#0f172a", fontSize: 14, fontWeight: "600" },

  /* claims card layout matching policy holder styling */
  claimCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    marginBottom: 14,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  claimIdText: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  claimVehicle: { fontSize: 12, color: "#64748b", fontWeight: "700", marginTop: 2 },
  statusBadge: {
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    minWidth: 80,
    alignItems: "center",
  },
  statusText: { fontSize: 11, fontWeight: "800" },
  cardDivider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 12 },
  cardBody: { gap: 8 },
  bodyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  bodyVal: { fontSize: 13, color: "#475569", fontWeight: "600" },
  viewDetailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 14,
  },
  viewDetailsBtnText: { fontSize: 12, color: "#0284c7", fontWeight: "800" },

  emptyCard: { backgroundColor: "#ffffff", borderRadius: 22, borderWidth: 1, borderColor: "#e2e8f0", paddingVertical: 40, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 13, color: "#64748b", fontWeight: "700" },

  /* modal popup styling */
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  modalSubtitle: { fontSize: 12, color: "#64748b", fontWeight: "700", marginTop: 2 },
  closeModalBtn: { padding: 4 },
  modalScrollBody: { paddingHorizontal: 20, paddingTop: 16 },

  /* wizard style matching Policy Holder tracker design */
  wizardContainer: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderRadius: 20,
    paddingTop: 18,
    paddingBottom: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
    position: "relative",
    width: "100%",
  },
  wizardBgLine: {
    position: "absolute",
    top: 32,
    left: 28,
    right: 28,
    height: 3,
    backgroundColor: "#e2e8f0",
  },
  wizardProgressLine: {
    position: "absolute",
    top: 32,
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

  /* table style details layout */
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
  detailsVal: { fontSize: 13, color: "#0f172a", fontWeight: "800", maxWidth: SCREEN_W * 0.5, textAlign: "right" },

  descriptionContainer: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  descriptionHeader: { fontSize: 11, color: "#64748b", fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 6 },
  descriptionText: { fontSize: 13, color: "#475569", fontWeight: "600", fontStyle: "italic", lineHeight: 18 },

  modalFooter: { borderTopWidth: 1, borderColor: "#f1f5f9", paddingHorizontal: 20, paddingTop: 14 },
  closeFooterBtn: {
    backgroundColor: "#1e3a8a",
    borderRadius: 99,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  closeFooterBtnText: { fontSize: 14, color: "#ffffff", fontWeight: "800" },
});
