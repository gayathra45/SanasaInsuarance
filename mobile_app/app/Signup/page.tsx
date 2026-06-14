import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { API_BASE_URL } from "../config";

// Sri Lanka Provinces and Cities Data
const provincesData = [
  { id: "western", name: "Western Province", cities: ["Colombo", "Gampaha", "Kalutara", "Negombo", "Moratuwa"] },
  { id: "central", name: "Central Province", cities: ["Kandy", "Matale", "Nuwara Eliya", "Dambulla"] },
  { id: "southern", name: "Southern Province", cities: ["Galle", "Matara", "Hambantota", "Tangalle"] },
  { id: "northern", name: "Northern Province", cities: ["Jaffna", "Vavuniya", "Mannar", "Kilinochchi"] },
  { id: "eastern", name: "Eastern Province", cities: ["Trincomalee", "Batticaloa", "Ampara"] },
  { id: "north-western", name: "North Western Province", cities: ["Kurunegala", "Chilaw", "Puttalam"] },
  { id: "north-central", name: "North Central Province", cities: ["Anuradhapura", "Polonnaruwa"] },
  { id: "uva", name: "Uva Province", cities: ["Badulla", "Bandarawela", "Monaragala"] },
  { id: "sabaragamuwa", name: "Sabaragamuwa Province", cities: ["Ratnapura", "Kegalle", "Embilipitiya"] }
];

const vehicleTypes = ["Car", "SUV", "Cab / Double Cab", "Van", "Motorbike", "Three-Wheeler", "Lorry / Truck", "Bus", "Tractor"];

interface Vehicle {
  numberPlate: string;
  vehicleType: string;
  year: string;
  company: string;
  model: string;
  engineNumber: string;
  chassisNumber: string;
  policyNumber: string;
}

