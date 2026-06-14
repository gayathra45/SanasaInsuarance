"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/app/Components/Homepage/Navbar";
import Footer from "@/app/Components/Login/Footer";

function ConfirmPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const token = searchParams.get("token") || "";
  const nic = searchParams.get("nic") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Password strength checker
  const getPasswordStrength = () => {
    if (!newPassword) return { label: "", color: "bg-transparent", width: "w-0" };
    let score = 0;
    if (newPassword.length >= 6 && newPassword.length <= 12) score += 1;
    if (newPassword.length >= 8 && newPassword.length <= 12) score += 1;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword)) score += 1;

    switch (score) {
      case 1:
        return { label: "Weak", color: "bg-red-500", width: "w-1/4" };
      case 2:
        return { label: "Fair", color: "bg-orange-500", width: "w-2/4" };
      case 3:
        return { label: "Good", color: "bg-yellow-500", width: "w-3/4" };
      case 4:
        return { label: "Strong", color: "bg-green-500", width: "w-full" };
      default:
        return { label: "", color: "bg-transparent", width: "w-0" };
    }
  };

  const strength = getPasswordStrength();

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (!token || !nic) {
      setValidationError("Missing verification token or NIC. Please request a new link.");
      return;
    }

    // Password validation checks
    if (newPassword.length < 6 || newPassword.length > 12) {
      setValidationError("Password must be between 6 and 12 characters.");
      return;
    }
    if (!/[0-9]/.test(newPassword) && !/[^A-Za-z0-9]/.test(newPassword)) {
      setValidationError("Password must contain at least one number or special character.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setValidationError("Passwords do not match!");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("http://localhost:5000/api/signup/reset-password/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ nic, token, newPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
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
      const timer = setTimeout(() => {
        router.push("/Login");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal, router]);

  return (
    <div className="relative w-full max-w-[500px] bg-white/10 backdrop-blur-md border border-white/20 rounded-[2.5rem] p-8 md:p-12 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col gap-8 transition-all duration-500 hover:border-white/30 animate-fade-in">
      
      {validationError && (
        <div className="bg-red-500/20 border-l-4 border-red-500 p-4 rounded-xl text-white text-sm flex items-center gap-3 animate-pulse">
          <svg className="w-5 h-5 flex-shrink-0 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={handleConfirm} className="flex flex-col gap-6">
        
        {/* New Password */}
        <div className="flex flex-col gap-2">
          <label className="text-white text-base font-semibold tracking-wide ml-1 select-none">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-white text-slate-800 rounded-full py-3.5 pl-6 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-gray-400 font-medium border border-transparent"
              placeholder="Enter New Password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-700 focus:outline-none cursor-pointer"
            >
              {showPassword ? (
                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          {newPassword && (
            <div className="mt-2 flex flex-col gap-2.5 px-1 bg-black/15 p-3 rounded-2xl border border-white/5 animate-fade-in">
              <div className="flex justify-between items-center text-xs text-white/95">
                <span className="font-semibold">Password Strength:</span>
                <span className="font-bold uppercase tracking-wider">{strength.label}</span>
              </div>
              <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
                <div className={`h-full ${strength.color} ${strength.width} transition-all duration-350 rounded-full`} />
              </div>
              
              <div className="flex flex-col gap-1 text-[11px] text-white/90">
                <div className="flex items-center gap-1.5">
                  {newPassword.length >= 6 && newPassword.length <= 12 ? (
                    <span className="text-green-400 font-bold flex items-center gap-1">✔ 6 to 12 characters</span>
                  ) : (
                    <span className="text-red-400 font-bold flex items-center gap-1">❌ 6 to 12 characters</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {/[0-9]/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword) ? (
                    <span className="text-green-400 font-bold flex items-center gap-1">✔ Min. 1 number or special character</span>
                  ) : (
                    <span className="text-red-400 font-bold flex items-center gap-1">❌ Min. 1 number or special character</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-2">
          <label className="text-white text-base font-semibold tracking-wide ml-1 select-none">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white text-slate-800 rounded-full py-3.5 pl-6 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-gray-400 font-medium border border-transparent"
              placeholder="Confirm New Password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-700 focus:outline-none cursor-pointer"
            >
              {showConfirmPassword ? (
                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 w-full max-w-[220px] mx-auto bg-[#ff9800] hover:bg-[#ff8f00] active:bg-[#f57c00] text-white font-bold py-3.5 px-8 rounded-full transition-all duration-300 transform hover:scale-[1.04] active:scale-95 shadow-lg shadow-orange-500/35 text-center text-lg cursor-pointer select-none outline-none border-none disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Updating..." : "Update Password"}
        </button>
      </form>

      {/* Done Popup Success Modal */}
      {showSuccessModal && (
        <div className="absolute inset-0 bg-[#0e3b44]/80 backdrop-blur-lg rounded-[2.5rem] border border-white/20 flex flex-col items-center justify-center p-6 text-center z-20 transition-all duration-500">
          <div className="flex flex-col items-center gap-6">
            
            {/* Glowing Orange Success Checkmark */}
            <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center border border-orange-400/40 shadow-[0_0_25px_rgba(249,115,22,0.45)] animate-[pulse_1.5s_infinite]">
              <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            
            {/* Done text and message */}
            <div className="flex flex-col gap-2">
              <h3 className="text-white text-3xl font-bold tracking-wide">Done</h3>
              <p className="text-white/80 text-sm max-w-[280px]">
                Your password has been successfully updated. You will now be redirected to Login.
              </p>
            </div>

            {/* Redirection indicator */}
            <div className="flex items-center gap-2 mt-4 text-xs text-orange-400 font-semibold uppercase tracking-widest select-none">
              <svg className="animate-spin h-4 w-4 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Redirecting...
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function ConfirmPasswordPage() {
  return (
    <div className="min-h-screen w-full flex flex-col">
      <Navbar />

      <div
        className="relative flex-1 w-full flex items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat py-12"
        style={{
          backgroundImage: "url('/login_bg.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-[#0e3b44]/75 mix-blend-multiply pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c3945]/90 via-[#125867]/75 to-[#0b333b]/90 pointer-events-none" />

        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-400/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-300/15 blur-[120px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-12 flex flex-col lg:flex-row items-center justify-around gap-12 lg:gap-6">
          
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left text-white max-w-md">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight select-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)] leading-tight">
              New Password
            </h1>
          </div>

          <Suspense fallback={
            <div className="relative w-full max-w-[500px] bg-white/10 backdrop-blur-md border border-white/20 rounded-[2.5rem] p-12 text-center text-white">
              Loading verification details...
            </div>
          }>
            <ConfirmPasswordForm />
          </Suspense>

        </div>
      </div>

      <Footer />
    </div>
  );
}
