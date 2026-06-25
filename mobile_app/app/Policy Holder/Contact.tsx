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
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PolicyHolderNavbar from "../Components/policy holder/page";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";

export default function PolicyHolderContact() {
  const [customAlert, setCustomAlert] = useState<{
    title: string;
    message: string;
    type?: "success" | "warning" | "info";
  } | null>(null);

  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [user, setUser] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    nic?: string;
    mobile?: string;
  } | null>(null);

  // Fetch logged in user on mount
  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem("logged_in_user");
        if (userStr) {
          setUser(JSON.parse(userStr));
        }
      } catch (err) {
        console.error("Failed to load user info from AsyncStorage:", err);
      }
    };
    fetchUser();
  }, []);

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
    setEmailModalVisible(true);
  };

  const handleSendEmail = async () => {
    if (!subject.trim() || !message.trim()) {
      setCustomAlert({
        title: "Validation Error",
        message: "Subject and message are required.",
        type: "warning",
      });
      return;
    }

    setIsSending(true);
    const payload = {
      name: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Mobile App Policy Holder",
      email: user?.email || "",
      nic: user?.nic || "",
      phone: user?.mobile || "",
      subject: subject.trim(),
      message: message.trim(),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/policy-holder/contact/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setEmailModalVisible(false);
        setSubject("");
        setMessage("");
        setCustomAlert({
          title: "Email Sent! ✉️",
          message: "Your contact request has been sent successfully. The claims team will review and reply within 24 hours.",
          type: "success",
        });
      } else {
        setCustomAlert({
          title: "Error",
          message: data.error || "Failed to send contact email. Please try again.",
          type: "warning",
        });
      }
    } catch (err) {
      console.error("Failed to send contact email:", err);
      setCustomAlert({
        title: "Network Error",
        message: "Unable to connect to the server. Please check your network connection.",
        type: "warning",
      });
    } finally {
      setIsSending(false);
    }
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

      {/* Email Composer Modal */}
      <Modal
        visible={emailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEmailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Send Email to Claims</Text>
                <Text style={styles.modalSubtitle}>We usually respond within 24 hours</Text>
              </View>
              <TouchableOpacity
                onPress={() => setEmailModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              
              {/* Logged in User info */}
              {user && (
                <View style={styles.userInfoBox}>
                  <View style={styles.userInfoRow}>
                    <Text style={styles.userInfoLabel}>From:</Text>
                    <Text style={styles.userInfoValue}>{user.firstName} {user.lastName}</Text>
                  </View>
                  <View style={styles.userInfoRow}>
                    <Text style={styles.userInfoLabel}>Email:</Text>
                    <Text style={styles.userInfoValue}>{user.email}</Text>
                  </View>
                  <View style={styles.userInfoRow}>
                    <Text style={styles.userInfoLabel}>NIC:</Text>
                    <Text style={styles.userInfoValue}>{user.nic}</Text>
                  </View>
                </View>
              )}

              {/* Recipient info */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>To</Text>
                <TextInput
                  value="claims@sanasainsurance.lk"
                  editable={false}
                  style={[styles.inputField, styles.disabledInput]}
                />
              </View>

              {/* Subject */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Subject</Text>
                <TextInput
                  placeholder="Enter inquiry subject..."
                  placeholderTextColor="#94a3b8"
                  value={subject}
                  onChangeText={setSubject}
                  style={styles.inputField}
                />
              </View>

              {/* Message */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Message</Text>
                <TextInput
                  placeholder="Type your message details here..."
                  placeholderTextColor="#94a3b8"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={6}
                  style={[styles.inputField, styles.multilineInput]}
                  textAlignVertical="top"
                />
              </View>

              {/* Actions */}
              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEmailModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
                  onPress={handleSendEmail}
                  disabled={isSending}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.sendButtonText}>Send Email</Text>
                  )}
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>

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
  /* Modal Styles for Email sending */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 24,
    paddingHorizontal: 20,
    maxHeight: "85%",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 16,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0f172a",
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
    backgroundColor: "#f8fafc",
    borderRadius: 20,
  },
  modalScrollContent: {
    paddingBottom: 40,
  },
  userInfoBox: {
    backgroundColor: "#f0f9ff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0f2fe",
    padding: 14,
    marginBottom: 18,
    gap: 6,
  },
  userInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  userInfoLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  userInfoValue: {
    fontSize: 12,
    color: "#0f172a",
    fontWeight: "700",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 6,
    paddingLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputField: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "600",
  },
  disabledInput: {
    backgroundColor: "#f1f5f9",
    color: "#64748b",
    borderColor: "#e2e8f0",
  },
  multilineInput: {
    height: 120,
    paddingTop: 12,
  },
  modalActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: "#475569",
    fontSize: 14.5,
    fontWeight: "700",
  },
  sendButton: {
    flex: 1.5,
    backgroundColor: "#0ea5e9",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: "#94a3b8",
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonText: {
    color: "#ffffff",
    fontSize: 14.5,
    fontWeight: "700",
  },
});
