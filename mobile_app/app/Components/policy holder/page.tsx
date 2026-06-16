import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";

const NAV_ITEMS = [
  { label: "Home",     icon: "home-outline" as const,          iconActive: "home" as const,          route: "/Policy Holder/page" },
  { label: "Claims",   icon: "document-text-outline" as const, iconActive: "document-text" as const, route: "/Policy Holder/My_claims" },
  { label: "New",      icon: "add" as const,                   iconActive: "add" as const,            route: "/Policy Holder/New_Claim", isCenter: true },
  { label: "Vehicles", icon: "car-outline" as const,           iconActive: "car" as const,            route: "/Policy Holder/MyVehicles" },
  { label: "Track",    icon: "search-outline" as const,        iconActive: "search" as const,         route: "/Policy Holder/TrackClaims" },
] as const;

interface PolicyHolderNavbarProps {
  activeRoute?: string;
}

export default function PolicyHolderNavbar({ activeRoute }: PolicyHolderNavbarProps) {
  const pathname = usePathname();
  const currentRoute = activeRoute ?? pathname;

  return (
    <View style={styles.container}>
      {NAV_ITEMS.map((item) => {
        const isActive = currentRoute === item.route || currentRoute.startsWith(item.route.replace("/page", ""));
        const isCenter = "isCenter" in item && item.isCenter;

        if (isCenter) {
          return (
            <TouchableOpacity
              key={item.route}
              activeOpacity={0.85}
              style={styles.centerWrap}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.centerBtn}>
                <Ionicons name="add" size={28} color="#fff" />
              </View>
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
              color={isActive ? "#0d9488" : "#9ca3af"}
            />
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {item.label}
            </Text>
            {isActive && <View style={styles.activeBar} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 28 : 12,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 8,
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
    color: "#9ca3af",
  },
  navLabelActive: {
    color: "#0d9488",
    fontWeight: "700",
  },
  activeBar: {
    position: "absolute",
    bottom: -12,
    width: 18,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: "#0d9488",
  },

  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: -20,
  },
  centerBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#0d9488",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: "#fff",
  },
  centerLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#0d9488",
  },
});
