import React, { useState, useEffect, useCallback, useRef } from "react";
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
  KeyboardAvoidingView,
  Linking,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import AgentNavbar from "../../Components/Agent/page";
import { API_BASE_URL } from "../../config";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

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

export default function AgentClaimsPage() {
  const [agentName, setAgentName] = useState("");
  const [agentEmail, setAgentEmail] = useState("");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"active" | "activity">("active");

  // Modal details & edits
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [assessmentAmount, setAssessmentAmount] = useState("");
  const [savingAssessment, setSavingAssessment] = useState(false);
  const [inspectionReportText, setInspectionReportText] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isAcceptingClaim, setIsAcceptingClaim] = useState(false);

  // Document upload state inside modal
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

  const fetchClaims = useCallback(async (email: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/agent/claims?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error("Failed to fetch claims");
      const data = await res.json();
      if (Array.isArray(data)) {
        setClaims(data);
        const activeCount = data.filter(
          (c: Claim) => c.status !== "Approved" && c.status !== "Rejected"
        ).length;
        if (activeCount > 0) {
          setActiveSubTab("active");
        } else {
          setActiveSubTab("activity");
        }
      }
    } catch (e) {
      console.error("Fetch claims page error:", e);
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

  useEffect(() => {
    if (selectedClaim) {
      setAssessmentAmount(selectedClaim.amount ? String(selectedClaim.amount) : "");
      setInspectionReportText(selectedClaim.inspectionReport || "");
    }
  }, [selectedClaim]);

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

  const handleViewDocument = (url?: string | null) => {
    if (!url) {
      Alert.alert("Error", "No document URL available.");
      return;
    }
    let fullUrl = url;
    if (!url.startsWith("http") && !url.startsWith("data:")) {
      const cleanBase = API_BASE_URL.replace("/api", "");
      fullUrl = `${cleanBase}/uploads/${url}`;
    }
    Linking.openURL(fullUrl).catch(() => {
      Alert.alert("Error", "Failed to open document URL.");
    });
  };

  const handlePickAgentDoc = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Allow storage permissions to select images.");
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

  const handleAgentDocUploadPicker = async (docName: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Allow storage permissions to select images.");
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
        uploadAgentDocImmediate(docName, base64Data);
      }
    }
  };

  const uploadAgentDocImmediate = async (docName: string, base64Data: string) => {
    if (!selectedClaim) return;
    setIsAgentUploading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/policy-holder/update-claim/${selectedClaim.claimNumber}`, {
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
        Alert.alert("Success", `${docName} uploaded successfully!`);
        await fetchClaims(agentEmail);
        const listRes = await fetch(`${API_BASE_URL}/api/agent/claims?email=${encodeURIComponent(agentEmail)}`);
        if (listRes.ok) {
          const data = await listRes.json();
          const freshClaim = data.find((c: Claim) => c._id === selectedClaim._id);
          if (freshClaim) setSelectedClaim(freshClaim);
        }
      } else {
        const errData = await res.json();
        Alert.alert("Error", errData.error || "Failed to upload document.");
      }
    } catch (e) {
      Alert.alert("Error", "An error occurred during document upload.");
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
        Alert.alert("Success", "Document uploaded successfully!");
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
        Alert.alert("Error", errData.error || "Failed to upload document.");
      }
    } catch (e) {
      Alert.alert("Error", "An error occurred during document upload.");
    } finally {
      setIsAgentUploading(false);
    }
  };

  const handleApproveAssessment = async () => {
    if (!selectedClaim) return;
    const numAmount = parseFloat(assessmentAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert("Validation Error", "Please enter a valid LKR assessment amount.");
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
      Alert.alert("Success", "Claim approved and assessment saved!");
      setSelectedClaim(null);
      fetchClaims(agentEmail);
    } catch (e) {
      Alert.alert("Error", "Failed to update claim. Please try again.");
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
      Alert.alert("Success", "Claim accepted successfully! Proceed with vehicle inspection.");
      await fetchClaims(agentEmail);
      const listRes = await fetch(`${API_BASE_URL}/api/agent/claims?email=${encodeURIComponent(agentEmail)}`);
      if (listRes.ok) {
        const data = await listRes.json();
        const freshClaim = data.find((c: Claim) => c._id === selectedClaim._id);
        if (freshClaim) setSelectedClaim(freshClaim);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to accept claim assignment. Please try again.");
    } finally {
      setIsAcceptingClaim(false);
    }
  };

  const handleSubmitInspectionReport = async () => {
    if (!selectedClaim) return;
    if (!inspectionReportText.trim()) {
      Alert.alert("Validation Error", "Please enter inspection report details.");
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
      Alert.alert("Success", "Inspection report submitted successfully!");
      setSelectedClaim(null);
      fetchClaims(agentEmail);
      setInspectionReportText("");
    } catch (e) {
      Alert.alert("Error", "Failed to submit inspection report. Please try again.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Search Filter
  const activeClaims = claims.filter(
    (c) => c.status !== "Approved" && c.status !== "Rejected"
  );
  const completedClaims = claims.filter(
    (c) => c.status === "Approved" || c.status === "Rejected"
  );

  const currentTabClaims = activeSubTab === "active" ? activeClaims : completedClaims;

  const filteredClaims = currentTabClaims.filter(
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

      {/* Styled Curved Header */}
      <ImageBackground
        source={require("../../../assets/images/myclaim.png")}
        style={styles.headerBackground}
        imageStyle={styles.headerImageStyle}
      >
        <LinearGradient
          colors={["rgba(15, 23, 42, 0.95)", "rgba(30, 41, 59, 0.88)", "rgba(15, 23, 42, 0.5)"]}
          style={styles.headerGradient}
        >
          <Text style={styles.headerTitle}>Claims Directory</Text>
          <Text style={styles.headerSubtitle}>All assigned policyholder claim files and details</Text>
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

      {/* Tab Selector */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeSubTab === "active" && styles.tabBtnActive]}
          onPress={() => setActiveSubTab("active")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, activeSubTab === "active" && styles.tabBtnTextActive]}>
            Active Claims
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeSubTab === "activity" && styles.tabBtnActive]}
          onPress={() => setActiveSubTab("activity")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, activeSubTab === "activity" && styles.tabBtnTextActive]}>
            My Activity
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loaderText}>Loading claims database...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" colors={["#f97316"]} />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {filteredClaims.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons 
                name={activeSubTab === "active" ? "document-text-outline" : "archive-outline"} 
                size={48} 
                color="#cbd5e1" 
              />
              <Text style={styles.emptyText}>
                {searchQuery 
                  ? "No matching claims found." 
                  : activeSubTab === "active" 
                    ? "No active claims assigned." 
                    : "No claim activity history found."}
              </Text>
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
                      <Text style={styles.bodyVal}>
                        {claim.amount ? `LKR ${Number(claim.amount).toLocaleString()}` : "Pending Evaluation"}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.viewDetailsBtn}
                    onPress={() => setSelectedClaim(claim)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.viewDetailsBtnText}>View Details & Action</Text>
                    <Ionicons name="arrow-forward" size={15} color="#0284c7" />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Detailed Claim Modal Viewer */}
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
                  const statusCfg = getStatusDetails(selectedClaim.status);
                  const isActive = selectedClaim.status !== "Approved" && selectedClaim.status !== "Rejected";
                  return (
                    <>
                      {/* Visual Stepper */}
                      {renderClaimProgress(selectedClaim.status, selectedClaim.currentStep)}

                      {/* Info Table */}
                      <View style={styles.modalInfoGrid}>
                        {[
                          { label: "User NIC",      value: selectedClaim.userNic },
                          { label: "Vehicle Plate",  value: formatNumberPlate(selectedClaim.vehiclePlate) },
                          { label: "Damage Type",    value: selectedClaim.damageType },
                          { label: "Location",       value: selectedClaim.location },
                          { label: "Incident Date",  value: selectedClaim.incidentDate },
                          { label: "Incident Time",  value: selectedClaim.incidentTime },
                          { label: "Assigned Agent", value: agentName || selectedClaim.assignedAgent },
                          { label: "Submitted Date", value: formatDate(selectedClaim.createdAt) },
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

                      {/* Accept Claim Assignment */}
                      {isActive && selectedClaim.currentStep === 2 && (
                        <View style={styles.modalDescBox}>
                          <Text style={styles.modalDescLabel}>Accept Claim Assignment</Text>
                          <Text style={[styles.modalDescText, { fontSize: 11, color: '#64748b', marginBottom: 8 }]}>
                            Accept assignment to start inspection logs.
                          </Text>
                          <TouchableOpacity
                            style={[styles.approveBtn, { backgroundColor: "#0ea5e9" }]}
                            onPress={handleAcceptClaim}
                            disabled={isAcceptingClaim}
                          >
                            <Text style={styles.approveBtnText}>
                              {isAcceptingClaim ? "Accepting..." : "Accept Assignment"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Submit Inspection Report */}
                      {isActive && selectedClaim.currentStep === 3 && !selectedClaim.inspectionSubmitted && (
                        <View style={styles.modalDescBox}>
                          <Text style={styles.modalDescLabel}>Submit Inspection Report</Text>
                          <TextInput
                            style={[styles.modalAssessField, { height: 70, textAlignVertical: 'top', padding: 8, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, color: '#1e293b' }]}
                            placeholder="Type evaluation notes..."
                            placeholderTextColor="#94a3b8"
                            multiline
                            numberOfLines={3}
                            value={inspectionReportText}
                            onChangeText={setInspectionReportText}
                          />
                          <TouchableOpacity
                            style={[styles.approveBtn, { backgroundColor: "#06b6d4", marginTop: 8 }]}
                            onPress={handleSubmitInspectionReport}
                            disabled={isSubmittingReport || !inspectionReportText.trim()}
                          >
                            <Text style={styles.approveBtnText}>
                              {isSubmittingReport ? "Submitting..." : "Submit Report"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {selectedClaim.inspectionSubmitted && (
                        <View style={styles.modalDescBox}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <Text style={styles.modalDescLabel}>Inspection Report</Text>
                            <Text style={{ fontSize: 9, fontWeight: '900', color: '#16a34a', backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>Submitted</Text>
                          </View>
                          <Text style={styles.modalDescText}>{selectedClaim.inspectionReport}</Text>
                        </View>
                      )}

                      {/* Requested Agent Docs */}
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

                      {/* Upload new agent doc */}
                      {isActive && (
                        <View style={styles.modalDescBox}>
                          <Text style={styles.modalDescLabel}>Upload Document File</Text>
                          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                            {["Repair Estimate", "Inspection Photos", "Damage Assessment", "Other"].map((type) => {
                              const isSelected = agentUploadDocName === type;
                              return (
                                <TouchableOpacity
                                  key={type}
                                  onPress={() => setAgentUploadDocName(type)}
                                  style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: isSelected ? "#dbeafe" : "#f1f5f9" }}
                                >
                                  <Text style={{ fontSize: 10.5, fontWeight: "800", color: isSelected ? "#1e3a8a" : "#64748b" }}>
                                    {type}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>

                          {agentUploadFileBase64 ? (
                            <View style={styles.agentDocCardSubmitted}>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center" }}>
                                  <Ionicons name="image-outline" size={20} color="#16a34a" />
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.agentDocTitleSubmitted} numberOfLines={1}>{agentUploadFileName}</Text>
                                  <Text style={styles.agentDocSubSubmitted}>Ready ({agentUploadDocName})</Text>
                                </View>
                              </View>
                              <TouchableOpacity onPress={() => { setAgentUploadFileBase64(null); setAgentUploadFileName(""); }}>
                                <Ionicons name="trash-outline" size={18} color="#dc2626" />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={{ borderStyle: "dashed", borderWidth: 1.5, borderColor: "#1e3a8a", borderRadius: 12, paddingVertical: 18, alignItems: "center", justifyContent: "center", gap: 6 }}
                              onPress={handlePickAgentDoc}
                            >
                              <Ionicons name="cloud-upload" size={24} color="#1e3a8a" />
                              <Text style={{ fontSize: 12, fontWeight: "800", color: "#1e293b" }}>Select document file</Text>
                            </TouchableOpacity>
                          )}

                          {agentUploadFileBase64 && (
                            <TouchableOpacity
                              style={[styles.approveBtn, { backgroundColor: "#f97316", marginTop: 10, height: 38 }]}
                              onPress={handleAgentDocSubmit}
                              disabled={isAgentUploading}
                            >
                              {isAgentUploading ? (
                                <ActivityIndicator color="#ffffff" size="small" />
                              ) : (
                                <Text style={styles.approveBtnText}>Upload to Claim</Text>
                              )}
                            </TouchableOpacity>
                          )}
                        </View>
                      )}

                      {/* Assessment amount evaluation */}
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

                      {!isActive && (
                        <View style={[styles.modalAssessBox, { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }]}>
                          <Text style={[styles.modalAssessLabel, { color: "#166534" }]}>Final Claim Amount</Text>
                          <Text style={[styles.modalInfoValue, { fontSize: 18, color: "#16a34a", fontWeight: "900" }]}>
                            {selectedClaim.amount ? `LKR ${selectedClaim.amount.toLocaleString()}` : "Not Evaluated"}
                          </Text>
                        </View>
                      )}

                      {/* Submit and close buttons */}
                      <View style={styles.modalActions}>
                        {isActive && (
                          <TouchableOpacity
                            style={[styles.approveBtn, savingAssessment && { opacity: 0.7 }]}
                            onPress={handleApproveAssessment}
                            disabled={savingAssessment}
                          >
                            {savingAssessment ? (
                              <ActivityIndicator color="#fff" size="small" />
                            ) : (
                              <>
                                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                                <Text style={styles.approveBtnText}>Approve Claim</Text>
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

      <AgentNavbar activeTab="claims" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 110 },
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { fontSize: 13, color: "#64748b", fontWeight: "600", marginTop: 10 },

  headerBackground: { width: "100%", height: 180 },
  headerImageStyle: { borderBottomRightRadius: 40 },
  headerGradient: {
    flex: 1,
    borderBottomRightRadius: 40,
    paddingTop: Platform.OS === "ios" ? 54 : 42,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  headerTitle: { fontSize: 26, color: "#ffffff", fontWeight: "800", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 11.5, color: "#e2e8f0", fontWeight: "600", marginTop: 2 },

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

  /* Modal Details */
  modalOverlay: { flex: 1, backgroundColor: "rgba(2,6,23,0.7)", alignItems: "center", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: "#ffffff", borderTopLeftRadius: 36, borderTopRightRadius: 36,
    maxHeight: "88%", width: "100%",
    shadowColor: "#000", shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25, shadowRadius: 20, elevation: 12,
    overflow: "hidden", flexShrink: 1,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  modalHeaderTitle: { fontSize: 18, fontWeight: "800", color: "#ffffff" },
  modalHeaderSub: { fontSize: 11.5, color: "#94a3b8", fontWeight: "600", marginTop: 2 },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },

  wizardContainer: {
    backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#f1f5f9", borderRadius: 20,
    paddingTop: 18, paddingBottom: 12, paddingHorizontal: 12, marginBottom: 20, position: "relative", width: "100%",
  },
  wizardBgLine: { position: "absolute", top: 32, left: 28, right: 28, height: 3, backgroundColor: "#e2e8f0" },
  wizardProgressLine: { position: "absolute", top: 32, left: 28, height: 3, backgroundColor: "#00b050" },
  wizardStepsRow: { flexDirection: "row", justifyContent: "space-between" },
  stepItem: { flex: 1, alignItems: "center" },
  stepCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff" },
  stepCircleInactive: { borderColor: "#cbd5e1" },
  stepCircleCompleted: { borderColor: "#00b050" },
  stepCircleActive: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  stepNumber: { fontSize: 10.5, fontWeight: "800", color: "#64748b" },
  stepLabel: { fontSize: 9.5, fontWeight: "700", marginTop: 6 },
  stepTextInactive: { color: "#94a3b8" },
  stepTextCompleted: { color: "#475569" },
  stepTextActive: { color: "#2563eb", fontWeight: "800" },

  modalInfoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, padding: 12, backgroundColor: "#f8fafc", borderRadius: 20, borderWidth: 1, borderColor: "#f1f5f9" },
  modalInfoItem: { width: "47%", paddingVertical: 4 },
  modalInfoLabel: { fontSize: 10.5, color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  modalInfoValue: { fontSize: 13, color: "#0f172a", fontWeight: "800", marginTop: 2 },

  modalDescBox: { backgroundColor: "#f8fafc", padding: 16, borderRadius: 20, borderWidth: 1, borderColor: "#f1f5f9" },
  modalDescLabel: { fontSize: 11, color: "#64748b", fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 6 },
  modalDescText: { fontSize: 13, color: "#475569", fontWeight: "600", lineHeight: 18 },

  agentDocCardPending: {
    backgroundColor: "#ffffff", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0", borderLeftWidth: 4, borderLeftColor: "#1e3a8a",
    padding: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8,
  },
  agentSirenIconWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#f0f7ff", alignItems: "center", justifyContent: "center" },
  agentDocTitlePending: { fontSize: 12.5, fontWeight: "800", color: "#1e293b" },
  agentDocSubPending: { fontSize: 10, color: "#64748b", fontWeight: "600", marginTop: 1 },
  agentUploadCardBtn: { backgroundColor: "#1e3a8a", flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  agentUploadCardBtnText: { color: "#ffffff", fontSize: 10, fontWeight: "800" },

  agentDocCardSubmitted: {
    backgroundColor: "#ffffff", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0", borderLeftWidth: 4, borderLeftColor: "#10b981",
    padding: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8,
  },
  agentDocTitleSubmitted: { fontSize: 12.5, fontWeight: "800", color: "#1e293b" },
  agentDocSubSubmitted: { fontSize: 10, color: "#64748b", fontWeight: "600", marginTop: 1 },
  agentDocViewBtn: { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  agentDocViewBtnText: { color: "#16a34a", fontSize: 10, fontWeight: "800" },

  modalAssessBox: { backgroundColor: "#f8fafc", padding: 14, borderRadius: 20, borderWidth: 1, borderColor: "#e2e8f0" },
  modalAssessLabel: { fontSize: 11, color: "#64748b", fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 8 },
  modalAssessInput: { flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, paddingHorizontal: 14, height: 44 },
  modalAssessCurrency: { fontSize: 13, fontWeight: "800", color: "#64748b", marginRight: 8 },
  modalAssessField: { flex: 1, fontSize: 14, color: "#0f172a", fontWeight: "800" },

  modalActions: { flexDirection: "row", gap: 10, marginTop: 10 },
  approveBtn: { flex: 1, height: 44, borderRadius: 14, backgroundColor: "#1e3a8a", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  approveBtnText: { color: "#ffffff", fontSize: 13, fontWeight: "800" },
  closeBtn: { flex: 1, height: 44, borderRadius: 14, backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#cbd5e1", alignItems: "center", justifyContent: "center" },
  closeBtnText: { color: "#475569", fontSize: 13, fontWeight: "800" },

  /* Tab selector */
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
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
});
