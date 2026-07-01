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
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { WebView } from "react-native-webview";
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
  accidentPhotos?: {
    front: string[];
    rear: string[];
    side: string[];
  };
  drivingLicense?: {
    front: string[];
    rear: string[];
  };
}

const parseInspectionReport = (reportText?: string | null) => {
  if (!reportText) return null;
  
  if (!reportText.includes("[1. VEHICLE CONDITION DETAILS]")) {
    return { isRaw: true, rawText: reportText };
  }

  try {
    const lines = reportText.split("\n");
    let odometer = "";
    let fuelLevel = "";
    let recommendedAction = "";
    let estimatedCost = "";
    let preExistingDamage = "";
    let physicalInspectionNotes = "";
    const checklist: { [key: string]: string } = {};

    let currentSection = "";

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith("• Odometer:")) {
        odometer = trimmed.replace("• Odometer:", "").trim();
      } else if (trimmed.startsWith("• Fuel Level:")) {
        fuelLevel = trimmed.replace("• Fuel Level:", "").trim();
      } else if (trimmed.startsWith("• Recommended Action:")) {
        recommendedAction = trimmed.replace("• Recommended Action:", "").trim();
      } else if (trimmed.startsWith("• Estimated Cost:")) {
        estimatedCost = trimmed.replace("• Estimated Cost:", "").trim();
      } else if (trimmed.includes("[3. PRE-EXISTING DAMAGE NOTES]")) {
        currentSection = "pre-existing";
      } else if (trimmed.includes("[4. PHYSICAL INSPECTION NOTES]")) {
        currentSection = "physical-notes";
      } else if (trimmed.includes("==================================") || trimmed.includes("VEHICLE CLAIM INSPECTION")) {
        // skip
      } else if (trimmed.includes("[2. COMPONENT DAMAGE CHECKLIST]")) {
        currentSection = "checklist";
      } else if (currentSection === "checklist" && trimmed.startsWith("• ")) {
        const parts = trimmed.substring(2).split(":");
        if (parts.length >= 2) {
          const compName = parts[0].trim();
          const compVal = parts[1].replace("[", "").replace("]", "").trim();
          checklist[compName] = compVal;
        }
      } else if (currentSection === "pre-existing") {
        if (!trimmed.startsWith("[")) {
          preExistingDamage += (preExistingDamage ? "\n" : "") + trimmed;
        }
      } else if (currentSection === "physical-notes") {
        if (!trimmed.startsWith("[")) {
          physicalInspectionNotes += (physicalInspectionNotes ? "\n" : "") + trimmed;
        }
      }
    });

    return {
      isRaw: false,
      odometer,
      fuelLevel,
      recommendedAction,
      estimatedCost,
      checklist,
      preExistingDamage: preExistingDamage || "None reported.",
      physicalInspectionNotes: physicalInspectionNotes || "None reported."
    };
  } catch (err) {
    console.error("Error parsing report:", err);
    return { isRaw: true, rawText: reportText };
  }
};