export default function MobileSignup() {
  const { width, height } = useWindowDimensions();

  // Wizard Steps (1: Personal, 2: Vehicles, 3: KYC, 4: Review)
  const [step, setStep] = useState(1);

  // STEP 1 State: Personal Details
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nic, setNic] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showProvincePicker, setShowProvincePicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeVehicleTypeIndex, setActiveVehicleTypeIndex] = useState<number | null>(null);

  // STEP 2 State: Vehicles Loop
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      numberPlate: "",
      vehicleType: "",
      year: "",
      company: "",
      model: "",
      engineNumber: "",
      chassisNumber: "",
      policyNumber: ""
    }
  ]);

  // STEP 3 State: Documents Upload Progress Simulation
  const [nicFront, setNicFront] = useState("");
  const [nicBack, setNicBack] = useState("");
  const [vehicleReg, setVehicleReg] = useState("");
  const [revenueLicense, setRevenueLicense] = useState("");

  const [uploadProgress, setUploadProgress] = useState({
    front: 0,
    back: 0,
    reg: 0,
    license: 0
  });

  const [uploadStatus, setUploadStatus] = useState({
    front: "idle",
    back: "idle",
    reg: "idle",
    license: "idle"
  });

  // STEP 4 State: Consents & Modal
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [consentData, setConsentData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [refNumber, setRefNumber] = useState("");
  const [customAlert, setCustomAlert] = useState<{ title: string; message: string } | null>(null);

  const showAlert = (title: string, message: string) => {
    setCustomAlert({ title, message });
  };

  const handleVehicleChange = (index: number, field: keyof Vehicle, val: string) => {
    const updated = [...vehicles];
    updated[index] = { ...updated[index], [field]: val };
    setVehicles(updated);
  };

  const addVehicle = () => {
    setVehicles([
      ...vehicles,
      { numberPlate: "", vehicleType: "", year: "", company: "", model: "", engineNumber: "", chassisNumber: "", policyNumber: "" }
    ]);
  };

  const removeVehicle = (index: number) => {
    if (vehicles.length > 1) {
      setVehicles(vehicles.filter((_, idx) => idx !== index));
    }
  };

  const triggerUpload = async (type: "front" | "back" | "reg" | "license") => {
    try {
      if (Platform.OS !== "web") {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          showAlert(
            "Permission Required",
            "You need to allow access to your photos to upload files."
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result) return;

      const isCanceled = result.canceled !== undefined ? result.canceled : (result as any).cancelled;
      if (isCanceled) return;

      let fileUri = "";
      if (result.assets && result.assets.length > 0) {
        fileUri = result.assets[0].uri;
      } else if ((result as any).uri) {
        fileUri = (result as any).uri;
      }

      if (!fileUri) return;

      const fileName = fileUri.split("/").pop() || `${type}_doc.jpg`;

      if (type === "front") setNicFront(fileName);
      else if (type === "back") setNicBack(fileName);
      else if (type === "reg") setVehicleReg(fileName);
      else if (type === "license") setRevenueLicense(fileName);

      setUploadStatus((prev) => ({ ...prev, [type]: "uploading" }));
      setUploadProgress((prev) => ({ ...prev, [type]: 0 }));

      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        if (progress >= 100) {
          progress = 100;
          setUploadStatus((prev) => ({ ...prev, [type]: "done" }));
          clearInterval(interval);
        }
        setUploadProgress((prev) => ({ ...prev, [type]: progress }));
      }, 150);

    } catch (err) {
      console.error("Image picker error:", err);
      showAlert("Error", "Could not load image library.");
    }
  };

  // Password Strength Check Helper
  const getPasswordStrength = () => {
    if (!password) return { label: "", color: "#ef4444", width: "0%", strength: 0 };
    let score = 0;
    if (password.length >= 6 && password.length <= 12) score += 1;
    if (password.length >= 8 && password.length <= 12) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;

    switch (score) {
      case 1:
        return { label: "Weak", color: "#ef4444", width: "25%", strength: 1 };
      case 2:
        return { label: "Fair", color: "#f97316", width: "50%", strength: 2 };
      case 3:
        return { label: "Good", color: "#eab308", width: "75%", strength: 3 };
      case 4:
        return { label: "Strong", color: "#22c55e", width: "100%", strength: 4 };
      default:
        return { label: "Weak", color: "#ef4444", width: "25%", strength: 1 };
    }
  };

  const strength = getPasswordStrength();

  const showDatepicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: dob ? new Date(dob) : new Date(),
        onChange: (event, selectedDate) => {
          if (event.type === "set" && selectedDate) {
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            setDob(`${year}-${month}-${day}`);
          }
        },
        mode: "date",
        maximumDate: new Date(),
      });
    } else {
      setShowDatePicker(true);
    }
  };

  // Step Navigations & Validations
  const handleNextStep = async () => {
    if (step === 1) {
      // Validate Step 1
      if (!firstName || !lastName || !nic || !mobile || !email || !dob || !address || !province || !city || !password || !confirmPassword) {
        showAlert("Validation Error", "All fields marked with * are required.");
        return;
      }

      const nicRegex = /^\d{8,11}[0-9vVxX]$/;
      if (!nicRegex.test(nic.trim())) {
        showAlert("Validation Error", "Invalid NIC Number (Must be 9-12 characters, ending with V or X).");
        return;
      }

      const cleanMobile = mobile.replace(/[-+()\s]/g, "");
      if (!/^\d{9,10}$/.test(cleanMobile)) {
        showAlert("Validation Error", "Mobile number must be exactly 9 or 10 digits.");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showAlert("Validation Error", "Please enter a valid email address.");
        return;
      }

      if (password.length < 6 || password.length > 12) {
        showAlert("Validation Error", "Password must be between 6 and 12 characters.");
        return;
      }

      if (!/[0-9]/.test(password) && !/[^A-Za-z0-9]/.test(password)) {
        showAlert("Validation Error", "Password must contain at least one number or special character.");
        return;
      }

      if (password !== confirmPassword) {
        showAlert("Validation Error", "Passwords do not match!");
        return;
      }

      // Check DB if NIC or Email exists
      try {
        const res = await fetch(`${API_BASE_URL}/api/signup/check?email=${encodeURIComponent(email)}&nic=${encodeURIComponent(nic.trim())}`);
        if (!res.ok) {
          throw new Error();
        }
        const checkData = await res.json();
        if (checkData.emailExists) {
          showAlert("Validation Error", "This email address is already registered.");
          return;
        }
        if (checkData.nicExists) {
          showAlert("Validation Error", "This NIC number is already registered.");
          return;
        }
      } catch (err) {
        showAlert("Connection Error", "Cannot connect to server. Running offline validation instead.");
      }

      setStep(2);
    } else if (step === 2) {
      // Validate Step 2 Vehicles
      for (let i = 0; i < vehicles.length; i++) {
        const v = vehicles[i];
        if (!v.numberPlate || !v.vehicleType || !v.year || !v.company || !v.model || !v.engineNumber || !v.chassisNumber || !v.policyNumber) {
          showAlert("Validation Error", `Please fill out all details for Vehicle #${i + 1}.`);
          return;
        }

        const cleanPlate = v.numberPlate.replace(/[\s-]/g, "");
        if (cleanPlate.length < 5 || cleanPlate.length > 10 || !/^[A-Za-z0-9]+$/.test(cleanPlate)) {
          showAlert("Validation Error", `Vehicle #${i + 1} Number Plate must be 5 to 10 alphanumeric characters.`);
          return;
        }

        if (!/^\d{4}$/.test(v.year)) {
          showAlert("Validation Error", `Vehicle #${i + 1} Year must be a 4-digit number.`);
          return;
        }

        const cleanPolicy = v.policyNumber.replace(/[\s-]/g, "");
        if (!/^SAN[A-Za-z0-9]{5,9}$/i.test(cleanPolicy)) {
          showAlert("Validation Error", `Vehicle #${i + 1} Policy must start with 'SAN' and be between 8 and 12 characters.`);
          return;
        }
      }

      setStep(3);
    } else if (step === 3) {
      // Validate step 3 Documents
      if (
        uploadStatus.front !== "done" ||
        uploadStatus.back !== "done" ||
        uploadStatus.reg !== "done" ||
        uploadStatus.license !== "done"
      ) {
        showAlert("Validation Error", "Please upload and complete verification for all four documents.");
        return;
      }

      setStep(4);
    }
  };

  const handleBackStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.push("/login/page");
    }
  };

  const handleFinalSubmit = async () => {
    if (!agreeTerms || !consentData) {
      showAlert("Consent Required", "You must agree to all policies and data processing terms.");
      return;
    }

    setIsSubmitting(true);

    const requestBody = {
      personal: {
        firstName,
        lastName,
        nic: nic.trim(),
        mobile: mobile.replace(/[-+()\s]/g, ""),
        email,
        dob,
        address,
        province,
        city,
        password
      },
      vehicles,
      documents: {
        nicFront,
        nicBack,
        vehicleReg,
        revenueLicense
      }
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Signup request failed.");
      }

      setRefNumber(data.referenceNumber);
      setShowSuccessModal(true);

      setTimeout(() => {
        router.push("/login/page");
      }, 3000);

    } catch (err: any) {
      showAlert("Registration Failed", err.message || "An error occurred while connecting to the database server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProvince = provincesData.find((p) => p.name === province);
  const activeCities = selectedProvince ? selectedProvince.cities : [];

  return (
    <ImageBackground
      source={require("../../assets/images/login_bg.jpg")}
      style={styles.backgroundImage}
      resizeMode="cover"
      blurRadius={10}
    >
      <StatusBar style="light" />
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { minHeight: height }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar with Back to Login Button */}
          <View style={styles.topBar}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/login/page")}
              style={styles.topBackBtn}
            >
              <Ionicons name="arrow-back-outline" size={18} color="#fff" />
              <Text style={styles.topBackBtnText}>Back to Login</Text>
            </TouchableOpacity>
          </View>

          {/* Header Title Section */}
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>Create an Account</Text>
            <Text style={styles.headerSubtitle}>
              Follow the steps to register your account with Sanasa General Insurance.
            </Text>
          </View>

          {/* MODERN SEGMENTED PILL STEP TRACKER */}
          <View style={styles.trackerContainer}>
            <View style={styles.pillContainer}>
              {[1, 2, 3, 4].map((num) => {
                const isActive = step === num;
                const isCompleted = step > num;
                return (
                  <View
                    key={num}
                    style={[
                      styles.trackerPill,
                      isCompleted && styles.trackerPillCompleted,
                      isActive && styles.trackerPillActive,
                    ]}
                  />
                );
              })}
            </View>
            <View style={styles.trackerLabelContainer}>
              <Text style={styles.trackerStepText}>STEP 0{step} OF 04</Text>
              <Text style={styles.trackerStepTitle}>
                {step === 1 && "Personal Details"}
                {step === 2 && "Vehicle Details"}
                {step === 3 && "Identity Verification"}
                {step === 4 && "Review & Confirm"}
              </Text>
            </View>
          </View>

          {/* Form Wizard Glass Card Container */}
          <View style={styles.glassCard}>
            
            {/* ==================== STEP 1: PERSONAL DETAILS ==================== */}
            {step === 1 && (
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <Ionicons name="person-outline" size={22} color="#ff9800" />
                  <Text style={styles.stepTitle}>Personal Details</Text>
                </View>

                {/* Grid Inputs */}
                <View style={styles.inputGrid}>
                  <View style={styles.inputBox}>
                    <Text style={styles.inputLabel}>First Name *</Text>
                    <TextInput style={styles.textInput} placeholder="Amal" placeholderTextColor="#94a3b8" value={firstName} onChangeText={setFirstName} />
                  </View>
                  <View style={styles.inputBox}>
                    <Text style={styles.inputLabel}>Last Name *</Text>
                    <TextInput style={styles.textInput} placeholder="Perera" placeholderTextColor="#94a3b8" value={lastName} onChangeText={setLastName} />
                  </View>
                </View>

                <View style={styles.inputBox}>
                  <Text style={styles.inputLabel}>NIC Number *</Text>
                  <TextInput style={styles.textInput} placeholder="200123500688" placeholderTextColor="#94a3b8" value={nic} onChangeText={setNic} autoCapitalize="none" />
                </View>

                <View style={styles.inputBox}>
                  <Text style={styles.inputLabel}>Mobile Number *</Text>
                  <TextInput style={styles.textInput} placeholder="0771234567" placeholderTextColor="#94a3b8" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" />
                </View>

                <View style={styles.inputBox}>
                  <Text style={styles.inputLabel}>Email Address *</Text>
                  <TextInput style={styles.textInput} placeholder="Amalperera@gmail.com" placeholderTextColor="#94a3b8" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                </View>

                <View style={styles.inputBox}>
                  <Text style={styles.inputLabel}>Date of Birth *</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.pickerSelector}
                    onPress={showDatepicker}
                  >
                    <Text style={[styles.pickerSelectorText, dob ? styles.pickerSelected : null]}>
                      {dob || "YYYY-MM-DD"}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color="#64748b" />
                  </TouchableOpacity>
                  {Platform.OS === "ios" && showDatePicker && (
                    <DateTimePicker
                      value={dob ? new Date(dob) : new Date()}
                      mode="date"
                      display="default"
                      maximumDate={new Date()}
                      onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                          const year = selectedDate.getFullYear();
                          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                          const day = String(selectedDate.getDate()).padStart(2, '0');
                          setDob(`${year}-${month}-${day}`);
                        }
                      }}
                    />
                  )}
                </View>

                <View style={styles.inputBox}>
                  <Text style={styles.inputLabel}>Residential Address *</Text>
                  <TextInput style={[styles.textInput, { height: 120, paddingVertical: 12 }]} multiline numberOfLines={4} placeholder="No 44, Malagane Road" placeholderTextColor="#94a3b8" value={address} onChangeText={setAddress} />
                </View>

                {/* Province Picker dropdown mockup */}
                <View style={styles.inputBox}>
                  <Text style={styles.inputLabel}>Province *</Text>
                  <TouchableOpacity activeOpacity={0.7} style={styles.pickerSelector} onPress={() => setShowProvincePicker(!showProvincePicker)}>
                    <Text style={[styles.pickerSelectorText, province ? styles.pickerSelected : null]}>
                      {province || "Select Province"}
                    </Text>
                    <Ionicons name="chevron-down-outline" size={20} color="#64748b" />
                  </TouchableOpacity>
                  {showProvincePicker && (
                    <ScrollView style={styles.dropdownOverlay} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                      {provincesData.map((p) => (
                        <TouchableOpacity key={p.id} style={styles.dropdownOption} onPress={() => { setProvince(p.name); setShowProvincePicker(false); }}>
                          <Text style={styles.dropdownOptionText}>{p.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* City Picker dropdown mockup */}
                <View style={styles.inputBox}>
                  <Text style={styles.inputLabel}>City *</Text>
                  <TouchableOpacity activeOpacity={0.7} style={[styles.pickerSelector, !province && { opacity: 0.6 }]} disabled={!province} onPress={() => setShowCityPicker(!showCityPicker)}>
                    <Text style={[styles.pickerSelectorText, city ? styles.pickerSelected : null]}>
                      {city || "Select City"}
                    </Text>
                    <Ionicons name="chevron-down-outline" size={20} color="#64748b" />
                  </TouchableOpacity>
                  {showCityPicker && (
                    <ScrollView style={styles.dropdownOverlay} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                      {activeCities.map((c) => (
                        <TouchableOpacity key={c} style={styles.dropdownOption} onPress={() => { setCity(c); setShowCityPicker(false); }}>
                          <Text style={styles.dropdownOptionText}>{c}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* Password Fields */}
                <View style={styles.inputBox}>
                  <Text style={styles.inputLabel}>Password *</Text>
                  <View style={styles.inputWithToggle}>
                    <TextInput style={[styles.textInput, { flex: 1 }]} placeholder="Password" placeholderTextColor="#94a3b8" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} autoCapitalize="none" />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.toggleIcon}>
                      <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                  {password ? (
                    <View style={styles.strengthContainer}>
                      <View style={styles.strengthHeader}>
                        <Text style={styles.strengthLabel}>Password Strength:</Text>
                        <Text style={[styles.strengthValue, { color: strength.color }]}>{strength.label}</Text>
                      </View>
                      <View style={styles.strengthBarBg}>
                        <View style={[styles.strengthBarFill, { width: strength.width as any, backgroundColor: strength.color }]} />
                      </View>
                      
                      <View style={styles.rulesContainer}>
                        <View style={styles.ruleRow}>
                          <Ionicons 
                            name={password.length >= 6 && password.length <= 12 ? "checkmark-circle" : "close-circle"} 
                            size={14} 
                            color={password.length >= 6 && password.length <= 12 ? "#4ade80" : "#f87171"} 
                          />
                          <Text style={[styles.ruleText, { color: password.length >= 6 && password.length <= 12 ? "#e2e8f0" : "#cbd5e1" }]}>
                            6 to 12 characters
                          </Text>
                        </View>
                        <View style={styles.ruleRow}>
                          <Ionicons 
                            name={/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password) ? "checkmark-circle" : "close-circle"} 
                            size={14} 
                            color={/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password) ? "#4ade80" : "#f87171"} 
                          />
                          <Text style={[styles.ruleText, { color: /[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password) ? "#e2e8f0" : "#cbd5e1" }]}>
                            Min. 1 number or special character
                          </Text>
                        </View>
                        <View style={styles.ruleRow}>
                          <Ionicons 
                            name={confirmPassword && password === confirmPassword ? "checkmark-circle" : "close-circle"} 
                            size={14} 
                            color={confirmPassword && password === confirmPassword ? "#4ade80" : "#f87171"} 
                          />
                          <Text style={[styles.ruleText, { color: confirmPassword && password === confirmPassword ? "#e2e8f0" : "#cbd5e1" }]}>
                            Passwords match
                          </Text>
                        </View>
                      </View>
                    </View>
                  ) : null}
                </View>

                <View style={styles.inputBox}>
                  <Text style={styles.inputLabel}>Confirm Password *</Text>
                  <View style={styles.inputWithToggle}>
                    <TextInput style={[styles.textInput, { flex: 1 }]} placeholder="Confirm Password" placeholderTextColor="#94a3b8" secureTextEntry={!showConfirmPassword} value={confirmPassword} onChangeText={setConfirmPassword} autoCapitalize="none" />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.toggleIcon}>
                      <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* ==================== STEP 2: VEHICLE DETAILS ==================== */}
            {step === 2 && (
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <Ionicons name="car-sport-outline" size={22} color="#ff9800" />
                  <Text style={styles.stepTitle}>Vehicle Details</Text>
                </View>

                {vehicles.map((veh, idx) => (
                  <View key={idx} style={[styles.vehicleBlock, idx > 0 && styles.vehicleDivider]}>
                    <View style={styles.vehicleBlockHeader}>
                      <Text style={styles.vehicleTitle}>Vehicle #{idx + 1}</Text>
                      {vehicles.length > 1 && (
                        <TouchableOpacity style={styles.removeBtn} onPress={() => removeVehicle(idx)}>
                          <Text style={styles.removeBtnText}>Remove</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.inputBox}>
                      <Text style={styles.inputLabel}>Number Plate *</Text>
                      <TextInput style={styles.textInput} placeholder="WP-CAD-8849" placeholderTextColor="#94a3b8" value={veh.numberPlate} onChangeText={(val) => handleVehicleChange(idx, "numberPlate", val)} autoCapitalize="characters" />
                    </View>

                    <View style={styles.inputBox}>
                      <Text style={styles.inputLabel}>Vehicle Type *</Text>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.pickerSelector}
                        onPress={() => setActiveVehicleTypeIndex(activeVehicleTypeIndex === idx ? null : idx)}
                      >
                        <Text style={[styles.pickerSelectorText, veh.vehicleType ? styles.pickerSelected : null]}>
                          {veh.vehicleType || "Select Vehicle Type"}
                        </Text>
                        <Ionicons name="chevron-down-outline" size={20} color="#64748b" />
                      </TouchableOpacity>
                      {activeVehicleTypeIndex === idx && (
                        <ScrollView style={styles.dropdownOverlay} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                          {vehicleTypes.map((type) => (
                            <TouchableOpacity
                              key={type}
                              style={styles.dropdownOption}
                              onPress={() => {
                                handleVehicleChange(idx, "vehicleType", type);
                                setActiveVehicleTypeIndex(null);
                              }}
                            >
                              <Text style={styles.dropdownOptionText}>{type}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>

                    <View style={styles.inputGrid}>
                      <View style={styles.inputBox}>
                        <Text style={styles.inputLabel}>Year *</Text>
                        <TextInput style={styles.textInput} placeholder="2020" placeholderTextColor="#94a3b8" value={veh.year} onChangeText={(val) => handleVehicleChange(idx, "year", val)} keyboardType="numeric" />
                      </View>
                      <View style={styles.inputBox}>
                        <Text style={styles.inputLabel}>Company (Make) *</Text>
                        <TextInput style={styles.textInput} placeholder="Toyota" placeholderTextColor="#94a3b8" value={veh.company} onChangeText={(val) => handleVehicleChange(idx, "company", val)} />
                      </View>
                    </View>

                    <View style={styles.inputBox}>
                      <Text style={styles.inputLabel}>Model *</Text>
                      <TextInput style={styles.textInput} placeholder="Prius" placeholderTextColor="#94a3b8" value={veh.model} onChangeText={(val) => handleVehicleChange(idx, "model", val)} />
                    </View>

                    <View style={styles.inputBox}>
                      <Text style={styles.inputLabel}>Engine Number *</Text>
                      <TextInput style={styles.textInput} placeholder="ENG12345" placeholderTextColor="#94a3b8" value={veh.engineNumber} onChangeText={(val) => handleVehicleChange(idx, "engineNumber", val)} autoCapitalize="none" />
                    </View>

                    <View style={styles.inputBox}>
                      <Text style={styles.inputLabel}>Chassis Number *</Text>
                      <TextInput style={styles.textInput} placeholder="CHS54321" placeholderTextColor="#94a3b8" value={veh.chassisNumber} onChangeText={(val) => handleVehicleChange(idx, "chassisNumber", val)} autoCapitalize="none" />
                    </View>

                    <View style={styles.inputBox}>
                      <Text style={styles.inputLabel}>Insurance Policy Number *</Text>
                      <TextInput style={styles.textInput} placeholder="SAN12345678" placeholderTextColor="#94a3b8" value={veh.policyNumber} onChangeText={(val) => handleVehicleChange(idx, "policyNumber", val)} autoCapitalize="none" />
                    </View>
                  </View>
                ))}

                <TouchableOpacity style={styles.addVehicleBtn} onPress={addVehicle}>
                  <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  <Text style={styles.addVehicleBtnText}>Add Another Vehicle</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ==================== STEP 3: DOCUMENT VERIFICATION ==================== */}
            {step === 3 && (
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <Ionicons name="cloud-upload-outline" size={22} color="#ff9800" />
                  <Text style={styles.stepTitle}>Verification Documents (KYC)</Text>
                </View>
                <Text style={styles.stepDesc}>
                  Please simulate uploading the clear copy of registration documents. Click each block to upload.
                </Text>

                {/* Front side upload */}
                <View style={styles.docBlock}>
                  <Text style={styles.docLabel}>NIC Front Side *</Text>
                  <TouchableOpacity activeOpacity={0.7} style={[styles.docSelector, uploadStatus.front === "done" && styles.docSelectorDone]} onPress={() => triggerUpload("front")}>
                    {uploadStatus.front === "idle" && (
                      <View style={styles.docPlaceholder}>
                        <Ionicons name="camera-outline" size={26} color="rgba(255,255,255,0.5)" />
                        <Text style={styles.docText}>Click to upload NIC Front Side</Text>
                      </View>
                    )}
                    {uploadStatus.front === "uploading" && (
                      <View style={styles.progressSection}>
                        <Text style={styles.progressText}>Uploading Front Side... {uploadProgress.front}%</Text>
                        <View style={styles.progressBarBg}>
                          <View style={[styles.progressBarFill, { width: `${uploadProgress.front}%` }]} />
                        </View>
                      </View>
                    )}
                    {uploadStatus.front === "done" && (
                      <View style={styles.docDone}>
                        <Ionicons name="checkmark-circle" size={26} color="#4ade80" />
                        <Text style={styles.docDoneText}>{nicFront}</Text>
                        <Text style={styles.docDoneSubText}>Upload Completed</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Back side upload */}
                <View style={styles.docBlock}>
                  <Text style={styles.docLabel}>NIC Back Side *</Text>
                  <TouchableOpacity activeOpacity={0.7} style={[styles.docSelector, uploadStatus.back === "done" && styles.docSelectorDone]} onPress={() => triggerUpload("back")}>
                    {uploadStatus.back === "idle" && (
                      <View style={styles.docPlaceholder}>
                        <Ionicons name="camera-outline" size={26} color="rgba(255,255,255,0.5)" />
                        <Text style={styles.docText}>Click to upload NIC Back Side</Text>
                      </View>
                    )}
                    {uploadStatus.back === "uploading" && (
                      <View style={styles.progressSection}>
                        <Text style={styles.progressText}>Uploading Back Side... {uploadProgress.back}%</Text>
                        <View style={styles.progressBarBg}>
                          <View style={[styles.progressBarFill, { width: `${uploadProgress.back}%` }]} />
                        </View>
                      </View>
                    )}
                    {uploadStatus.back === "done" && (
                      <View style={styles.docDone}>
                        <Ionicons name="checkmark-circle" size={26} color="#4ade80" />
                        <Text style={styles.docDoneText}>{nicBack}</Text>
                        <Text style={styles.docDoneSubText}>Upload Completed</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Vehicle Reg upload */}
                <View style={styles.docBlock}>
                  <Text style={styles.docLabel}>Vehicle Registration Document *</Text>
                  <TouchableOpacity activeOpacity={0.7} style={[styles.docSelector, uploadStatus.reg === "done" && styles.docSelectorDone]} onPress={() => triggerUpload("reg")}>
                    {uploadStatus.reg === "idle" && (
                      <View style={styles.docPlaceholder}>
                        <Ionicons name="document-text-outline" size={26} color="rgba(255,255,255,0.5)" />
                        <Text style={styles.docText}>Click to upload Registration Document</Text>
                      </View>
                    )}
                    {uploadStatus.reg === "uploading" && (
                      <View style={styles.progressSection}>
                        <Text style={styles.progressText}>Uploading Document... {uploadProgress.reg}%</Text>
                        <View style={styles.progressBarBg}>
                          <View style={[styles.progressBarFill, { width: `${uploadProgress.reg}%` }]} />
                        </View>
                      </View>
                    )}
                    {uploadStatus.reg === "done" && (
                      <View style={styles.docDone}>
                        <Ionicons name="checkmark-circle" size={26} color="#4ade80" />
                        <Text style={styles.docDoneText}>{vehicleReg}</Text>
                        <Text style={styles.docDoneSubText}>Upload Completed</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Revenue License upload */}
                <View style={styles.docBlock}>
                  <Text style={styles.docLabel}>Revenue License *</Text>
                  <TouchableOpacity activeOpacity={0.7} style={[styles.docSelector, uploadStatus.license === "done" && styles.docSelectorDone]} onPress={() => triggerUpload("license")}>
                    {uploadStatus.license === "idle" && (
                      <View style={styles.docPlaceholder}>
                        <Ionicons name="document-text-outline" size={26} color="rgba(255,255,255,0.5)" />
                        <Text style={styles.docText}>Click to upload Revenue License</Text>
                      </View>
                    )}
                    {uploadStatus.license === "uploading" && (
                      <View style={styles.progressSection}>
                        <Text style={styles.progressText}>Uploading License... {uploadProgress.license}%</Text>
                        <View style={styles.progressBarBg}>
                          <View style={[styles.progressBarFill, { width: `${uploadProgress.license}%` }]} />
                        </View>
                      </View>
                    )}
                    {uploadStatus.license === "done" && (
                      <View style={styles.docDone}>
                        <Ionicons name="checkmark-circle" size={26} color="#4ade80" />
                        <Text style={styles.docDoneText}>{revenueLicense}</Text>
                        <Text style={styles.docDoneSubText}>Upload Completed</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ==================== STEP 4: REVIEW & CONFIRM ==================== */}
            {step === 4 && (
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <Ionicons name="create-outline" size={22} color="#ff9800" />
                  <Text style={styles.stepTitle}>Review & Confirm</Text>
                </View>
                <Text style={styles.stepDesc}>
                  Please review the details. Tick the compliance checks below to complete.
                </Text>

                <View style={styles.reviewBlock}>
                  <Text style={styles.reviewTitle}>PERSONAL DETAILS</Text>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Full Name:</Text>
                    <Text style={styles.reviewValue}>{firstName} {lastName}</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>NIC:</Text>
                    <Text style={styles.reviewValue}>{nic}</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Mobile:</Text>
                    <Text style={styles.reviewValue}>{mobile}</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Email:</Text>
                    <Text style={styles.reviewValue}>{email}</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Location:</Text>
                    <Text style={styles.reviewValue}>{city}, {province}</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Address:</Text>
                    <Text style={styles.reviewValue}>{address}</Text>
                  </View>
                </View>

                <View style={styles.reviewBlock}>
                  <Text style={styles.reviewTitle}>VEHICLE DETAILS ({vehicles.length})</Text>
                  {vehicles.map((v, i) => (
                    <View key={i} style={styles.reviewVehicleBlock}>
                      <Text style={styles.reviewVehicleTitle}>Vehicle #{i + 1}</Text>
                      <View style={styles.reviewRow}>
                        <Text style={styles.reviewLabel}>Plate Number:</Text>
                        <Text style={styles.reviewValue}>{v.numberPlate}</Text>
                      </View>
                      <View style={styles.reviewRow}>
                        <Text style={styles.reviewLabel}>Make / Model:</Text>
                        <Text style={styles.reviewValue}>{v.company} {v.model} ({v.vehicleType})</Text>
                      </View>
                      <View style={styles.reviewRow}>
                        <Text style={styles.reviewLabel}>Policy Number:</Text>
                        <Text style={styles.reviewValue}>{v.policyNumber}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Consent Toggles */}
                <View style={styles.consentBlock}>
                  <TouchableOpacity activeOpacity={0.7} style={styles.checkboxRow} onPress={() => setAgreeTerms(!agreeTerms)}>
                    <Ionicons
                      name={agreeTerms ? "checkbox" : "square-outline"}
                      size={24}
                      color={agreeTerms ? "#ff9800" : "rgba(255,255,255,0.6)"}
                    />
                    <Text style={styles.checkboxText}>
                      I agree to the Terms of Service and Privacy Policy of Sanasa General Insurance.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity activeOpacity={0.7} style={styles.checkboxRow} onPress={() => setConsentData(!consentData)}>
                    <Ionicons
                      name={consentData ? "checkbox" : "square-outline"}
                      size={24}
                      color={consentData ? "#ff9800" : "rgba(255,255,255,0.6)"}
                    />
                    <Text style={styles.checkboxText}>
                      I consent to the collection and processing of my identity verification details.
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Bottom Actions Navigation */}
            <View style={styles.bottomActions}>
              <TouchableOpacity activeOpacity={0.8} style={styles.actionBtnBack} onPress={handleBackStep}>
                <Ionicons name="arrow-back-outline" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>{step === 1 ? "Back to Login" : "Back"}</Text>
              </TouchableOpacity>

              {step < 4 ? (
                <TouchableOpacity activeOpacity={0.8} style={styles.actionBtnNext} onPress={handleNextStep}>
                  <Text style={styles.actionBtnText}>Next</Text>
                  <Ionicons name="arrow-forward-outline" size={18} color="#fff" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity activeOpacity={0.8} style={[styles.actionBtnNext, isSubmitting && { opacity: 0.6 }]} disabled={isSubmitting} onPress={handleFinalSubmit}>
                  <Text style={styles.actionBtnText}>{isSubmitting ? "Submitting..." : "Submit"}</Text>
                  <Ionicons name="checkmark-outline" size={18} color="#fff" />
                </TouchableOpacity>
              )}
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Done Popup Success Modal */}
      {showSuccessModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.checkmarkCircle}>
              <Ionicons name="checkmark" size={48} color="#4ade80" />
            </View>
            <Text style={styles.modalTitle}>Done!</Text>
            <Text style={styles.modalMsg}>
              Your registration with Sanasa General Insurance has been successfully submitted.
            </Text>
            {refNumber ? (
              <View style={styles.refBox}>
                <Text style={styles.refLabel}>REFERENCE NUMBER</Text>
                <Text style={styles.refValue}>{refNumber}</Text>
              </View>
            ) : null}
            <Text style={styles.modalRedirect}>Redirecting to Login...</Text>
          </View>
        </View>
      )}
      {customAlert && (
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <View style={styles.alertIconCircle}>
              <Ionicons name="warning-outline" size={38} color="#ff9800" />
            </View>
            <Text style={styles.alertTitle}>{customAlert.title}</Text>
            <Text style={styles.alertMsg}>{customAlert.message}</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setCustomAlert(null)}
              style={styles.alertButton}
            >
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 18, 21, 0.88)",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13.5,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 320,
  },
  trackerContainer: {
    width: "100%",
    paddingHorizontal: 8,
    marginBottom: 24,
    gap: 12,
  },
  pillContainer: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    height: 4,
  },
  trackerPill: {
    flex: 1,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: 2,
  },
  trackerPillActive: {
    backgroundColor: "#ff9800",
    shadowColor: "#ff9800",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
  },
  trackerPillCompleted: {
    backgroundColor: "#00cc66",
  },
  trackerLabelContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
  },
  trackerStepText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#ff9800",
    letterSpacing: 1,
  },
  trackerStepTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  glassCard: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 36,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.18)",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  stepContainer: {
    gap: 16,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.12)",
    paddingBottom: 12,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  stepDesc: {
    fontSize: 13.5,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 18,
    marginBottom: 8,
  },
  inputGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  inputBox: {
    flex: 1,
    gap: 8,
  },
  inputLabel: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "600",
    marginLeft: 4,
  },
  textInput: {
    backgroundColor: "#fff",
    borderRadius: 18,
    height: 48,
    paddingHorizontal: 16,
    color: "#1e293b",
    fontSize: 14.5,
    fontWeight: "500",
  },
  inputWithToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
    height: 48,
    paddingRight: 12,
  },
  toggleIcon: {
    padding: 6,
  },
  pickerSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 18,
    height: 48,
    paddingHorizontal: 16,
  },
  pickerSelectorText: {
    fontSize: 14.5,
    color: "#94a3b8",
    fontWeight: "500",
  },
  pickerSelected: {
    color: "#1e293b",
  },
  dropdownOverlay: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginTop: 4,
    padding: 8,
    maxHeight: 180,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 99,
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f1f5f9",
  },
  dropdownOptionText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "500",
  },
  vehicleBlock: {
    gap: 14,
  },
  vehicleDivider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    paddingTop: 20,
    marginTop: 10,
  },
  vehicleBlockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff9800",
  },
  removeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  removeBtnText: {
    color: "#f87171",
    fontSize: 12,
    fontWeight: "bold",
  },
  addVehicleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 46,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.4)",
    marginTop: 10,
  },
  addVehicleBtnText: {
    color: "#fff",
    fontSize: 14.5,
    fontWeight: "bold",
  },
  docBlock: {
    gap: 8,
    marginBottom: 12,
  },
  docLabel: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "600",
    marginLeft: 2,
  },
  docSelector: {
    height: 100,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  docSelectorDone: {
    borderStyle: "solid",
    borderColor: "rgba(74, 222, 128, 0.4)",
    backgroundColor: "rgba(74, 222, 128, 0.05)",
  },
  docPlaceholder: {
    alignItems: "center",
    gap: 6,
  },
  docText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "500",
  },
  progressSection: {
    width: "80%",
    alignItems: "center",
    gap: 8,
  },
  progressText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  progressBarBg: {
    width: "100%",
    height: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#ff9800",
  },
  docDone: {
    alignItems: "center",
    gap: 2,
  },
  docDoneText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
  docDoneSubText: {
    color: "#4ade80",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  reviewBlock: {
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 14,
    gap: 10,
    marginBottom: 8,
  },
  reviewTitle: {
    fontSize: 12.5,
    fontWeight: "bold",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingBottom: 6,
    marginBottom: 2,
  },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13.5,
    fontWeight: "500",
  },
  reviewValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  reviewVehicleBlock: {
    gap: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingBottom: 8,
    marginBottom: 4,
  },
  reviewVehicleTitle: {
    color: "#ff9800",
    fontSize: 13.5,
    fontWeight: "bold",
  },
  consentBlock: {
    gap: 14,
    marginTop: 8,
  },
  checkboxRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  checkboxText: {
    flex: 1,
    color: "rgba(255,255,255,0.8)",
    fontSize: 12.5,
    lineHeight: 16,
  },
  bottomActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 18,
    marginTop: 24,
  },
  actionBtnBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    height: 40,
    paddingHorizontal: 16,
  },
  actionBtnNext: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ff9800",
    borderRadius: 20,
    height: 40,
    paddingHorizontal: 20,
    shadowColor: "#ff9800",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 11, 13, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  modalCard: {
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
  checkmarkCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(74, 222, 128, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(74, 222, 128, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#4ade80",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  modalMsg: {
    fontSize: 13.5,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  refBox: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 16,
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  refLabel: {
    fontSize: 10.5,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 4,
  },
  refValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ff9800",
    letterSpacing: 0.5,
  },
  modalRedirect: {
    fontSize: 12.5,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
  },
  topBar: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  topBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ff9800",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#ff9800",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  topBackBtnText: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "bold",
  },
  strengthContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderRadius: 16,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  strengthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
  },
  strengthValue: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  strengthBarBg: {
    height: 5,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  strengthBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  rulesContainer: {
    gap: 4,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ruleText: {
    fontSize: 11,
    fontWeight: "500",
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
