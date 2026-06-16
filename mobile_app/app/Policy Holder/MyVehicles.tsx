import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform,
  ImageBackground,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import PolicyHolderNavbar from "../Components/policy holder/page";
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
  return "car-side";
}

export default function MyVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userNic, setUserNic] = useState("");

  const fetchVehicles = useCallback(async (nic: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/policy-holder/vehicles?nic=${encodeURIComponent(nic)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.vehicles) && data.vehicles.length > 0) {
          setVehicles(data.vehicles);
          setLoading(false);
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
      setLoading(false);
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
            fetchVehicles(user.nic);
          }
        } catch (e) {
          console.error(e);
        }
      }
    })();
  }, [fetchVehicles]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (userNic) fetchVehicles(userNic);
  }, [userNic, fetchVehicles]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Styled curved header matching the dashboard */}
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
          {vehicles.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="car-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No registered vehicles found.</Text>
            </View>
          ) : (
            vehicles.map((v, idx) => (
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

                {/* Coverage details */}
                <View style={styles.coverageBox}>
                  <Ionicons name="shield-checkmark" size={16} color="#16a34a" />
                  <Text style={styles.coverageText}>
                    Sanasa Full-Option Covered · Valued up to LKR 4,500,000
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <PolicyHolderNavbar />
    </View>
  );
}

const styles = StyleSheet.create({
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

  /* Coverage box */
  coverageBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 10,
    marginTop: 14,
    gap: 8,
  },
  coverageText: { fontSize: 11, color: "#166534", fontWeight: "700", flex: 1 },

  /* Empty placeholders */
  emptyCard: { backgroundColor: "#ffffff", borderRadius: 22, borderWidth: 1, borderColor: "#e2e8f0", paddingVertical: 40, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 13, color: "#64748b", fontWeight: "700" },
});
