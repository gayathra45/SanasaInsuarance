import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Platform,
  ImageBackground,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router, useNavigation } from "expo-router";
import PolicyHolderNavbar from "../Components/PolicyHolder/page";
import { API_BASE_URL } from "../config";

interface Vehicle {
  numberPlate: string;
  vehicleType: string;
  year: string | number;
  company: string;
  model: string;
  engineNumber?: string;
  chassisNumber?: string;
  policyNumber?: string;
}

const vehicleTypes = ["Car", "SUV", "Cab / Double Cab", "Van", "Motorbike", "Three-Wheeler", "Lorry / Truck", "Bus", "Tractor"];

function formatPlate(plate: string) {
  if (!plate) return "";
  const cleaned = plate.trim();
  if (cleaned.includes("-")) return cleaned.toUpperCase();
  const m = cleaned.match(/^(.*[A-Za-z]+)(\d+)$/);
  if (m) return `${m[1].trim().toUpperCase()}-${m[2]}`;
  return cleaned.toUpperCase();
}

function vehicleIcon(type: string) {
  const t = (type || "").toLowerCase().trim();
  if (t.includes("bike") || t.includes("motorcycle") || t.includes("scooter")) return "motorbike";
  if (t.includes("van") || t.includes("minibus")) return "van-utility";
  if (t.includes("bus")) return "bus";
  if (t.includes("truck") || t.includes("lorry")) return "truck";
  if (t.includes("suv")) return "car-estate";
  if (t.includes("tuk") || t.includes("three") || t.includes("rickshaw")) return "rickshaw";
  if (t.includes("tractor")) return "tractor";
  if (t.includes("cab") || t.includes("pickup")) return "truck-pickup";
  return "car-side";
}

