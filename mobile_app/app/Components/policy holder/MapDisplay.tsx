import React from "react";
import { StyleSheet, View, Text, Platform, Image, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface MapDisplayProps {
  latitude: number;
  longitude: number;
  onLocationSelect: (lat: number, lon: number) => void;
}

export default function MapDisplay({ latitude, longitude, onLocationSelect }: MapDisplayProps) {
  if (Platform.OS === "web") {
    // Web rendering (uses Google Maps iframe fallback)
    const mapUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    return (
      <View style={styles.container}>
        <iframe
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          title="Incident Map"
        />
      </View>
    );
  }

  // Native rendering: Render a premium static map preview using Yandex Static Maps API.
  // Tap to open in Google/Apple Maps.
  const staticMapUrl = `https://static-maps.yandex.ru/1.x/?ll=${longitude},${latitude}&z=14&l=map&size=500,220`;

  const handleOpenMapApp = () => {
    const url = Platform.select({
      ios: `maps://app?saddr=&daddr=${latitude},${longitude}`,
      android: `google.navigation:q=${latitude},${longitude}`,
      default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    });
    
    Linking.openURL(url).catch((err) => {
      console.warn("Could not open maps application:", err);
      // Fallback to web link
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
    });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handleOpenMapApp} activeOpacity={0.9}>
      <Image
        source={{ uri: staticMapUrl }}
        style={styles.staticMap}
        resizeMode="cover"
      />
      <View style={styles.overlay}>
        <View style={styles.pinContainer}>
          <Ionicons name="location" size={24} color="#dc2626" />
        </View>
        <View style={styles.tapToOpenBadge}>
          <Ionicons name="open-outline" size={14} color="#ffffff" />
          <Text style={styles.tapToOpenText}>Tap to open in Map app</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 220,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#e2e8f0",
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: "relative",
  },
  staticMap: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.1)",
  },
  pinContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  tapToOpenBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(13, 42, 58, 0.85)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 99,
  },
  tapToOpenText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
});
