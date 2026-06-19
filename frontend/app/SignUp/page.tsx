"use client";

import React, { useState, useEffect } from "react";
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

  // Validate step completion and go to next step
  const handleNextStep = async () => {
    setValidationError("");

    if (!firstName || !lastName || !nic || !mobile || !email || !dob || !address || !province || !city || !password || !confirmPassword) {
      setValidationError("Please fill out all required fields marked with *");
      return;
    }

    // NIC format check: 9-12 characters, numbers only, last character can be V/v/X/x.
    const cleanNic = nic.trim();
    const nicRegex = /^\d{8,11}[0-9vVxX]$/;
    if (!nicRegex.test(cleanNic)) {
      setValidationError("Please enter a valid NIC (9-12 characters, numbers only, last character can be V or X).");
      return;
    }

    // Mobile number check: exactly 9 or 10 digits
    const cleanMobile = mobile.replace(/[-+()\s]/g, "");
    if (!/^\d{9,10}$/.test(cleanMobile)) {
      setValidationError("Mobile number must be exactly 9 or 10 digits.");
      return;
    }

    // Email check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError("Please enter a valid email address.");
      return;
    }

    // Password check: 6-12 characters, with conditions (numbers or special chars)
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
  };

  const handleBackStep = () => {
    router.push("/Login");
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
          
          {/* Header Title */}
          <div className="text-center select-none flex flex-col gap-2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)] leading-tight">
              Create an Account
            </h1>
            <p className="text-white/75 text-sm sm:text-base font-medium max-w-md mx-auto">
              Follow the steps to register your account with Sanasa General Insurance.
            </p>
          </div>

          {/* MODERN SEGMENTED PILL STEP TRACKER */}
          <div className="w-full max-w-xl mx-auto flex flex-col gap-4 select-none">
            {/* Pill Bar */}
            <div className="flex w-full gap-3 h-1.5">
              {[1, 2, 3, 4].map((num) => {
                const isActive = num === 1;
                return (
                  <div
                    key={num}
                    className={`flex-1 h-full rounded-full transition-all duration-500 ${
                      isActive
                        ? "bg-[#ff9800] shadow-[0_0_15px_rgba(255,152,0,0.6)] scale-[1.02]"
                        : "bg-white/15"
                    }`}
                  />
                );
              })}
            </div>
            {/* Step Label Container */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left gap-0.5 mt-1">
              <span className="text-xs md:text-sm font-bold text-[#ff9800] tracking-widest uppercase">
                STEP 01 OF 04
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold text-white">
                Personal Details
              </h2>
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

                {/* Mobile Number */}
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

                {/* Date of Birth */}
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
                      <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Residential Address */}
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

                {/* Province Selection */}
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
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* City Selection */}
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
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Password Field */}
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
                  {password && (
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

            {/* ACTION NAVIGATION BUTTONS (BOTTOM) */}
            <div className="flex justify-between items-center w-full border-t border-white/10 pt-6 mt-2">
              
              {/* Back button */}
              <button
                type="button"
                onClick={handleBackStep}
                className="bg-[#ff9800] hover:bg-[#ff8f00] text-white font-bold py-1.5 pl-2 pr-6 rounded-full flex items-center gap-3 shadow-lg hover:shadow-orange-500/35 transition-all duration-300 active:scale-95 cursor-pointer border-none outline-none select-none"
              >
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[#ff9800]" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </div>
                <span className="text-base font-semibold">Back to login</span>
              </button>

              {/* Next button */}
              <button
                type="button"
                onClick={handleNextStep}
                className="bg-[#ff9800] hover:bg-[#ff8f00] text-white font-bold py-1.5 pl-6 pr-2 rounded-full flex items-center gap-3 shadow-lg hover:shadow-orange-500/35 transition-all duration-300 active:scale-95 cursor-pointer border-none outline-none select-none"
              >
                <span className="text-base font-semibold">Next</span>
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[#ff9800]" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </button>

            </div>

          </div>

        </div>
      </div>

      <LoginFooter />
    </div>
  );
}
