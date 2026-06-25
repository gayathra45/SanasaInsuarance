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
  Alert,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import PolicyHolderNavbar from "../Components/policy holder/page";
import { API_BASE_URL } from "../config";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface Claim {
  claimNumber: string;
  vehiclePlate: string;
  incidentDate: string;
  incidentTime?: string;
  damageType: string;
  amount: string | number;
  status: string;
  description?: string;
  location?: string;
  officer?: string;
  documentsRequested?: boolean;
  requestedDocuments?: string[];
  currentStep?: number;
  messages?: { sender: string; message: string; sentAt: string }[];
}

export default function MyClaims() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userNic, setUserNic] = useState("");

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

  const formatDateString = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch (e) {
      return dateStr;
    }
  };

  const fetchClaims = useCallback(async (nic: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/policy-holder/user-claims?nic=${encodeURIComponent(nic)}&_=${Date.now()}`);
      let databaseClaims: Claim[] = [];
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.claims)) {
          databaseClaims = data.claims.map((claim: any) => ({
            claimNumber: claim.claimNumber,
            vehiclePlate: claim.vehiclePlate,
            incidentDate: formatDateString(claim.incidentDate),
            incidentTime: claim.incidentTime,
            damageType: claim.damageType,
            amount: claim.amount ? `Rs. ${Number(claim.amount).toLocaleString()}` : "Pending",
            status: claim.status || "Pending",
            description: claim.description,
            location: claim.location,
            officer: claim.officer || "Not Assigned",
            documentsRequested: claim.documentsRequested || false,
            requestedDocuments: claim.requestedDocuments || [],
            currentStep: claim.currentStep || 1,
            messages: claim.messages || []
          }));
        }
      }

      // Check local drafts
      const lastStr = await AsyncStorage.getItem("last_submitted_claim");
      let localClaims: Claim[] = [];
      if (lastStr) {
        const parsed = JSON.parse(lastStr);
        const exists = databaseClaims.some((c) => c.claimNumber === parsed.claimNumber);
        if (!exists) {
          localClaims.push({
            claimNumber: parsed.claimNumber,
            vehiclePlate: parsed.vehiclePlate,
            incidentDate: formatDateString(parsed.incidentDate),
            incidentTime: parsed.incidentTime,
            damageType: parsed.damageType,
            amount: "Pending",
            status: "Pending",
            description: parsed.description,
            location: parsed.location,
            officer: "Not Assigned",
            documentsRequested: false,
            requestedDocuments: [],
            currentStep: 1,
            messages: []
          });
        }
      }

      setClaims([...localClaims, ...databaseClaims]);
    } catch (err) {
      console.error("Error fetching claims in app:", err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const userStr = await AsyncStorage.getItem("logged_in_user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.nic) {
            setUserNic(user.nic);
            fetchClaims(user.nic);
          }
        } catch (e) {
          console.error(e);
        }
      }
    })();
  }, [fetchClaims]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (userNic) fetchClaims(userNic);
  }, [userNic, fetchClaims]);

  const filteredClaims = claims.filter(
    (claim) =>
      claim.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.damageType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.status.toLowerCase().includes(searchQuery.toLowerCase())
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
    return { text: status, color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" };
  };

  const renderClaimProgress = (status: string, dbStep?: number) => {
    let currentStep = dbStep || 1;
    if (!dbStep) {
      const s = status.toLowerCase();
      if (s.includes("pending") || s.includes("progress")) currentStep = 3;
      else if (s.includes("review")) currentStep = 4;
      else if (s.includes("approved") || s.includes("done")) currentStep = 6;
    }

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
        {/* Green progress connection line */}
        <View
          style={[
            styles.wizardProgressLine,
            { width: `${((currentStep - 1) / 5) * 100}%` }
          ]}
        />

        <View style={styles.wizardStepsRow}>
          {steps.map((step, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentStep;
            const isActive = stepNum === currentStep;

            let circleStyle = styles.stepCircleInactive;
            let textStyle = styles.stepTextInactive;

            if (isCompleted) {
              circleStyle = styles.stepCircleCompleted;
              textStyle = styles.stepTextCompleted;
            } else if (isActive) {
              circleStyle = styles.stepCircleActive;
              textStyle = styles.stepTextActive;
            }

            return (
              <View key={step.num} style={styles.stepItem}>
                <View style={[styles.stepCircle, circleStyle]}>
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={14} color="#00b050" />
                  ) : (
                    <Text style={[styles.stepNumber, isActive && { color: "#2563eb" }]}>{step.num}</Text>
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

      {/* Styled curved header matching the dashboard */}
      <ImageBackground
        source={require("../../assets/images/myclaim.png")}
        style={styles.headerBackground}
        imageStyle={styles.headerImageStyle}
      >
        <LinearGradient
          colors={["rgba(13, 42, 58, 0.95)", "rgba(13, 42, 58, 0.82)", "rgba(15, 23, 42, 0.5)"]}
          style={styles.headerGradient}
        >
          <Text style={styles.headerTitle}>My Claims</Text>
          <Text style={styles.headerSubtitle}>All your insurance claims in one place</Text>
        </LinearGradient>
      </ImageBackground>

      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
        <TextInput
          placeholder="Search claims..."
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
      {isLoading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={styles.loaderText}>Loading your claims...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0284c7" colors={["#0284c7"]} />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {filteredClaims.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No claims found matching filters.</Text>
            </View>
          ) : (
            filteredClaims.map((claim) => {
              const statusCfg = getStatusDetails(claim.status);
              return (
                <View key={claim.claimNumber} style={styles.claimCard}>
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
                      <Text style={styles.bodyVal}>{claim.incidentDate}</Text>
                    </View>
                    <View style={styles.bodyRow}>
                      <Ionicons name="construct-outline" size={16} color="#64748b" />
                      <Text style={styles.bodyVal}>{claim.damageType}</Text>
                    </View>
                    <View style={styles.bodyRow}>
                      <Ionicons name="cash-outline" size={16} color="#64748b" />
                      <Text style={styles.bodyVal}>{claim.amount}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.viewDetailsBtn}
                    onPress={() => setSelectedClaim(claim)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.viewDetailsBtnText}>View Timeline & Info</Text>
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
        {selectedClaim && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Claim Details</Text>
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

                {/* Details Table Card */}
                <View style={styles.detailsCard}>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Vehicle Plate</Text>
                    <Text style={styles.detailsVal}>{formatNumberPlate(selectedClaim.vehiclePlate)}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Incident Type</Text>
                    <Text style={styles.detailsVal}>{selectedClaim.damageType}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Incident Date</Text>
                    <Text style={styles.detailsVal}>{selectedClaim.incidentDate}</Text>
                  </View>
                  {selectedClaim.incidentTime && (
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Incident Time</Text>
                      <Text style={styles.detailsVal}>{selectedClaim.incidentTime}</Text>
                    </View>
                  )}
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Est. Compensation</Text>
                    <Text style={[styles.detailsVal, { color: "#16a34a", fontWeight: "800" }]}>{selectedClaim.amount}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Assigned Agent</Text>
                    <Text style={styles.detailsVal}>{selectedClaim.officer || "Not Assigned"}</Text>
                  </View>
                  {selectedClaim.location && (
                    <View style={styles.detailsRowNoBorder}>
                      <Text style={styles.detailsLabel}>Incident Location</Text>
                      <Text style={styles.detailsVal} numberOfLines={2}>{selectedClaim.location}</Text>
                    </View>
                  )}
                </View>

                {/* Incident Description */}
                {selectedClaim.description && (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionHeader}>Incident Description</Text>
                    <Text style={styles.descriptionText}>&quot;{selectedClaim.description}&quot;</Text>
                  </View>
                )}

                {/* Documents Requested Warning Alert Box */}
                {selectedClaim.documentsRequested && (
                  <View style={styles.docRequestAlert}>
                    <View style={styles.docAlertTitleRow}>
                      <Ionicons name="alert-circle" size={18} color="#dc2626" />
                      <Text style={styles.docAlertTitle}>Additional Documents Required</Text>
                    </View>
                    <Text style={styles.docAlertDesc}>
                      Staff has requested the following files to process your payout. Please submit them to your agent:
                    </Text>
                    <View style={styles.docItems}>
                      {(selectedClaim.requestedDocuments && selectedClaim.requestedDocuments.length > 0
                        ? selectedClaim.requestedDocuments
                        : ["Police Report", "Repair Estimate"]
                      ).map((doc, i) => (
                        <View key={i} style={styles.docDotItem}>
                          <View style={styles.bulletDot} />
                          <Text style={styles.docDotText}>{doc}</Text>
                        </View>
                      ))}
                    </View>
                    <TouchableOpacity
                      style={styles.uploadDocBtn}
                      onPress={() => {
                        setSelectedClaim(null);
                        Alert.alert("Document Upload", "Please contact your assigned agent Saman at +94 112 003 000 or email documents to claims-support@sanasa.lk to submit your requested files.");
                      }}
                    >
                      <Text style={styles.uploadDocBtnText}>Contact Support to Upload</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Messages & Logs */}
                <View style={styles.messagesSection}>
                  <Text style={styles.messagesHeader}>Messages & Updates</Text>
                  {selectedClaim.messages && selectedClaim.messages.length > 0 ? (
                    <View style={styles.messagesList}>
                      {selectedClaim.messages.map((msg, i) => (
                        <View key={i} style={styles.messageBox}>
                          <View style={styles.messageSubHeader}>
                            <Text style={styles.messageSender}>{msg.sender}</Text>
                            <Text style={styles.messageTime}>{formatDateString(msg.sentAt)}</Text>
                          </View>
                          <Text style={styles.messageBody}>{msg.message}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.noMessagesText}>No notifications or messages have been sent for this claim.</Text>
                  )}
                </View>
              </ScrollView>

              {/* Close Button */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.closeFooterBtn}
                  onPress={() => setSelectedClaim(null)}
                >
                  <Text style={styles.closeFooterBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>

      <PolicyHolderNavbar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 110 },
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { fontSize: 13, color: "#64748b", fontWeight: "600", marginTop: 10 },

  /* Curved Background Header */
  headerBackground: { width: "100%", height: 190 },
  headerImageStyle: { borderBottomRightRadius: 50 },
  headerGradient: {
    flex: 1,
    borderBottomRightRadius: 50,
    paddingTop: Platform.OS === "ios" ? 54 : 42,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  headerTitle: { fontSize: 28, color: "#ffffff", fontWeight: "800", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 12, color: "#e2e8f0", fontWeight: "600", marginTop: 4 },

  /* Search Input */
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

  /* Claims Cards */
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

  /* Empty / Error Placeholders */
  emptyCard: { backgroundColor: "#ffffff", borderRadius: 22, borderWidth: 1, borderColor: "#e2e8f0", paddingVertical: 40, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 13, color: "#64748b", fontWeight: "700" },

  /* MODAL STYLE */
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    maxHeight: SCREEN_H * 0.86,
    minHeight: SCREEN_H * 0.75,
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

  /* Wizard progress tracker inside Modal */
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

  /* Details Card */
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

  /* Description Card */
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

  /* Doc request Alert Box */
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
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 12,
  },
  messageSubHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  messageSender: { fontSize: 11.5, fontWeight: "800", color: "#0f172a" },
  messageTime: { fontSize: 10, color: "#94a3b8", fontWeight: "600" },
  messageBody: { fontSize: 12, color: "#475569", fontWeight: "600", lineHeight: 17 },
  noMessagesText: { fontSize: 12, color: "#94a3b8", fontWeight: "600", fontStyle: "italic" },

  /* Modal footer close button */
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
