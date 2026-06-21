import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated, Easing, LayoutChangeEvent, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NAV_ITEMS = [
  { label: "Home",     icon: "home-outline" as const,          iconActive: "home" as const,          route: "/Policy Holder/page" },
  { label: "Claims",   icon: "document-text-outline" as const, iconActive: "document-text" as const, route: "/Policy Holder/My_claims" },
  { label: "New",      icon: "add" as const,                   iconActive: "add" as const,            route: "/Policy Holder/New_Claim", isCenter: true },
  { label: "Contact",  icon: "headset-outline" as const,       iconActive: "headset" as const,        route: "/Policy Holder/Contact" },
  { label: "Profile",  icon: "person-outline" as const,        iconActive: "person" as const,         route: "profile" },
] as const;

interface PolicyHolderNavbarProps {
  activeRoute?: string;
}

export default function PolicyHolderNavbar({ activeRoute }: PolicyHolderNavbarProps) {
  const pathname = usePathname();
  const currentRoute = activeRoute ?? pathname;
  const centerPulse = useRef(new Animated.Value(1)).current;

  // Custom Alert State
  const [customAlert, setCustomAlert] = useState<{
    title: string;
    message: string;
    type?: "success" | "warning" | "info" | "profile";
    userName?: string;
    userNic?: string;
    onClose?: () => void;
  } | null>(null);

  const activeIndex = useMemo(() => {
    return NAV_ITEMS.findIndex((item) => {
      if (item.route === "/Policy Holder/page") {
        return currentRoute === "/Policy Holder/page" || currentRoute === "/Policy Holder";
      }
      if (item.route === "profile") {
        return false;
      }
      return currentRoute === item.route || currentRoute.startsWith(item.route);
    });
  }, [currentRoute]);



  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(centerPulse, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
        Animated.timing(centerPulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [centerPulse]);



  const showSupportAlert = () => {
    setCustomAlert({
      title: "Sanasa Support 📞",
      message: "We are available 24/7 to assist you.\n\nHotline: +94 112 003 000\nEmail: claims@sanasainsurance.lk\nAddress: No: 172, Elvitigala Mv, Colombo 8",
      type: "info"
    });
  };

  const showProfileAlert = async () => {
    try {
      const userStr = await AsyncStorage.getItem("logged_in_user");
      let name = "User";
      let nic = "N/A";
      if (userStr) {
        const user = JSON.parse(userStr);
        name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";
        nic = user.nic || "N/A";
      }
      setCustomAlert({
        title: "My Profile 👤",
        message: "",
        type: "profile",
        userName: name,
        userNic: nic
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    setCustomAlert(null);
    await AsyncStorage.removeItem("logged_in_user");
    router.replace("/login/page");
  };

  return (
    <View style={styles.container}>
      <View style={styles.shadowPad} />
      <View style={styles.shell}>
      {NAV_ITEMS.map((item) => {
        const isActive = item.route === "/Policy Holder/page"
          ? (currentRoute === "/Policy Holder/page" || currentRoute === "/Policy Holder")
          : (currentRoute === item.route || currentRoute.startsWith(item.route));
        const isCenter = "isCenter" in item && item.isCenter;

        if (isCenter) {
          return (
            <TouchableOpacity
              key={item.route}
              activeOpacity={0.85}
              style={styles.centerWrap}
              onPress={() => router.push(item.route as any)}
            >
              <Animated.View style={[styles.centerBtn, { transform: [{ scale: centerPulse }] }]}>
                <Ionicons name="add" size={28} color="#fff" />
              </Animated.View>
              <Text style={styles.centerLabel}>{item.label}</Text>
            </TouchableOpacity>
          );
        }

        const handleItemPress = () => {
          if (item.route === "profile") {
            showProfileAlert();
          } else {
            router.push(item.route as any);
          }
        };

        return (
          <TouchableOpacity
            key={item.route}
            activeOpacity={0.7}
            style={styles.navItem}
            onPress={handleItemPress}
          >
            <Ionicons
              name={(isActive ? item.iconActive : item.icon) as any}
              size={22}
              color={isActive ? "#0ea5e9" : "#94a3b8"}
            />
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
      </View>

      {/* Unified Custom Alert Overlay Modal */}
      {customAlert && (
        <Modal
          transparent
          animationType="fade"
          visible={!!customAlert}
          onRequestClose={() => setCustomAlert(null)}
        >
          <View style={styles.alertOverlay}>
            <View style={styles.alertCard}>
              <View style={[
                styles.alertIconCircle,
                customAlert.type === "success" && { backgroundColor: "rgba(74, 222, 128, 0.12)", borderColor: "rgba(74, 222, 128, 0.3)" },
                customAlert.type === "warning" && { backgroundColor: "rgba(239, 68, 68, 0.12)", borderColor: "rgba(239, 68, 68, 0.3)" },
                customAlert.type === "profile" && { backgroundColor: "rgba(14, 165, 233, 0.12)", borderColor: "rgba(14, 165, 233, 0.3)" },
              ]}>
                <Ionicons
                  name={
                    customAlert.type === "success"
                      ? "checkmark-circle-outline"
                      : customAlert.type === "warning"
                        ? "alert-circle-outline"
                        : customAlert.type === "profile"
                          ? "person-circle-outline"
                          : "information-circle-outline"
                  }
                  size={38}
                  color={
                    customAlert.type === "success"
                      ? "#4ade80"
                      : customAlert.type === "warning"
                        ? "#f87171"
                        : customAlert.type === "profile"
                          ? "#0ea5e9"
                          : "#ff9800"
                  }
                />
              </View>
              <Text style={styles.alertTitle}>{customAlert.title}</Text>
              
              {customAlert.type === "profile" ? (
                <View style={styles.profileDetailsBox}>
                  <Text style={styles.profileLabel}>Name: <Text style={styles.profileValue}>{customAlert.userName}</Text></Text>
                  <Text style={styles.profileLabel}>NIC: <Text style={styles.profileValue}>{customAlert.userNic}</Text></Text>
                </View>
              ) : (
                <Text style={styles.alertMsg}>{customAlert.message}</Text>
              )}

              {customAlert.type === "profile" ? (
                <View style={styles.profileActionsRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setCustomAlert(null)}
                    style={[styles.alertButton, styles.cancelBtn]}
                  >
                    <Text style={styles.alertButtonText}>Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleLogout}
                    style={[styles.alertButton, styles.logoutBtn]}
                  >
                    <Text style={styles.alertButtonText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              ) : (
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
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
    paddingTop: 2,
    paddingHorizontal: 14,
  },
  shadowPad: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: Platform.OS === "ios" ? 20 : 10,
    height: 64,
    borderRadius: 22,
    backgroundColor: "#0f172a",
    opacity: 0.04,
  },
  shell: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 18 : 10,
    paddingHorizontal: 8,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
  },


  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 2,
    position: "relative",
  },
  navLabel: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#6b7280",
  },
  navLabelActive: {
    color: "#0f172a",
    fontWeight: "700",
  },

  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: -10,
  },
  centerBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#0d2a3a",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0d2a3a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: "#f9fafb",
  },
  centerLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#0d2a3a",
  },

  /* Unified Alert Styles */
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  alertCard: {
    width: "85%",
    maxWidth: 340,
    backgroundColor: "#ffffff",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 24,
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  alertIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(14, 165, 233, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(14, 165, 233, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  },
  alertMsg: {
    fontSize: 13.5,
    color: "#475569",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  alertButton: {
    backgroundColor: "#0d2a3a",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 32,
    shadowColor: "#0d2a3a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  alertButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  profileDetailsBox: {
    width: "100%",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    marginBottom: 20,
    gap: 8,
  },
  profileLabel: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
  profileValue: {
    color: "#0f172a",
    fontWeight: "bold",
  },
  profileActionsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    justifyContent: "center",
  },
  cancelBtn: {
    backgroundColor: "#64748b",
    shadowColor: "#64748b",
    flex: 1,
    alignItems: "center",
  },
  logoutBtn: {
    backgroundColor: "#ef4444",
    shadowColor: "#ef4444",
    flex: 1,
    alignItems: "center",
  },
});
