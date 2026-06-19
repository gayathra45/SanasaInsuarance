import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  StatusBar,
  ImageBackground,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PolicyHolderNavbar from "../Components/policy holder/page";

export default function PolicyHolderContact() {
  const [customAlert, setCustomAlert] = useState<{
    title: string;
    message: string;
    type?: "success" | "warning" | "info";
  } | null>(null);

  const handleHotlinePress = () => {
    Linking.openURL("tel:+94112003000").catch((err) => {
      console.error("Failed to open dialer:", err);
      setCustomAlert({
        title: "Error",
        message: "Could not open dialer app. Please call +94 112 003 000 manually.",
        type: "warning",
      });
    });
  };

  const handleEmailPress = () => {
    Linking.openURL("mailto:claims@sanasainsurance.lk").catch((err) => {
      console.error("Failed to open mail app:", err);
      setCustomAlert({
        title: "Error",
        message: "Could not open mail app. Please email claims@sanasainsurance.lk manually.",
        type: "warning",
      });
    });
  };

  const handleChatPress = () => {
    setCustomAlert({
      title: "Live Chat 💬",
      message: "The live chat feature is currently being developed and will be available soon!",
      type: "info",
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Curved Header Banner */}
        <ImageBackground
          source={require("../../assets/images/policy1.jpg")}
          style={styles.headerBackground}
          imageStyle={styles.headerImageStyle}
        >
          <View style={styles.headerGradient}>
            <Text style={styles.headerTitle}>Contact Us</Text>
            <Text style={styles.headerSubtitle}>Contact with Anytime with Us</Text>
          </View>
        </ImageBackground>

        {/* Channels List */}
        <View style={styles.channelsContainer}>
          
          {/* Card 1: Hotline */}
          <TouchableOpacity
            style={styles.channelCard}
            onPress={handleHotlinePress}
            activeOpacity={0.7}
          >
            <View style={styles.channelLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="call-outline" size={24} color="#0ea5e9" />
              </View>
              <View style={styles.channelInfo}>
                <Text style={styles.channelTitle}>Hotline</Text>
                <Text style={styles.channelDetail}>+94 112 003 000</Text>
                <Text style={styles.channelDetail}>+94 112 003 000</Text>
              </View>
            </View>
            <Text style={styles.channelBadge}>24 Hours Hotline</Text>
          </TouchableOpacity>

          {/* Card 2: Email */}
          <TouchableOpacity
            style={styles.channelCard}
            onPress={handleEmailPress}
            activeOpacity={0.7}
          >
            <View style={styles.channelLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="mail-outline" size={24} color="#0ea5e9" />
              </View>
              <View style={styles.channelInfo}>
                <Text style={styles.channelTitle}>Email</Text>
                <Text style={styles.channelDetail}>claims@sanasainsurance.lk</Text>
              </View>
            </View>
            <Text style={styles.channelBadge}>Response within 24h</Text>
          </TouchableOpacity>

          {/* Card 3: Live Chat */}
          <TouchableOpacity
            style={styles.channelCard}
            onPress={handleChatPress}
            activeOpacity={0.7}
          >
            <View style={styles.channelLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="chatbubble-ellipses-outline" size={24} color="#0ea5e9" />
              </View>
              <View style={styles.channelInfo}>
                <Text style={styles.channelTitle}>Live Chat</Text>
                <Text style={styles.channelDetail}>Available Now</Text>
              </View>
            </View>
            <Text style={styles.channelBadge}>Mon-Sat 9am-6pm</Text>
          </TouchableOpacity>

        </View>

        {/* Head Office & Open Hours Box */}
        <View style={styles.officeBox}>
          <View style={styles.officeItem}>
            <View style={styles.officeIconCircle}>
              <Ionicons name="location-outline" size={22} color="#0ea5e9" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.officeLabel}>Head Office</Text>
              <Text style={styles.officeVal}>No: 172, Elvitigala Mv, Colombo 8, Sri Lanka</Text>
            </View>
          </View>

          <View style={styles.officeDivider} />

          <View style={styles.officeItem}>
            <View style={styles.officeIconCircle}>
              <Ionicons name="time-outline" size={22} color="#0ea5e9" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.officeLabel}>Open Hours</Text>
              <Text style={styles.officeVal}>Monday - Friday{"\n"}8:30AM–5:15PM</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Floating support */}
      <TouchableOpacity style={styles.floatingSupport} onPress={handleChatPress} activeOpacity={0.8}>
        <Ionicons name="chatbubble-ellipses" size={26} color="#ffffff" />
      </TouchableOpacity>

      <PolicyHolderNavbar />

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
                onPress={() => setCustomAlert(null)}
                style={styles.alertButton}
              >
                <Text style={styles.alertButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: { paddingBottom: 120 },

  /* Curved background header */
  headerBackground: { width: "100%", height: 190 },
  headerImageStyle: { borderBottomRightRadius: 50 },
  headerGradient: {
    flex: 1,
    borderBottomRightRadius: 50,
    backgroundColor: "rgba(13, 42, 58, 0.8)",
    paddingTop: Platform.OS === "ios" ? 54 : 42,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  headerTitle: { fontSize: 28, color: "#ffffff", fontWeight: "800", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: "#cbd5e1", fontWeight: "600", marginTop: 4 },

  /* Channels cards container */
  channelsContainer: { paddingHorizontal: 16, marginTop: 24, gap: 14 },
  channelCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  channelLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f0f9ff",
    alignItems: "center",
    justifyContent: "center",
  },
  channelInfo: { flex: 1 },
  channelTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  channelDetail: { fontSize: 13, color: "#475569", fontWeight: "600", marginTop: 2 },
  channelBadge: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#ef4444",
    alignSelf: "center",
  },

  /* Office and open hours box */
  officeBox: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginHorizontal: 16,
    marginTop: 24,
    padding: 20,
    gap: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  officeItem: { flexDirection: "row", alignItems: "center", gap: 14 },
  officeIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#f0f9ff",
    alignItems: "center",
    justifyContent: "center",
  },
  officeLabel: { fontSize: 14.5, fontWeight: "800", color: "#0f172a" },
  officeVal: { fontSize: 12.5, color: "#475569", fontWeight: "600", marginTop: 2, lineHeight: 18 },
  officeDivider: { height: 1, backgroundColor: "#f1f5f9" },

  /* Floating support */
  floatingSupport: {
    position: "absolute",
    bottom: 96,
    right: 18,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#0ea5e9",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 99,
  },

  /* Unified Alert Styles */
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(2, 11, 13, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  alertCard: {
    width: "85%",
    maxWidth: 340,
    backgroundColor: "rgba(10, 34, 40, 0.98)",
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