const renderParsedInspection = (reportText?: string | null) => {
  const parsed = parseInspectionReport(reportText);
  if (!parsed) return null;

  if (parsed.isRaw) {
    return (
      <View style={{ backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 10 }}>
        <Text style={{
          fontSize: 11,
          fontWeight: "600",
          color: "#334155",
          fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
          lineHeight: 16,
        }}>
          {parsed.rawText}
        </Text>
      </View>
    );
  }

  const renderBadge = (val: string) => {
    let bg = "#f1f5f9";
    let color = "#475569";
    let border = "#e2e8f0";

    if (val === "None") {
      bg = "#ecfdf5";
      color = "#047857";
      border = "#a7f3d0";
    } else if (val === "Minor") {
      bg = "#fffbeb";
      color = "#b45309";
      border = "#fde68a";
    } else if (val === "Major") {
      bg = "#fef2f2";
      color = "#b91c1c";
      border = "#fecaca";
    }

    return (
      <View style={{ backgroundColor: bg, borderColor: border, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
        <Text style={{ fontSize: 9, fontWeight: "900", color: color, textTransform: "uppercase" }}>{val}</Text>
      </View>
    );
  };

  return (
    <View style={{ gap: 12 }}>
      {/* 2-column Grid for stats */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 8 }}>
        <View style={{ width: "48%", backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, padding: 10, gap: 2 }}>
          <Text style={{ fontSize: 8.5, fontWeight: "800", color: "#94a3b8" }}>MILEAGE</Text>
          <Text style={{ fontSize: 11.5, fontWeight: "900", color: "#1e3a8a" }}>{parsed.odometer}</Text>
        </View>
        <View style={{ width: "48%", backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, padding: 10, gap: 2 }}>
          <Text style={{ fontSize: 8.5, fontWeight: "800", color: "#94a3b8" }}>FUEL LEVEL</Text>
          <Text style={{ fontSize: 11.5, fontWeight: "900", color: "#b45309" }}>{parsed.fuelLevel}</Text>
        </View>
        <View style={{ width: "48%", backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, padding: 10, gap: 2 }}>
          <Text style={{ fontSize: 8.5, fontWeight: "800", color: "#94a3b8" }}>EST. REPAIR COST</Text>
          <Text style={{ fontSize: 11.5, fontWeight: "900", color: "#16a34a" }}>{parsed.estimatedCost}</Text>
        </View>
        <View style={{ width: "48%", backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, padding: 10, gap: 2 }}>
          <Text style={{ fontSize: 8.5, fontWeight: "800", color: "#94a3b8" }}>RECOMMENDATION</Text>
          <Text style={{ fontSize: 10.5, fontWeight: "900", color: "#334155" }} numberOfLines={1}>{parsed.recommendedAction}</Text>
        </View>
      </View>

      {/* Component Damage Checklist */}
      <View style={{ backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, padding: 12, gap: 8 }}>
        <Text style={{ fontSize: 9.5, fontWeight: "900", color: "#1e3a8a", borderBottomWidth: 1, borderBottomColor: "#f1f5f9", paddingBottom: 6 }}>
          COMPONENT CHECKLIST
        </Text>
        {Object.entries(parsed.checklist || {}).map(([key, value]) => (
          <View key={key} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: "#f8fafc" }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#475569" }}>{key}</Text>
            {renderBadge(value)}
          </View>
        ))}
      </View>

      {/* Pre-Existing Notes */}
      {parsed.preExistingDamage && parsed.preExistingDamage !== "None reported." && (
        <View style={{ backgroundColor: "#fffbeb", borderLeftWidth: 3, borderLeftColor: "#f59e0b", padding: 10, borderRadius: 8, gap: 2 }}>
          <Text style={{ fontSize: 9, fontWeight: "800", color: "#b45309" }}>PRE-EXISTING DAMAGE NOTES</Text>
          <Text style={{ fontSize: 11.5, fontWeight: "600", color: "#451a03" }}>{parsed.preExistingDamage}</Text>
        </View>
      )}

      {/* General Notes */}
      <View style={{ backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", padding: 10, borderRadius: 8, gap: 2 }}>
        <Text style={{ fontSize: 9, fontWeight: "800", color: "#64748b" }}>PHYSICAL INSPECTION NOTES</Text>
        <Text style={{ fontSize: 11.5, fontWeight: "600", color: "#334155" }}>{parsed.physicalInspectionNotes}</Text>
      </View>
    </View>
  );
};

export default function AgentClaimsPage() {
  const { claimId, from, step } = useLocalSearchParams<{ claimId?: string; from?: string; step?: string }>();
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

  // ── Step-by-Step Inspection Wizard States ──────────────────────────────────
  const [activeInspectionStep, setActiveInspectionStep] = useState(1);
  const [agentLocation, setAgentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [incidentCoords, setIncidentCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocatingAgent, setIsLocatingAgent] = useState(false);
  const [isGeocodingClaim, setIsGeocodingClaim] = useState(false);
  const [inspectionPhotos, setInspectionPhotos] = useState<{ uri: string; base64: string }[]>([]);

  // Detailed vehicle inspection report fields
  const [odometer, setOdometer] = useState("");
  const [fuelLevel, setFuelLevel] = useState("1/2");
  const [preExistingDamage, setPreExistingDamage] = useState("");
  const [recommendedAction, setRecommendedAction] = useState("Repairable (Minor)");
  
  // Damage checklist fields
  const [frontBumperDmg, setFrontBumperDmg] = useState("None");
  const [rearBumperDmg, setRearBumperDmg] = useState("None");
  const [leftSideDmg, setLeftSideDmg] = useState("None");
  const [rightSideDmg, setRightSideDmg] = useState("None");
  const [engineDmg, setEngineDmg] = useState("None");
  const [glassDmg, setGlassDmg] = useState("None");
  const [wheelsDmg, setWheelsDmg] = useState("None");

  // Synchronize wizard activeInspectionStep on claim selection
  useEffect(() => {
    if (selectedClaim) {
      if (step === "4") {
        setActiveInspectionStep(4);
      } else if (selectedClaim.currentStep === 2) {
        setActiveInspectionStep(1);
      } else if (selectedClaim.currentStep === 3) {
        if (selectedClaim.inspectionSubmitted) {
          setActiveInspectionStep(5);
        } else {
          setActiveInspectionStep(2);
        }
      } else if (selectedClaim.currentStep >= 4) {
        setActiveInspectionStep(5);
      }
      setInspectionReportText(selectedClaim.inspectionReport || "");
      setAssessmentAmount(selectedClaim.amount ? selectedClaim.amount.toString() : "");
      setInspectionPhotos([]);
      setOdometer("");
      setFuelLevel("1/2");
      setPreExistingDamage("");
      setRecommendedAction("Repairable (Minor)");
      setFrontBumperDmg("None");
      setRearBumperDmg("None");
      setLeftSideDmg("None");
      setRightSideDmg("None");
      setEngineDmg("None");
      setGlassDmg("None");
      setWheelsDmg("None");
    } else {
      setActiveInspectionStep(1);
      setAgentLocation(null);
      setIncidentCoords(null);
      setInspectionPhotos([]);
    }
  }, [selectedClaim, step]);

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
          (c: Claim) => c.status !== "Approved" && c.status !== "Rejected" && !c.inspectionSubmitted
        ).length;
        if (activeCount > 0) {
          setActiveSubTab("active");
        } else {
          setActiveSubTab("activity");
        }
        await AsyncStorage.setItem("@sanasa_agent_cached_claims", JSON.stringify(data));
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
      // 1. Check if we have notification claim data passed instantly
      if (claimId) {
        try {
          const storedClaimStr = await AsyncStorage.getItem("notification_claim_data");
          if (storedClaimStr) {
            const storedClaim = JSON.parse(storedClaimStr);
            if (storedClaim._id === claimId || storedClaim.claimNumber === claimId) {
              setSelectedClaim(storedClaim);
              setLoading(false);
            }
          }
        } catch (e) {
          console.error("Error loading notification claim data:", e);
        }
      }

      // 2. Load cached claims instantly if available
      try {
        const cached = await AsyncStorage.getItem("@sanasa_agent_cached_claims");
        if (cached) {
          const data = JSON.parse(cached);
          if (Array.isArray(data) && data.length > 0) {
            setClaims(data);
            const activeCount = data.filter(
              (c: Claim) => c.status !== "Approved" && c.status !== "Rejected" && !c.inspectionSubmitted
            ).length;
            if (activeCount > 0) {
              setActiveSubTab("active");
            } else {
              setActiveSubTab("activity");
            }
            setLoading(false);
          }
        }
      } catch (e) {
        console.error("Error loading cached claims in boot:", e);
      }

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
  }, [fetchClaims, claimId]);

  // Auto-open claim details when claimId is passed via params

  const closeClaimDetailModal = () => {
    if (activeInspectionStep === 5) {
      setActiveSubTab("activity");
    }
    setSelectedClaim(null);
    AsyncStorage.removeItem("notification_claim_data").catch(() => {});
    if (from === "notifications") {
      router.replace("/Agent/Notifications/page");
    } else if (claimId) {
      router.replace("/Agent/Claims/page");
    }
  };

  useEffect(() => {
    if (claimId && claims.length > 0) {
      const matched = claims.find(c => c._id === claimId || c.claimNumber === claimId);
      if (matched) {
        setSelectedClaim(matched);
        if (step === "4") {
          setActiveInspectionStep(4);
        }
      }
    }
  }, [claimId, claims, step]);

  // Poll claims in background for real-time updates
  useEffect(() => {
    if (!agentEmail || selectedClaim !== null) return;
    const pollInterval = setInterval(() => {
      fetchClaims(agentEmail);
    }, 7000);
    return () => clearInterval(pollInterval);
  }, [agentEmail, selectedClaim, fetchClaims]);

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

  // ── Geocode Claim Location ──────────────────────────────────────────────────
  const geocodeClaimLocation = async (locationStr: string) => {
    setIsGeocodingClaim(true);
    try {
      const query = encodeURIComponent(locationStr + ", Sri Lanka");
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setIncidentCoords({ latitude: lat, longitude: lon });
          setIsGeocodingClaim(false);
          return { latitude: lat, longitude: lon };
        }
      }
      const fallback = { latitude: 6.0535, longitude: 80.2210 };
      setIncidentCoords(fallback);
      setIsGeocodingClaim(false);
      return fallback;
    } catch (e) {
      console.warn("Geocoding failed, using fallback:", e);
      const fallback = { latitude: 6.9271, longitude: 79.8612 };
      setIncidentCoords(fallback);
      setIsGeocodingClaim(false);
      return fallback;
    }
  };

  // ── Get Agent GPS Location ──────────────────────────────────────────────────
  const getAgentGPSLocation = async () => {
    setIsLocatingAgent(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Enable location permissions to calculate navigation routes.");
        setIsLocatingAgent(false);
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setAgentLocation(coords);
      setIsLocatingAgent(false);
      return coords;
    } catch (e) {
      console.error("GPS retrieval error:", e);
      const coords = { latitude: 6.915, longitude: 79.860 };
      setAgentLocation(coords);
      setIsLocatingAgent(false);
      return coords;
    }
  };

  // ── Launch Media / Camera Picker ────────────────────────────────────────────
  const handleSnapInspectionPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Camera access is needed to snap inspection photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const prefix = "data:image/jpeg;base64,";
      const base64Data = asset.base64 ? `${prefix}${asset.base64}` : "";
      setInspectionPhotos(prev => [...prev, { uri: asset.uri, base64: base64Data }]);
    }
  };

  const handlePickInspectionPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Library access is needed to select inspection photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const prefix = "data:image/jpeg;base64,";
      const base64Data = asset.base64 ? `${prefix}${asset.base64}` : "";
      setInspectionPhotos(prev => [...prev, { uri: asset.uri, base64: base64Data }]);
    }
  };

  const removeInspectionPhoto = (idx: number) => {
    setInspectionPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Submit Physical Inspection Report (Step 4 -> Step 5 Done) ───────────────
  const handleSubmitInspectionWizard = async () => {
    if (!selectedClaim) return;
    if (!odometer.trim()) {
      Alert.alert("Validation Error", "Please enter the vehicle's odometer reading.");
      return;
    }
    if (!inspectionReportText.trim()) {
      Alert.alert("Validation Error", "Please write physical inspection notes.");
      return;
    }
    if (!assessmentAmount.trim()) {
      Alert.alert("Validation Error", "Please enter an estimated assessment amount.");
      return;
    }

    const formattedReport = `
==================================================
           VEHICLE CLAIM INSPECTION REPORT
==================================================
[1. VEHICLE CONDITION DETAILS]
• Odometer: ${odometer.trim()} km
• Fuel Level: ${fuelLevel}
• Recommended Action: ${recommendedAction}
• Estimated Cost: LKR ${Number(assessmentAmount).toLocaleString()}

[2. COMPONENT DAMAGE CHECKLIST]
• Front Bumper: [${frontBumperDmg}]
• Rear Bumper: [${rearBumperDmg}]
• Left Side Panels: [${leftSideDmg}]
• Right Side Panels: [${rightSideDmg}]
• Engine Compartment: [${engineDmg}]
• Glass & Windshield: [${glassDmg}]
• Wheels & Tires: [${wheelsDmg}]

[3. PRE-EXISTING DAMAGE NOTES]
${preExistingDamage.trim() || "None reported."}

[4. PHYSICAL INSPECTION NOTES]
${inspectionReportText.trim()}
==================================================
    `.trim();

    setIsSubmittingReport(true);
    try {
      const statusRes = await fetch(`${API_BASE_URL}/api/agent/claims/${selectedClaim._id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inspectionReport: formattedReport,
          inspectionSubmitted: true,
          amount: Number(assessmentAmount),
          status: "In Progress"
        }),
      });

      if (!statusRes.ok) throw new Error("Failed to submit assessment report");

      // Document uploads should be isolated in try-catch to prevent upload network/Cloudinary timeouts from blocking inspection finalization
      if (inspectionPhotos.length > 0) {
        for (let i = 0; i < inspectionPhotos.length; i++) {
          const photo = inspectionPhotos[i];
          const docName = `Inspection Photo #${i + 1}`;
          try {
            await fetch(`${API_BASE_URL}/api/policy-holder/update-claim/${selectedClaim.claimNumber}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                uploadedDocuments: [
                  {
                    documentName: docName,
                    fileData: photo.base64,
                    uploadedBy: "Agent"
                  }
                ]
              })
            });
          } catch (uploadErr) {
            console.warn("Failed to upload photo:", docName, uploadErr);
          }
        }
      }

      // Transition UI to Done state immediately
      setActiveInspectionStep(5);
      Alert.alert("Success", "Inspection completed! Details updated to office staff.");

      // Run background refreshes without blocking UI
      try {
        await fetchClaims(agentEmail);
        const listRes = await fetch(`${API_BASE_URL}/api/agent/claims?email=${encodeURIComponent(agentEmail)}`);
        if (listRes.ok) {
          const data = await listRes.json();
          const freshClaim = data.find((c: Claim) => c._id === selectedClaim._id);
          if (freshClaim) {
            setSelectedClaim(freshClaim);
          }
        }
      } catch (refreshErr) {
        console.warn("Background refresh failed:", refreshErr);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to finalize claim inspection. Please try again.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // ── Stepper UI Progress Render ──────────────────────────────────────────────
  const renderWizardProgress = () => {
    const steps = [
      { num: 1, label: "Review" },
      { num: 2, label: "Accepted" },
      { num: 3, label: "Route Map" },
      { num: 4, label: "Inspect" },
      { num: 5, label: "Done" },
    ];
    return (
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", backgroundColor: "#f8fafc" }}>
        {steps.map((st, idx) => {
          const isDone = activeInspectionStep > st.num;
          const isActive = activeInspectionStep === st.num;
          return (
            <React.Fragment key={st.num}>
              <View style={{ alignItems: "center", flex: 1 }}>
                <View style={{
                  width: 28, height: 28, borderRadius: 14,
                  backgroundColor: isDone ? "#16a34a" : (isActive ? "#0284c7" : "#e2e8f0"),
                  justifyContent: "center", alignItems: "center",
                  borderWidth: isActive ? 2 : 0, borderColor: "#0284c7"
                }}>
                  {isDone ? (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  ) : (
                    <Text style={{ color: isActive ? "#fff" : "#64748b", fontSize: 11, fontWeight: "900" }}>{st.num}</Text>
                  )}
                </View>
                <Text style={{ fontSize: 9, fontWeight: "800", color: isActive ? "#0284c7" : "#64748b", marginTop: 4, textTransform: "uppercase" }}>{st.label}</Text>
              </View>
              {idx < steps.length - 1 && (
                <View style={{ height: 2, flex: 1, backgroundColor: isDone ? "#16a34a" : "#e2e8f0", marginHorizontal: -10, marginTop: -10 }} />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  // ── Wizard Step 2 Popup ─────────────────────────────────────────────────────
  const renderStep2Popup = () => {
    if (!selectedClaim) return null;
    return (
      <ScrollView contentContainerStyle={{ padding: 24, alignItems: "center", justifyContent: "center", gap: 20 }}>
        <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(2, 132, 199, 0.08)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: "rgba(2, 132, 199, 0.15)", justifyContent: "center", alignItems: "center" }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#0284c7", justifyContent: "center", alignItems: "center", shadowColor: "#0284c7", shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }}>
              <Ionicons name="navigate" size={22} color="#fff" />
            </View>
          </View>
        </View>

        <View style={{ alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#0f172a", textAlign: "center" }}>Start Physical Inspection</Text>
          <Text style={{ fontSize: 12.5, fontWeight: "600", color: "#64748b", textAlign: "center", maxWidth: 280, lineHeight: 18 }}>
            Assignment accepted. Proceed to map routing to find the fastest path to the incident scene.
          </Text>
        </View>

        <View style={{ width: "100%", backgroundColor: "#f8fafc", borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 16, padding: 16, gap: 10 }}>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <Ionicons name="location-sharp" size={18} color="#dc2626" />
            <Text style={{ fontSize: 13, fontWeight: "800", color: "#334155", flex: 1 }} numberOfLines={2}>
              {selectedClaim.location}
            </Text>
          </View>
          <View style={{ height: 1, backgroundColor: "#e2e8f0" }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748b" }}>DAMAGE TYPE</Text>
            <Text style={{ fontSize: 12, fontWeight: "800", color: "#0f172a" }}>{selectedClaim.damageType}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748b" }}>PLATE NUMBER</Text>
            <Text style={{ fontSize: 12, fontWeight: "800", color: "#0f172a" }}>{formatNumberPlate(selectedClaim.vehiclePlate)}</Text>
          </View>
        </View>

        <View style={{ width: "100%", gap: 10, marginTop: 10 }}>
          <View style={{ flexDirection: "row", width: "100%", gap: 10 }}>
            <TouchableOpacity
              style={{ width: 46, height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: "#cbd5e1", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" }}
              onPress={() => {
                setSelectedClaim(null);
                router.push({
                  pathname: "/Agent/MapRoute/page",
                  params: {
                    claimId: selectedClaim.claimNumber,
                    location: selectedClaim.location,
                    branch: selectedClaim.branch || "Galle",
                    userNic: selectedClaim.userNic,
                    vehiclePlate: selectedClaim.vehiclePlate,
                    damageType: selectedClaim.damageType,
                    fromPage: "Claims",
                  },
                });
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="call-outline" size={20} color="#475569" />
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1, height: 46, borderRadius: 12, backgroundColor: "#0284c7", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 }}
              onPress={async () => {
                setSelectedClaim(null);
                router.push({
                  pathname: "/Agent/MapRoute/page",
                  params: {
                    claimId: selectedClaim.claimNumber,
                    location: selectedClaim.location,
                    branch: selectedClaim.branch || "Galle",
                    userNic: selectedClaim.userNic,
                    vehiclePlate: selectedClaim.vehiclePlate,
                    damageType: selectedClaim.damageType,
                    fromPage: "Claims",
                  },
                });
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "800" }}>Start Navigation Route</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={{ width: "100%", height: 42, borderRadius: 12, backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#cbd5e1", justifyContent: "center", alignItems: "center" }}
            onPress={() => setActiveInspectionStep(1)}
            activeOpacity={0.8}
          >
            <Text style={{ color: "#475569", fontSize: 13, fontWeight: "800" }}>Review Details Again</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  // ── Wizard Step 3 Map Navigation ────────────────────────────────────────────
  const renderStep3Map = () => {
    if (!selectedClaim) return null;

    return (
      <ScrollView contentContainerStyle={{ padding: 24, alignItems: "center", justifyContent: "center", gap: 20 }}>
        <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(2, 132, 199, 0.08)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: "rgba(2, 132, 199, 0.15)", justifyContent: "center", alignItems: "center" }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#0284c7", justifyContent: "center", alignItems: "center", shadowColor: "#0284c7", shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }}>
              <Ionicons name="map" size={22} color="#fff" />
            </View>
          </View>
        </View>

        <View style={{ alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#0f172a", textAlign: "center" }}>Route Navigation</Text>
          <Text style={{ fontSize: 12.5, fontWeight: "600", color: "#64748b", textAlign: "center", maxWidth: 280, lineHeight: 18 }}>
            Click Start to launch full-screen map routing with GPS tracking and branch/policyholder call lines.
          </Text>
        </View>

        <View style={{ width: "100%", backgroundColor: "#f8fafc", borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 16, padding: 16, gap: 10 }}>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <Ionicons name="location-sharp" size={18} color="#dc2626" />
            <Text style={{ fontSize: 13, fontWeight: "800", color: "#334155", flex: 1 }} numberOfLines={2}>
              {selectedClaim.location}
            </Text>
          </View>
          <View style={{ height: 1, backgroundColor: "#e2e8f0" }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748b" }}>ESTIMATED DISTANCE</Text>
            <Text style={{ fontSize: 12.5, fontWeight: "800", color: "#0f172a" }}>12.8 km</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748b" }}>ESTIMATED TRAVEL TIME</Text>
            <Text style={{ fontSize: 12.5, fontWeight: "800", color: "#0284c7" }}>22 mins</Text>
          </View>
        </View>

        <View style={{ width: "100%", gap: 10, marginTop: 10 }}>
          <TouchableOpacity
            style={{ width: "100%", height: 46, borderRadius: 12, backgroundColor: "#0284c7", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 }}
            onPress={() => {
              setSelectedClaim(null);
              router.push({
                pathname: "/Agent/MapRoute/page",
                params: {
                  claimId: selectedClaim.claimNumber,
                  location: selectedClaim.location,
                  branch: selectedClaim.branch || "Galle",
                  userNic: selectedClaim.userNic,
                  vehiclePlate: selectedClaim.vehiclePlate,
                  damageType: selectedClaim.damageType,
                  fromPage: "Claims",
                },
              });
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "800" }}>Start</Text>
            <Ionicons name="navigate" size={16} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ width: "100%", height: 42, borderRadius: 12, backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#cbd5e1", justifyContent: "center", alignItems: "center" }}
            onPress={() => setActiveInspectionStep(2)}
            activeOpacity={0.8}
          >
            <Text style={{ color: "#475569", fontSize: 13, fontWeight: "800" }}>Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  // ── Wizard Step 4 Physical Inspection Form ──────────────────────────────────
  const renderStep4InspectionForm = () => {
    if (!selectedClaim) return null;

    const checklistItems = [
      { key: "frontBumper", label: "Front Bumper Damage", val: frontBumperDmg, setVal: setFrontBumperDmg },
      { key: "rearBumper", label: "Rear Bumper Damage", val: rearBumperDmg, setVal: setRearBumperDmg },
      { key: "leftSide", label: "Left Panels Damage", val: leftSideDmg, setVal: setLeftSideDmg },
      { key: "rightSide", label: "Right Panels Damage", val: rightSideDmg, setVal: setRightSideDmg },
      { key: "engine", label: "Engine Compartment", val: engineDmg, setVal: setEngineDmg },
      { key: "glass", label: "Glass & Windshield", val: glassDmg, setVal: setGlassDmg },
      { key: "wheels", label: "Wheels & Tires", val: wheelsDmg, setVal: setWheelsDmg },
    ];

    return (
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 16, fontWeight: "900", color: "#0f172a" }}>Physical Damage Findings</Text>
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#64748b", lineHeight: 16 }}>
            Record complete vehicle status, components condition, and attach on-site damage reports.
          </Text>
        </View>

        {/* Vehicle General Details */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 12.5, color: "#475569", fontWeight: "700" }}>Vehicle Odometer Mileage *</Text>
          <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 12, height: 46, backgroundColor: "#ffffff" }}>
            <TextInput
              style={{ flex: 1, paddingHorizontal: 12, color: "#0f172a", fontSize: 13.5, fontWeight: "700" }}
              placeholder="e.g. 45280"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={odometer}
              onChangeText={setOdometer}
            />
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#64748b", paddingRight: 12 }}>km</Text>
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 12.5, color: "#475569", fontWeight: "700" }}>Fuel Level</Text>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {["Empty", "1/4", "1/2", "3/4", "Full"].map((lvl) => (
              <TouchableOpacity
                key={lvl}
                style={{
                  flex: 1,
                  height: 36,
                  borderRadius: 8,
                  borderWidth: 1.5,
                  borderColor: fuelLevel === lvl ? "#0284c7" : "#e2e8f0",
                  backgroundColor: fuelLevel === lvl ? "#0284c7" : "#ffffff",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => setFuelLevel(lvl)}
              >
                <Text style={{ fontSize: 11, fontWeight: "800", color: fuelLevel === lvl ? "#ffffff" : "#475569" }}>
                  {lvl}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Component damage checklist */}
        <View style={{ gap: 4, marginTop: 4 }}>
          <Text style={{ fontSize: 12.5, color: "#475569", fontWeight: "700" }}>Component Damage Checklist</Text>
          <View style={{ borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 16, backgroundColor: "#f8fafc", paddingHorizontal: 14, paddingVertical: 6 }}>
            {checklistItems.map((item) => (
              <View key={item.key} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" }}>
                <Text style={{ fontSize: 12.5, fontWeight: "700", color: "#334155", flex: 1 }}>{item.label}</Text>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {["None", "Minor", "Major"].map((level) => {
                    const isSelected = item.val === level;
                    let selectedBg = "#f1f5f9";
                    let selectedBorder = "#cbd5e1";
                    let selectedText = "#64748b";

                    if (isSelected) {
                      if (level === "None") {
                        selectedBg = "#f0fdf4";
                        selectedBorder = "#16a34a";
                        selectedText = "#16a34a";
                      } else if (level === "Minor") {
                        selectedBg = "#fffbeb";
                        selectedBorder = "#d97706";
                        selectedText = "#d97706";
                      } else if (level === "Major") {
                        selectedBg = "#fef2f2";
                        selectedBorder = "#dc2626";
                        selectedText = "#dc2626";
                      }
                    }

                    return (
                      <TouchableOpacity
                        key={level}
                        style={{
                          paddingVertical: 4,
                          paddingHorizontal: 8,
                          borderRadius: 8,
                          borderWidth: 1.5,
                          borderColor: isSelected ? selectedBorder : "#e2e8f0",
                          backgroundColor: isSelected ? selectedBg : "#ffffff",
                        }}
                        onPress={() => item.setVal(level)}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontSize: 10, fontWeight: "800", color: isSelected ? selectedText : "#94a3b8" }}>
                          {level}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 12.5, color: "#475569", fontWeight: "700" }}>Recommended Action</Text>
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
            {["Repairable (Minor)", "Repairable (Major)", "Replacement Required", "Total Loss / Write-off"].map((act) => (
              <TouchableOpacity
                key={act}
                style={{
                  width: "48%",
                  height: 38,
                  borderRadius: 8,
                  borderWidth: 1.5,
                  borderColor: recommendedAction === act ? "#0284c7" : "#e2e8f0",
                  backgroundColor: recommendedAction === act ? "#0284c7" : "#ffffff",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => setRecommendedAction(act)}
              >
                <Text style={{ fontSize: 10, fontWeight: "800", color: recommendedAction === act ? "#ffffff" : "#475569", textAlign: "center" }}>
                  {act}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 12.5, color: "#475569", fontWeight: "700" }}>Pre-Existing Damages Notes</Text>
          <TextInput
            style={{
              height: 48,
              padding: 10,
              borderWidth: 1.5,
              borderColor: '#e2e8f0',
              borderRadius: 12,
              color: '#0f172a',
              fontSize: 13,
              fontWeight: "600",
              backgroundColor: '#ffffff'
            }}
            placeholder="Write details of older scratches, rust or dents..."
            placeholderTextColor="#94a3b8"
            value={preExistingDamage}
            onChangeText={setPreExistingDamage}
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 12.5, color: "#475569", fontWeight: "700" }}>Estimated Repair / Parts Cost *</Text>
          <View style={[styles.modalAssessInput, { borderRadius: 12, height: 46 }]}>
            <Text style={styles.modalAssessCurrency}>LKR</Text>
            <TextInput
              style={styles.modalAssessField}
              placeholder="e.g. 75,000"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={assessmentAmount}
              onChangeText={setAssessmentAmount}
            />
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 12.5, color: "#475569", fontWeight: "700" }}>Detailed Inspection Notes & Remarks *</Text>
          <TextInput
            style={{
              height: 80,
              textAlignVertical: 'top',
              padding: 12,
              borderWidth: 1.5,
              borderColor: '#e2e8f0',
              borderRadius: 12,
              color: '#0f172a',
              fontSize: 13,
              fontWeight: "600",
              backgroundColor: '#ffffff'
            }}
            placeholder="Write physical inspection notes regarding damage severity, recommended repairs, or findings..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={3}
            value={inspectionReportText}
            onChangeText={setInspectionReportText}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 12.5, color: "#475569", fontWeight: "700" }}>Attach Inspection Photos *</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              style={{ flex: 1, height: 74, borderRadius: 12, borderStyle: "dashed", borderWidth: 1.5, borderColor: "#0284c7", backgroundColor: "rgba(2, 132, 199, 0.03)", justifyContent: "center", alignItems: "center", gap: 4 }}
              onPress={handleSnapInspectionPhoto}
              activeOpacity={0.7}
            >
              <Ionicons name="camera" size={22} color="#0284c7" />
              <Text style={{ fontSize: 10.5, fontWeight: "800", color: "#0284c7" }}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1, height: 74, borderRadius: 12, borderStyle: "dashed", borderWidth: 1.5, borderColor: "#64748b", backgroundColor: "rgba(100, 116, 139, 0.03)", justifyContent: "center", alignItems: "center", gap: 4 }}
              onPress={handlePickInspectionPhoto}
              activeOpacity={0.7}
            >
              <Ionicons name="images" size={22} color="#64748b" />
              <Text style={{ fontSize: 10.5, fontWeight: "800", color: "#64748b" }}>Gallery</Text>
            </TouchableOpacity>
          </View>

          {inspectionPhotos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingTop: 10 }}>
              {inspectionPhotos.map((photo, index) => (
                <View key={index} style={{ width: 80, height: 80, borderRadius: 10, overflow: "hidden", position: "relative", borderWidth: 1, borderColor: "#cbd5e1" }}>
                  <Image source={{ uri: photo.uri }} style={{ width: "100%", height: "100%" }} />
                  <TouchableOpacity
                    style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(220, 38, 38, 0.9)", justifyContent: "center", alignItems: "center" }}
                    onPress={() => removeInspectionPhoto(index)}
                  >
                    <Ionicons name="close" size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={{ gap: 10, marginTop: 14 }}>
          <TouchableOpacity
            style={{ width: "100%", height: 46, borderRadius: 12, backgroundColor: "#16a34a", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 }}
            onPress={handleSubmitInspectionWizard}
            disabled={isSubmittingReport}
            activeOpacity={0.8}
          >
            {isSubmittingReport ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-done-circle" size={20} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: "800" }}>Submit & Done</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={{ width: "100%", height: 42, borderRadius: 12, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#cbd5e1", justifyContent: "center", alignItems: "center" }}
            onPress={() => setActiveInspectionStep(3)}
            disabled={isSubmittingReport}
            activeOpacity={0.8}
          >
            <Text style={{ color: "#64748b", fontSize: 13, fontWeight: "800" }}>Back to Map</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  // ── Wizard Step 5 Finished Summary ──────────────────────────────────────────
  const renderStep5Completed = () => {
    if (!selectedClaim) return null;
    return (
      <ScrollView contentContainerStyle={{ padding: 24, alignItems: "center", justifyContent: "center", gap: 20 }}>
        <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: "rgba(22, 163, 74, 0.08)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ width: 66, height: 66, borderRadius: 33, backgroundColor: "rgba(22, 163, 74, 0.15)", justifyContent: "center", alignItems: "center" }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#16a34a", justifyContent: "center", alignItems: "center", shadowColor: "#16a34a", shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }}>
              <Ionicons name="checkmark" size={24} color="#fff" />
            </View>
          </View>
        </View>

        <View style={{ alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#0f172a", textAlign: "center" }}>Assessment Finished</Text>
          <Text style={{ fontSize: 12.5, fontWeight: "600", color: "#64748b", textAlign: "center", maxWidth: 280, lineHeight: 18 }}>
            Physical damage inspection has been completed and uploaded to the database.
          </Text>
        </View>

        <View style={{ width: "100%", backgroundColor: "#f8fafc", borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 16, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748b" }}>FINAL STATUS</Text>
            <View style={{ backgroundColor: "#dcfce7", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ fontSize: 10, fontWeight: "900", color: "#16a34a" }}>COMPLETED</Text>
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: "#e2e8f0" }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748b" }}>EVALUATED AMOUNT</Text>
            <Text style={{ fontSize: 13, fontWeight: "900", color: "#16a34a" }}>
              LKR {selectedClaim.amount ? selectedClaim.amount.toLocaleString() : assessmentAmount || "—"}
            </Text>
          </View>
          <View style={{ height: 1, backgroundColor: "#e2e8f0" }} />
          <View style={{ flexDirection: "column", gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748b", marginBottom: 4 }}>INSPECTION REPORT SUMMARY</Text>
            {renderParsedInspection(selectedClaim.inspectionReport || inspectionReportText)}
          </View>
        </View>

        <View style={{ width: "100%", gap: 10, marginTop: 10 }}>
          <TouchableOpacity
            style={{ width: "100%", height: 46, borderRadius: 12, backgroundColor: "#1e3a8a", justifyContent: "center", alignItems: "center" }}
            onPress={closeClaimDetailModal}
            activeOpacity={0.8}
          >
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "800" }}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
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
      closeClaimDetailModal();
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
      
      // Refresh list
      await fetchClaims(agentEmail);
      // Refresh local selected claim to reflect step 3 in backend
      const listRes = await fetch(`${API_BASE_URL}/api/agent/claims?email=${encodeURIComponent(agentEmail)}`);
      if (listRes.ok) {
        const data = await listRes.json();
        const freshClaim = data.find((c: Claim) => c._id === selectedClaim._id);
        if (freshClaim) {
          setSelectedClaim(freshClaim);
          setActiveInspectionStep(2); // Assignment Accepted view
        }
      }
    } catch (e) {
      Alert.alert("Error", "Failed to accept claim assignment. Please try again.");
    } finally {
      setIsAcceptingClaim(false);
    }
  };

  const handleDeclineClaim = async () => {
    if (!selectedClaim) return;
    setIsAcceptingClaim(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/office-staff/claims/${selectedClaim.claimNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Rejected",
          currentStep: 5,
          rejectionReason: "Rejected by Agent",
          messageText: "Claim rejected by Agent.",
          messageRecipient: "Office Staff",
          messageSender: "Agent"
        }),
      });
      if (!res.ok) throw new Error("Failed to reject");
      Alert.alert("Success", "Claim assignment rejected successfully!");
      closeClaimDetailModal();
      fetchClaims(agentEmail);
    } catch (e) {
      Alert.alert("Error", "Failed to decline claim assignment. Please try again.");
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
      closeClaimDetailModal();
      setActiveSubTab("activity");
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
    (c) => c.status !== "Approved" && c.status !== "Rejected" && !c.inspectionSubmitted
  );
  const completedClaims = claims.filter(
    (c) => c.status === "Approved" || c.status === "Rejected" || c.inspectionSubmitted
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
              const isCompleted = claim.status === "Approved" || claim.status === "Rejected";
              const statusColor = claim.status === "Approved" ? "#16a34a"
                : claim.status === "Rejected" ? "#dc2626"
                : claim.status === "In Progress" ? "#0ea5e9" : "#f59e0b";

              return (
                <TouchableOpacity
                  key={claim._id}
                  style={[
                    styles.claimCard,
                    {
                      backgroundColor: "#ffffff",
                      borderColor: "#e2e8f0",
                      borderLeftWidth: 4,
                      borderLeftColor: isCompleted ? statusColor : "#1e3a8a",
                    },
                  ]}
                  onPress={() => setSelectedClaim(claim)}
                  activeOpacity={0.85}
                >
                  {/* Left Side: Circular Status/Vehicle Icon Badge */}
                  <View style={[styles.claimIconWrap, { backgroundColor: "#f0f7ff" }]}>
                    <Ionicons
                      name="car-sport"
                      size={20}
                      color={isCompleted ? statusColor : "#1e3a8a"}
                    />
                  </View>

                  {/* Right Side: Claim Details */}
                  <View style={{ flex: 1, marginLeft: 12, paddingRight: 8 }}>
                    {/* Header Row: Plate Number and Status Badge */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <Text style={styles.claimPlateText}>{claim.vehiclePlate}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: statusCfg.bg, borderColor: statusCfg.border }
                        ]}
                      >
                        <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.text}</Text>
                      </View>
                    </View>

                    {/* Highlighted Location & Damage Type */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 }}>
                      <Ionicons name="location" size={14} color="#f97316" />
                      <Text style={styles.claimLocationHighlightText} numberOfLines={1}>
                        {claim.location}
                      </Text>
                      <Text style={{ color: "#cbd5e1", fontWeight: "bold" }}>·</Text>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: "#64748b" }}>
                        {claim.damageType}
                      </Text>
                    </View>

                    {/* Bottom Row: Claim ID, Date, Amount */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: "#f1f5f9" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Ionicons name="document-text-outline" size={12} color="#94a3b8" />
                          <Text style={styles.claimNumberBottomText}>{claim.claimNumber}</Text>
                        </View>
                        <Text style={{ fontSize: 11, color: "#cbd5e1" }}>|</Text>
                        <Text style={{ fontSize: 11, color: "#64748b", fontWeight: "600" }}>{formatDate(claim.createdAt)}</Text>
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: "800", color: claim.amount ? "#16a34a" : "#64748b" }}>
                        {claim.amount ? `LKR ${Number(claim.amount).toLocaleString()}` : "Pending"}
                      </Text>
                    </View>
                  </View>

                  {/* Far Right: Tap indicator arrow */}
                  <View style={{ justifyContent: "center", alignItems: "center" }}>
                    <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      <Modal
        visible={selectedClaim !== null}
        animationType="slide"
        transparent
        onRequestClose={closeClaimDetailModal}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ width: "100%", maxWidth: 460, alignSelf: "center", flex: 1, justifyContent: "flex-end" }}
          >
            <View style={[styles.modalCard, activeInspectionStep > 1 && { height: SCREEN_H * 0.8 }]}>
              {/* Drag Handle */}
              <View style={styles.modalDragHandle} />

              {/* Premium Header */}
              <View style={styles.premiumPopupHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                  <View style={[styles.popupHeaderIconWrap, { backgroundColor: "rgba(30, 58, 138, 0.08)", borderColor: "rgba(30, 58, 138, 0.15)" }]}>
                    <Ionicons name="document-text" size={20} color="#1e3a8a" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.popupHeaderTitle}>
                      {activeInspectionStep === 1 && "Claim Details"}
                      {activeInspectionStep === 2 && "Assignment Accepted"}
                      {activeInspectionStep === 3 && "Navigation to Incident"}
                      {activeInspectionStep === 4 && "Physical Inspection"}
                      {activeInspectionStep === 5 && "Assessment Finished"}
                    </Text>
                    <Text style={[styles.popupHeaderSubtext, { color: "#64748b" }]}>
                      {selectedClaim?.claimNumber}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.popupCloseBtn}
                  onPress={closeClaimDetailModal}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={18} color="#475569" />
                </TouchableOpacity>
              </View>

              {/* Wizard Stepper Visualizer */}
              {selectedClaim && selectedClaim.status !== "Approved" && selectedClaim.status !== "Rejected" && renderWizardProgress()}

              {/* Step specific views */}
              {activeInspectionStep === 1 && (
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

                      {/* Action forms are grouped lower down in the scroll view */}

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

                      {/* Policy Holder Attachments / Photos Section */}
                      {(() => {
                        const attachments: { name: string; url: string }[] = [];
                        const dlFront = selectedClaim.drivingLicense?.front?.[0];
                        const dlRear = selectedClaim.drivingLicense?.rear?.[0];
                        if (dlFront) attachments.push({ name: "License (Front)", url: dlFront });
                        if (dlRear) attachments.push({ name: "License (Rear)", url: dlRear });
                        
                        let photoIdx = 1;
                        const fPhotos = selectedClaim.accidentPhotos?.front || [];
                        const rPhotos = selectedClaim.accidentPhotos?.rear || [];
                        const sPhotos = selectedClaim.accidentPhotos?.side || [];
                        
                        fPhotos.forEach((url: string) => attachments.push({ name: `Accident Front #${photoIdx++}`, url }));
                        rPhotos.forEach((url: string) => attachments.push({ name: `Accident Rear #${photoIdx++}`, url }));
                        sPhotos.forEach((url: string) => attachments.push({ name: `Accident Side #${photoIdx++}`, url }));

                        return (
                          <View style={styles.modalDescBox}>
                            <Text style={styles.modalDescLabel}>Policy Holder Attachments & Photos</Text>
                            {attachments.length === 0 ? (
                              <Text style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic", marginTop: 4 }}>
                                No driving license or accident photos attached to this claim.
                              </Text>
                            ) : (
                              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, marginTop: 10 }}>
                                {attachments.map((item, idx) => {
                                  let docUrl = item.url;
                                  if (docUrl && !docUrl.startsWith("http") && !docUrl.startsWith("data:")) {
                                    docUrl = `${API_BASE_URL.replace("/api", "")}/uploads/${docUrl}`;
                                  }
                                  return (
                                    <TouchableOpacity
                                      key={idx}
                                      onPress={() => handleViewDocument(docUrl)}
                                      style={{ alignItems: "center", width: 90 }}
                                      activeOpacity={0.7}
                                    >
                                      <View style={{ width: 90, height: 70, borderRadius: 10, overflow: "hidden", borderColor: "#e2e8f0", borderStyle: "solid", borderWidth: 1 }}>
                                        <Image source={{ uri: docUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                                      </View>
                                      <Text style={{ fontSize: 9, color: "#64748b", fontWeight: "700", textAlign: "center", marginTop: 4, textTransform: "uppercase" }} numberOfLines={1}>
                                        {item.name}
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </ScrollView>
                            )}
                          </View>
                        );
                      })()}

                      {/* Redesigned Step-based Interactive Actions Panel */}
                      {isActive ? (
                        <View style={[styles.modalDescBox, { backgroundColor: "#f8fafc", borderColor: "#cbd5e1", borderLeftWidth: 4, borderLeftColor: "#1e3a8a", padding: 16 }]}>
                          <Text style={[styles.modalDescLabel, { color: "#1e3a8a" }]}>Action Required: Step 0{selectedClaim.currentStep}</Text>
                          
                          {/* Step 2 Actions: Case Assignment */}
                          {selectedClaim.currentStep === 2 && (
                            <View style={{ gap: 8, marginTop: 4 }}>
                              <Text style={{ fontSize: 12.5, fontWeight: "600", color: "#475569", lineHeight: 18 }}>
                                Review and accept this case file assignment to start damage inspections.
                              </Text>
                              <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
                                <TouchableOpacity
                                  style={[styles.approveBtn, { backgroundColor: "#16a34a", flex: 1, borderRadius: 10, height: 38 }]}
                                  onPress={handleAcceptClaim}
                                  disabled={isAcceptingClaim}
                                  activeOpacity={0.7}
                                >
                                  <Text style={styles.approveBtnText}>
                                    {isAcceptingClaim ? "Accepting..." : "Accept"}
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[styles.approveBtn, { backgroundColor: "#dc2626", flex: 1, borderRadius: 10, height: 38 }]}
                                  onPress={handleDeclineClaim}
                                  disabled={isAcceptingClaim}
                                  activeOpacity={0.7}
                                >
                                  <Text style={styles.approveBtnText}>
                                    {isAcceptingClaim ? "Declining..." : "Reject"}
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          )}

                          {/* Step 3 Actions: physical navigation */}
                          {selectedClaim.currentStep === 3 && (
                            <View style={{ gap: 8, marginTop: 4 }}>
                              <Text style={{ fontSize: 12.5, fontWeight: "600", color: "#475569", lineHeight: 18 }}>
                                This claim assignment is accepted. Proceed to routing navigation and physical vehicle damage inspection.
                              </Text>
                              <TouchableOpacity
                                style={[styles.approveBtn, { backgroundColor: "#0284c7", borderRadius: 10, height: 38, marginTop: 6 }]}
                                onPress={() => setActiveInspectionStep(2)}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.approveBtnText}>Proceed to Navigation & Inspection</Text>
                                <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
                              </TouchableOpacity>
                            </View>
                          )}

                          {/* Step 4 & 5 Actions: Assessment Approval (For backend tracking steps 4 & 5 if needed) */}
                          {(selectedClaim.currentStep === 4 || selectedClaim.currentStep === 5) && (
                            <View style={{ gap: 10, marginTop: 4 }}>
                              <Text style={{ fontSize: 12.5, fontWeight: "600", color: "#475569", lineHeight: 18 }}>
                                Damaged vehicle evaluation details and assessment reports have been synchronized.
                              </Text>
                            </View>
                          )}
                        </View>
                      ) : (
                        <View style={[styles.modalAssessBox, { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0", borderLeftWidth: 4, borderLeftColor: "#16a34a" }]}>
                          <Text style={[styles.modalAssessLabel, { color: "#166534" }]}>Final Claim Amount</Text>
                          <Text style={[styles.modalInfoValue, { fontSize: 18, color: "#16a34a", fontWeight: "900" }]}>
                            {selectedClaim.amount ? `LKR ${selectedClaim.amount.toLocaleString()}` : "Not Evaluated"}
                          </Text>
                        </View>
                      )}

                      {/* Upload Document File (Step 3, 4, 5 only) */}
                      {isActive && (selectedClaim.currentStep === 3 || selectedClaim.currentStep === 4 || selectedClaim.currentStep === 5) && (
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

                      {/* Modal Footer actions (Close button only) */}
                      <View style={styles.modalActions}>
                        <TouchableOpacity
                          style={[styles.closeBtn, { flex: 1, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center", backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#cbd5e1" }]}
                          onPress={closeClaimDetailModal}
                        >
                          <Text style={[styles.closeBtnText, { color: "#475569" }]}>Close</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  );
                })()}
              </ScrollView>
              )}

              {activeInspectionStep === 2 && renderStep2Popup()}
              {activeInspectionStep === 3 && renderStep3Map()}
              {activeInspectionStep === 4 && renderStep4InspectionForm()}
              {activeInspectionStep === 5 && renderStep5Completed()}
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
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    marginBottom: 12,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  claimIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  claimPlateText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  claimLocationHighlightText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
    maxWidth: 160,
  },
  claimNumberBottomText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
  },
  statusBadge: {
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 99,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

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
  closeBtn: { flex: 1, height: 48, borderRadius: 16, backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center", justifyContent: "center" },
  closeBtnText: { color: "#334155", fontSize: 14, fontWeight: "800" },

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
  modalDragHandle: {
    width: 40,
    height: 4.5,
    borderRadius: 9,
    backgroundColor: "#e2e8f0",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 2,
  },
  premiumPopupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  popupHeaderIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  popupHeaderTitle: {
    fontSize: 16.5,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.2,
  },
  popupHeaderSubtext: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
    letterSpacing: -0.1,
  },
  popupCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
});
