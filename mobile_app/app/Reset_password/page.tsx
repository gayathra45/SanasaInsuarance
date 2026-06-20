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
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../config";

type Stage = 1 | 2 | 3 | 4; // 1=request, 2=otp, 3=set-password, 4=success
type Role = "policy_holder" | "insurance_agent";

const API = `${API_BASE_URL}/api/signup`;

export default function MobileResetPassword() {
  const { height } = useWindowDimensions();

  const [stage, setStage] = useState<Stage>(1);
  const [activeRole, setActiveRole] = useState<Role>("policy_holder");
  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null);

  const showAlert = (title: string, message: string) => setAlert({ title, message });

  // Stage 1 inputs
  const [nic, setNic] = useState("");
  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [devOtp, setDevOtp] = useState("");

  // Stage 2 OTP
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const otpRefs = useRef<(TextInput | null)[]>([]);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [sessionToken, setSessionToken] = useState("");

  // Stage 3 password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  // OTP countdown timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (stage === 2 && timerSeconds > 0) {
      timer = setInterval(() => setTimerSeconds((p) => p - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [stage, timerSeconds]);

  // Success redirect countdown timer
  useEffect(() => {
    if (stage === 4 && redirectCountdown > 0) {
      const t = setTimeout(() => setRedirectCountdown((p) => p - 1), 1000);
      return () => clearTimeout(t);
    } else if (stage === 4 && redirectCountdown === 0) {
      router.push("/login/page");
    }
  }, [stage, redirectCountdown]);

  // OTP digit handler
  const handleOtpChange = (idx: number, val: string) => {
    const digit = val.replace(/[^0-9]/g, "").slice(-1);
    const next = [...otpDigits];
    next[idx] = digit;
    setOtpDigits(next);
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpBackspace = (idx: number) => {
    const next = [...otpDigits];
    if (next[idx]) {
      next[idx] = "";
      setOtpDigits(next);
    } else if (idx > 0) {
      next[idx - 1] = "";
      setOtpDigits(next);
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const rolesList: { id: Role; label: string }[] = [
    { id: "policy_holder", label: "Policy Holder" },
    { id: "insurance_agent", label: "Insurance Agent" },
  ];

  // ── HANDLER: Send OTP ─────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!nic.trim()) { showAlert("Required", "Please enter your NIC number."); return; }
    if (!email.trim()) { showAlert("Required", "Please enter your registered email."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      showAlert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/reset-password/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nic: nic.trim(), email: email.trim(), role: activeRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP.");
      setSentEmail(email.trim());
      if (data.devOtp) setDevOtp(data.devOtp);
      setOtpDigits(Array(6).fill(""));
      setTimerSeconds(60);
      setStage(2);
    } catch (err: any) {
      showAlert("Error", err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── HANDLER: Resend OTP ───────────────────────────────────────────────────
  const handleResendOtp = async () => {
    setDevOtp("");
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/reset-password/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nic: nic.trim(), email: sentEmail, role: activeRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend OTP.");
      if (data.devOtp) setDevOtp(data.devOtp);
      setOtpDigits(Array(6).fill(""));
      setTimerSeconds(60);
    } catch (err: any) {
      showAlert("Error", err.message || "Failed to resend code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── HANDLER: Verify OTP ───────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    const otp = otpDigits.join("");
    if (otp.length < 6 || otpDigits.some((d) => d === "")) {
      showAlert("Incomplete", "Please enter the full 6-digit verification code.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/reset-password/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: sentEmail, otp, role: activeRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed.");
      setSessionToken(data.sessionToken);
      setStage(3);
    } catch (err: any) {
      showAlert("Error", err.message || "Verification failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── HANDLER: Set new password ─────────────────────────────────────────────
  const handleSetPassword = async () => {
    if (newPassword.length < 6 || newPassword.length > 12) {
      showAlert("Password Error", "Password must be between 6 and 12 characters.");
      return;
    }
    if (!/[0-9]/.test(newPassword) && !/[^A-Za-z0-9]/.test(newPassword)) {
      showAlert("Password Error", "Password must contain at least one number or special character.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert("Password Error", "Passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/reset-password/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password.");
      setStage(4);
    } catch (err: any) {
      showAlert("Error", err.message || "Failed to update password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/login_bg.jpg")}
      style={styles.bg}
      resizeMode="cover"
      blurRadius={10}
    >
      <StatusBar style="light" />
      <View style={styles.overlay} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { minHeight: height }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/login/page")} style={styles.backBtn}>
              <Ionicons name="arrow-back-outline" size={18} color="#fff" />
              <Text style={styles.backBtnText}>Back to Login</Text>
            </TouchableOpacity>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Reset Password</Text>
            <Text style={styles.headerSubtitle}>
              {stage === 1 && "Enter your details to receive a 6-digit verification code."}
              {stage === 2 && `Enter the code sent to ${sentEmail}`}
              {stage === 3 && "Set a new password for your account."}
              {stage === 4 && "Your password has been updated!"}
            </Text>
          </View>

          {/* Glass Card */}
          <View style={styles.card}>

            {/* ── STAGE 1: Enter details ── */}
            {stage === 1 && (
              <View style={styles.form}>
                {/* Role tabs */}
                <View style={styles.rolesRow}>
                  {rolesList.map((role) => {
                    const active = activeRole === role.id;
                    return (
                      <TouchableOpacity key={role.id} activeOpacity={0.7}
                        onPress={() => { setActiveRole(role.id); setNic(""); setEmail(""); }}
                        style={[styles.roleBtn, active && styles.roleBtnActive]}>
                        <Text style={[styles.roleBtnText, active && styles.roleBtnTextActive]}>{role.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* NIC */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>National Identity Card (NIC) *</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="id-card-outline" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput style={styles.textInput} placeholder="Enter your NIC" placeholderTextColor="#94a3b8"
                      value={nic} onChangeText={setNic} autoCapitalize="none" autoCorrect={false} />
                  </View>
                </View>

                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Registered Email *</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput style={styles.textInput} placeholder="Enter your registered email" placeholderTextColor="#94a3b8"
                      value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                  </View>
                </View>

                <TouchableOpacity activeOpacity={0.8} style={styles.primaryBtn} disabled={isSubmitting} onPress={handleSendOtp}>
                  <Text style={styles.primaryBtnText}>{isSubmitting ? "Sending..." : "Send OTP Code"}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── STAGE 2: Enter OTP ── */}
            {stage === 2 && (
              <View style={styles.form}>
                {/* Email icon */}
                <View style={{ alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="mail-open-outline" size={32} color="#ff9800" />
                  </View>
                  <Text style={[styles.label, { fontSize: 17, fontWeight: "bold", textAlign: "center" }]}>Enter Verification Code</Text>
                  <Text style={styles.subtitleSmall}>Check your email inbox for the 6-digit code</Text>
                </View>

                {/* 6 OTP boxes */}
                <View style={styles.otpRow}>
                  {otpDigits.map((digit, idx) => (
                    <TextInput key={idx}
                      ref={(el) => { otpRefs.current[idx] = el; }}
                      style={[styles.otpBox, digit ? styles.otpBoxFilled : {}]}
                      value={digit}
                      maxLength={1}
                      keyboardType="numeric"
                      onChangeText={(val) => handleOtpChange(idx, val)}
                      onKeyPress={({ nativeEvent }) => {
                        if (nativeEvent.key === "Backspace") handleOtpBackspace(idx);
                      }}
                      selectTextOnFocus
                    />
                  ))}
                </View>

                {/* Dev mode OTP display */}
                {devOtp ? (
                  <View style={styles.devOtpCard}>
                    <Text style={styles.devOtpLabel}>⚡ Dev Mode — OTP Code</Text>
                    <Text style={styles.devOtpCode}>{devOtp}</Text>
                    <Text style={styles.devOtpHint}>Configure SMTP_PASS in backend/.env to send real emails</Text>
                  </View>
                ) : null}

                {/* Timer / Resend */}
                <View style={{ alignItems: "center" }}>
                  {timerSeconds > 0 ? (
                    <Text style={styles.subtitleSmall}>
                      Resend code in <Text style={{ color: "#ff9800", fontWeight: "bold" }}>{timerSeconds}s</Text>
                    </Text>
                  ) : (
                    <TouchableOpacity activeOpacity={0.7} onPress={handleResendOtp} disabled={isSubmitting}>
                      <Text style={{ color: "#ff9800", fontWeight: "bold", fontSize: 13, textDecorationLine: "underline" }}>
                        Resend Verification Code
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity activeOpacity={0.8} style={styles.primaryBtn} disabled={isSubmitting} onPress={handleVerifyOtp}>
                  <Text style={styles.primaryBtnText}>{isSubmitting ? "Verifying..." : "Verify Code"}</Text>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.7} onPress={() => { setStage(1); setDevOtp(""); }}
                  style={{ alignItems: "center", marginTop: 4 }}>
                  <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, textDecorationLine: "underline" }}>
                    ← Try a different email
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── STAGE 3: Set New Password ── */}
            {stage === 3 && (
              <View style={styles.form}>
                <View style={{ gap: 4, marginBottom: 8 }}>
                  <Text style={[styles.label, { fontSize: 18, fontWeight: "bold" }]}>Set New Password</Text>
                  <Text style={styles.subtitleSmall}>Choose a strong, memorable password</Text>
                </View>

                {/* New Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>New Password *</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput style={[styles.textInput, { flex: 1 }]} placeholder="Enter new password" placeholderTextColor="#94a3b8"
                      secureTextEntry={!showPassword} value={newPassword} onChangeText={setNewPassword} autoCapitalize="none" />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingHorizontal: 4 }}>
                      <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                  {newPassword.length > 0 && (
                    <View style={styles.hintRow}>
                      <Text style={newPassword.length >= 6 && newPassword.length <= 12 ? styles.hintOk : styles.hintErr}>
                        {newPassword.length >= 6 && newPassword.length <= 12 ? "✔" : "✖"} 6–12 characters
                      </Text>
                      <Text style={(/[0-9]/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword)) ? styles.hintOk : styles.hintErr}>
                        {(/[0-9]/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword)) ? "✔" : "✖"} Number or symbol
                      </Text>
                    </View>
                  )}
                </View>

                {/* Confirm Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password *</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput style={[styles.textInput, { flex: 1 }]} placeholder="Confirm new password" placeholderTextColor="#94a3b8"
                      secureTextEntry={!showConfirm} value={confirmPassword} onChangeText={setConfirmPassword} autoCapitalize="none" />
                    <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={{ paddingHorizontal: 4 }}>
                      <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                  {confirmPassword.length > 0 && (
                    <Text style={newPassword === confirmPassword ? styles.hintOk : styles.hintErr}>
                      {newPassword === confirmPassword ? "✔ Passwords match" : "✖ Passwords do not match"}
                    </Text>
                  )}
                </View>

                <TouchableOpacity activeOpacity={0.8} style={styles.primaryBtn} disabled={isSubmitting} onPress={handleSetPassword}>
                  <Text style={styles.primaryBtnText}>{isSubmitting ? "Updating..." : "Update Password"}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── STAGE 4: Success ── */}
            {stage === 4 && (
              <View style={[styles.form, { alignItems: "center", gap: 16, paddingVertical: 16 }]}>
                {/* Glowing Checkmark Icon */}
                <View style={[styles.iconCircle, { width: 88, height: 88, borderRadius: 44, borderColor: "#ff9800", backgroundColor: "rgba(255,152,0,0.15)" }]}>
                  <Ionicons name="checkmark-done-outline" size={46} color="#ff9800" />
                </View>
                
                <Text style={[styles.label, { fontSize: 24, fontWeight: "bold", textAlign: "center", color: "#ffffff" }]}>
                  Password Updated!
                </Text>
                
                <Text style={[styles.subtitleSmall, { textAlign: "center", paddingHorizontal: 12, color: "rgba(255,255,255,0.75)", lineHeight: 18 }]}>
                  Your password has been successfully changed. You can now log in with your new password.
                </Text>

                {/* Progress bar and countdown */}
                <View style={{ alignItems: "center", width: "100%", marginTop: 12 }}>
                  <View style={{ width: 180, height: 6, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 3, overflow: "hidden" }}>
                    <View style={{ height: "100%", backgroundColor: "#ff9800", borderRadius: 3, width: `${(redirectCountdown / 3) * 100}%` }} />
                  </View>
                  <Text style={[styles.subtitleSmall, { marginTop: 10, color: "rgba(255,255,255,0.5)", fontWeight: "500" }]}>
                    Redirecting to login in <Text style={{ color: "#ff9800", fontWeight: "bold" }}>{redirectCountdown}s</Text>
                  </Text>
                </View>

                {/* Manual Go to Login Button */}
                <TouchableOpacity activeOpacity={0.8} style={[styles.primaryBtn, { width: "100%", marginTop: 16 }]} onPress={() => router.push("/login/page")}>
                  <Text style={styles.primaryBtnText}>Go to Login Now</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Footer */}
            {stage === 1 && (
              <View style={styles.footer}>
                <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/Signup/page")}>
                  <Text style={styles.footerLink}>Create an Account</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Alert */}
      {alert && (
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <View style={styles.alertIconCircle}>
              <Ionicons name="warning-outline" size={36} color="#ff9800" />
            </View>
            <Text style={styles.alertTitle}>{alert.title}</Text>
            <Text style={styles.alertMsg}>{alert.message}</Text>
            <TouchableOpacity activeOpacity={0.8} onPress={() => setAlert(null)} style={styles.alertBtn}>
              <Text style={styles.alertBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, width: "100%", height: "100%" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(4, 18, 21, 0.88)" },
  scrollContent: {
    flexGrow: 1, justifyContent: "center", alignItems: "center",
    paddingHorizontal: 20, paddingTop: Platform.OS === "ios" ? 60 : 40, paddingBottom: 40,
  },
  topBar: { width: "100%", flexDirection: "row", justifyContent: "flex-start", marginBottom: 16, paddingHorizontal: 4 },
  backBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#ff9800", paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 20, shadowColor: "#ff9800", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
  },
  backBtnText: { color: "#fff", fontSize: 13.5, fontWeight: "bold" },
  header: { alignItems: "center", marginBottom: 20, paddingHorizontal: 10 },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 8, letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.65)", textAlign: "center", lineHeight: 18, maxWidth: 300 },
  card: {
    width: "100%", maxWidth: 400,
    backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 36,
    borderWidth: 1.2, borderColor: "rgba(255,255,255,0.18)", padding: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  form: { gap: 16, marginBottom: 20 },
  rolesRow: { flexDirection: "row", gap: 10 },
  roleBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 16, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  roleBtnActive: {
    backgroundColor: "rgba(0,0,0,0.4)", borderColor: "#ffffff",
    shadowColor: "#ffffff", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 8,
  },
  roleBtnText: { fontSize: 12.5, fontWeight: "600", color: "rgba(255,255,255,0.8)", textAlign: "center" },
  roleBtnTextActive: { color: "#ffffff", fontWeight: "800" },
  inputGroup: { gap: 8 },
  label: { color: "#fff", fontSize: 13.5, fontWeight: "600", marginLeft: 4 },
  inputWrapper: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    borderRadius: 18, height: 50, paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, color: "#1e293b", fontSize: 15, fontWeight: "500", height: "100%" },
  primaryBtn: {
    backgroundColor: "#ff9800", borderRadius: 24, height: 50,
    alignItems: "center", justifyContent: "center", marginTop: 8,
    shadowColor: "#ff9800", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3,
    shadowRadius: 8, elevation: 4,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  footer: {
    borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)",
    paddingTop: 16, alignItems: "center",
  },
  footerLink: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "500", textDecorationLine: "underline" },
  iconCircle: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: "rgba(255,152,0,0.12)", borderWidth: 1, borderColor: "rgba(255,152,0,0.3)",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#ff9800", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 10,
  },
  subtitleSmall: { color: "rgba(255,255,255,0.6)", fontSize: 12.5, textAlign: "center", lineHeight: 18 },
  otpRow: { flexDirection: "row", justifyContent: "center", gap: 10, marginVertical: 4 },
  otpBox: {
    width: 44, height: 54, backgroundColor: "#fff", borderRadius: 14,
    textAlign: "center", fontSize: 22, fontWeight: "bold", color: "#1e293b",
    borderWidth: 2, borderColor: "transparent",
  },
  otpBoxFilled: { borderColor: "#ff9800", shadowColor: "#ff9800", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 6 },
  devOtpCard: {
    backgroundColor: "rgba(255,152,0,0.1)", borderRadius: 16, padding: 14,
    alignItems: "center", gap: 4, borderWidth: 1, borderColor: "rgba(255,152,0,0.25)",
  },
  devOtpLabel: { color: "#ff9800", fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 0.5 },
  devOtpCode: { color: "#fff", fontSize: 28, fontWeight: "bold", letterSpacing: 10, fontVariant: ["tabular-nums"] },
  devOtpHint: { color: "rgba(255,255,255,0.4)", fontSize: 10, textAlign: "center" },
  hintRow: { flexDirection: "row", gap: 16, marginTop: 2, marginLeft: 4 },
  hintOk: { color: "#4ade80", fontSize: 12, fontWeight: "600" },
  hintErr: { color: "#f87171", fontSize: 12, fontWeight: "600" },
  alertOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(2,11,13,0.95)", alignItems: "center", justifyContent: "center", zIndex: 9999 },
  alertCard: {
    width: "85%", maxWidth: 340, backgroundColor: "rgba(10,34,40,0.95)", borderRadius: 32,
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.15)", padding: 24, alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10,
  },
  alertIconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "rgba(255,152,0,0.12)", borderWidth: 1, borderColor: "rgba(255,152,0,0.3)",
    alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  alertTitle: { fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 8, textAlign: "center" },
  alertMsg: { fontSize: 13.5, color: "rgba(255,255,255,0.75)", textAlign: "center", lineHeight: 18, marginBottom: 20 },
  alertBtn: {
    backgroundColor: "#ff9800", borderRadius: 20, paddingVertical: 10, paddingHorizontal: 32,
    shadowColor: "#ff9800", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  alertBtnText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
});
