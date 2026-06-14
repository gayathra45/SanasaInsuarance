"use client";

import React, { useState, useEffect, useRef, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/app/Components/Homepage/Navbar";
import LoginFooter from "@/app/Components/Login/Footer";

// Province and Cities Sri Lanka Data
const provincesData = [
  { id: "western", name: "Western Province", cities: ["Colombo", "Gampaha", "Kalutara", "Negombo", "Dehiwala-Mount Lavinia", "Kaduwela", "Moratuwa"] },
  { id: "central", name: "Central Province", cities: ["Kandy", "Matale", "Nuwara Eliya", "Gampola", "Nawalapitiya", "Dambulla"] },
  { id: "southern", name: "Southern Province", cities: ["Galle", "Matara", "Hambantota", "Hikkaduwa", "Ambalangoda", "Tangalle"] },
  { id: "northern", name: "Northern Province", cities: ["Jaffna", "Vavuniya", "Mannar", "Kilinochchi", "Mullaitivu", "Point Pedro"] },
  { id: "eastern", name: "Eastern Province", cities: ["Trincomalee", "Batticaloa", "Ampara", "Kalmunai", "Samanthurai"] },
  { id: "north-western", name: "North Western Province", cities: ["Kurunegala", "Chilaw", "Puttalam", "Kuliyapitiya", "Wariyapola"] },
  { id: "north-central", name: "North Central Province", cities: ["Anuradhapura", "Polonnaruwa", "Medawachchiya", "Kekirawa"] },
  { id: "uva", name: "Uva Province", cities: ["Badulla", "Bandarawela", "Monaragala", "Welimada", "Mahiyanganaya"] },
  { id: "sabaragamuwa", name: "Sabaragamuwa Province", cities: ["Ratnapura", "Kegalle", "Balangoda", "Mawanella", "Embilipitiya"] }
];

export default function SignUp() {
  const router = useRouter();

  // Multi-step State
  const [step, setStep] = useState(1);

  // Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nic, setNic] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeCities, setActiveCities] = useState<string[]>([]);
  
  // Step 2 OTP State
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [timerSeconds, setTimerSeconds] = useState(59);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 3 Document State
  const [nicFront, setNicFront] = useState<File | null>(null);
  const [nicFrontProgress, setNicFrontProgress] = useState(0);
  const [nicFrontStatus, setNicFrontStatus] = useState<"idle" | "uploading" | "done">("idle");

  const [nicBack, setNicBack] = useState<File | null>(null);
  const [nicBackProgress, setNicBackProgress] = useState(0);
  const [nicBackStatus, setNicBackStatus] = useState<"idle" | "uploading" | "done">("idle");

  // Step 4 Confirmation State
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [consentData, setConsentData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Error/validation messages
  const [validationError, setValidationError] = useState("");

  // Auto update cities list when province selection changes
  useEffect(() => {
    const selected = provincesData.find((p) => p.name === province);
    if (selected) {
      setActiveCities(selected.cities);
      setCity(""); // Reset selected city
    } else {
      setActiveCities([]);
      setCity("");
    }
  }, [province]);

  // Countdown timer for OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && timerSeconds > 0) {
      timer = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, timerSeconds]);

  // Handle OTP Input Changes
  const handleOtpChange = (index: number, val: string) => {
    const numericVal = val.replace(/[^0-9]/g, "");
    if (!numericVal) return;

    const newOtp = [...otp];
    newOtp[index] = numericVal.substring(numericVal.length - 1); // Get last digit
    setOtp(newOtp);

    // Focus next cell
    if (index < 5 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];
      if (newOtp[index] !== "") {
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        newOtp[index - 1] = "";
        setOtp(newOtp);
        otpRefs.current[index - 1]?.focus();
      }
    }
  };

  // Simulating File Upload Progress
  const simulateUpload = (type: "front" | "back", file: File) => {
    if (type === "front") {
      setNicFront(file);
      setNicFrontStatus("uploading");
      setNicFrontProgress(0);
      let progress = 0;
      const interval = setInterval(() => {
        progress += 15;
        if (progress >= 100) {
          progress = 100;
          setNicFrontStatus("done");
          clearInterval(interval);
        }
        setNicFrontProgress(progress);
      }, 150);
    } else {
      setNicBack(file);
      setNicBackStatus("uploading");
      setNicBackProgress(0);
      let progress = 0;
      const interval = setInterval(() => {
        progress += 15;
        if (progress >= 100) {
          progress = 100;
          setNicBackStatus("done");
          clearInterval(interval);
        }
        setNicBackProgress(progress);
      }, 150);
    }
  };

  // Drag and Drop Helpers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (type: "front" | "back", e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      simulateUpload(type, files[0]);
    }
  };

  // Password strength checker
  const getPasswordStrength = () => {
    if (!password) return { label: "", color: "bg-transparent", width: "w-0", strength: 0 };
    let score = 0;
    if (password.length >= 6 && password.length <= 12) score += 1;
    if (password.length >= 8 && password.length <= 12) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;

    switch (score) {
      case 1:
        return { label: "Weak", color: "bg-red-500", width: "w-1/4", strength: 1 };
      case 2:
        return { label: "Fair", color: "bg-orange-500", width: "w-2/4", strength: 2 };
      case 3:
        return { label: "Good", color: "bg-yellow-500", width: "w-3/4", strength: 3 };
      case 4:
        return { label: "Strong", color: "bg-green-500", width: "w-full", strength: 4 };
      default:
        return { label: "", color: "bg-transparent", width: "w-0", strength: 0 };
    }
  };

  const strength = getPasswordStrength();

  // Load state from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("signup_personal_details");
      if (saved) {
        try {
          const data = JSON.parse(saved);
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setNic(data.nic || "");
          setMobile(data.mobile || "");
          setEmail(data.email || "");
          setDob(data.dob || "");
          setAddress(data.address || "");
          setProvince(data.province || "");
          setCity(data.city || "");
          setPassword(data.password || "");
          setConfirmPassword(data.password || "");
        } catch (err) {
          console.error("Error loading personal details:", err);
        }
      }
    }
  }, []);

  // Validate step completion
  const handleNextStep = async () => {
    setValidationError("");

    if (step === 1) {
      if (!firstName || !lastName || !nic || !mobile || !email || !dob || !address || !province || !city || !password || !confirmPassword) {
        setValidationError("Please fill out all required fields marked with *");
        return;
      }
      // 1. First Name and Last Name check (not empty passed)

      // 2. NIC format check: 9-12 characters, numbers only, last character can be V/v/X/x.
      const cleanNic = nic.trim();
      const nicRegex = /^\d{8,11}[0-9vVxX]$/;
      if (!nicRegex.test(cleanNic)) {
        setValidationError("Please enter a valid NIC (9-12 characters, numbers only, last character can be V or X).");
        return;
      }

      // 3. Mobile number check: exactly 9 or 10 digits
      const cleanMobile = mobile.replace(/[-+()\s]/g, "");
      if (!/^\d{9,10}$/.test(cleanMobile)) {
        setValidationError("Mobile number must be exactly 9 or 10 digits.");
        return;
      }

      // 4. Email check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setValidationError("Please enter a valid email address.");
        return;
      }

      // 5. Password check: 6-12 characters, with conditions (numbers or special chars)
      if (password.length < 6 || password.length > 12) {
        setValidationError("Password must be between 6 and 12 characters.");
        return;
      }
      if (!/[0-9]/.test(password) && !/[^A-Za-z0-9]/.test(password)) {
        setValidationError("Password must contain at least one number or special character.");
        return;
      }

      if (password !== confirmPassword) {
        setValidationError("Passwords do not match!");
        return;
      }

      // Check database if NIC or Email is already registered
      try {
        const res = await fetch(`http://localhost:5000/api/signup/check?email=${encodeURIComponent(email)}&nic=${encodeURIComponent(cleanNic)}`);
        if (!res.ok) {
          throw new Error("Failed to verify credentials with the database.");
        }
        const data = await res.json();
        if (data.emailExists) {
          setValidationError("This email address is already registered.");
          return;
        }
        if (data.nicExists) {
          setValidationError("This NIC number is already registered.");
          return;
        }
      } catch (err: any) {
        setValidationError("Could not connect to verification server. Please try again.");
        return;
      }
      
      // Save state to sessionStorage
      if (typeof window !== "undefined") {
        const personalData = { firstName, lastName, nic: cleanNic, mobile: cleanMobile, email, dob, address, province, city, password };
        sessionStorage.setItem("signup_personal_details", JSON.stringify(personalData));
      }
      
      router.push("/SignUp/page1");
    } else if (step === 2) {
      // Check if OTP is completely filled
      if (otp.some((digit) => digit === "")) {
        setValidationError("Please enter the complete 6-digit OTP code.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!nicFront || nicFrontStatus !== "done" || !nicBack || nicBackStatus !== "done") {
        setValidationError("Please upload and complete verification for both front and back sides of your NIC.");
        return;
      }
      setStep(4);
    }
  };

  const handleBackStep = () => {
    setValidationError("");
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.push("/Login");
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (!agreedToTerms || !consentData) {
      setValidationError("You must agree to the Terms of Service and Privacy Policy to register.");
      return;
    }

    setIsSubmitting(true);

    // Simulate final API call
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessModal(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/Login");
      }, 3000);
    }, 1500);
  };

  const resendOtp = () => {
    setOtp(Array(6).fill(""));
    setTimerSeconds(59);
    setValidationError("");
    alert("Simulated: A new 6-digit OTP has been sent to your mobile & email.");
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      <Navbar />

      {/* Main Container Layer matching Login design aesthetics */}
      <div
        className="relative flex-1 w-full flex items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat py-12 md:py-20"
        style={{
          backgroundImage: "url('/login_bg.jpg')",
        }}
      >
        {/* Background Visual teal/blue depth effects */}
        <div className="absolute inset-0 bg-[#0e3b44]/75 mix-blend-multiply pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c3945]/90 via-[#125867]/75 to-[#0b333b]/90 pointer-events-none" />
        
        {/* Modern glowing ambient lights */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-400/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-300/15 blur-[120px] pointer-events-none" />

        {/* Content Wizard Box */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 md:px-8 flex flex-col items-center gap-8">
          
          {/* STEP TRACKER - Solid Solid black line, white/black nodes, green active node */}
          <div className="w-full max-w-xl mx-auto py-2 relative flex justify-between items-center select-none z-10">
            {/* Connecting Solid Black Line */}
            <div className="absolute left-[5%] right-[5%] top-[20px] h-[2.5px] bg-black -z-10" />

            {/* Step 1 Circle */}
            <div className="flex flex-col items-center">
              <button 
                type="button" 
                onClick={() => step > 1 && setStep(1)} 
                disabled={step === 1}
                className={`w-10 h-10 flex items-center justify-center rounded-full text-base font-bold transition-all duration-300 border ${
                  step === 1
                    ? "bg-[#00cc66] text-white border-transparent shadow-[0_0_12px_rgba(0,204,102,0.4)]"
                    : step > 1
                    ? "bg-[#00cc66] text-white border-transparent"
                    : "bg-white text-slate-800 border-black"
                }`}
              >
                01
              </button>
            </div>

            {/* Step 2 Circle */}
            <div className="flex flex-col items-center">
              <button 
                type="button" 
                onClick={() => step > 2 && setStep(2)} 
                disabled={step <= 2}
                className={`w-10 h-10 flex items-center justify-center rounded-full text-base font-bold transition-all duration-300 border ${
                  step === 2
                    ? "bg-[#00cc66] text-white border-transparent shadow-[0_0_12px_rgba(0,204,102,0.4)]"
                    : step > 2
                    ? "bg-[#00cc66] text-white border-transparent"
                    : "bg-white text-slate-800 border-black"
                }`}
              >
                02
              </button>
            </div>

            {/* Step 3 Circle */}
            <div className="flex flex-col items-center">
              <button 
                type="button" 
                onClick={() => step > 3 && setStep(3)} 
                disabled={step <= 3}
                className={`w-10 h-10 flex items-center justify-center rounded-full text-base font-bold transition-all duration-300 border ${
                  step === 3
                    ? "bg-[#00cc66] text-white border-transparent shadow-[0_0_12px_rgba(0,204,102,0.4)]"
                    : step > 3
                    ? "bg-[#00cc66] text-white border-transparent"
                    : "bg-white text-slate-800 border-black"
                }`}
              >
                03
              </button>
            </div>

            {/* Step 4 Circle */}
            <div className="flex flex-col items-center">
              <button 
                type="button" 
                disabled
                className={`w-10 h-10 flex items-center justify-center rounded-full text-base font-bold transition-all duration-300 border ${
                  step === 4
                    ? "bg-[#00cc66] text-white border-transparent shadow-[0_0_12px_rgba(0,204,102,0.4)]"
                    : "bg-white text-slate-800 border-black"
                }`}
              >
                04
              </button>
            </div>
          </div>

          {/* MAIN GLASSMORPHIC CARD */}
          <div className="w-full max-w-4xl bg-[#0e3b44]/45 backdrop-blur-md border border-white/20 rounded-[2.5rem] p-6 md:p-12 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col gap-8 transition-all duration-500 hover:border-white/25">
            
            {/* Show Validation Error Banner if present */}
            {validationError && (
              <div className="bg-red-500/20 border-l-4 border-red-500 p-4 rounded-xl text-white text-sm flex items-center gap-3 animate-pulse">
                <svg className="w-5 h-5 flex-shrink-0 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{validationError}</span>
              </div>
            )}

            {/* STEP 1: PERSONAL DETAILS */}
            {step === 1 && (
              <div className="flex flex-col gap-6">
                
                {/* Title & Icon */}
                <div className="flex items-center gap-3 border-b border-white/15 pb-4">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-400/40 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.25)]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  </div>
                  <h2 className="text-white text-2xl font-bold tracking-wide select-none">
                    Personal Details
                  </h2>
                </div>

                {/* Form fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* First Name */}
                  <div className="flex flex-col gap-2">
                    <label className="text-white text-sm font-semibold tracking-wide ml-1 select-none flex gap-0.5">
                      First Name <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-white text-slate-800 rounded-full py-3 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-gray-400 font-medium border border-transparent"
                      placeholder="Amal"
                    />
                  </div>

                  {/* Last Name */}
                  <div className="flex flex-col gap-2">
                    <label className="text-white text-sm font-semibold tracking-wide ml-1 select-none flex gap-0.5">
                      Last Name <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-white text-slate-800 rounded-full py-3 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-gray-400 font-medium border border-transparent"
                      placeholder="Perera"
                    />
                  </div>

                  {/* NIC Number */}
                  <div className="flex flex-col gap-2">
                    <label className="text-white text-sm font-semibold tracking-wide ml-1 select-none flex gap-0.5">
                      NIC Number <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={nic}
                      onChange={(e) => setNic(e.target.value)}
                      className="w-full bg-white text-slate-800 rounded-full py-3 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-gray-400 font-medium border border-transparent"
                      placeholder="200123500688"
                    />
                  </div>

                  {/* Mobile Number with icon on right */}
                  <div className="flex flex-col gap-2">
                    <label className="text-white text-sm font-semibold tracking-wide ml-1 select-none flex gap-0.5">
                      Mobile Number <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        className="w-full bg-white text-slate-800 rounded-full py-3 pl-6 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-gray-400 font-medium border border-transparent"
                        placeholder="0771234567"
                      />
                      <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        {/* Handset/Phone icon on the right */}
                        <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.502-5.187-3.865-6.69-6.69l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                        </svg>
                      </span>
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="flex flex-col gap-2">
                    <label className="text-white text-sm font-semibold tracking-wide ml-1 select-none flex gap-0.5">
                      Email Address <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white text-slate-800 rounded-full py-3 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-gray-400 font-medium border border-transparent"
                      placeholder="Amalperera@gmail.com"
                    />
                  </div>

                  {/* Date of Birth with calendar icon on right & format-on-focus */}
                  <div className="flex flex-col gap-2">
                    <label className="text-white text-sm font-semibold tracking-wide ml-1 select-none flex gap-0.5">
                      Date of Birth <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="dd/mm/yyyy"
                        onFocus={(e) => { e.target.type = "date"; }}
                        onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
                        required
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full bg-white text-slate-800 rounded-full py-3 pl-6 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-gray-400 font-medium border border-transparent"
                      />
                      <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        {/* Calendar Icon on the right */}
                        <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                        </svg>
                      </span>
                    </div>
                  </div>

                  {/* Residential Address - full width rounded box */}
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-white text-sm font-semibold tracking-wide ml-1 select-none flex gap-0.5">
                      Residential Address <span className="text-red-500 font-bold">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-white text-slate-800 rounded-3xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-gray-400 font-medium border border-transparent"
                      placeholder="No 44 , Malagane Road ......"
                    />
                  </div>

                  {/* Province Selection with custom down chevron icon */}
                  <div className="flex flex-col gap-2">
                    <label className="text-white text-sm font-semibold tracking-wide ml-1 select-none flex gap-0.5">
                      Province <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className="w-full bg-white text-slate-800 rounded-full py-3 px-6 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all font-medium border border-transparent appearance-none"
                      >
                        <option value="" disabled>Select Province</option>
                        {provincesData.map((p) => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                      <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-700">
                        {/* Down chevron */}
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </span>
                    </div>
                  </div>

                  {/* City Selection with custom down chevron icon */}
                  <div className="flex flex-col gap-2">
                    <label className="text-white text-sm font-semibold tracking-wide ml-1 select-none flex gap-0.5">
                      City <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        disabled={!province}
                        className="w-full bg-white text-slate-800 rounded-full py-3 px-6 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all font-medium border border-transparent appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <option value="" disabled>Select City</option>
                        {activeCities.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-700">
                        {/* Down chevron */}
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </span>
                    </div>
                  </div>

                  {/* Password Field with strength bar and conditions checklist below */}
                  <div className="flex flex-col gap-2">
                    <label className="text-white text-sm font-semibold tracking-wide ml-1 select-none flex gap-0.5">
                      Password <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white text-slate-800 rounded-full py-3 pl-6 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-gray-400 font-medium border border-transparent"
                        placeholder="Enter Password"
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
                    {/* Password Strength Indicator & Checklist Conditions */}
                    {password && (
                      <div className="mt-2 flex flex-col gap-2.5 px-1 bg-black/15 p-3 rounded-2xl border border-white/5 animate-fade-in">
                        {/* Horizontal strength status bar */}
                        <div className="flex justify-between items-center text-xs text-white/95">
                          <span className="font-semibold">Password Strength:</span>
                          <span className="font-bold uppercase tracking-wider">{strength.label}</span>
                        </div>
                        <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
                          <div className={`h-full ${strength.color} ${strength.width} transition-all duration-350 rounded-full`} />
                        </div>
                        
                        {/* Requirement Conditions */}
                        <div className="flex flex-col gap-1 text-[11px] text-white/90">
                          <div className="flex items-center gap-1.5">
                            {password.length >= 6 && password.length <= 12 ? (
                              <span className="text-green-400 font-bold flex items-center gap-1">✔ 6 to 12 characters</span>
                            ) : (
                              <span className="text-red-400 font-bold flex items-center gap-1">❌ 6 to 12 characters</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password) ? (
                              <span className="text-green-400 font-bold flex items-center gap-1">✔ Min. 1 number or special character</span>
                            ) : (
                              <span className="text-red-400 font-bold flex items-center gap-1">❌ Min. 1 number or special character</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {confirmPassword && password === confirmPassword ? (
                              <span className="text-green-400 font-bold flex items-center gap-1">✔ Passwords match</span>
                            ) : (
                              <span className="text-red-400 font-bold flex items-center gap-1">❌ Passwords match</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="flex flex-col gap-2">
                    <label className="text-white text-sm font-semibold tracking-wide ml-1 select-none flex gap-0.5">
                      Confirm Password <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white text-slate-800 rounded-full py-3 pl-6 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-gray-400 font-medium border border-transparent"
                        placeholder="Confirm Password"
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

                </div>
              </div>
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {step === 2 && (
              <div className="flex flex-col gap-6 items-center text-center max-w-lg mx-auto py-4">
                
                {/* Title & Icon */}
                <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-400/40 text-orange-400 shadow-[0_0_25px_rgba(249,115,22,0.3)] mb-2">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                </div>
                
                <h2 className="text-white text-3xl font-bold tracking-wide">Verification Code</h2>
                <p className="text-white/80 text-sm md:text-base max-w-md">
                  We've sent a 6-digit verification code to <span className="text-orange-400 font-semibold">{mobile}</span> and <span className="text-orange-400 font-semibold">{email}</span>.
                </p>

                {/* 6-Digit OTP Box inputs */}
                <div className="flex gap-2.5 sm:gap-4 my-6 justify-center">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { otpRefs.current[idx] = el; }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-white text-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all border border-transparent shadow-md"
                    />
                  ))}
                </div>

                {/* OTP Resend block */}
                <div className="flex flex-col gap-2 items-center text-sm">
                  {timerSeconds > 0 ? (
                    <span className="text-white/70 select-none">
                      Resend code in <span className="text-orange-400 font-bold">{timerSeconds}s</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={resendOtp}
                      className="text-orange-400 hover:text-orange-300 font-bold underline transition-colors cursor-pointer select-none"
                    >
                      Resend Verification Code
                    </button>
                  )}
                </div>

              </div>
            )}

            {/* STEP 3: KYC DOCUMENT UPLOAD */}
            {step === 3 && (
              <div className="flex flex-col gap-6">
                
                {/* Title & Icon */}
                <div className="flex items-center gap-3 border-b border-white/15 pb-4">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-400/40 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.25)]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                    </svg>
                  </div>
                  <h2 className="text-white text-2xl font-bold tracking-wide select-none">
                    Identity Verification (KYC)
                  </h2>
                </div>

                <p className="text-white/85 text-sm md:text-base select-none">
                  Please upload a clear photograph of both the **Front** and **Back** sides of your National Identity Card (NIC). Supported formats: JPG, PNG, PDF (Max 5MB).
                </p>

                {/* Upload drag & drop components */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-4">
                  
                  {/* Front Side Card */}
                  <div className="flex flex-col gap-3">
                    <label className="text-white text-base font-semibold ml-1">NIC Front Side <span className="text-red-500">*</span></label>
                    <div
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop("front", e)}
                      className={`relative border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[220px] bg-white/5 ${
                        nicFrontStatus === "done" 
                          ? "border-green-400 bg-green-500/5"
                          : "border-white/20 hover:border-white/40 hover:bg-white/10"
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            simulateUpload("front", e.target.files[0]);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />

                      {nicFrontStatus === "idle" && (
                        <div className="flex flex-col items-center gap-3 text-white/80">
                          <svg className="w-12 h-12 text-white/50" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                          <span className="font-semibold text-sm">Drag & Drop or click to upload</span>
                          <span className="text-xs text-white/50">FRONT SIDE of identity card</span>
                        </div>
                      )}

                      {nicFrontStatus === "uploading" && (
                        <div className="w-full flex flex-col items-center gap-4 px-4">
                          <svg className="animate-spin h-8 w-8 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <div className="w-full">
                            <div className="flex justify-between text-xs text-white mb-1">
                              <span>Uploading Front Side...</span>
                              <span>{nicFrontProgress}%</span>
                            </div>
                            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-400 transition-all duration-150" style={{ width: `${nicFrontProgress}%` }} />
                            </div>
                          </div>
                        </div>
                      )}

                      {nicFrontStatus === "done" && nicFront && (
                        <div className="flex flex-col items-center gap-3 w-full px-4">
                          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center border border-green-400/40 text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.25)]">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75l6 6 9-13.5" />
                            </svg>
                          </div>
                          <span className="text-white text-sm font-bold truncate max-w-[200px]">{nicFront.name}</span>
                          <span className="text-xs text-green-400 font-semibold uppercase tracking-wider">Upload Completed</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNicFront(null);
                              setNicFrontStatus("idle");
                              setNicFrontProgress(0);
                            }}
                            className="mt-2 text-xs text-red-400 hover:text-red-300 font-semibold underline cursor-pointer"
                          >
                            Delete File
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Back Side Card */}
                  <div className="flex flex-col gap-3">
                    <label className="text-white text-base font-semibold ml-1">NIC Back Side <span className="text-red-500">*</span></label>
                    <div
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop("back", e)}
                      className={`relative border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[220px] bg-white/5 ${
                        nicBackStatus === "done" 
                          ? "border-green-400 bg-green-500/5"
                          : "border-white/20 hover:border-white/40 hover:bg-white/10"
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            simulateUpload("back", e.target.files[0]);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />

                      {nicBackStatus === "idle" && (
                        <div className="flex flex-col items-center gap-3 text-white/80">
                          <svg className="w-12 h-12 text-white/50" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                          <span className="font-semibold text-sm">Drag & Drop or click to upload</span>
                          <span className="text-xs text-white/50">BACK SIDE of identity card</span>
                        </div>
                      )}

                      {nicBackStatus === "uploading" && (
                        <div className="w-full flex flex-col items-center gap-4 px-4">
                          <svg className="animate-spin h-8 w-8 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <div className="w-full">
                            <div className="flex justify-between text-xs text-white mb-1">
                              <span>Uploading Back Side...</span>
                              <span>{nicBackProgress}%</span>
                            </div>
                            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-400 transition-all duration-150" style={{ width: `${nicBackProgress}%` }} />
                            </div>
                          </div>
                        </div>
                      )}

                      {nicBackStatus === "done" && nicBack && (
                        <div className="flex flex-col items-center gap-3 w-full px-4">
                          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center border border-green-400/40 text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.25)]">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75l6 6 9-13.5" />
                            </svg>
                          </div>
                          <span className="text-white text-sm font-bold truncate max-w-[200px]">{nicBack.name}</span>
                          <span className="text-xs text-green-400 font-semibold uppercase tracking-wider">Upload Completed</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNicBack(null);
                              setNicBackStatus("idle");
                              setNicBackProgress(0);
                            }}
                            className="mt-2 text-xs text-red-400 hover:text-red-300 font-semibold underline cursor-pointer"
                          >
                            Delete File
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* STEP 4: REVIEW & CONFIRM */}
            {step === 4 && (
              <div className="flex flex-col gap-6">
                
                {/* Title & Icon */}
                <div className="flex items-center gap-3 border-b border-white/15 pb-4">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-400/40 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.25)]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-.621-.504-1.125-1.125-1.125H9.75M8.25 21h8.25M8.25 21h-2.25A2.25 2.25 0 0 1 3.75 18.75V7.5A2.25 2.25 0 0 1 6 5.25h12A2.25 2.25 0 0 1 20.25 7.5v11.25A2.25 2.25 0 0 1 18 21h-2.25" />
                    </svg>
                  </div>
                  <h2 className="text-white text-2xl font-bold tracking-wide select-none">
                    Review and Confirm
                  </h2>
                </div>

                <p className="text-white/85 text-sm md:text-base">
                  Please review the details below. If correct, check the compliance boxes and confirm registration.
                </p>

                {/* Summary Table Grid */}
                <div className="bg-black/20 rounded-3xl p-6 border border-white/10 text-white grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm md:text-base">
                  <div>
                    <span className="text-white/50 font-medium text-xs uppercase block">Full Name</span>
                    <span className="font-bold">{firstName} {lastName}</span>
                  </div>
                  <div>
                    <span className="text-white/50 font-medium text-xs uppercase block">NIC Number</span>
                    <span className="font-bold">{nic}</span>
                  </div>
                  <div>
                    <span className="text-white/50 font-medium text-xs uppercase block">Mobile Number</span>
                    <span className="font-bold">{mobile}</span>
                  </div>
                  <div>
                    <span className="text-white/50 font-medium text-xs uppercase block">Email Address</span>
                    <span className="font-bold">{email}</span>
                  </div>
                  <div>
                    <span className="text-white/50 font-medium text-xs uppercase block">Date of Birth</span>
                    <span className="font-bold">{dob}</span>
                  </div>
                  <div>
                    <span className="text-white/50 font-medium text-xs uppercase block">Location</span>
                    <span className="font-bold">{city}, {province}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-white/50 font-medium text-xs uppercase block">Residential Address</span>
                    <span className="font-bold">{address}</span>
                  </div>
                  <div>
                    <span className="text-white/50 font-medium text-xs uppercase block">KYC Document (Front)</span>
                    <span className="text-green-400 font-bold flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      Verified: {nicFront?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/50 font-medium text-xs uppercase block">KYC Document (Back)</span>
                    <span className="text-green-400 font-bold flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      Verified: {nicBack?.name}
                    </span>
                  </div>
                </div>

                {/* Consent Checkboxes */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
                  <label className="flex items-start gap-3 text-white text-sm select-none cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 w-4.5 h-4.5 rounded text-orange-500 focus:ring-orange-400 cursor-pointer"
                    />
                    <span>
                      I agree to the <span className="text-orange-400 underline hover:text-orange-300">Terms of Service</span> and <span className="text-orange-400 underline hover:text-orange-300">Privacy Policy</span> of Sanasa General Insurance.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 text-white text-sm select-none cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={consentData}
                      onChange={(e) => setConsentData(e.target.checked)}
                      className="mt-1 w-4.5 h-4.5 rounded text-orange-500 focus:ring-orange-400 cursor-pointer"
                    />
                    <span>
                      I consent to the collection and processing of my identity verification details for policy processing.
                    </span>
                  </label>
                </form>

              </div>
            )}

            {/* ACTION NAVIGATION BUTTONS (BOTTOM) - pill design matching user reference */}
            <div className="flex justify-between items-center w-full border-t border-white/10 pt-6 mt-2">
              
              {/* Back to Login / Back button */}
              <button
                type="button"
                onClick={handleBackStep}
                className="bg-[#ff9800] hover:bg-[#ff8f00] text-white font-bold py-1.5 pl-2 pr-6 rounded-full flex items-center gap-3 shadow-lg hover:shadow-orange-500/35 transition-all duration-300 active:scale-95 cursor-pointer border-none outline-none select-none"
              >
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                  {/* Left pointing arrow */}
                  <svg className="w-4 h-4 text-[#ff9800]" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </div>
                <span className="text-base font-semibold">{step === 1 ? "Back to login" : "Back"}</span>
              </button>

              {/* Next / Confirm button */}
              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-[#ff9800] hover:bg-[#ff8f00] text-white font-bold py-1.5 pl-6 pr-2 rounded-full flex items-center gap-3 shadow-lg hover:shadow-orange-500/35 transition-all duration-300 active:scale-95 cursor-pointer border-none outline-none select-none"
                >
                  <span className="text-base font-semibold">Next</span>
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                    {/* Right pointing arrow */}
                    <svg className="w-4 h-4 text-[#ff9800]" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-[#ff9800] hover:bg-[#ff8f00] text-white font-bold py-1.5 pl-6 pr-2 rounded-full flex items-center gap-3 shadow-lg hover:shadow-orange-500/35 transition-all duration-300 active:scale-95 cursor-pointer border-none outline-none select-none disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className="text-base font-semibold">{isSubmitting ? "Creating Account..." : "Confirm & Submit"}</span>
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                    {isSubmitting ? (
                      <svg className="animate-spin h-4 w-4 text-[#ff9800]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-[#ff9800]" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                      </svg>
                    )}
                  </div>
                </button>
              )}

            </div>

            {/* DONE MODAL ON SUBMIT SUCCESS */}
            {showSuccessModal && (
              <div className="absolute inset-0 bg-[#0e3b44]/90 backdrop-blur-xl rounded-[2.5rem] border border-white/20 flex flex-col items-center justify-center p-6 text-center z-30 transition-all duration-500 animate-fade-in">
                <div className="flex flex-col items-center gap-6 max-w-sm">
                  
                  {/* Big Glowing Orange/Green Success Checkmark */}
                  <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center border border-green-400/40 shadow-[0_0_30px_rgba(74,222,128,0.5)] animate-[pulse_1.5s_infinite]">
                    <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  
                  {/* Done / Message */}
                  <div className="flex flex-col gap-2">
                    <h3 className="text-white text-4xl font-extrabold tracking-wide">Done!</h3>
                    <p className="text-white/80 text-base font-medium">
                      Your registration with **Sanasa General Insurance** has been successfully submitted for processing.
                    </p>
                  </div>

                  {/* Redirection indicator */}
                  <div className="flex items-center gap-2 mt-4 text-sm text-orange-400 font-bold uppercase tracking-widest select-none">
                    <svg className="animate-spin h-5 w-5 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Redirecting to Login...
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      <LoginFooter />
    </div>
  );
}