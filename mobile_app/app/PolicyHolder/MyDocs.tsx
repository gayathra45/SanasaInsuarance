import React, { useState, useEffect } from "react";
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
  Alert,
  ImageBackground,
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import PolicyHolderNavbar from "../Components/PolicyHolder/page";
import { API_BASE_URL } from "../config";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface AdditionalDoc {
  name: string;
  url: string;
  uploadedAt: string;
  _id?: string;
}

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
  createdAt: string;
  documentsRequested: boolean;
  requestedDocuments: string[];
  documentRequestTo?: string;
  messages?: ClaimMessage[];
  accidentPhotos?: {
    front?: string[];
    rear?: string[];
    side?: string[];
  };
  drivingLicense?: {
    front?: string[];
    rear?: string[];
  };
  additionalDocuments?: AdditionalDoc[];
}

export default function MyDocs() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [userNic, setUserNic] = useState("");

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

  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTargetClaim, setUploadTargetClaim] = useState<Claim | null>(null);
  const [uploadFiles, setUploadFiles] = useState<{ [docName: string]: { base64: string | null; name: string } }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Uploaded List Modal State
  const [uploadedListModalOpen, setUploadedListModalOpen] = useState(false);
  const [uploadedListTargetClaim, setUploadedListTargetClaim] = useState<any>(null);

  // View Document Modal State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewModalTitle, setViewModalTitle] = useState("");
  const [viewModalFiles, setViewModalFiles] = useState<string[]>([]);
  const [viewCurrentIndex, setViewCurrentIndex] = useState(0);

  // Fetch logged in user and claims
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const userStr = await AsyncStorage.getItem("logged_in_user");
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserNic(user.nic || "");
          if (user.nic) {
            await fetchClaims(user.nic);
          }
        }
      } catch (err) {
        console.error("Error loading user context", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fetchClaims = async (nic: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/policy-holder/user-claims?nic=${encodeURIComponent(nic)}&includeDocs=true`);
      let databaseClaims: Claim[] = [];
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.claims)) {
          databaseClaims = data.claims;
        }
      }
      setClaims(databaseClaims);
    } catch (err) {
      console.error("Error fetching claim documents:", err);
    }
  };

  const formatDateString = (dateStr: string) => {
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

  // Open upload modal for a claim
  const handleOpenUpload = (claim: Claim) => {
    setUploadTargetClaim(claim);
    const initialFiles: { [docName: string]: { base64: string | null; name: string } } = {};
    const userDocs = getUserRequestedDocs(claim);
    const docs = userDocs.length > 0 ? userDocs : ["Police Report", "Repair Estimate"];
    
    docs.forEach(docName => {
      initialFiles[docName] = { base64: null, name: "" };
    });

    setUploadFiles(initialFiles);
    setUploadSuccess(false);
    setUploadModalOpen(true);
  };

  // Launch mobile image picker
  const handlePickImage = async (docName: string) => {
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
        setUploadFiles(prev => ({
          ...prev,
          [docName]: { 
            base64: base64Data, 
            name: asset.fileName || `image_${Date.now().toString().slice(-4)}.jpg` 
          }
        }));
      }
    }
  };

  // Remove selected image slot
  const handleRemoveFile = (docName: string) => {
    setUploadFiles(prev => ({
      ...prev,
      [docName]: { base64: null, name: "" }
    }));
  };

  // Submit base64 uploads to backend
  const handleUploadSubmit = async () => {
    if (!uploadTargetClaim) return;

    const selectedFiles = Object.entries(uploadFiles).filter(([_, val]) => val.base64 !== null);
    if (selectedFiles.length === 0) {
      Alert.alert("Error", "Please select at least one document to upload.");
      return;
    }

    setIsUploading(true);

    try {
      const uploadedDocumentsPayload = selectedFiles.map(([docName, val]) => ({
        documentName: docName,
        fileData: val.base64
      }));

      const res = await fetch(`${API_BASE_URL}/api/policy-holder/update-claim/${uploadTargetClaim.claimNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadedDocuments: uploadedDocumentsPayload })
      });

      if (res.ok) {
        setUploadSuccess(true);
        if (userNic) {
          await fetchClaims(userNic);
        }
      } else {
        const data = await res.json();
        Alert.alert("Upload Failed", data.error || "Failed to upload requested documents.");
      }
    } catch (err) {
      console.error("Document upload failed", err);
      Alert.alert("Error", "An error occurred. Check your connection and try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Open viewer modal
  const handleOpenView = (title: string, urls: string[] | undefined) => {
    if (!urls || urls.length === 0) return;
    setViewModalTitle(title);
    setViewModalFiles(urls);
    setViewCurrentIndex(0);
    setViewModalOpen(true);
  };

  // Compile Requested Documents List
  const requestedDocsList = claims.filter(c => c.documentsRequested && getUserRequestedDocs(c).length > 0);

  // Compile Grouped Uploaded Documents by Claim ID
  const groupedClaimsList = claims.map(claim => {
    const docs: { name: string; files: string[] }[] = [];

    // 1. Driving License
    const licFront = claim.drivingLicense?.front || [];
    const licRear = claim.drivingLicense?.rear || [];
    const allLicPhotos = [...licFront, ...licRear].filter(Boolean);
    if (allLicPhotos.length > 0) {
      docs.push({
        name: "Driving License",
        files: allLicPhotos
      });
    }

    // 2. Accident Photos
    const frontPhotos = claim.accidentPhotos?.front || [];
    const rearPhotos = claim.accidentPhotos?.rear || [];
    const sidePhotos = claim.accidentPhotos?.side || [];
    const allAccidentPhotos = [...frontPhotos, ...rearPhotos, ...sidePhotos].filter(Boolean);
    if (allAccidentPhotos.length > 0) {
      docs.push({
        name: "Accident Photos",
        files: allAccidentPhotos
      });
    }

    // 3. Additional Documents
    if (claim.additionalDocuments && claim.additionalDocuments.length > 0) {
      claim.additionalDocuments.forEach(doc => {
        if (doc.url) {
          docs.push({
            name: doc.name,
            files: [doc.url]
          });
        }
      });
    }

    const allFiles = docs.flatMap(d => d.files);

    return {
      claimNumber: claim.claimNumber,
      date: formatDateString(claim.createdAt),
      docs,
      allFiles
    };
  }).filter(c => c.docs.length > 0);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Styled curved header */}
      <ImageBackground
        source={require("../../assets/images/policy1.jpg")}
        style={styles.headerBackground}
        imageStyle={styles.headerImageStyle}
      >
        <LinearGradient
          colors={["rgba(15, 23, 42, 0.95)", "rgba(15, 23, 42, 0.82)", "rgba(15, 23, 42, 0.5)"]}
          style={styles.headerGradient}
        >
          <Text style={styles.headerTitle}>My Documents</Text>
          <Text style={styles.headerSubtitle}>Requested documents and uploads</Text>
        </LinearGradient>
      </ImageBackground>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loaderText}>Loading document logs...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* SECTION 1: REQUESTED DOCUMENTS */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Requested Documents</Text>
              <Ionicons name="chevron-forward" size={18} color="#0f172a" />
            </View>

            {requestedDocsList.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="checkmark-done-circle-outline" size={32} color="#10b981" />
                </View>
                <Text style={styles.emptyTitle}>No Pending Document Requests</Text>
                <Text style={styles.emptyDesc}>All your claim documents are verified and up to date.</Text>
              </View>
            ) : (
              requestedDocsList.map((claim) => (
                <View key={claim.claimNumber} style={styles.alertCard}>
                  <View style={styles.alertRow}>
                    <View style={styles.sirenIconWrap}>
                      <Ionicons name="alert-circle" size={24} color="#ef4444" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.alertTitle}>Documents Requested – Action Required</Text>
                      <Text style={styles.alertText}>
                        Staff has requested a <Text style={{ fontWeight: "800" }}>{getUserRequestedDocs(claim).join(" & ")}</Text> for <Text style={{ fontWeight: "800" }}>{claim.claimNumber}</Text>.
                      </Text>
                      <Text style={styles.alertWarningText}>Please upload within 3 days...</Text>
                    </View>
                  </View>

                  <View style={styles.alertFooter}>
                    <Text style={styles.alertDate}>{formatDateString(claim.createdAt)}</Text>
                    <TouchableOpacity 
                      style={styles.alertUploadBtn} 
                      onPress={() => handleOpenUpload(claim)}
                    >
                      <Text style={styles.alertUploadBtnText}>Upload</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* SECTION 2: UPLOADED DOCUMENTS */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Uploaded Documents</Text>
              <Ionicons name="chevron-forward" size={18} color="#0f172a" />
            </View>

            {groupedClaimsList.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="folder-outline" size={30} color="#94a3b8" />
                <Text style={styles.emptyDesc}>You have not uploaded any claim files yet.</Text>
              </View>
            ) : (
              groupedClaimsList.map((claim, idx) => (
                <View key={idx} style={styles.uploadedCard}>
                  <View style={styles.uploadedLeft}>
                    <View style={styles.uploadedCheckWrap}>
                      <Ionicons name="checkmark" size={18} color="#10b981" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.uploadedClaimNumber}>{claim.claimNumber}</Text>
                      <View style={styles.uploadedDocsSubList}>
                        {claim.docs.map((doc, dIdx) => (
                          <Text key={dIdx} style={styles.uploadedDocNameText}>• {doc.name}</Text>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View style={styles.uploadedRight}>
                    <Text style={styles.uploadedDateText}>{claim.date}</Text>
                    <TouchableOpacity 
                      style={styles.uploadedViewBtn}
                      onPress={() => {
                        setUploadedListTargetClaim(claim);
                        setUploadedListModalOpen(true);
                      }}
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

      {/* UPLOAD DOCUMENT DIALOG MODAL */}
      <Modal
        visible={uploadModalOpen && uploadTargetClaim !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setUploadModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            
            {!uploadSuccess ? (
              <View style={{ width: "100%" }}>
                <Text style={styles.modalTitle}>Claim {uploadTargetClaim?.claimNumber}</Text>
                <Text style={styles.modalSubtitle}>
                  Staff has requested a {uploadTargetClaim ? getUserRequestedDocs(uploadTargetClaim).join(" & ") : ""}
                </Text>

                <View style={styles.modalDivider} />

                <ScrollView style={{ maxHeight: SCREEN_H * 0.4 }} showsVerticalScrollIndicator={false}>
                  {Object.entries(uploadFiles).map(([docName, val]) => (
                    <View key={docName} style={styles.modalPillRow}>
                      <Text style={styles.modalPillLabel}>{docName}</Text>
                      
                      {val.base64 === null ? (
                        <TouchableOpacity onPress={() => handlePickImage(docName)}>
                          <Text style={styles.modalPillActionText}>Upload</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.modalSelectedFileWrap}>
                          <Text style={styles.modalSelectedFileName} numberOfLines={1}>
                            ✓ {val.name || "Selected"}
                          </Text>
                          <TouchableOpacity onPress={() => handleRemoveFile(docName)} style={styles.modalBinBtn}>
                            <Ionicons name="trash-outline" size={16} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity 
                    style={styles.modalCloseBtn}
                    onPress={() => setUploadModalOpen(false)}
                  >
                    <Text style={styles.modalBtnText}>&lt; Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalSubmitBtn, isUploading && { opacity: 0.6 }]}
                    onPress={handleUploadSubmit}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.modalBtnText}>Submit &gt;</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Success Complete View */
              <View style={styles.successContainer}>
                <View style={styles.successIconCircle}>
                  <Ionicons name="checkmark" size={32} color="#ffffff" />
                </View>
                <Text style={styles.successTitle}>Upload Complete!</Text>
                <Text style={styles.successDesc}>
                  Your files have been submitted successfully. Office staff will review them shortly.
                </Text>
                <TouchableOpacity 
                  style={styles.successDoneBtn}
                  onPress={() => setUploadModalOpen(false)}
                >
                  <Text style={styles.modalBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </View>
      </Modal>

      {/* UPLOADED DOCUMENTS LIST DIALOG MODAL */}
      <Modal
        visible={uploadedListModalOpen && uploadedListTargetClaim !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setUploadedListModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            
            <View style={{ width: "100%" }}>
              <Text style={styles.modalTitle}>Claim {uploadedListTargetClaim?.claimNumber}</Text>
              <Text style={styles.modalSubtitle}>Uploaded Documents</Text>

              <View style={styles.modalDivider} />

              <ScrollView style={{ maxHeight: SCREEN_H * 0.4 }} showsVerticalScrollIndicator={false}>
                {uploadedListTargetClaim?.docs.map((doc: any, dIdx: number) => (
                  <View key={dIdx} style={styles.modalPillRow}>
                    <Text style={styles.modalPillLabel} numberOfLines={1}>{doc.name}</Text>
                    <TouchableOpacity 
                      onPress={() => handleOpenView(`${doc.name} – ${uploadedListTargetClaim.claimNumber}`, doc.files)}
                    >
                      <Text style={styles.modalPillActionText}>View</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>

              <View style={[styles.modalFooter, { justifyContent: "flex-start" }]}>
                <TouchableOpacity 
                  style={styles.modalCloseBtn}
                  onPress={() => setUploadedListModalOpen(false)}
                >
                  <Text style={styles.modalBtnText}>&lt; Close</Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>
        </View>
      </Modal>

      {/* VIEW DOCUMENT VIEWER MODAL */}
      <Modal
        visible={viewModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setViewModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            
            {(() => {
              const [docName, claimNumber] = viewModalTitle.includes(" – ") 
                ? viewModalTitle.split(" – ") 
                : [viewModalTitle, ""];
              return (
                <View style={{ width: "100%" }}>
                  <Text style={styles.modalTitle}>{docName}</Text>
                  <Text style={styles.modalSubtitle}>{claimNumber ? `Claim ${claimNumber}` : ""}</Text>

                  <View style={styles.modalDivider} />

                  <View style={styles.viewerFrame}>
                    {viewModalFiles[viewCurrentIndex] ? (
                      <Image
                        source={{ uri: viewModalFiles[viewCurrentIndex] }}
                        style={styles.viewerImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.viewerEmptyText}>No preview available</Text>
                    )}

                    {viewModalFiles.length > 1 && (
                      <View style={styles.viewerNavOverlay}>
                        {viewCurrentIndex > 0 && (
                          <TouchableOpacity 
                            style={styles.viewerArrowBtn}
                            onPress={() => setViewCurrentIndex(prev => prev - 1)}
                          >
                            <Ionicons name="chevron-back" size={20} color="#ffffff" />
                          </TouchableOpacity>
                        )}
                        <View style={{ flex: 1 }} />
                        {viewCurrentIndex < viewModalFiles.length - 1 && (
                          <TouchableOpacity 
                            style={styles.viewerArrowBtn}
                            onPress={() => setViewCurrentIndex(prev => prev + 1)}
                          >
                            <Ionicons name="chevron-forward" size={20} color="#ffffff" />
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    {viewModalFiles.length > 1 && (
                      <View style={styles.viewerCounterBadge}>
                        <Text style={styles.viewerCounterText}>
                          {viewCurrentIndex + 1} / {viewModalFiles.length}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={[styles.modalFooter, { justifyContent: "flex-start" }]}>
                    <TouchableOpacity 
                      style={styles.modalCloseBtn}
                      onPress={() => setViewModalOpen(false)}
                    >
                      <Text style={styles.modalBtnText}>&lt; Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })()}

          </View>
        </View>
      </Modal>

      <PolicyHolderNavbar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: { paddingBottom: 120 },
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { fontSize: 13, color: "#64748b", fontWeight: "600", marginTop: 10 },

  /* Header styles */
  headerBackground: { width: "100%", height: 180 },
  headerImageStyle: { borderBottomRightRadius: 45 },
  headerGradient: {
    flex: 1,
    borderBottomRightRadius: 45,
    paddingTop: Platform.OS === "ios" ? 54 : 42,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  headerTitle: { fontSize: 26, color: "#ffffff", fontWeight: "800", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 12, color: "#e2e8f0", fontWeight: "600", marginTop: 4 },

  /* Sections */
  sectionContainer: { marginTop: 24, paddingHorizontal: 16 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", letterSpacing: -0.2 },

  /* Empty state */
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  emptyIconWrap: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#ecfeff", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  emptyTitle: { fontSize: 14.5, fontWeight: "800", color: "#0f172a" },
  emptyDesc: { fontSize: 11.5, color: "#94a3b8", fontWeight: "600", marginTop: 2, textAlign: "center" },

  /* Alert Card - Action Required */
  alertCard: {
    backgroundColor: "rgba(239, 68, 68, 0.03)",
    borderWidth: 1.5,
    borderColor: "#fee2e2",
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
  },
  alertRow: { flexDirection: "row", alignItems: "flex-start" },
  sirenIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#fee2e2", alignItems: "center", justifyContent: "center" },
  alertTitle: { fontSize: 14, fontWeight: "800", color: "#dc2626" },
  alertText: { fontSize: 12.5, color: "#475569", fontWeight: "600", marginTop: 4, lineHeight: 18 },
  alertWarningText: { fontSize: 11, color: "#94a3b8", fontWeight: "700", marginTop: 4 },
  alertFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.04)" },
  alertDate: { fontSize: 11, color: "#94a3b8", fontWeight: "600" },
  alertUploadBtn: { backgroundColor: "#dc2626", paddingHorizontal: 18, paddingVertical: 6, borderRadius: 99 },
  alertUploadBtnText: { color: "#ffffff", fontSize: 12, fontWeight: "800" },

  /* Uploaded Document Claims */
  uploadedCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  uploadedLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  uploadedCheckWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", alignItems: "center", justifyContent: "center" },
  uploadedClaimNumber: { fontSize: 14.5, fontWeight: "800", color: "#166534" },
  uploadedDocsSubList: { marginTop: 4, gap: 1 },
  uploadedDocNameText: { fontSize: 11, color: "#64748b", fontWeight: "600" },
  uploadedRight: { alignItems: "flex-end", gap: 6 },
  uploadedDateText: { fontSize: 11, color: "#94a3b8", fontWeight: "600" },
  uploadedViewBtn: { borderWidth: 1.5, borderColor: "#10b981", paddingHorizontal: 16, paddingVertical: 5, borderRadius: 99 },
  uploadedViewBtnText: { color: "#10b981", fontSize: 11.5, fontWeight: "800" },

  /* Modal System */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 36,
    width: "100%",
    maxWidth: 480,
    padding: 24,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  modalTitle: { fontSize: 22, fontWeight: "800", color: "#0f172a", textAlign: "left" },
  modalSubtitle: { fontSize: 13, color: "#94a3b8", fontWeight: "600", marginTop: 4, textAlign: "left" },
  modalDivider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 16 },

  modalPillRow: {
    borderWidth: 1.2,
    borderColor: "#cbd5e1",
    borderRadius: 99,
    minHeight: 52,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    backgroundColor: "#ffffff",
  },
  modalPillLabel: { fontSize: 14, fontWeight: "800", color: "#334155", flex: 1 },
  modalPillActionText: { color: "#dc2626", fontSize: 14, fontWeight: "800" },

  modalSelectedFileWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  modalSelectedFileName: { fontSize: 12, fontWeight: "700", color: "#10b981", maxWidth: 150 },
  modalBinBtn: { padding: 4 },

  modalFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, gap: 12 },
  modalCloseBtn: { backgroundColor: "#0d2a3a", paddingVertical: 12, paddingHorizontal: 26, borderRadius: 99, minWidth: 110, alignItems: "center" },
  modalSubmitBtn: { backgroundColor: "#0d2a3a", paddingVertical: 12, paddingHorizontal: 26, borderRadius: 99, minWidth: 110, alignItems: "center" },
  modalBtnText: { color: "#ffffff", fontSize: 13, fontWeight: "800" },

  /* Success View in Modal */
  successContainer: { alignItems: "center", paddingVertical: 16 },
  successIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#10b981", alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", marginTop: 16 },
  successDesc: { fontSize: 12.5, color: "#64748b", fontWeight: "600", textAlign: "center", marginTop: 8, paddingHorizontal: 12, lineHeight: 18 },
  successDoneBtn: { backgroundColor: "#0d2a3a", paddingVertical: 12, paddingHorizontal: 36, borderRadius: 99, marginTop: 24 },

  /* Image Viewer */
  viewerFrame: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 24,
    backgroundColor: "#f8fafc",
    height: 280,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  viewerImage: { width: "100%", height: "100%" },
  viewerEmptyText: { fontSize: 12, color: "#94a3b8", fontWeight: "600" },
  viewerNavOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center", paddingHorizontal: 12 },
  viewerArrowBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  viewerCounterBadge: { position: "absolute", bottom: 12, right: 12, backgroundColor: "rgba(0,0,0,0.65)", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  viewerCounterText: { color: "#ffffff", fontSize: 10, fontWeight: "800" },
});
