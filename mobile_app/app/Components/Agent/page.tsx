import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Easing,
  LayoutChangeEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";

const NAV_ITEMS = [
  {
    label: "Home",
    icon: "home-outline" as const,
    iconActive: "home" as const,
    route: "/Agent/Dashboard/page",
  },
  {
    label: "Claims",
    icon: "document-text-outline" as const,
    iconActive: "document-text" as const,
    route: "/Agent/Dashboard/page",
    isCenter: true,
  },
  {
    label: "Activity",
    icon: "bar-chart-outline" as const,
    iconActive: "bar-chart" as const,
    route: "/Agent/Dashboard/page",
  },
] as const;

interface AgentNavbarProps {
  activeRoute?: string;
  onTabPress?: (tab: "home" | "claims" | "activity") => void;
  activeTab?: "home" | "claims" | "activity";
}

export default function AgentNavbar({
  activeRoute,
  onTabPress,
  activeTab = "home",
}: AgentNavbarProps) {
  const pathname = usePathname();
  const [navWidth, setNavWidth] = useState(0);
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorOpacity = useRef(new Animated.Value(1)).current;
  const centerPulse = useRef(new Animated.Value(1)).current;

  const tabMap = ["home", "claims", "activity"] as const;
  const activeIndex = tabMap.indexOf(activeTab);

  useEffect(() => {
    if (!navWidth) return;
    const slot = navWidth / 3;
    const isCenter = activeIndex === 1;
    const targetX = Math.max(0, activeIndex) * slot + (slot - 34) / 2;
    Animated.parallel([
      Animated.timing(indicatorX, {
        toValue: targetX,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(indicatorOpacity, {
        toValue: isCenter ? 0 : 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeIndex, navWidth]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(centerPulse, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
        Animated.timing(centerPulse, { toValue: 1,    duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const onShellLayout = (e: LayoutChangeEvent) => {
    setNavWidth(e.nativeEvent.layout.width);
  };

  const handlePress = (tab: "home" | "claims" | "activity") => {
    onTabPress?.(tab);
  };

  return (
    <View style={styles.container}>
      <View style={styles.shadowPad} />
      <View style={styles.shell} onLayout={onShellLayout}>
        <Animated.View
          style={[
            styles.indicator,
            {
              opacity: indicatorOpacity,
              transform: [{ translateX: indicatorX }],
            },
          ]}
        />

        {/* Home */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.navItem}
          onPress={() => handlePress("home")}
        >
          <Ionicons
            name={activeTab === "home" ? "home" : "home-outline"}
            size={22}
            color={activeTab === "home" ? "#f97316" : "#94a3b8"}
          />
          <Text style={[styles.navLabel, activeTab === "home" && styles.navLabelActive]}>
            Home
          </Text>
          {activeTab === "home" && <View style={styles.activeBar} />}
        </TouchableOpacity>

        {/* Center — Claims */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.centerWrap}
          onPress={() => handlePress("claims")}
        >
          <Animated.View
            style={[
              styles.centerBtn,
              activeTab === "claims" && styles.centerBtnActive,
              { transform: [{ scale: centerPulse }] },
            ]}
          >
            <Ionicons name="document-text" size={26} color="#fff" />
          </Animated.View>
          <Text style={[styles.centerLabel, activeTab === "claims" && styles.centerLabelActive]}>
            Claims
          </Text>
        </TouchableOpacity>

        {/* Activity */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.navItem}
          onPress={() => handlePress("activity")}
        >
          <Ionicons
            name={activeTab === "activity" ? "bar-chart" : "bar-chart-outline"}
            size={22}
            color={activeTab === "activity" ? "#f97316" : "#94a3b8"}
          />
          <Text style={[styles.navLabel, activeTab === "activity" && styles.navLabelActive]}>
            Activity
          </Text>
          {activeTab === "activity" && <View style={styles.activeBar} />}
        </TouchableOpacity>
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
    backgroundColor: "#f97316",
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
    backgroundColor: "#f97316",
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
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: "#f9fafb",
  },
  centerBtnActive: {
    backgroundColor: "#f97316",
    shadowColor: "#f97316",
  },
  centerLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#6b7280",
  },
  centerLabelActive: {
    color: "#f97316",
  },
});
