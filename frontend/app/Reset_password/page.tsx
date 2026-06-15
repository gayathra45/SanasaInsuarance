"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/app/Components/Homepage/Navbar";
import Footer from "@/app/Components/Login/Footer";

type Stage = "request" | "link-sent" | "set-password" | "token-invalid";
type Role = "policy_holder" | "insurance_agent" | "office_staff" | "admin";

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [stage, setStage] = useState<Stage>("request");
  const [activeRole, setActiveRole] = useState<Role>("policy_holder");

  const rolesList: { id: Role; label: string }[] = [
    { id: "policy_holder", label: "Policy Holder" },
    { id: "insurance_agent", label: "Insurance Agent" },
    { id: "office_staff", label: "Office Staff" },
    { id: "admin", label: "Admin" },
  ];

  // Stage: request
  const [nic, setNic] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [devToken, setDevToken] = useState("");
  const [emailStatus, setEmailStatus] = useState<{ sent: boolean; error: string | null } | null>(null);

  // Stage: set-password
  const [token, setToken] = useState("");
  const [tokenUser, setTokenUser] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // ── On load: check if there is a token in the URL ──────────────────────────
  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
      // Validate the token with backend
      fetch(`http://localhost:5000/api/signup/reset-password/validate-token?token=${urlToken}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.valid) {
            setTokenUser(data.firstName || "");
            setStage("set-password");
          } else {
            setStage("token-invalid");
          }
        })
        .catch(() => setStage("token-invalid"));
    }
  }, [searchParams]);

  // ── Password strength ───────────────────────────────────────────────────────
  const getPasswordStrength = () => {
    if (!newPassword) return { label: "", color: "bg-transparent", width: "w-0" };
    let score = 0;
    if (newPassword.length >= 6 && newPassword.length <= 12) score += 1;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword)) score += 1;
    switch (score) {
      case 1: return { label: "Weak", color: "bg-red-500", width: "w-1/4" };
      case 2: return { label: "Fair", color: "bg-orange-500", width: "w-2/4" };
      case 3: return { label: "Good", color: "bg-yellow-500", width: "w-3/4" };
      case 4: return { label: "Strong", color: "bg-green-500", width: "w-full" };
      default: return { label: "", color: "bg-transparent", width: "w-0" };
    }
  };
  const strength = getPasswordStrength();

  // ── HANDLER: Send reset link ────────────────────────────────────────────────
  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    
    const isNicRequired = activeRole === "policy_holder" || activeRole === "insurance_agent";
    const isMobileRequired = activeRole === "office_staff" || activeRole === "admin";

    if (isNicRequired && !nic.trim()) {
      setValidationError("NIC number is required.");
      return;
    }
    if (isMobileRequired && !mobile.trim()) {
      setValidationError("Mobile number is required.");
      return;
    }
    if (!email.trim()) {
      setValidationError("Email address is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:5000/api/signup/reset-password/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          nic: isNicRequired ? nic.trim() : "", 
          mobile: isMobileRequired ? mobile.trim() : "",
          email: email.trim() 
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset link.");
      }
      setSentEmail(email.trim());
      if (data.resetToken) {
        setDevToken(data.resetToken);
      }
      setEmailStatus({
        sent: !!data.emailSent,
        error: data.emailError || null,
      });
      setStage("link-sent");
    } catch (err: any) {
      setValidationError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── HANDLER: Direct bypass (Dev Mode) ──────────────────────────────────────
  const handleDevBypass = () => {
    if (!devToken) return;
    setToken(devToken);
    setIsSubmitting(true);
    fetch(`http://localhost:5000/api/signup/reset-password/validate-token?token=${devToken}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setTokenUser(data.firstName || "");
          setStage("set-password");
        } else {
          setStage("token-invalid");
        }
      })
      .catch(() => setStage("token-invalid"))
      .finally(() => setIsSubmitting(false));
  };

  // ── HANDLER: Set new password ───────────────────────────────────────────────
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    if (newPassword.length < 6 || newPassword.length > 12) {
      setValidationError("Password must be between 6 and 12 characters.");
      return;
    }
    if (!/[0-9]/.test(newPassword) && !/[^A-Za-z0-9]/.test(newPassword)) {
      setValidationError("Password must contain at least one number or special character.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setValidationError("Passwords do not match.");

      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:5000/api/signup/reset-password/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password.");
      }
      setShowSuccessModal(true);
    } catch (err: any) {
      setValidationError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => router.push("/Login"), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal, router]);

  return (
    <div className="min-h-screen w-full flex flex-col relative">
      {/* ── Fixed Background & Overlays (Locks bg image size) ── */}
      <div
        className="fixed inset-0 z-[-10] bg-cover bg-center bg-no-repeat bg-fixed pointer-events-none"
        style={{ backgroundImage: "url('/login_bg.jpg')" }}
      />
      <div className="fixed inset-0 z-[-9] bg-[#0e3b44]/75 mix-blend-multiply pointer-events-none" />
      <div className="fixed inset-0 z-[-8] bg-gradient-to-br from-[#0c3945]/90 via-[#125867]/75 to-[#0b333b]/90 pointer-events-none" />
      <div className="fixed inset-0 z-[-7] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-400/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-300/15 blur-[120px]" />
      </div>

      <Navbar />

      <div className="relative z-10 flex-1 w-full flex items-center justify-center py-12">
        <div className="w-full max-w-6xl mx-auto px-6 py-12 flex flex-col lg:flex-row items-center justify-around gap-12 lg:gap-6 min-h-[550px]">

          {/* Left: Title */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left text-white max-w-md">
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight select-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)] leading-[0.9] animate-fade-in">
              Reset<br />Password
            </h1>
          </div>

          {/* Right: Card */}
          <div className="relative w-full max-w-[500px] bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 md:p-12 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col gap-6 transition-all duration-500 hover:border-white/30">

            {/* Error Banner */}
            {validationError && (
              <div className="bg-red-500/20 border-l-4 border-red-500 p-4 rounded-xl text-white text-sm flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{validationError}</span>
              </div>
            )}

            {/* ── STAGE: Request (Enter NIC + Email or just Email) ── */}
            {stage === "request" && (
              <form onSubmit={handleSendLink} className="flex flex-col gap-6">
                {/* 2x2 Grid of Roles */}
                <div className="grid grid-cols-2 gap-4">
                  {rolesList.map((role) => {
                    const isSelected = activeRole === role.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => {
                          setActiveRole(role.id);
                          setValidationError("");
                          setNic("");
                          setMobile("");
                          setEmail("");
                        }}
                        className={`
                          w-full py-3 px-3 text-center rounded-2xl cursor-pointer select-none text-sm font-semibold
                          transition-all duration-300 ease-out border outline-none
                          ${
                            isSelected
                              ? "bg-black/35 border-white text-white scale-[1.02] shadow-[0_0_15px_rgba(255,255,255,0.15)] font-bold"
                              : "bg-white/5 border-white/35 text-white/90 hover:bg-white/15 hover:border-white/60 active:scale-95"
                          }
                        `}
                      >
                        {role.label}
                      </button>
                    );
                  })}
                </div>

                {/* NIC (Only shown for policy holder and agent) */}
                {(activeRole === "policy_holder" || activeRole === "insurance_agent") && (
                  <div className="flex flex-col gap-2">
                    <label className="text-white text-sm font-semibold tracking-wide ml-1 select-none">
                      National Identity Card (NIC)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3m-3 3h3m-3 3h3M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        required
                        value={nic}
                        onChange={(e) => setNic(e.target.value)}
                        className="w-full bg-white text-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-gray-400 font-medium"
                        placeholder="Enter your NIC number"
                      />
                    </div>
                  </div>
                )}

                {/* Mobile (Only shown for office staff and admin) */}
                {(activeRole === "office_staff" || activeRole === "admin") && (
                  <div className="flex flex-col gap-2">
                    <label className="text-white text-sm font-semibold tracking-wide ml-1 select-none">
                      Registered Mobile Number
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        required
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        className="w-full bg-white text-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-gray-400 font-medium"
                        placeholder="Enter your mobile number"
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="flex flex-col gap-2">
                  <label className="text-white text-sm font-semibold tracking-wide ml-1 select-none">
                    {activeRole === "policy_holder" || activeRole === "insurance_agent" ? "Registered Email Address" : "Gmail Address"}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white text-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-gray-400 font-medium"
                      placeholder={activeRole === "policy_holder" || activeRole === "insurance_agent" ? "Enter your registered email" : "Enter your Gmail address"}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 w-full max-w-[240px] mx-auto bg-[#ff9800] hover:bg-[#ff8f00] active:bg-[#f57c00] text-white font-bold py-3.5 px-8 rounded-full transition-all duration-300 transform hover:scale-[1.04] active:scale-95 shadow-lg shadow-orange-500/35 text-center text-lg cursor-pointer select-none outline-none border-none disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending...
                    </span>
                  ) : "Send Reset Link"}
                </button>

                <div className="flex justify-between items-center w-full border-t border-white/10 pt-4 text-sm text-white/70 font-medium select-none">
                  <Link href="/SignUp" className="hover:text-white hover:underline transition-all">Create an Account</Link>
                  <Link href="/Login" className="hover:text-white hover:underline transition-all">Back to Login</Link>
                </div>
              </form>
            )}

            {/* ── STAGE: Link Sent ── */}
            {stage === "link-sent" && (
              <div className="flex flex-col items-center gap-6 text-center py-4">
                {/* Icon */}
                <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-400/40 shadow-[0_0_30px_rgba(249,115,22,0.35)]">
                  <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-white text-2xl font-bold">Check Your Email</h3>
                  <p className="text-white/70 text-sm max-w-sm">
                    A password reset link has been sent to{" "}
                    <span className="text-orange-400 font-semibold">{sentEmail}</span>.
                    Open the email and click the <strong className="text-white">Reset My Password</strong> button.
                  </p>
                </div>

                <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2 text-sm text-white/60">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                    </svg>
                    <span>The link expires in <strong className="text-white">15 minutes</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                    </svg>
                    <span>Check your <strong className="text-white">Spam/Junk</strong> folder if you don&apos;t see it</span>
                  </div>
                </div>

                {/* ── ⚡ Premium Dev Mode / Sandbox Control Panel ── */}
                {devToken && (
                  <div className="w-full relative overflow-hidden bg-white/5 backdrop-blur-md border border-amber-500/20 rounded-3xl p-6 text-center shadow-[0_12px_32px_rgba(0,0,0,0.4)] flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Glowing Sandbox Logo */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center border border-amber-500/35 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                      <svg className="w-6 h-6 text-amber-400 animate-[pulse_1.8s_infinite]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <h4 className="text-white text-base font-bold tracking-wide">Developer Sandbox</h4>
                      <p className="text-white/60 text-xs max-w-[280px] mx-auto leading-relaxed">
                        {emailStatus?.sent
                          ? "Email sent successfully! Or bypass to reset password immediately:"
                          : "Email not sent (credentials missing). Direct bypass is available below:"}
                      </p>
                    </div>

                    {/* Bypass Button */}
                    <button
                      type="button"
                      onClick={handleDevBypass}
                      className="w-full max-w-[240px] bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:from-amber-700 active:to-orange-700 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300 text-sm flex items-center justify-center gap-2 hover:scale-[1.04] active:scale-[0.96] shadow-lg shadow-amber-500/35 border-none outline-none cursor-pointer"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                      <span>Bypass & Reset Now</span>
                    </button>
                  </div>
                )}


                <button
                  type="button"
                  onClick={() => { setStage("request"); setValidationError(""); }}
                  className="text-white/50 hover:text-white text-sm underline transition-all cursor-pointer bg-transparent border-none outline-none"
                >
                  ← Try a different email
                </button>
              </div>
            )}


            {/* ── STAGE: Set New Password (token from URL is valid) ── */}
            {stage === "set-password" && (
              <form onSubmit={handleSetPassword} className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                  {tokenUser && (
                    <p className="text-orange-400 text-sm font-semibold">Hi {tokenUser} 👋</p>
                  )}
                  <h2 className="text-white text-2xl font-bold">Set New Password</h2>
                  <p className="text-white/60 text-sm">Choose a strong new password for your account.</p>
                </div>

                {/* New Password */}
                <div className="flex flex-col gap-2">
                  <label className="text-white text-sm font-semibold tracking-wide ml-1 select-none">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white text-slate-800 rounded-2xl py-3.5 pl-6 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-gray-400 font-medium"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Strength meter */}
                  {newPassword && (
                    <div className="mt-1 flex flex-col gap-2 px-1 bg-black/15 p-3 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-center text-xs text-white/90">
                        <span className="font-semibold">Password Strength:</span>
                        <span className="font-bold uppercase tracking-wider">{strength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                        <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300 rounded-full`} />
                      </div>
                      <div className="flex flex-col gap-1 text-[11px] text-white/80">
                        <span className={newPassword.length >= 6 && newPassword.length <= 12 ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                          {newPassword.length >= 6 && newPassword.length <= 12 ? "✔" : "✖"} 6 to 12 characters
                        </span>
                        <span className={(/[0-9]/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword)) ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                          {(/[0-9]/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword)) ? "✔" : "✖"} Min. 1 number or special character
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-2">
                  <label className="text-white text-sm font-semibold tracking-wide ml-1 select-none">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white text-slate-800 rounded-2xl py-3.5 pl-6 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-gray-400 font-medium"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-red-400 text-xs ml-1 font-semibold">Passwords do not match</p>
                  )}
                  {confirmPassword && newPassword === confirmPassword && (
                    <p className="text-green-400 text-xs ml-1 font-semibold">✔ Passwords match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 w-full max-w-[240px] mx-auto bg-[#ff9800] hover:bg-[#ff8f00] active:bg-[#f57c00] text-white font-bold py-3.5 px-8 rounded-full transition-all duration-300 transform hover:scale-[1.04] active:scale-95 shadow-lg shadow-orange-500/35 text-center text-lg cursor-pointer select-none outline-none border-none disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Updating..." : "Update Password"}
                </button>
              </form>
            )}

            {/* ── STAGE: Token Invalid / Expired ── */}
            {stage === "token-invalid" && (
              <div className="flex flex-col items-center gap-6 text-center py-4">
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center border border-red-400/40 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                  <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-white text-2xl font-bold">Link Expired</h3>
                  <p className="text-white/70 text-sm max-w-sm">
                    This reset link is invalid or has expired (links expire after 15 minutes). Please request a new one.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setStage("request"); setValidationError(""); }}
                  className="bg-[#ff9800] hover:bg-[#ff8f00] text-white font-bold py-3 px-8 rounded-full transition-all duration-300 hover:scale-[1.04] shadow-lg shadow-orange-500/35"
                >
                  Request New Link
                </button>
                <Link href="/Login" className="text-white/50 hover:text-white text-sm underline transition-all">Back to Login</Link>
              </div>
            )}

            {/* ── Success Modal ── */}
            {showSuccessModal && (
              <div className="absolute inset-0 bg-[#0e3b44]/85 backdrop-blur-lg rounded-3xl sm:rounded-[2.5rem] border border-white/20 flex flex-col items-center justify-center p-6 text-center z-20">
                <div className="flex flex-col items-center gap-6">
                  <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center border border-orange-400/40 shadow-[0_0_25px_rgba(249,115,22,0.45)] animate-[pulse_1.5s_infinite]">
                    <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-white text-3xl font-bold">Done!</h3>
                    <p className="text-white/80 text-sm max-w-[280px]">
                      Your password has been updated successfully. Redirecting to Login...
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-orange-400 font-semibold uppercase tracking-widest">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Redirecting to Login...
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
