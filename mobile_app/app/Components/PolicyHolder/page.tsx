import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";

const NAV_ITEMS = [
  { label: "Home",     icon: "home-outline" as const,          iconActive: "home" as const,          route: "/PolicyHolder/page" },
  { label: "Claims",   icon: "document-text-outline" as const, iconActive: "document-text" as const, route: "/PolicyHolder/My_claims" },
  { label: "New",      icon: "add" as const,                   iconActive: "add" as const,            route: "/PolicyHolder/New_Claim", isCenter: true },
  { label: "Vehicles", icon: "car-outline" as const,           iconActive: "car" as const,            route: "/PolicyHolder/MyVehicles" },
  { label: "Track",    icon: "search-outline" as const,        iconActive: "search" as const,         route: "/PolicyHolder/TrackClaims" },
] as const;

interface PolicyHolderNavbarProps {
  activeRoute?: string;
}

export default function PolicyHolderNavbar({ activeRoute }: PolicyHolderNavbarProps) {
  const pathname = usePathname();
  const currentRoute = activeRoute ?? pathname;
  const centerPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(centerPulse, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
        Animated.timing(centerPulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [centerPulse]);

  return (
    <View style={styles.container}>
      <View style={styles.shadowPad} />
      <View style={styles.shell}>
      {NAV_ITEMS.map((item) => {
        const isActive = currentRoute === item.route || 
          (item.route.endsWith("/page") 
            ? (currentRoute === item.route.replace("/page", "") || currentRoute === item.route) 
            : currentRoute.startsWith(item.route)
          );
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

        return (
          <TouchableOpacity
            key={item.route}
            activeOpacity={0.7}
            style={styles.navItem}
            onPress={() => router.push(item.route as any)}
          >
            <Ionicons
              name={(isActive ? item.iconActive : item.icon) as any}
              size={22}
              color={isActive ? "#0f766e" : "#94a3b8"}
            />
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
      </View>
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
  indicator: {
    position: "absolute",
    top: 6,
    width: 34,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#0f766e",
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
  activeBar: {
    position: "absolute",
    bottom: 4,
    width: 18,
    height: 3,
    borderRadius: 999,
    backgroundColor: "#0f766e",
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
    backgroundColor: "#0f766e",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f766e",
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
    color: "#0f766e",
  },
});