export default function MyVehicles() {
  const navigation = useNavigation();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userNic, setUserNic] = useState("");

  // Search & Filter Category States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // Add Vehicle Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newNumberPlate, setNewNumberPlate] = useState("");
  const [newVehicleType, setNewVehicleType] = useState("Car");
  const [newPolicyNumber, setNewPolicyNumber] = useState("");
  const [newEngineNumber, setNewEngineNumber] = useState("");
  const [newChassisNumber, setNewChassisNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activeVehicleTypePicker, setActiveVehicleTypePicker] = useState(false);
  const [customAlert, setCustomAlert] = useState<{
    title: string;
    message: string;
    type?: "success" | "warning" | "info";
    onClose?: () => void;
  } | null>(null);

  const showCustomAlert = (title: string, message: string, type: "success" | "warning" | "info" = "info", onClose?: () => void) => {
    setCustomAlert({ title, message, type, onClose });
  };

  const fetchVehicles = useCallback(async (nic: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/policy-holder/vehicles?nic=${encodeURIComponent(nic)}&_=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.vehicles)) {
          setVehicles(data.vehicles);
          if (!silent) setLoading(false);
          return;
        }
      }
      // Fallback to locally stored user vehicles
      const userStr = await AsyncStorage.getItem("logged_in_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.vehicles && Array.isArray(user.vehicles)) {
          setVehicles(user.vehicles);
        }
      }
    } catch (err) {
      console.error("Error fetching vehicles in app:", err);
      // Local fallback
      const userStr = await AsyncStorage.getItem("logged_in_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.vehicles && Array.isArray(user.vehicles)) {
          setVehicles(user.vehicles);
        }
      }
    } finally {
      if (!silent) setLoading(false);
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
            fetchVehicles(user.nic, false);
          }
        } catch (e) {
          console.error(e);
        }
      }
    })();
  }, [fetchVehicles]);

  // Setup periodic silent polling (every 5 seconds) on screen focus
  useEffect(() => {
    let intervalId: any;

    const startPolling = (nic: string) => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        fetchVehicles(nic, true);
      }, 5000);
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const unsubscribeFocus = navigation.addListener("focus", async () => {
      const userStr = await AsyncStorage.getItem("logged_in_user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          const nic = user.nic || userNic;
          if (nic) {
            fetchVehicles(nic, true);
            startPolling(nic);
          }
        } catch {}
      }
    });

    const unsubscribeBlur = navigation.addListener("blur", () => {
      stopPolling();
    });

    // Start polling initially if userNic is already set
    if (userNic) {
      startPolling(userNic);
    }

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
      stopPolling();
    };
  }, [navigation, userNic, fetchVehicles]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (userNic) fetchVehicles(userNic);
  }, [userNic, fetchVehicles]);

  const handleAddVehicleSubmit = async () => {
    setValidationError(null);
    if (!userNic) {
      setValidationError("User session not found. Please log in again.");
      console.error("Add Vehicle failed: userNic is empty.");
      return;
    }

    if (!newCompany.trim() || !newModel.trim() || !newYear.trim() || !newNumberPlate.trim() || !newVehicleType.trim() || !newPolicyNumber.trim() || !newEngineNumber.trim() || !newChassisNumber.trim()) {
      setValidationError("All fields are required.");
      return;
    }

    const cleanPlate = newNumberPlate.replace(/[\s-]/g, "");
    if (cleanPlate.length < 5 || cleanPlate.length > 10 || !/^[A-Za-z0-9]+$/.test(cleanPlate)) {
      setValidationError("Number Plate must be between 5 and 10 alphanumeric characters.");
      return;
    }

    if (!/^\d{4}$/.test(newYear.trim())) {
      setValidationError("Year must be a 4-digit number.");
      return;
    }

    const cleanPolicy = newPolicyNumber.replace(/[\s-]/g, "");
    if (!/^SAN[A-Za-z0-9]{5,9}$/i.test(cleanPolicy)) {
      setValidationError("Policy Number must start with 'SAN' and be between 8 and 12 characters.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      nic: userNic,
      company: newCompany.trim(),
      model: newModel.trim(),
      year: newYear.trim(),
      numberPlate: newNumberPlate.trim(),
      vehicleType: newVehicleType.trim(),
      policyNumber: newPolicyNumber.trim(),
      engineNumber: newEngineNumber.trim(),
      chassisNumber: newChassisNumber.trim(),
    };

    console.log("Submitting Add Vehicle payload to API:", `${API_BASE_URL}/api/policy-holder/add-vehicle`, payload);

    try {
      const res = await fetch(`${API_BASE_URL}/api/policy-holder/add-vehicle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("Add Vehicle API Response Status:", res.status, "Data:", data);

      if (!res.ok) {
        setValidationError(data.error || "Failed to add vehicle.");
        setIsSubmitting(false);
        return;
      }

      // Update local storage and list
      const userStr = await AsyncStorage.getItem("logged_in_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        const updatedUser = { ...user, vehicles: data.vehicles || [...(user.vehicles || []), data.vehicle] };
        await AsyncStorage.setItem("logged_in_user", JSON.stringify(updatedUser));
      }

      setVehicles(data.vehicles || [...vehicles, data.vehicle]);
      setIsAddModalOpen(false);
      setNewCompany("");
      setNewModel("");
      setNewYear("");
      setNewNumberPlate("");
      setNewVehicleType("Car");
      setNewPolicyNumber("");
      setNewEngineNumber("");
      setNewChassisNumber("");
      showCustomAlert(
        "Registration Under Review",
        "Your vehicle details have been submitted successfully. The regional branch office staff will review and verify your policy information.\n\nThis process typically takes 1-2 business days. You will be notified via email once approved.",
        "success"
      );
    } catch (err) {
      console.error("Add Vehicle network request failed error:", err);
      setValidationError("Unable to connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCoverNote = (vehicle: Vehicle) => {
    showCustomAlert(
      "Cover Note",
      `Generating insurance certificate for ${formatPlate(vehicle.numberPlate)}...\n\nCover Note downloaded successfully!`,
      "success"
    );
  };

  const handleFileClaim = (vehicle: Vehicle) => {
    router.push({
      pathname: "/PolicyHolder/New_Claim" as any,
      params: { plate: vehicle.numberPlate }
    });
  };

  // Search & Filter Category logic
  const filteredVehicles = vehicles.filter((v) => {
    const term = searchQuery.toLowerCase();
    const matchesSearch =
      v.numberPlate.toLowerCase().includes(term) ||
      (v.company || "").toLowerCase().includes(term) ||
      (v.model || "").toLowerCase().includes(term) ||
      (v.policyNumber || "").toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (activeCategory === "All") return true;
    const cat = activeCategory.toLowerCase();
    const vType = (v.vehicleType || "").toLowerCase();

    if (cat === "car") return vType.includes("car");
    if (cat === "suv") return vType.includes("suv");
    if (cat === "bike") return vType.includes("bike") || vType.includes("motorcycle") || vType.includes("scooter");
    if (cat === "truck") return vType.includes("truck") || vType.includes("lorry");
    if (cat === "other") {
      return !vType.includes("car") && !vType.includes("suv") && !vType.includes("bike") && !vType.includes("motorcycle") && !vType.includes("scooter") && !vType.includes("truck") && !vType.includes("lorry");
    }

    return true;
  });

  const categories = [
    { id: "All", label: "All" },
    { id: "Car", label: "Cars" },
    { id: "SUV", label: "SUVs" },
    { id: "Bike", label: "Motorbikes" },
    { id: "Truck", label: "Trucks" },
    { id: "Other", label: "Others" }
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header Background */}
      <ImageBackground
        source={require("../../assets/images/policy1.jpg")}
        style={styles.headerBackground}
        imageStyle={styles.headerImageStyle}
      >
        <LinearGradient
          colors={["rgba(15, 23, 42, 0.95)", "rgba(15, 23, 42, 0.82)", "rgba(15, 23, 42, 0.5)"]}
          style={styles.headerGradient}
        >
          <Text style={styles.headerTitle}>My Vehicles</Text>
          <Text style={styles.headerSubtitle}>Registered vehicles and active insurance policies</Text>
        </LinearGradient>
      </ImageBackground>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={styles.loaderText}>Loading vehicles registry...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0284c7" colors={["#0284c7"]} />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {/* Search bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color="#64748b" style={styles.searchIcon} />
            <TextInput
              placeholder="Search make, plate, or policy..."
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>

          {/* Categories select tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContent}
          >
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setActiveCategory(cat.id)}
                  style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                >
                  <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Stats Summaries */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: "#f0f9ff" }]}>
                <MaterialCommunityIcons name="car-multiple" size={22} color="#0284c7" />
              </View>
              <View>
                <Text style={styles.statNum}>{vehicles.length}</Text>
                <Text style={styles.statLabel}>Total Insured</Text>
              </View>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: "#f0fdf4" }]}>
                <MaterialCommunityIcons name="shield-check" size={22} color="#16a34a" />
              </View>
              <View>
                <Text style={styles.statNum}>{vehicles.filter(v => v.policyNumber).length}</Text>
                <Text style={styles.statLabel}>Active Policies</Text>
              </View>
            </View>
          </View>

          {/* Vehicles list */}
          {filteredVehicles.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="car-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No matching vehicles found.</Text>
            </View>
          ) : (
            filteredVehicles.map((v, idx) => (
              <View key={idx} style={styles.vehicleCard}>
                {/* Header Row */}
                <View style={styles.cardHeader}>
                  <View style={styles.iconBox}>
                    <MaterialCommunityIcons name={vehicleIcon(v.vehicleType) as any} size={28} color="#0284c7" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.plateText}>{formatPlate(v.numberPlate)}</Text>
                    <Text style={styles.companyModelText}>
                      {[v.company, v.model].filter(Boolean).join(" ")} ({v.year})
                    </Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <View style={styles.dot} />
                    <Text style={styles.badgeLabel}>Active</Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                {/* Technical specs list */}
                <View style={styles.specsList}>
                  <View style={styles.specItem}>
                    <Text style={styles.specLabel}>Policy Number</Text>
                    <Text style={styles.specVal}>{v.policyNumber || "SGI-88942-019"}</Text>
                  </View>
                  <View style={styles.specItem}>
                    <Text style={styles.specLabel}>Vehicle Type</Text>
                    <Text style={styles.specVal}>{v.vehicleType || "Car"}</Text>
                  </View>
                  <View style={styles.specItem}>
                    <Text style={styles.specLabel}>Engine Number</Text>
                    <Text style={styles.specVal}>{v.engineNumber || "1NZ-FE-778122"}</Text>
                  </View>
                  <View style={styles.specItemNoBorder}>
                    <Text style={styles.specLabel}>Chassis Number</Text>
                    <Text style={styles.specVal}>{v.chassisNumber || "NZE141-8890204"}</Text>
                  </View>
                </View>

                {/* Quick actions row */}
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#fee2e2" }]}
                    onPress={() => handleFileClaim(v)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="alert-circle-outline" size={15} color="#dc2626" />
                    <Text style={[styles.actionBtnText, { color: "#dc2626" }]}>File Claim</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#e0f2fe" }]}
                    onPress={() => handleCoverNote(v)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="document-text-outline" size={15} color="#0284c7" />
                    <Text style={[styles.actionBtnText, { color: "#0284c7" }]}>Cover Note</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {/* Dashed Add Vehicle Card */}
          <TouchableOpacity
            style={styles.dashedAddCard}
            onPress={() => setIsAddModalOpen(true)}
            activeOpacity={0.7}
          >
            <View style={styles.dashedAddIconBox}>
              <Ionicons name="add-outline" size={26} color="#0284c7" />
            </View>
            <Text style={styles.dashedAddTitle}>Add Another Vehicle</Text>
            <Text style={styles.dashedAddDesc}>Register another vehicle to your active policy coverage</Text>
          </TouchableOpacity>

          {/* Galle office Support banner */}
          <View style={styles.helpBanner}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.helpTitle}>Need to update registry?</Text>
              <Text style={styles.helpDesc}>
                If any vehicle is missing, reach out to Galle regional office or message your agent.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.helpBtn}
              onPress={() => showCustomAlert("Support Contact", "Please call our Galle Regional office at: +94 91 224 8890", "info")}
            >
              <Text style={styles.helpBtnText}>Support</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Add Vehicle Modal */}
      <Modal
        visible={isAddModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContainer}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Vehicle</Text>
              </View>

              {validationError ? (
                <View style={styles.modalErrorBox}>
                  <Text style={styles.modalErrorText}>{validationError}</Text>
                </View>
              ) : null}

              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.modalFormScroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Field 1: Number Plate */}
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>Number Plate *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. WP-CBH-3202"
                    placeholderTextColor="#94a3b8"
                    value={newNumberPlate}
                    onChangeText={setNewNumberPlate}
                    autoCapitalize="characters"
                  />
                </View>

                {/* Field 2: Vehicle Type */}
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>Vehicle Type *</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.modalInput, styles.pickerTrigger]}
                    onPress={() => setActiveVehicleTypePicker(!activeVehicleTypePicker)}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                      <MaterialCommunityIcons
                        name={vehicleIcon(newVehicleType) as any}
                        size={20}
                        color="#0284c7"
                        style={{ marginRight: 10 }}
                      />
                      <Text style={styles.pickerText}>{newVehicleType}</Text>
                    </View>
                    <Ionicons name="chevron-down-outline" size={18} color="#64748b" />
                  </TouchableOpacity>

                  {activeVehicleTypePicker && (
                    <ScrollView style={styles.modalPickerDropdown} nestedScrollEnabled={true}>
                      {vehicleTypes.map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setNewVehicleType(type);
                            setActiveVehicleTypePicker(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{type}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* Field 3: Company */}
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>Company *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Toyota"
                    placeholderTextColor="#94a3b8"
                    value={newCompany}
                    onChangeText={setNewCompany}
                  />
                </View>

                {/* Field 4: Model */}
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>Model *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Corolla"
                    placeholderTextColor="#94a3b8"
                    value={newModel}
                    onChangeText={setNewModel}
                  />
                </View>

                {/* Field 5: Year */}
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>Year *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. 2020"
                    placeholderTextColor="#94a3b8"
                    value={newYear}
                    onChangeText={setNewYear}
                    keyboardType="numeric"
                  />
                </View>

                {/* Field 6: Policy Number */}
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>Insurance Policy Number *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. SAN12345"
                    placeholderTextColor="#94a3b8"
                    value={newPolicyNumber}
                    onChangeText={setNewPolicyNumber}
                    autoCapitalize="characters"
                  />
                </View>

                {/* Field 7: Engine Number */}
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>Engine Number *</Text>
                  <TextInput
                    style={[styles.modalInput, { fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" }]}
                    placeholder="e.g. 1NZ-FE-xxxx"
                    placeholderTextColor="#94a3b8"
                    value={newEngineNumber}
                    onChangeText={setNewEngineNumber}
                  />
                </View>

                {/* Field 8: Chassis Number */}
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>Chassis Number *</Text>
                  <TextInput
                    style={[styles.modalInput, { fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" }]}
                    placeholder="e.g. NZE141-xxxx"
                    placeholderTextColor="#94a3b8"
                    value={newChassisNumber}
                    onChangeText={setNewChassisNumber}
                  />
                </View>

                {/* Warning notice */}
                <View style={styles.modalWarningBox}>
                  <Ionicons name="warning-outline" size={16} color="#d97706" style={{ marginTop: 2, marginRight: 6 }} />
                  <Text style={styles.modalWarningText}>
                    <Text style={{ fontWeight: "800" }}>Important: </Text>
                    Your vehicle will be reviewed by office staff before submit. This usually takes 1-2 business days. You'll receive an email once approved.
                  </Text>
                </View>
              </ScrollView>

              {/* Modal Footer buttons */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setIsAddModalOpen(false)}
                >
                  <Text style={styles.modalCloseBtnText}>&lt; Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSubmitBtn, isSubmitting && { opacity: 0.7 }]}
                  disabled={isSubmitting}
                  onPress={handleAddVehicleSubmit}
                >
                  <Text style={styles.modalSubmitBtnText}>
                    {isSubmitting ? "Submitting..." : "Submit >"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <PolicyHolderNavbar />

      {customAlert && (
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <View style={[
              styles.alertIconCircle,
              customAlert.type === "success" && { backgroundColor: "rgba(74, 222, 128, 0.12)", borderColor: "rgba(74, 222, 128, 0.3)" },
              customAlert.type === "warning" && { backgroundColor: "rgba(239, 68, 68, 0.12)", borderColor: "rgba(239, 68, 68, 0.3)" },
            ]}>
              <Ionicons
                name={
                  customAlert.type === "success"
                    ? "checkmark-circle-outline"
                    : customAlert.type === "warning"
                      ? "alert-circle-outline"
                      : "information-circle-outline"
                }
                size={38}
                color={
                  customAlert.type === "success"
                    ? "#4ade80"
                    : customAlert.type === "warning"
                      ? "#f87171"
                      : "#ff9800"
                }
              />
            </View>
            <Text style={styles.alertTitle}>{customAlert.title}</Text>
            <Text style={styles.alertMsg}>{customAlert.message}</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                const cb = customAlert.onClose;
                setCustomAlert(null);
                if (cb) cb();
              }}
              style={styles.alertButton}
            >
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles: any = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 110 },
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

  /* Search Container */
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    marginBottom: 16,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: "#0f172a", fontWeight: "500" },

  /* Categories selection list */
  categoryScroll: { marginBottom: 16 },
  categoryContent: { gap: 8, paddingRight: 16 },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  categoryPillActive: {
    backgroundColor: "#0284c7",
    borderColor: "#025a87",
  },
  categoryText: { fontSize: 13, color: "#64748b", fontWeight: "700" },
  categoryTextActive: { color: "#ffffff" },

  /* Stats summary indicators */
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    gap: 12,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statNum: { fontSize: 20, fontWeight: "900", color: "#0f172a", lineHeight: 22 },
  statLabel: { fontSize: 10, color: "#94a3b8", fontWeight: "700", textTransform: "uppercase" },

  /* Vehicle Cards */
  vehicleCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    marginBottom: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#f0f9ff",
    alignItems: "center",
    justifyContent: "center",
  },
  plateText: { fontSize: 16, fontWeight: "800", color: "#0f172a", letterSpacing: 0.3 },
  companyModelText: { fontSize: 12, color: "#64748b", fontWeight: "600", marginTop: 2 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderWidth: 1.2,
    borderColor: "#bbf7d0",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22c55e", marginRight: 6 },
  badgeLabel: { fontSize: 10, color: "#16a34a", fontWeight: "800" },

  cardDivider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 14 },

  /* Specs list */
  specsList: {
    backgroundColor: "#f8fafc",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  specItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  specItemNoBorder: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  specLabel: { fontSize: 12.5, color: "#64748b", fontWeight: "600" },
  specVal: { fontSize: 12.5, color: "#0f172a", fontWeight: "800" },

  /* Card Actions Row */
  cardActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 99,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "800",
  },

  /* Dashed Add Vehicle Card */
  dashedAddCard: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    marginBottom: 16,
  },
  dashedAddIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0f9ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  dashedAddTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  dashedAddDesc: { fontSize: 11, color: "#64748b", fontWeight: "600", textAlign: "center", marginTop: 4, paddingHorizontal: 20 },

  /* Support Galle Office Banner */
  helpBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 24,
    padding: 16,
    marginTop: 8,
  },
  helpTitle: { fontSize: 15, fontWeight: "900", color: "#ffffff", marginBottom: 2 },
  helpDesc: { fontSize: 11.5, color: "#cbd5e1", fontWeight: "600", lineHeight: 15 },
  helpBtn: {
    backgroundColor: "#f97316",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 99,
  },
  helpBtnText: { fontSize: 12.5, fontWeight: "800", color: "#ffffff" },

  /* Empty placeholders */
  emptyCard: { backgroundColor: "#ffffff", borderRadius: 22, borderWidth: 1, borderColor: "#e2e8f0", paddingVertical: 40, alignItems: "center", gap: 10, marginBottom: 16 },
  emptyText: { fontSize: 13, color: "#64748b", fontWeight: "700" },

  /* Modal Styles */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalOverlay: {
    width: "100%",
    maxWidth: 480,
    height: "85%",
    borderRadius: 28,
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0f172a",
  },
  modalFormScroll: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 14,
  },
  formItem: {
    flexDirection: "column",
    gap: 6,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },
  modalInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    fontSize: 13.5,
    color: "#0f172a",
    fontWeight: "600",
  },
  pickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
  },
  pickerText: {
    fontSize: 13.5,
    color: "#0f172a",
    fontWeight: "600",
  },
  modalPickerDropdown: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    padding: 6,
    maxHeight: 180,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  modalWarningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fef3c7",
    borderRadius: 14,
    padding: 10,
    marginTop: 6,
  },
  modalWarningText: {
    flex: 1,
    fontSize: 11,
    color: "#b45309",
    fontWeight: "600",
    lineHeight: 14,
  },
  modalFooter: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 24,
    paddingVertical: 16,
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
  },
  modalCloseBtn: {
    backgroundColor: "#1e3a8a",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 99,
  },
  modalCloseBtnText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 13,
  },
  modalSubmitBtn: {
    backgroundColor: "#1e3a8a",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 99,
  },
  modalSubmitBtnText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 13,
  },
  modalErrorBox: {
    marginHorizontal: 24,
    marginTop: 14,
    padding: 10,
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  modalErrorText: {
    color: "#b91c1c",
    fontSize: 12,
    fontWeight: "700",
  },
  alertOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 11, 13, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  alertCard: {
    width: "85%",
    maxWidth: 340,
    backgroundColor: "rgba(10, 34, 40, 0.95)",
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.15)",
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  alertIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(255, 152, 0, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 152, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  alertMsg: {
    fontSize: 13.5,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  alertButton: {
    backgroundColor: "#ff9800",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 32,
    shadowColor: "#ff9800",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  alertButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});
