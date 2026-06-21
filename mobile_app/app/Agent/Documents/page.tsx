import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform,
  ImageBackground,
  Linking,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import AgentNavbar from "../../Components/Agent/page";
import { API_BASE_URL } from "../../config";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface AdditionalDoc {
  name: string;
  url: string;
  uploadedAt: string;
  uploadedBy?: string;
  _id?: string;
}

interface Claim {
  _id: string;
  claimNumber: string;
  userNic: string;
  vehiclePlate: string;
  damageType: string;
  status: string;
  createdAt: string;
  requestedDocuments?: string[];
  documentRequestTo?: string;
  additionalDocuments?: AdditionalDoc[];
  messages?: { sender: string; message: string; sentAt: string }[];
}

export default function AgentDocsPage() {
  const [agentEmail, setAgentEmail] = useState("");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
      requestedAt = formatDateString(msg.sentAt);
    } else {
      requestedAt = formatDateString(claim.createdAt);
    }

    if (status === "Submitted") {
      const doc = (claim.additionalDocuments || []).find(
        d => d.name.trim().toLowerCase() === name.trim().toLowerCase()
      );
      if (doc && doc.uploadedAt) {
        submittedAt = formatDateString(doc.uploadedAt);
      }
    }

    return { requestedAt, submittedAt };
  };

  const fetchClaims = useCallback(async (email: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/agent/claims?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error("Failed to fetch claims");
      const data = await res.json();
      if (Array.isArray(data)) setClaims(data);
    } catch (e) {
      console.error("Fetch claims docs error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const agentStr = await AsyncStorage.getItem("logged_in_agent");
        if (agentStr) {
          const agent = JSON.parse(agentStr);
          if (agent.email) {
            setAgentEmail(agent.email);
            await fetchClaims(agent.email);
          }
        }
      } catch (err) {
        console.error("Error loading agent docs context", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchClaims]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (agentEmail) fetchClaims(agentEmail);
  }, [agentEmail, fetchClaims]);

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

  const handleAgentDocUploadPicker = async (docName: string, claim: Claim) => {
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
        uploadAgentDocImmediate(docName, base64Data, claim);
      }
    }
  };

  const uploadAgentDocImmediate = async (docName: string, base64Data: string, claim: Claim) => {
    setIsUploading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/policy-holder/update-claim/${claim.claimNumber}`, {
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
        if (agentEmail) {
          await fetchClaims(agentEmail);
        }
      } else {
        const errData = await res.json();
        Alert.alert("Error", errData.error || "Failed to upload document.");
      }
    } catch (e) {
      Alert.alert("Error", "An error occurred during document upload.");
    } finally {
      setIsUploading(false);
    }
  };

  // Compile Requested Documents list for the Agent
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

  const claimsWithPendingRequests = claims.filter(c => getAgentPendingRequests(c).length > 0);

  // Compile Submitted Documents list (either by Agent or by user, but let's show all additional documents of these claims)
  const submittedDocsList = claims.flatMap(claim => {
    const docs = claim.additionalDocuments || [];
    return docs.map(doc => ({
      claimNumber: claim.claimNumber,
      vehiclePlate: claim.vehiclePlate,
      name: doc.name,
      url: doc.url,
      uploadedAt: doc.uploadedAt,
      uploadedBy: doc.uploadedBy || "User"
    }));
  }).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

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
          <Text style={styles.headerTitle}>My Documents</Text>
          <Text style={styles.headerSubtitle}>Requested uploads and submitted file records</Text>
        </LinearGradient>
      </ImageBackground>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loaderText}>Loading document logs...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" colors={["#f97316"]} />
          }
          contentContainerStyle={styles.scrollContent}
        >
          
          {/* SECTION 1: REQUESTED DOCUMENTS */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Awaiting Agent Uploads</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>
                  {claimsWithPendingRequests.reduce((sum, c) => sum + getAgentPendingRequests(c).length, 0)}
                </Text>
              </View>
            </View>

            {claimsWithPendingRequests.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="checkmark-done-circle-outline" size={32} color="#16a34a" />
                </View>
                <Text style={styles.emptyTitle}>No Action Required</Text>
                <Text style={styles.emptyDesc}>No document requests are pending for you at this time.</Text>
              </View>
            ) : (
              claimsWithPendingRequests.map((claim) => {
                const pendingDocs = getAgentPendingRequests(claim);
                return (
                  <View key={claim._id} style={{ marginBottom: 16 }}>
                    <Text style={styles.groupClaimLabel}>
                      Claim: {claim.claimNumber} ({claim.vehiclePlate})
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
                            style={[styles.agentUploadCardBtn, isUploading && { opacity: 0.7 }]}
                            onPress={() => handleAgentDocUploadPicker(docName, claim)}
                            disabled={isUploading}
                          >
                            <Ionicons name="cloud-upload-outline" size={14} color="#ffffff" />
                            <Text style={styles.agentUploadCardBtnText}>Upload</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                );
              })
            )}
          </View>

          {/* SECTION 2: SUBMITTED DOCUMENTS */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Submitted Files Archive</Text>
              <View style={styles.sectionBadgeGrey}>
                <Text style={styles.sectionBadgeText}>{submittedDocsList.length}</Text>
              </View>
            </View>

            {submittedDocsList.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="folder-outline" size={30} color="#cbd5e1" />
                <Text style={styles.emptyDesc}>No files have been submitted for your assigned claims.</Text>
              </View>
            ) : (
              submittedDocsList.map((doc, idx) => (
                <View key={idx} style={styles.uploadedCard}>
                  <View style={styles.uploadedLeft}>
                    <View style={styles.uploadedCheckWrap}>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#16a34a" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.uploadedClaimNumber} numberOfLines={1}>{doc.name}</Text>
                      <Text style={styles.uploadedClaimSub}>
                        Claim: {doc.claimNumber} · {doc.vehiclePlate}
                      </Text>
                      <Text style={styles.uploadedByText}>Uploaded By: {doc.uploadedBy}</Text>
                    </View>
                  </View>

                  <View style={styles.uploadedRight}>
                    <Text style={styles.uploadedDateText}>{formatDateString(doc.uploadedAt)}</Text>
                    <TouchableOpacity 
                      style={styles.uploadedViewBtn}
                      onPress={() => handleViewDocument(doc.url)}
                    >
                      <Text style={styles.uploadedViewBtnText}>View</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

        </ScrollView>
      )}

      <AgentNavbar activeTab="docs" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: { paddingBottom: 120 },
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

  sectionContainer: { marginTop: 24, paddingHorizontal: 16 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  sectionBadge: { backgroundColor: "#f97316", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  sectionBadgeGrey: { backgroundColor: "#64748b", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  sectionBadgeText: { color: "#ffffff", fontSize: 10.5, fontWeight: "800" },

  groupClaimLabel: { fontSize: 12.5, fontWeight: "800", color: "#475569", marginBottom: 8, paddingLeft: 4, textTransform: "uppercase", letterSpacing: 0.3 },

  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIconWrap: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#ecfeff", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  emptyTitle: { fontSize: 14.5, fontWeight: "800", color: "#0f172a" },
  emptyDesc: { fontSize: 11.5, color: "#94a3b8", fontWeight: "600", marginTop: 2, textAlign: "center" },

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
    marginBottom: 8,
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
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  agentUploadCardBtnText: {
    color: "#ffffff",
    fontSize: 10.5,
    fontWeight: "800",
  },

  uploadedCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    padding: 14,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  uploadedLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  uploadedCheckWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", alignItems: "center", justifyContent: "center" },
  uploadedClaimNumber: { fontSize: 13.5, fontWeight: "800", color: "#1e293b" },
  uploadedClaimSub: { fontSize: 11, color: "#64748b", fontWeight: "700", marginTop: 2 },
  uploadedByText: { fontSize: 10, color: "#94a3b8", fontWeight: "600", marginTop: 2 },
  uploadedRight: { alignItems: "flex-end", gap: 6, marginLeft: 10 },
  uploadedDateText: { fontSize: 10.5, color: "#94a3b8", fontWeight: "600" },
  uploadedViewBtn: { borderWidth: 1.5, borderColor: "#10b981", paddingHorizontal: 14, paddingVertical: 4, borderRadius: 99 },
  uploadedViewBtnText: { color: "#10b981", fontSize: 10.5, fontWeight: "800" },
});
