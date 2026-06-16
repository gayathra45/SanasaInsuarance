import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../config";

type Role = "policy_holder" | "insurance_agent";

export default function MobileResetPassword() {
  const { width, height } = useWindowDimensions();

  // 3-Stage Navigation (1: Enter Details, 2: OTP Verification, 3: New Password)
  const [stage, setStage] = useState(1);
  const [activeRole, setActiveRole] = useState<Role>("policy_holder");
  const [customAlert, setCustomAlert] = useState<{ title: string; message: string } | null>(null);

  const showAlert = (title: string, message: string) => {
    setCustomAlert({ title, message });
  };

  // Stage 1 Inputs
  const [nic, setNic] = useState("");           // Policy Holder NIC
  const [mobile, setMobile] = useState("");     // Policy Holder Mobile
  const [agentNic, setAgentNic] = useState(""); // Insurance Agent NIC
  const [email, setEmail] = useState("");       // Insurance Agent Email

  // OTP Stage Inputs
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState<string[]>(Array(6).fill(""));
  const otpRefs = useRef<(TextInput | null)[]>([]);
  const [timerSeconds, setTimerSeconds] = useState(59);

  // Stage 3 Inputs
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Password strength checker
  const getPasswordStrength = () => {
    if (!newPassword) return { label: "", color: "transparent", width: "0%" };
    let score = 0;
    if (newPassword.length >= 6 && newPassword.length <= 12) score += 1;
    if (newPassword.length >= 8 && newPassword.length <= 12) score += 1;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword)) score += 1;

    switch (score) {
      case 1:
        return { label: "Weak", color: "#ef4444", width: "25%" };
      case 2:
        return { label: "Fair", color: "#f97316", width: "50%" };
      case 3:
        return { label: "Good", color: "#eab308", width: "75%" };
      case 4:
        return { label: "Strong", color: "#22c55e", width: "100%" };
      default:
        return { label: "", color: "transparent", width: "0%" };
    }
  };

  const strength = getPasswordStrength();

  // Countdown timer for OTP
  useEffect(() => {
    let timer: any;
    if (stage === 2 && timerSeconds > 0) {
      timer = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [stage, timerSeconds]);

  // Handle OTP Input Changes
  const handleOtpChange = (index: number, val: string) => {
    const numericVal = val.replace(/[^0-9]/g, "");
    if (!numericVal) return;

    const newOtp = [...enteredOtp];
    newOtp[index] = numericVal.substring(numericVal.length - 1); // Get last digit
    setEnteredOtp(newOtp);

    // Focus next cell
    if (index < 5 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: any) => {
    if (e.nativeEvent.key === "Backspace") {
      const newOtp = [...enteredOtp];
      if (newOtp[index] !== "") {
        newOtp[index] = "";
        setEnteredOtp(newOtp);
      } else if (index > 0) {
        newOtp[index - 1] = "";
        setEnteredOtp(newOtp);
        otpRefs.current[index - 1]?.focus();
      }
    }
  };

  const resendOtp = async () => {
    setEnteredOtp(Array(6).fill(""));
    setTimerSeconds(59);

    if (activeRole === "insurance_agent") {
      const localOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(localOtp);
      showAlert("Simulated Email OTP", `A new verification code has been sent to ${email}.\nCode: ${localOtp}`);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/signup/reset-password/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nic: nic.trim(), mobile: mobile.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to verify details.");
      }

      setGeneratedOtp(data.otp);
      showAlert("Simulated SMS OTP", `A new verification code has been sent to your mobile number.\nCode: ${data.otp}`);
    } catch (err: any) {
      showAlert("Error", "Failed to resend verification code. Please try again.");
    }
  };

  const handleVerify = async () => {
    // ── Insurance Agent: NIC + Email ──────────────────────────────
    if (activeRole === "insurance_agent") {
      if (!agentNic.trim()) {
        showAlert("Validation Error", "Please enter your NIC.");
        return;
      }
      if (!email.trim()) {
        showAlert("Validation Error", "Please enter your Gmail / Email.");
        return;
      }
      const isGmail = email.trim().toLowerCase().endsWith("@gmail.com");
      if (!isGmail) {
        showAlert("Validation Error", "Please enter a valid Gmail address.");
        return;
      }
      const localOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(localOtp);
      setTimerSeconds(59);
      setStage(2);
      showAlert("Simulated Email OTP", `A verification code has been sent to ${email}.\nCode: ${localOtp}`);
      return;
    }

    // ── Policy Holder: NIC + Mobile ───────────────────────────────
    if (!nic.trim() || !mobile.trim()) {
      showAlert("Validation Error", "Please fill in both NIC and Mobile Number fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/signup/reset-password/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nic: nic.trim(), mobile: mobile.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed.");
      }

      setGeneratedOtp(data.otp);
      setTimerSeconds(59);
      setStage(2);
      showAlert("Simulated SMS OTP", `A verification code has been sent to your mobile number.\nCode: ${data.otp}`);
    } catch (err: any) {
      showAlert("Verification Failed", err.message || "No matching registered account found.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpVerify = () => {
    const code = enteredOtp.join("");
    if (code.length < 6 || enteredOtp.some(digit => digit === "")) {
      showAlert("Validation Error", "Please enter the complete 6-digit OTP code.");
      return;
    }
    if (code !== generatedOtp) {
      showAlert("Verification Error", "Incorrect verification code. Please try again.");
      return;
    }
    setStage(3);
  };

  const handleUpdate = async () => {
    if (!newPassword || !confirmPassword) {
      showAlert("Validation Error", "Please fill in both password fields.");
      return;
    }

    if (newPassword.length < 6 || newPassword.length > 12) {
      showAlert("Validation Error", "Password must be between 6 and 12 characters.");
      return;
    }

    if (!/[0-9]/.test(newPassword) && !/[^A-Za-z0-9]/.test(newPassword)) {
      showAlert("Validation Error", "Password must contain at least one number or special character.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert("Validation Error", "Passwords do not match!");
      return;
    }

    if (activeRole !== "policy_holder") {
      setShowSuccessModal(true);
      setTimeout(() => {
        router.push("/login/page");
      }, 3000);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/signup/reset-password/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nic: nic.trim(),
          mobile: mobile.trim(),
          newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Update failed.");
      }

      setShowSuccessModal(true);
      setTimeout(() => {
        router.push("/login/page");
      }, 3000);
    } catch (err: any) {
      showAlert("Update Failed", err.message || "An error occurred while connecting to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const rolesList: { id: Role; label: string }[] = [
    { id: "policy_holder", label: "Policy Holder" },
    { id: "insurance_agent", label: "Insurance Agent" },
  ];

  return (
    <ImageBackground
      source={require("../../assets/images/login_bg.jpg")}
      style={styles.backgroundImage}
      resizeMode="cover"
      blurRadius={10}
    >
      <StatusBar style="light" />
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { minHeight: height }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar with Back to Login Button */}
          <View style={styles.topBar}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/login/page")}
              style={styles.topBackBtn}
            >
              <Ionicons name="arrow-back-outline" size={18} color="#fff" />
              <Text style={styles.topBackBtnText}>Back to Login</Text>
            </TouchableOpacity>
          </View>

          {/* Header Title Section */}
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>Reset Password</Text>
            <Text style={styles.headerSubtitle}>
              {stage === 1
                ? "Verify your identity details to reset your credentials."
                : stage === 2
                ? "Verify the verification code sent to your credentials."
                : "Choose a new strong password for your account."}
            </Text>
          </View>

          {/* Glass Card Container */}
          <View style={styles.glassCard}>
            
            {/* STAGE 1: VERIFY IDENTITY */}
            {stage === 1 && (
              <View style={styles.formContainer}>
                
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
                          ]}
                        >
                          {role.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {activeRole === "policy_holder" ? (
                  <>
                    {/* NIC field */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>National Identity Card (NIC) *</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="id-card-outline" size={20} color="#64748b" style={styles.inputIcon} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="Enter your NIC"
                          placeholderTextColor="#94a3b8"
                          value={nic}
                          onChangeText={setNic}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                    </View>

                    {/* Mobile Number field */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Mobile Number *</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="phone-portrait-outline" size={20} color="#64748b" style={styles.inputIcon} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="Enter your Mobile Number"
                          placeholderTextColor="#94a3b8"
                          value={mobile}
                          onChangeText={setMobile}
                          keyboardType="phone-pad"
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                    </View>
                  </>
                ) : (
                  /* Insurance Agent: NIC + Email fields */
                  <>
                    {/* Agent NIC field */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>National Identity Card (NIC) *</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="id-card-outline" size={20} color="#64748b" style={styles.inputIcon} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="Enter your NIC"
                          placeholderTextColor="#94a3b8"
                          value={agentNic}
                          onChangeText={setAgentNic}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                    </View>

                    {/* Agent Email field */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Gmail / Email Address *</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="Enter your Gmail address"
                          placeholderTextColor="#94a3b8"
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                    </View>
                  </>
                )}

                {/* Send OTP Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.actionButton}
                  disabled={isSubmitting}
                  onPress={handleVerify}
                >
                  <Text style={styles.actionButtonText}>
                    {isSubmitting ? "Sending..." : "Send OTP"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STAGE 2: OTP VERIFICATION */}
            {stage === 2 && (
              <View style={styles.formContainer}>
                <View style={{ alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <View style={styles.checkmarkCircle}>
                    <Ionicons name="shield-checkmark-outline" size={36} color="#ff9800" />
                  </View>
                  <Text style={[styles.label, { fontSize: 16, fontWeight: "bold", textAlign: "center" }]}>
                    Verification Code
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, textAlign: "center", paddingHorizontal: 12 }}>
                    We've sent a 6-digit code to{" "}
                    <Text style={{ color: "#ff9800", fontWeight: "bold" }}>
                      {activeRole === "policy_holder" ? mobile : email}
                    </Text>
                    {activeRole === "insurance_agent" && agentNic ? (
                      <Text style={{ color: "rgba(255,255,255,0.7)" }}>{" "}(NIC: {agentNic})</Text>
                    ) : null}.
                  </Text>
                </View>

                {/* 6-Digit OTP inputs */}
                <View style={styles.otpWrapper}>
                  {enteredOtp.map((digit, idx) => (
                    <TextInput
                      key={idx}
                      ref={(el) => { otpRefs.current[idx] = el; }}
                      style={styles.otpInput}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(val) => handleOtpChange(idx, val)}
                      onKeyPress={(e) => handleOtpKeyDown(idx, e)}
                    />
                  ))}
                </View>

                {/* Timer / Resend */}
                <View style={{ alignItems: "center", marginTop: 8 }}>
                  {timerSeconds > 0 ? (
                    <Text style={styles.otpText}>
                      Resend code in <Text style={styles.otpTextBold}>{timerSeconds}s</Text>
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={resendOtp}>
                      <Text style={[styles.linkText, { color: "#ff9800", fontWeight: "bold" }]}>
                        Resend Verification Code
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Verify OTP Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.actionButton}
                  onPress={handleOtpVerify}
                >
                  <Text style={styles.actionButtonText}>Verify Code</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STAGE 3: UPDATE PASSWORD */}
            {stage === 3 && (
              <View style={styles.formContainer}>
                
                {/* New Password */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>New Password *</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter New Password"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry={!showPassword}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                      <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Strength Meter */}
                {newPassword ? (
                  <View style={styles.strengthBox}>
                    <View style={styles.strengthHeader}>
                      <Text style={styles.strengthLabel}>Password Strength:</Text>
                      <Text style={[styles.strengthValue, { color: strength.color }]}>
                        {strength.label}
                      </Text>
                    </View>
                    <View style={styles.strengthBarBg}>
                      <View style={[styles.strengthBarFill, { width: strength.width as any, backgroundColor: strength.color }]} />
                    </View>
                  </View>
                ) : null}

                {/* Confirm Password */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirm Password *</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Confirm New Password"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                      <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Update Action Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.actionButton}
                  disabled={isSubmitting}
                  onPress={handleUpdate}
                >
                  <Text style={styles.actionButtonText}>
                    {isSubmitting ? "Updating..." : "Update Password"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Bottom links */}
            <View style={styles.footerLinks}>
              {activeRole === "policy_holder" ? (
                <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/Signup/page")}>
                  <Text style={styles.linkText}>Create an Account</Text>
                </TouchableOpacity>
              ) : null}
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Done Popup Success Modal */}
      {showSuccessModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.checkmarkCircle}>
              <Ionicons name="checkmark" size={44} color="#4ade80" />
            </View>
            <Text style={styles.modalTitle}>Done</Text>
            <Text style={styles.modalMsg}>
              Your password has been successfully updated. Redirecting to Login...
            </Text>
            <Text style={styles.modalRedirect}>Please wait...</Text>
          </View>
        </View>
      )}
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 40,
  },
  topBar: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  topBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ff9800",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#ff9800",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  topBackBtnText: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "bold",
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13.5,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 300,
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
    maxWidth: 400,
  },
  formContainer: {
    gap: 16,
    marginBottom: 24,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "600",
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
    height: 50,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    color: "#1e293b",
    fontSize: 15,
    fontWeight: "500",
    height: "100%",
  },
  eyeIcon: {
    padding: 4,
  },
  strengthBox: {
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.15)",
    padding: 10,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
  },
  strengthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  strengthLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: "600",
  },
  strengthValue: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  strengthBarBg: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 2,
    overflow: "hidden",
  },
  strengthBarFill: {
    height: "100%",
  },
  actionButton: {
    backgroundColor: "#ff9800",
    borderRadius: 24,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ff9800",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    paddingTop: 18,
  },
  linkText: {
    color: "rgba(255, 255, 255, 0.78)",
    fontSize: 13,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 11, 13, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  modalCard: {
    width: "80%",
    maxWidth: 320,
    backgroundColor: "rgba(10, 34, 40, 0.95)",
    borderRadius: 30,
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
  checkmarkCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(74, 222, 128, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(74, 222, 128, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#4ade80",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  modalMsg: {
    fontSize: 13.5,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  modalRedirect: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
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
  otpWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginVertical: 16,
  },
  otpInput: {
    width: 44,
    height: 50,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  otpText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },
  otpTextBold: {
    color: "#ff9800",
    fontWeight: "bold",
  },
});
