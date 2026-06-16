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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import PolicyHolderNavbar from "../Components/policy holder/page";

interface DocumentItem {
  id: string;
  name: string;
  type: string;
  status: "Verified" | "Pending Review" | "Action Required";
  uploadDate: string;
  uri?: string;
}

export default function MyDocs() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Load default and custom uploaded documents on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const storedDocsStr = await AsyncStorage.getItem("user_uploaded_docs");
        const defaultDocs: DocumentItem[] = [
          { id: "nic-cert", name: "National Identity Card (NIC)", type: "Identification", status: "Verified", uploadDate: "12 May 2026" },
          { id: "lic-front", name: "Driving License (Front)", type: "Driving Permit", status: "Verified", uploadDate: "12 May 2026" },
          { id: "lic-rear", name: "Driving License (Rear)", type: "Driving Permit", status: "Verified", uploadDate: "12 May 2026" },
          { id: "policy-cert", name: "SGI Policy Certificate", type: "Insurance Policy", status: "Verified", uploadDate: "15 May 2026" }
        ];

        if (storedDocsStr) {
          const parsedDocs = JSON.parse(storedDocsStr);
          setDocuments([...defaultDocs, ...parsedDocs]);
        } else {
          setDocuments(defaultDocs);
        }
      } catch (err) {
        console.error("Error loading documents:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleUploadDoc = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Allow storage permissions to select files.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.6,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setIsUploading(true);
      const asset = result.assets[0];
      const newDoc: DocumentItem = {
        id: "doc-" + Date.now(),
        name: asset.fileName || "Uploaded Document " + (documents.length - 3),
        type: "Claim Supporting File",
        status: "Pending Review",
        uploadDate: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        uri: asset.uri
      };

      try {
        const customDocsOnly = documents.filter(d => d.id.startsWith("doc-"));
        const updatedCustomDocs = [...customDocsOnly, newDoc];
        await AsyncStorage.setItem("user_uploaded_docs", JSON.stringify(updatedCustomDocs));
        setDocuments(prev => [...prev, newDoc]);
        Alert.alert("Success 🎉", "Document uploaded successfully and queued for review.");
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Failed to save document.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!id.startsWith("doc-")) {
      Alert.alert("Action Restriced", "System verified core registration documents cannot be deleted.");
      return;
    }

    Alert.alert("Delete Document", "Are you sure you want to remove this document?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const remainingDocs = documents.filter(d => d.id !== id);
            const customOnly = remainingDocs.filter(d => d.id.startsWith("doc-"));
            await AsyncStorage.setItem("user_uploaded_docs", JSON.stringify(customOnly));
            setDocuments(remainingDocs);
          } catch (e) {
            console.error(e);
          }
        }
      }
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Verified":
        return { text: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" };
      case "Pending Review":
        return { text: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" };
      default:
        return { text: "#dc2626", bg: "#fef2f2", border: "#fecaca" };
    }
  };

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
          <Text style={styles.headerSubtitle}>View policy files, licenses, and verified logs</Text>
        </LinearGradient>
      </ImageBackground>

      {/* Upload New Document Button */}
      <View style={styles.uploadContainer}>
        <TouchableOpacity style={styles.uploadBtn} onPress={handleUploadDoc} disabled={isUploading} activeOpacity={0.85}>
          {isUploading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={20} color="#ffffff" />
              <Text style={styles.uploadBtnText}>Upload New Document</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Documents List */}
      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loaderText}>Loading document logs...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {documents.map((doc) => {
            const colors = getStatusColor(doc.status);
            return (
              <View key={doc.id} style={styles.docCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="document-text" size={24} color="#0ea5e9" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.docName}>{doc.name}</Text>
                    <Text style={styles.docType}>{doc.type} · {doc.uploadDate}</Text>
                  </View>
                  {doc.id.startsWith("doc-") && (
                    <TouchableOpacity onPress={() => handleDeleteDoc(doc.id)} style={styles.deleteBtn}>
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.cardFooter}>
                  <View style={[styles.statusBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                    <Text style={[styles.statusText, { color: colors.text }]}>{doc.status}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <PolicyHolderNavbar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 110 },
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { fontSize: 13, color: "#64748b", fontWeight: "600", marginTop: 10 },

  /* Curved background header */
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

  /* Upload Container */
  uploadContainer: {
    paddingHorizontal: 16,
    marginTop: -22,
    marginBottom: 16,
    zIndex: 10,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0d2a3a",
    borderRadius: 99,
    paddingVertical: 12,
    gap: 8,
    shadowColor: "rgba(13, 42, 58, 0.25)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  uploadBtnText: { color: "#ffffff", fontSize: 13.5, fontWeight: "800" },

  /* Document Cards */
  docCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    marginBottom: 12,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f0f9ff",
    alignItems: "center",
    justifyContent: "center",
  },
  docName: { fontSize: 14.5, fontWeight: "800", color: "#0f172a" },
  docType: { fontSize: 11.5, color: "#64748b", fontWeight: "600", marginTop: 2 },
  deleteBtn: { padding: 4 },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
  },
  statusBadge: {
    borderWidth: 1.2,
    paddingHorizontal: 10,
    paddingVertical: 2.5,
    borderRadius: 99,
  },
  statusText: { fontSize: 10, fontWeight: "800" },
});
