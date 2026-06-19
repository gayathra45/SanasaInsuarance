import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated, Easing, LayoutChangeEvent } from "react-native";
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
  const [navWidth, setNavWidth] = useState(0);
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorOpacity = useRef(new Animated.Value(1)).current;
  const centerPulse = useRef(new Animated.Value(1)).current;
  const activeIndex = useMemo(() => {
    return NAV_ITEMS.findIndex((item) => {
      if (item.route === "/Policy Holder/page") {
        return currentRoute === "/Policy Holder/page" || currentRoute === "/Policy Holder";
      }
      return currentRoute === item.route || currentRoute.startsWith(item.route);
    });
  }, [currentRoute]);

  useEffect(() => {
    if (!navWidth) return;
    const slot = navWidth / NAV_ITEMS.length;
    const isCenter = activeIndex === 2;
    const isNotFound = activeIndex === -1;
    const targetX = (isNotFound ? 0 : activeIndex) * slot + (slot - 34) / 2;
    Animated.parallel([
      Animated.timing(indicatorX, {
        toValue: targetX,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(indicatorOpacity, {
        toValue: (isCenter || isNotFound) ? 0 : 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeIndex, indicatorOpacity, indicatorX, navWidth]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(centerPulse, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
        Animated.timing(centerPulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [centerPulse]);

  const onShellLayout = (e: LayoutChangeEvent) => {
    setNavWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={styles.container}>
      <View style={styles.shadowPad} />
      <View style={styles.shell} onLayout={onShellLayout}>
        <Animated.View style={[styles.indicator, { opacity: indicatorOpacity, transform: [{ translateX: indicatorX }] }]} />
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
              color={isActive ? "#0ea5e9" : "#94a3b8"}
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
    bottom: Platform.OS === "ios" ? 10 : 4,
    width: 34,
    height: 3,
    borderRadius: 999,
    backgroundColor: "#0ea5e9",
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
});
