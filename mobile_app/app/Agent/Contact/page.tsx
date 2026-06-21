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
import AgentNavbar from "../../Components/Agent/page";

export default function AgentContact() {
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
    Linking.openURL("mailto:claims-support@sanasa.lk").catch((err) => {
      console.error("Failed to open mail app:", err);
      setCustomAlert({
        title: "Error",
        message: "Could not open mail app. Please email claims-support@sanasa.lk manually.",
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
          source={require("../../../assets/images/policy1.jpg")}
          style={styles.headerBackground}
          imageStyle={styles.headerImageStyle}
        >
          <View style={styles.headerGradient}>
            <Text style={styles.headerTitle}>Contact Us</Text>
            <Text style={styles.headerSubtitle}>Connect anytime with Sanasa Agent Support</Text>
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
                <Ionicons name="call-outline" size={24} color="#f97316" />
              </View>
              <View style={styles.channelInfo}>
                <Text style={styles.channelTitle}>Hotline</Text>
                <Text style={styles.channelDetail}>+94 112 003 000</Text>
                <Text style={styles.channelDetail}>+94 112 003 001</Text>
              </View>
            </View>
            <Text style={styles.channelBadge}>24h Support</Text>
          </TouchableOpacity>

          {/* Card 2: Email */}
          <TouchableOpacity
            style={styles.channelCard}
            onPress={handleEmailPress}
            activeOpacity={0.7}
          >
            <View style={styles.channelLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="mail-outline" size={24} color="#f97316" />
              </View>
              <View style={styles.channelInfo}>
                <Text style={styles.channelTitle}>Email</Text>
                <Text style={styles.channelDetail}>claims-support@sanasa.lk</Text>
              </View>
            </View>
            <Text style={styles.channelBadge}>Agent Helpdesk</Text>
          </TouchableOpacity>

          {/* Card 3: Live Chat */}
          <TouchableOpacity
            style={styles.channelCard}
            onPress={handleChatPress}
            activeOpacity={0.7}
          >
            <View style={styles.channelLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="chatbubble-ellipses-outline" size={24} color="#f97316" />
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
              <Ionicons name="location-outline" size={22} color="#f97316" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.officeLabel}>Head Office</Text>
              <Text style={styles.officeVal}>No: 172, Elvitigala Mv, Colombo 8, Sri Lanka</Text>
            </View>
          </View>

          <View style={styles.officeDivider} />

          <View style={styles.officeItem}>
            <View style={styles.officeIconCircle}>
              <Ionicons name="time-outline" size={22} color="#f97316" />
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

      <AgentNavbar activeTab="contact" />

      {/* Custom Alert Modal */}
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
                        : "#f97316"
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

  headerBackground: { width: "100%", height: 190 },
  headerImageStyle: { borderBottomRightRadius: 50 },
  headerGradient: {
    flex: 1,
    borderBottomRightRadius: 50,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    paddingTop: Platform.OS === "ios" ? 54 : 42,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  headerTitle: { fontSize: 28, color: "#ffffff", fontWeight: "800", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: "#cbd5e1", fontWeight: "600", marginTop: 4 },

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
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
  },
  channelInfo: { flex: 1 },
  channelTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  channelDetail: { fontSize: 13, color: "#475569", fontWeight: "600", marginTop: 2 },
  channelBadge: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#f97316",
    alignSelf: "center",
  },

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
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
  },
  officeLabel: { fontSize: 14.5, fontWeight: "800", color: "#0f172a" },
  officeVal: { fontSize: 12.5, color: "#475569", fontWeight: "600", marginTop: 2, lineHeight: 18 },
  officeDivider: { height: 1, backgroundColor: "#f1f5f9" },

  floatingSupport: {
    position: "absolute",
    bottom: 96,
    right: 18,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 99,
  },

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
    backgroundColor: "rgba(249, 115, 22, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.2)",
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
    backgroundColor: "#f97316",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 32,
    shadowColor: "#f97316",
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
