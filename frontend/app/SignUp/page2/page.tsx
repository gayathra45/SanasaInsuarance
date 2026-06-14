"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/Components/Homepage/Navbar";
import LoginFooter from "@/app/Components/Login/Footer";

export default function SignUpPage2() {
  const router = useRouter();
  const [validationError, setValidationError] = useState("");

  // Upload slots state
  const [nicFront, setNicFront] = useState<File | null>(null);
  const [nicFrontProgress, setNicFrontProgress] = useState(0);
  const [nicFrontStatus, setNicFrontStatus] = useState<"idle" | "uploading" | "done">("idle");

  const [nicBack, setNicBack] = useState<File | null>(null);
  const [nicBackProgress, setNicBackProgress] = useState(0);
  const [nicBackStatus, setNicBackStatus] = useState<"idle" | "uploading" | "done">("idle");

  const [vehicleReg, setVehicleReg] = useState<File | null>(null);
  const [vehicleRegProgress, setVehicleRegProgress] = useState(0);
  const [vehicleRegStatus, setVehicleRegStatus] = useState<"idle" | "uploading" | "done">("idle");

  const [revenueLicense, setRevenueLicense] = useState<File | null>(null);
  const [revenueLicenseProgress, setRevenueLicenseProgress] = useState(0);
  const [revenueLicenseStatus, setRevenueLicenseStatus] = useState<"idle" | "uploading" | "done">("idle");

  // Load state from sessionStorage on mount (if files were already uploaded previously, we can simulate loading them)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedFront = sessionStorage.getItem("signup_nic_front_uploaded");
      const savedBack = sessionStorage.getItem("signup_nic_back_uploaded");
      const savedVehicleReg = sessionStorage.getItem("signup_vehicle_reg_uploaded");
      const savedRevenueLicense = sessionStorage.getItem("signup_revenue_license_uploaded");

      if (savedFront) {
        setNicFront(new File([], savedFront));
        setNicFrontStatus("done");
        setNicFrontProgress(100);
      }
      if (savedBack) {
        setNicBack(new File([], savedBack));
        setNicBackStatus("done");
        setNicBackProgress(100);
      }
      if (savedVehicleReg) {
        setVehicleReg(new File([], savedVehicleReg));
        setVehicleRegStatus("done");
        setVehicleRegProgress(100);
      }
      if (savedRevenueLicense) {
        setRevenueLicense(new File([], savedRevenueLicense));
        setRevenueLicenseStatus("done");
        setRevenueLicenseProgress(100);
      }
    }
  }, []);

  // Simulating File Upload Progress
  const simulateUpload = (type: "front" | "back" | "vehicleReg" | "revenueLicense", file: File) => {
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
          if (typeof window !== "undefined") {
            sessionStorage.setItem("signup_nic_front_uploaded", file.name);
          }
          clearInterval(interval);
        }
        setNicFrontProgress(progress);
      }, 150);
    } else if (type === "back") {
      setNicBack(file);
      setNicBackStatus("uploading");
      setNicBackProgress(0);
      let progress = 0;
      const interval = setInterval(() => {
        progress += 15;
        if (progress >= 100) {
          progress = 100;
          setNicBackStatus("done");
          if (typeof window !== "undefined") {
            sessionStorage.setItem("signup_nic_back_uploaded", file.name);
          }
          clearInterval(interval);
        }
        setNicBackProgress(progress);
      }, 150);
    } else if (type === "vehicleReg") {
      setVehicleReg(file);
      setVehicleRegStatus("uploading");
      setVehicleRegProgress(0);
      let progress = 0;
      const interval = setInterval(() => {
        progress += 15;
        if (progress >= 100) {
          progress = 100;
          setVehicleRegStatus("done");
          if (typeof window !== "undefined") {
            sessionStorage.setItem("signup_vehicle_reg_uploaded", file.name);
          }
          clearInterval(interval);
        }
        setVehicleRegProgress(progress);
      }, 150);
    } else if (type === "revenueLicense") {
      setRevenueLicense(file);
      setRevenueLicenseStatus("uploading");
      setRevenueLicenseProgress(0);
      let progress = 0;
      const interval = setInterval(() => {
        progress += 15;
        if (progress >= 100) {
          progress = 100;
          setRevenueLicenseStatus("done");
          if (typeof window !== "undefined") {
            sessionStorage.setItem("signup_revenue_license_uploaded", file.name);
          }
          clearInterval(interval);
        }
        setRevenueLicenseProgress(progress);
      }, 150);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (type: "front" | "back" | "vehicleReg" | "revenueLicense", e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      simulateUpload(type, files[0]);
    }
  };

  // Navigate to Step 4
  const handleNextStep = () => {
    setValidationError("");

    if (
      !nicFront || nicFrontStatus !== "done" ||
      !nicBack || nicBackStatus !== "done" ||
      !vehicleReg || vehicleRegStatus !== "done" ||
      !revenueLicense || revenueLicenseStatus !== "done"
    ) {
      setValidationError("Please upload and complete verification for all required documents.");
      return;
    }

    router.push("/SignUp/page3");
  };

  // Navigate back to Step 2
  const handleBackStep = () => {
    router.push("/SignUp/page1");
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

          {/* STEP TRACKER - Solid black line, active circle 01-03 green, line green */}
          <div className="w-full max-w-xl mx-auto py-2 relative flex justify-between items-center select-none z-10">
            {/* Connecting Line Track */}
            <div className="absolute left-[5%] right-[5%] top-[20px] h-[2.5px] bg-black -z-10" />
            {/* Active Green Line Track fill between step 1, 2, & 3 */}
            <div className="absolute left-[5%] w-[60%] top-[20px] h-[2.5px] bg-[#00cc66] -z-10" />

            {/* Step 1 Circle (Completed) */}
            <div className="flex flex-col items-center">
              <button 
                type="button" 
                onClick={() => router.push("/SignUp")}
                className="w-10 h-10 flex items-center justify-center rounded-full text-base font-bold transition-all duration-300 bg-[#00cc66] text-white border border-transparent shadow-[0_0_12px_rgba(0,204,102,0.4)]"
              >
                01
              </button>
            </div>

            {/* Step 2 Circle (Completed) */}
            <div className="flex flex-col items-center">
              <button 
                type="button" 
                onClick={handleBackStep}
                className="w-10 h-10 flex items-center justify-center rounded-full text-base font-bold transition-all duration-300 bg-[#00cc66] text-white border border-transparent shadow-[0_0_12px_rgba(0,204,102,0.4)]"
              >
                02
              </button>
            </div>

            {/* Step 3 Circle (Active) */}
            <div className="flex flex-col items-center">
              <button 
                type="button" 
                disabled
                className="w-10 h-10 flex items-center justify-center rounded-full text-base font-bold transition-all duration-300 bg-[#00cc66] text-white border border-transparent shadow-[0_0_12px_rgba(0,204,102,0.4)]"
              >
                03
              </button>
            </div>

            {/* Step 4 Circle (Inactive) */}
            <div className="flex flex-col items-center">
              <button 
                type="button" 
                disabled
                className="w-10 h-10 flex items-center justify-center rounded-full text-base font-bold transition-all duration-300 bg-white text-slate-800 border border-black"
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

            {/* Form Title & Icon */}
            <div className="flex items-center gap-3 border-b border-white/15 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-400/40 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.25)]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                </svg>
              </div>
              <h2 className="text-white text-2xl font-bold tracking-wide select-none">
                Upload Required Documents
              </h2>
            </div>

            <p className="text-white/85 text-sm md:text-base select-none">
              Upload clear scans or photos of required documents (JPG, PNG or PDF - Max 5MB each)
            </p>

            {/* Upload drag & drop components - 2x2 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-4">
              
              {/* NIC Front Side Card */}
              <div className="flex flex-col gap-3">
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop("front", e)}
                  className={`relative border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[200px] bg-white/5 ${
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
                    <div className="flex flex-col items-center gap-2 text-white/85">
                      <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center p-2 mb-2">
                        <svg className="w-10 h-10" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="4" y="14" width="56" height="36" rx="4" fill="#ffffff" stroke="#2c3e50" strokeWidth="2.5"/>
                          <rect x="4" y="14" width="56" height="7" rx="1" fill="#e74c3c"/>
                          <circle cx="10" cy="17.5" r="1.5" fill="white"/>
                          <rect x="10" y="27" width="14" height="17" rx="2" fill="#ebf5fb" stroke="#2980b9" strokeWidth="1.5"/>
                          <circle cx="17" cy="32.5" r="3" fill="#2980b9"/>
                          <path d="M11 42.5 C11 39.5, 23 39.5, 23 42.5" fill="#2980b9" />
                          <line x1="30" y1="29" x2="52" y2="29" stroke="#2c3e50" strokeWidth="2" strokeLinecap="round"/>
                          <line x1="30" y1="35" x2="48" y2="35" stroke="#2c3e50" strokeWidth="2" strokeLinecap="round"/>
                          <line x1="30" y1="41" x2="44" y2="41" stroke="#2c3e50" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <span className="font-bold text-sm">NIC Front</span>
                      <span className="text-xs text-white/50">Required</span>
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
                          if (typeof window !== "undefined") {
                            sessionStorage.removeItem("signup_nic_front_uploaded");
                          }
                        }}
                        className="mt-2 text-xs text-red-400 hover:text-red-300 font-semibold underline cursor-pointer"
                      >
                        Delete File
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* NIC Back Side Card */}
              <div className="flex flex-col gap-3">
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop("back", e)}
                  className={`relative border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[200px] bg-white/5 ${
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
                    <div className="flex flex-col items-center gap-2 text-white/85">
                      <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center p-2 mb-2">
                        <svg className="w-10 h-10" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="4" y="14" width="56" height="36" rx="4" fill="#ffffff" stroke="#2c3e50" strokeWidth="2.5"/>
                          <rect x="4" y="14" width="56" height="7" rx="1" fill="#e74c3c"/>
                          <circle cx="10" cy="17.5" r="1.5" fill="white"/>
                          <rect x="10" y="27" width="14" height="17" rx="2" fill="#ebf5fb" stroke="#2980b9" strokeWidth="1.5"/>
                          <circle cx="17" cy="32.5" r="3" fill="#2980b9"/>
                          <path d="M11 42.5 C11 39.5, 23 39.5, 23 42.5" fill="#2980b9" />
                          <line x1="30" y1="29" x2="52" y2="29" stroke="#2c3e50" strokeWidth="2" strokeLinecap="round"/>
                          <line x1="30" y1="35" x2="48" y2="35" stroke="#2c3e50" strokeWidth="2" strokeLinecap="round"/>
                          <line x1="30" y1="41" x2="44" y2="41" stroke="#2c3e50" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <span className="font-bold text-sm">NIC Back</span>
                      <span className="text-xs text-white/50">Required</span>
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
                          if (typeof window !== "undefined") {
                            sessionStorage.removeItem("signup_nic_back_uploaded");
                          }
                        }}
                        className="mt-2 text-xs text-red-400 hover:text-red-300 font-semibold underline cursor-pointer"
                      >
                        Delete File
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle Registration Card */}
              <div className="flex flex-col gap-3">
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop("vehicleReg", e)}
                  className={`relative border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[200px] bg-white/5 ${
                    vehicleRegStatus === "done" 
                      ? "border-green-400 bg-green-500/5"
                      : "border-white/20 hover:border-white/40 hover:bg-white/10"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        simulateUpload("vehicleReg", e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />

                  {vehicleRegStatus === "idle" && (
                    <div className="flex flex-col items-center gap-2 text-white/85">
                      <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center p-2 mb-2">
                        <svg className="w-10 h-10" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 10 H38 L48 20 V54 C48 56.2 46.2 58 44 58 H14 C11.8 58 10 56.2 10 54 V14 C10 11.8 11.8 10 14 10 Z" fill="#ffffff" stroke="#2c3e50" strokeWidth="2.5" strokeLinejoin="round"/>
                          <path d="M38 10 V20 H48" fill="#ffffff" stroke="#2c3e50" strokeWidth="2.5" strokeLinejoin="round"/>
                          <line x1="18" y1="28" x2="40" y2="28" stroke="#2c3e50" strokeWidth="2.5" strokeLinecap="round"/>
                          <line x1="18" y1="37" x2="36" y2="37" stroke="#2c3e50" strokeWidth="2.5" strokeLinecap="round"/>
                          <line x1="18" y1="46" x2="40" y2="46" stroke="#2c3e50" strokeWidth="2.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <span className="font-bold text-sm">Vehicle Registration</span>
                      <span className="text-xs text-white/50">Required</span>
                    </div>
                  )}

                  {vehicleRegStatus === "uploading" && (
                    <div className="w-full flex flex-col items-center gap-4 px-4">
                      <svg className="animate-spin h-8 w-8 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <div className="w-full">
                        <div className="flex justify-between text-xs text-white mb-1">
                          <span>Uploading Vehicle Registration...</span>
                          <span>{vehicleRegProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-400 transition-all duration-150" style={{ width: `${vehicleRegProgress}%` }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {vehicleRegStatus === "done" && vehicleReg && (
                    <div className="flex flex-col items-center gap-3 w-full px-4">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center border border-green-400/40 text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.25)]">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                      <span className="text-white text-sm font-bold truncate max-w-[200px]">{vehicleReg.name}</span>
                      <span className="text-xs text-green-400 font-semibold uppercase tracking-wider">Upload Completed</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVehicleReg(null);
                          setVehicleRegStatus("idle");
                          setVehicleRegProgress(0);
                          if (typeof window !== "undefined") {
                            sessionStorage.removeItem("signup_vehicle_reg_uploaded");
                          }
                        }}
                        className="mt-2 text-xs text-red-400 hover:text-red-300 font-semibold underline cursor-pointer"
                      >
                        Delete File
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Revenue License Card */}
              <div className="flex flex-col gap-3">
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop("revenueLicense", e)}
                  className={`relative border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[200px] bg-white/5 ${
                    revenueLicenseStatus === "done" 
                      ? "border-green-400 bg-green-500/5"
                      : "border-white/20 hover:border-white/40 hover:bg-white/10"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        simulateUpload("revenueLicense", e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />

                  {revenueLicenseStatus === "idle" && (
                    <div className="flex flex-col items-center gap-2 text-white/85">
                      <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center p-2 mb-2">
                        <svg className="w-10 h-10" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 10 H38 L48 20 V54 C48 56.2 46.2 58 44 58 H14 C11.8 58 10 56.2 10 54 V14 C10 11.8 11.8 10 14 10 Z" fill="#ffffff" stroke="#2c3e50" strokeWidth="2.5" strokeLinejoin="round"/>
                          <path d="M38 10 V20 H48" fill="#ffffff" stroke="#2c3e50" strokeWidth="2.5" strokeLinejoin="round"/>
                          <line x1="18" y1="28" x2="40" y2="28" stroke="#2c3e50" strokeWidth="2.5" strokeLinecap="round"/>
                          <line x1="18" y1="37" x2="36" y2="37" stroke="#2c3e50" strokeWidth="2.5" strokeLinecap="round"/>
                          <line x1="18" y1="46" x2="40" y2="46" stroke="#2c3e50" strokeWidth="2.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <span className="font-bold text-sm">Revenue License</span>
                      <span className="text-xs text-white/50">Required</span>
                    </div>
                  )}

                  {revenueLicenseStatus === "uploading" && (
                    <div className="w-full flex flex-col items-center gap-4 px-4">
                      <svg className="animate-spin h-8 w-8 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <div className="w-full">
                        <div className="flex justify-between text-xs text-white mb-1">
                          <span>Uploading Revenue License...</span>
                          <span>{revenueLicenseProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-400 transition-all duration-150" style={{ width: `${revenueLicenseProgress}%` }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {revenueLicenseStatus === "done" && revenueLicense && (
                    <div className="flex flex-col items-center gap-3 w-full px-4">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center border border-green-400/40 text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.25)]">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                      <span className="text-white text-sm font-bold truncate max-w-[200px]">{revenueLicense.name}</span>
                      <span className="text-xs text-green-400 font-semibold uppercase tracking-wider">Upload Completed</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRevenueLicense(null);
                          setRevenueLicenseStatus("idle");
                          setRevenueLicenseProgress(0);
                          if (typeof window !== "undefined") {
                            sessionStorage.removeItem("signup_revenue_license_uploaded");
                          }
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

            {/* Warning Info Badge under upload zones */}
            <div className="flex items-center justify-center w-full mt-2">
              <div className="bg-white/10 border border-white/5 backdrop-blur-sm px-6 py-2.5 rounded-full flex items-center gap-2.5 text-white/95 text-xs sm:text-sm shadow-md max-w-2xl text-center select-none">
                <span className="text-yellow-400 text-lg flex items-center">⚠️</span>
                <span>All documents must be clear and legible. Incomplete submissions will delay account activation.</span>
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
                <span className="text-base font-semibold">Back</span>
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

