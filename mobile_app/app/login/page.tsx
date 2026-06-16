import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";

type Role = "policy_holder" | "insurance_agent";

export default function MobileLogin() {
  const [activeRole, setActiveRole] = useState<Role>("policy_holder");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [customAlert, setCustomAlert] = useState<{ title: string; message: string } | null>(null);

  const showAlert = (title: string, message: string) => {
    setCustomAlert({ title, message });
  };
  const { width, height } = useWindowDimensions();

  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (!loginId.trim() || !password) {
      const fieldName = activeRole === "policy_holder" ? "NIC" : "Gmail";
      showAlert("Validation Error", `Please fill out both ${fieldName} and Password fields.`);
      return;
    }
    if (activeRole !== "policy_holder") {
      const isGmail = loginId.trim().toLowerCase().endsWith("@gmail.com");
      if (!isGmail) {
        showAlert("Validation Error", "Please enter a valid Gmail address.");
        return;
      }
    }

    setLoggingIn(true);
    try {
      // ── Policy Holder ──────────────────────────────────────────
      if (activeRole === "policy_holder") {
        const res = await fetch(`${API_BASE_URL}/api/policy-holder/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nic: loginId.trim(), password }),
        });
        const data = await res.json();
        if (!res.ok) {
          showAlert("Login Failed", data.error || "Invalid NIC or Password.");
          return;
        }
        await AsyncStorage.setItem("logged_in_user", JSON.stringify(data.user));
        router.replace("/Policy Holder/page");

      // ── Insurance Agent ────────────────────────────────────────
      } else if (activeRole === "insurance_agent") {
        const res = await fetch(`${API_BASE_URL}/api/agent/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: loginId.trim(), password }),
        });
        const data = await res.json();
        if (!res.ok) {
          showAlert("Login Failed", data.error || "Invalid credentials.");
          return;
        }
        await AsyncStorage.setItem("logged_in_agent", JSON.stringify(data.agent));
        router.replace("/Agent/Dashboard/page");

      }
    } catch (e) {
      showAlert("Network Error", "Could not connect to server. Please check your connection.");
      console.error("Login error:", e);
    } finally {
      setLoggingIn(false);
    }
  };

  const rolesList: { id: Role; label: string }[] = [
    { id: "policy_holder", label: "Policy Holder" },
    { id: "insurance_agent", label: "Insurance Agent" },
  ];

  const isSmallScreen = width < 380;

  return (
    <ImageBackground
      source={require("../../assets/images/login_bg.jpg")}
      style={styles.backgroundImage}
      resizeMode="cover"
      blurRadius={10}
    >
      <StatusBar style="light" />
      {/* Immersive Teal Overlay to match Web Gradient */}
      <View style={styles.overlay} />

      {/* Decorative Blur Ambient Lights */}
      <View style={[styles.ambientLightTop, { width: width * 0.7, height: width * 0.7 }]} />
      <View style={[styles.ambientLightBottom, { width: width * 0.6, height: width * 0.6 }]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { minHeight: height }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Form Card */}
          <View style={[styles.glassCard, { maxWidth: width > 500 ? 460 : "100%" }]}>
            <Text style={styles.cardTitle}>Login</Text>

            {/* Roles Selection Grid */}
            <View style={styles.rolesGrid}>
              {rolesList.map((role) => {
                const isSelected = activeRole === role.id;
                return (
                  <TouchableOpacity
                    key={role.id}
                    activeOpacity={0.7}
                    onPress={() => setActiveRole(role.id)}
                    style={[
                      styles.roleButton,
                      isSelected && styles.roleButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        isSelected && styles.roleButtonTextActive,
                        isSmallScreen && { fontSize: 11 }
                      ]}
                    >
                      {role.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Inputs Section */}
            <View style={styles.inputsSection}>
              {/* Dynamic Input (NIC / Gmail) */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  {activeRole === "policy_holder" ? "National Identity Card (NIC)" : "Gmail / Email"}
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name={activeRole === "policy_holder" ? "id-card-outline" : "mail-outline"}
                    size={20}
                    color="#64748b"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder={activeRole === "policy_holder" ? "Enter your NIC" : "Enter your Gmail address"}
                    placeholderTextColor="#94a3b8"
                    value={loginId}
                    onChangeText={setLoginId}
                    keyboardType={activeRole === "policy_holder" ? "default" : "email-address"}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#64748b"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLogin}
              style={[styles.submitButton, loggingIn && { opacity: 0.7 }]}
              disabled={loggingIn}
            >
              {loggingIn ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* Bottom Navigation Links */}
            <View style={styles.footerLinks}>
              {activeRole === "policy_holder" ? (
                <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/Signup/page")}>
                  <Text style={styles.linkText}>Create an Account</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}
              <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/Reset_password/page")}>
                <Text style={styles.linkText}>Reset Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {customAlert && (
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <View style={styles.alertIconCircle}>
              <Ionicons name="warning-outline" size={38} color="#ff9800" />
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
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 18, 21, 0.88)",
  },
  ambientLightTop: {
    position: "absolute",
    top: "-10%",
    left: "-10%",
    borderRadius: 9999,
    backgroundColor: "rgba(34, 211, 238, 0.16)",
    transform: [{ scale: 1.2 }],
  },
  ambientLightBottom: {
    position: "absolute",
    bottom: "-10%",
    right: "-10%",
    borderRadius: 9999,
    backgroundColor: "rgba(20, 184, 166, 0.12)",
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 40,
  },
  logoSection: {
    marginBottom: 25,
    alignItems: "center",
  },
  logoImage: {
    width: 130,
    height: 55,
  },
  glassCard: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 36,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.18)",
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  rolesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 24,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  roleButtonActive: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderColor: "#ffffff",
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  roleButtonText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  roleButtonTextActive: {
    color: "#ffffff",
    fontWeight: "800",
  },
  inputsSection: {
    gap: 16,
    marginBottom: 28,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    height: 52,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    color: "#1e293b",
    fontSize: 15.5,
    fontWeight: "500",
    height: "100%",
  },
  eyeIcon: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: "#ff9800",
    borderRadius: 26,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ff9800",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 24,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    paddingTop: 18,
  },
  linkText: {
    color: "rgba(255, 255, 255, 0.78)",
    fontSize: 13.5,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  alertOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 11, 13, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  alertCard: {
    width: "85%",
    maxWidth: 340,
    backgroundColor: "rgba(10, 34, 40, 0.95)",
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
