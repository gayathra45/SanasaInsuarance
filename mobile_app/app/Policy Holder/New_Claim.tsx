import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform,
  Alert,
  ImageBackground,
  Modal,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import PolicyHolderNavbar from "../Components/policy holder/page";
import { API_BASE_URL } from "../config";

const { width: SCREEN_W } = Dimensions.get("window");

interface Vehicle {
  numberPlate: string;
  vehicleType: string;
  year: string | number;
  company: string;
  model: string;
}

interface PhotoState {
  uri: string;
  base64: string;
}

export default function FileNewClaim() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [userNic, setUserNic] = useState("");

  // Wizard Steps
  const [currentStep, setCurrentStep] = useState(1);

  // Form Fields State
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [damageType, setDamageType] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("Colombo, Sri Lanka");

  // Loading States
  const [isVehiclesLoading, setIsVehiclesLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success Modal States
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedClaimNumber, setGeneratedClaimNumber] = useState("");

  // Photo uploads
  const [accidentFront, setAccidentFront] = useState<PhotoState | null>(null);
  const [accidentRear, setAccidentRear] = useState<PhotoState | null>(null);
  const [accidentSide, setAccidentSide] = useState<PhotoState | null>(null);
  const [licenseFront, setLicenseFront] = useState<PhotoState | null>(null);
  const [licenseRear, setLicenseRear] = useState<PhotoState | null>(null);

  const damageTypes = [
    "Front Bumper / Grille Damage",
    "Rear Bumper Damage",
    "Side Scratch / Dent (Left/Right)",
    "Windshield / Glass Crack",
    "Engine / Mechanical Failure",
    "Suspension Damage",
    "Total Loss / Rollover",
    "Other Accident Damage"
  ];

  useEffect(() => {
    (async () => {
      const userStr = await AsyncStorage.getItem("logged_in_user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.nic) {
            setUserNic(user.nic);
            loadVehicles(user.nic, user.vehicles);
          }
        } catch (e) {
          console.error(e);
        }
      }
    })();
  }, []);

  const loadVehicles = async (nic: string, fallbackVehicles: Vehicle[]) => {
    setIsVehiclesLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/policy-holder/vehicles?nic=${nic}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.vehicles) && data.vehicles.length > 0) {
          setVehicles(data.vehicles);
          setIsVehiclesLoading(false);
          return;
        }
      }
      if (Array.isArray(fallbackVehicles) && fallbackVehicles.length > 0) {
        setVehicles(fallbackVehicles);
      }
    } catch (e) {
      console.warn("API load vehicles failed, using fallback:", e);
      if (Array.isArray(fallbackVehicles) && fallbackVehicles.length > 0) {
        setVehicles(fallbackVehicles);
      }
    } finally {
      setIsVehiclesLoading(false);
    }
  };

  const handleGPSLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Please enable location permissions in your app settings to retrieve your coordinates.");
        setIsLocating(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      
      // Perform reverse geocoding to get address
      const addressArray = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      if (addressArray && addressArray.length > 0) {
        const item = addressArray[0];
        const street = item.street || "";
        const city = item.city || item.subregion || "";
        const district = item.district || "";
        const country = item.country || "";
        
        let fullAddress = "";
        if (street) fullAddress += `${street}, `;
        if (district) fullAddress += `${district}, `;
        if (city) fullAddress += `${city}, `;
        if (country) fullAddress += country;

        // Clean up trailing comma/space
        fullAddress = fullAddress.trim().replace(/,\s*$/, "");
        setAddress(fullAddress || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      } else {
        setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      }
    } catch (e) {
      console.error("GPS retrieval error:", e);
      Alert.alert("Error", "Could not retrieve your current location. Please verify that your device GPS is turned on and try again.");
    } finally {
      setIsLocating(false);
    }
  };

  const selectPhoto = async (stateSetter: React.Dispatch<React.SetStateAction<PhotoState | null>>) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow photo access to upload files.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const base64Data = `data:image/jpeg;base64,${asset.base64}`;
      stateSetter({
        uri: asset.uri,
        base64: base64Data
      });
    }
  };

  const removePhoto = (stateSetter: React.Dispatch<React.SetStateAction<PhotoState | null>>) => {
    stateSetter(null);
  };

  const handleNextStep = () => {
    if (!selectedVehicle || !incidentDate || !incidentTime || !damageType || !description || !address) {
      Alert.alert("Required Fields", "Please fill in all incident details before proceeding.");
      return;
    }
    setCurrentStep(2);
  };

  const handleSubmit = async () => {
    if (!accidentFront && !accidentRear && !accidentSide) {
      Alert.alert("Accident Photos Required", "Please upload at least one accident photo (Front, Rear, or Side).");
      return;
    }
    if (!licenseFront && !licenseRear) {
      Alert.alert("Driving License Required", "Please upload at least one Driving License photo.");
      return;
    }

    setIsSubmitting(true);

    const claimData = {
      userNic,
      vehiclePlate: selectedVehicle,
      incidentDate,
      incidentTime,
      damageType,
      description,
      location: address,
      accidentPhotos: {
        front: accidentFront ? [accidentFront.base64] : [],
        rear: accidentRear ? [accidentRear.base64] : [],
        side: accidentSide ? [accidentSide.base64] : []
      },
      drivingLicense: {
        front: licenseFront ? [licenseFront.base64] : [],
        rear: licenseRear ? [licenseRear.base64] : []
      }
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/policy-holder/new-claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(claimData)
      });
      const data = await response.json();
      if (!response.ok) {
        Alert.alert("Submission Failed", data.error || "Failed to submit claim.");
        setIsSubmitting(false);
        return;
      }

      // Save local reference for dashboard
      await AsyncStorage.setItem("last_submitted_claim", JSON.stringify({
        ...claimData,
        claimNumber: data.claimNumber,
        status: "Submitted",
        createdAt: new Date().toISOString()
      }));

      setGeneratedClaimNumber(data.claimNumber);
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Submit claim error:", err);
      Alert.alert("Network Error", "Unable to connect to the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const renderUploadBox = (label: string, photo: PhotoState | null, stateSetter: React.Dispatch<React.SetStateAction<PhotoState | null>>) => {
    return (
      <View style={styles.uploadBoxContainer}>
        <Text style={styles.uploadLabel}>{label}</Text>
        {photo ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: photo.uri }} style={styles.previewImage} />
            <TouchableOpacity style={styles.deletePhotoBtn} onPress={() => removePhoto(stateSetter)}>
              <Ionicons name="trash" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.placeholderBox} onPress={() => selectPhoto(stateSetter)}>
            <Ionicons name="camera" size={32} color="#94a3b8" />
            <Text style={styles.placeholderTitle}>Select Image</Text>
            <Text style={styles.placeholderDesc}>JPG, PNG up to 5MB</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Styled curved header matching the dashboard */}
      <ImageBackground
        source={require("../../assets/images/newclaim1.webp")}
        style={styles.headerBackground}
        imageStyle={styles.headerImageStyle}
      >
        <LinearGradient
          colors={["rgba(13, 42, 58, 0.95)", "rgba(13, 42, 58, 0.82)", "rgba(15, 23, 42, 0.5)"]}
          style={styles.headerGradient}
        >
          <Text style={styles.headerTitle}>New Claim</Text>
          <Text style={styles.headerSubtitle}>
            {currentStep === 1 ? "Step 1 of 2: Incident Details" : "Step 2 of 2: Upload Files"}
          </Text>
        </LinearGradient>
      </ImageBackground>

      {/* Page Body Form */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {currentStep === 1 ? (
          /* STEP 1: Details form */
          <View style={styles.formContainer}>
            <Text style={styles.sectionHeader}>Incident & Vehicle Details</Text>

            {/* Select Vehicle */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Select Vehicle *</Text>
              {isVehiclesLoading ? (
                <ActivityIndicator size="small" color="#0284c7" />
              ) : (
                <View style={styles.pickerFakeBorder}>
                  <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                    <View style={styles.vehiclePillRow}>
                      {vehicles.map((v) => {
                        const isSelected = selectedVehicle === v.numberPlate;
                        return (
                          <TouchableOpacity
                            key={v.numberPlate}
                            style={[styles.vehiclePill, isSelected && styles.vehiclePillActive]}
                            onPress={() => setSelectedVehicle(v.numberPlate)}
                          >
                            <Text style={[styles.vehiclePillText, isSelected && styles.vehiclePillTextActive]}>
                              {formatNumberPlate(v.numberPlate)} ({v.company})
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Date and Time row */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Incident Date *</Text>
                <TextInput
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94a3b8"
                  value={incidentDate}
                  onChangeText={setIncidentDate}
                  style={styles.textInput}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Incident Time *</Text>
                <TextInput
                  placeholder="HH:MM AM/PM"
                  placeholderTextColor="#94a3b8"
                  value={incidentTime}
                  onChangeText={setIncidentTime}
                  style={styles.textInput}
                />
              </View>
            </View>

            {/* Damage Type Fake Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Damage Type *</Text>
              <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                <View style={styles.vehiclePillRow}>
                  {damageTypes.map((t) => {
                    const isSelected = damageType === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        style={[styles.vehiclePill, isSelected && styles.vehiclePillActive]}
                        onPress={() => setDamageType(t)}
                      >
                        <Text style={[styles.vehiclePillText, isSelected && styles.vehiclePillTextActive]}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* Description Textarea */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Incident Description *</Text>
              <TextInput
                placeholder="Briefly describe what happened..."
                placeholderTextColor="#94a3b8"
                multiline={true}
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
                style={[styles.textInput, styles.textareaInput]}
              />
            </View>

            {/* Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Enter Address or Land Mark *</Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Where did the incident occur?"
                placeholderTextColor="#94a3b8"
                style={styles.textInput}
              />
            </View>

            {/* GPS Retrieval Simulator button */}
            <TouchableOpacity
              style={styles.gpsBtn}
              onPress={handleGPSLocation}
              disabled={isLocating}
              activeOpacity={0.8}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color="#0284c7" />
              ) : (
                <Ionicons name="location" size={18} color="#0284c7" />
              )}
              <Text style={styles.gpsBtnText}>
                {isLocating ? "Retrieving Coordinates..." : "Use My Current GPS Location"}
              </Text>
            </TouchableOpacity>

            {/* Action Row */}
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => router.push("/Policy Holder/page")}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleNextStep}>
                <Text style={styles.primaryBtnText}>Next Step</Text>
                <Ionicons name="arrow-forward" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* STEP 2: Photo uploads */
          <View style={styles.formContainer}>
            <Text style={styles.sectionHeader}>Accident Photos *</Text>
            <View style={styles.photosGrid}>
              {renderUploadBox("Front Damage", accidentFront, setAccidentFront)}
              {renderUploadBox("Rear Damage", accidentRear, setAccidentRear)}
              {renderUploadBox("Side Damage", accidentSide, setAccidentSide)}
            </View>

            <Text style={[styles.sectionHeader, { marginTop: 14 }]}>Driving License *</Text>
            <View style={styles.photosGrid}>
              {renderUploadBox("License Front", licenseFront, setLicenseFront)}
              {renderUploadBox("License Rear", licenseRear, setLicenseRear)}
            </View>

            {/* Submit Action Row */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setCurrentStep(1)}
                disabled={isSubmitting}
              >
                <Ionicons name="arrow-back" size={16} color="#475569" style={{ marginRight: 6 }} />
                <Text style={styles.cancelBtnText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryBtn, isSubmitting && { backgroundColor: "#93c5fd" }]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>Submit Claim</Text>
                    <Ionicons name="shield-checkmark" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={42} color="#ffffff" />
            </View>

            <Text style={styles.successTitle}>Thank You.</Text>
            <Text style={styles.successSubtitle}>Application Submitted!</Text>

            <View style={styles.refPill}>
              <Text style={styles.refText}>{generatedClaimNumber}</Text>
            </View>

            <Text style={styles.successDesc}>
              Your insurance application has been received. Our office staff will review your documents.
            </Text>

            <TouchableOpacity
              style={styles.returnBtn}
              onPress={() => {
                setShowSuccessModal(false);
                router.replace("/Policy Holder/page");
              }}
            >
              <Ionicons name="home" size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.returnBtnText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <PolicyHolderNavbar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 110 },

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

  /* Form details */
  formContainer: { marginTop: 10 },
  sectionHeader: { fontSize: 16, fontWeight: "800", color: "#0f172a", marginBottom: 12 },
  inputGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 12.5, color: "#475569", fontWeight: "700", marginBottom: 8 },
  rowInputs: { flexDirection: "row", gap: 12 },

  textInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    color: "#0f172a",
    fontSize: 13.5,
    fontWeight: "600",
  },
  textareaInput: { minHeight: 90, textAlignVertical: "top" },

  pickerFakeBorder: { paddingVertical: 2 },
  vehiclePillRow: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  vehiclePill: {
    backgroundColor: "#e2e8f0",
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  vehiclePillActive: {
    backgroundColor: "#eff6ff",
    borderColor: "#3b82f6",
  },
  vehiclePillText: { fontSize: 12.5, color: "#475569", fontWeight: "700" },
  vehiclePillTextActive: { color: "#2563eb" },

  gpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#bae6fd",
    backgroundColor: "#f0f9ff",
    borderRadius: 16,
    paddingVertical: 12,
    marginTop: 4,
    marginBottom: 24,
    gap: 8,
  },
  gpsBtnText: { fontSize: 13, color: "#0284c7", fontWeight: "800" },

  /* Photos layout */
  photosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  uploadBoxContainer: {
    width: (SCREEN_W - 44) / 2 - 4, // 2 column layout
  },
  uploadLabel: { fontSize: 11.5, color: "#475569", fontWeight: "700", marginBottom: 6 },
  placeholderBox: {
    height: 124,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  placeholderTitle: { fontSize: 12, color: "#475569", fontWeight: "800", marginTop: 6 },
  placeholderDesc: { fontSize: 9, color: "#94a3b8", fontWeight: "600", marginTop: 2 },

  previewContainer: {
    height: 124,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  previewImage: { width: "100%", height: "100%" },
  deletePhotoBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(220, 38, 38, 0.9)",
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Action row styling */
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderRadius: 99,
    paddingVertical: 13,
    paddingHorizontal: 28,
  },
  cancelBtnText: { fontSize: 13.5, color: "#475569", fontWeight: "800" },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0d2a3a",
    borderRadius: 99,
    paddingVertical: 14,
    paddingHorizontal: 32,
    shadowColor: "rgba(13, 42, 58, 0.2)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: { fontSize: 13.5, color: "#ffffff", fontWeight: "800" },

  /* MODAL SUCCESS STYLE */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  successCard: {
    backgroundColor: "#e2e8f0",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 36,
    width: "100%",
    maxWidth: 420,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  checkCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#00b050",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(0, 176, 80, 0.4)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  successTitle: { fontSize: 22, fontWeight: "900", color: "#0d2a3a", marginTop: 18 },
  successSubtitle: { fontSize: 18, fontWeight: "800", color: "#0d2a3a", marginTop: 4 },
  refPill: {
    backgroundColor: "#000000",
    borderRadius: 99,
    paddingHorizontal: 22,
    paddingVertical: 10,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  refText: { color: "#ffffff", fontSize: 14, fontWeight: "800", letterSpacing: 0.5 },
  successDesc: {
    fontSize: 12.5,
    color: "#475569",
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 20,
    paddingHorizontal: 10,
  },
  returnBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0d2a3a",
    borderRadius: 99,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 24,
    width: "100%",
  },
  returnBtnText: { color: "#ffffff", fontSize: 13, fontWeight: "800" },
});
