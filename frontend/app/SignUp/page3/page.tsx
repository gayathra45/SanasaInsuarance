"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/Components/Homepage/Navbar";
import LoginFooter from "@/app/Components/Login/Footer";

function formatNumberPlate(plate: string): string {
  if (!plate) return "";
  const cleaned = plate.trim();
  if (cleaned.includes("-")) {
    return cleaned;
  }
  const lastNumbersMatch = cleaned.match(/^(.*[A-Za-z]+)(\d+)$/);
  if (lastNumbersMatch) {
    return `${lastNumbersMatch[1].trim().toUpperCase()}-${lastNumbersMatch[2]}`;
  }
  return cleaned;
}

function getVehicleIconSvg(type: string, className = "w-5 h-5 text-white") {
  if (!type) type = "car";
  const t = type.toLowerCase().trim();
  
  if (t.includes("suv")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12h20M17 17h3a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3L14 4H6L3 7v8a2 2 0 0 0 2 2h3" />
        <circle cx="7" cy="17" r="2" />
        <path d="M9 17h6" />
        <circle cx="17" cy="17" r="2" />
        <path d="M7 7h6M19 10h-3" />
      </svg>
    );
  }
  if (t.includes("cab") || t.includes("pickup")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 13h13V8H7L4 11H2v2zm13 0h7V10h-7v3z" />
        <path d="M2 13v3a1 1 0 0 0 1 1h3" />
        <path d="M9 17h6" />
        <path d="M19 17h2a1 1 0 0 0 1-1v-3" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    );
  }
  if (t.includes("van") || t.includes("minibus")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 15V7a2 2 0 0 1 2-2h12l5 3v7a2 2 0 0 1-2 2h-1" />
        <path d="M2 15h3" />
        <path d="M9 17h6" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
        <path d="M6 8h4v3H6V8zm6 0h3v3h-3V8z" />
      </svg>
    );
  }
  if (t.includes("bike") || t.includes("motorcycle") || t.includes("scooter")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5" cy="16" r="3" />
        <circle cx="19" cy="16" r="3" />
        <path d="M5 16h8l3-7H9l-2 3M16 9h3M12 9l-3-4H6" />
      </svg>
    );
  }
  if (t.includes("three") || t.includes("rickshaw") || t.includes("tuk")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
        <path d="M3 18h1c.5 0 .9-.4 1-1l1-6h11c.6 0 1-.4 1-1V5h-3l-2 3H8L6 11H3v7z" />
        <path d="M12 11v7M15 11v7" />
      </svg>
    );
  }
  if (t.includes("lorry") || t.includes("truck")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 18H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h11v13zm0-8h7l2 3v5a1 1 0 0 1-1 1h-8v-9z" />
        <circle cx="6" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </svg>
    );
  }
  if (t.includes("bus")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 15V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v9M2 15h20v1a2 2 0 0 1-2 2h-1M5 18H3" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
        <path d="M4 7h3v3H4V7zm5 0h3v3H9V7zm5 0h3v3h-3V7zm5 0h2v3h-2V7z" />
      </svg>
    );
  }
  if (t.includes("tractor")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="17" r="2.5" />
        <circle cx="17" cy="15" r="4.5" />
        <path d="M6 17h6v-2h-3v-4h4v5" />
        <path d="M12.5 15.5h.5M9 11l-3-4H4" />
      </svg>
    );
  }
  
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.8C2.1 11 2 11.3 2 11.5V16c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}

interface Vehicle {
  numberPlate: string;
  vehicleType: string;
  year: string;
  company: string;
  model: string;
  engineNumber: string;
  chassisNumber: string;
  policyNumber: string;
}

export default function SignUpPage3() {
  const router = useRouter();
  
  // Data retrieved from session cache
  const [personal, setPersonal] = useState<any>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [nicFrontName, setNicFrontName] = useState("");
  const [nicBackName, setNicBackName] = useState("");
  const [vehicleRegName, setVehicleRegName] = useState("");
  const [revenueLicenseName, setRevenueLicenseName] = useState("");

  const [validationError, setValidationError] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [consentData, setConsentData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [refNumber, setRefNumber] = useState("");

  // Load cache on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPersonal = sessionStorage.getItem("signup_personal_details");
      const savedVehicles = sessionStorage.getItem("signup_vehicle_details");
      const savedFront = sessionStorage.getItem("signup_nic_front_uploaded");
      const savedBack = sessionStorage.getItem("signup_nic_back_uploaded");
      const savedVehicleReg = sessionStorage.getItem("signup_vehicle_reg_uploaded");
      const savedRevenueLicense = sessionStorage.getItem("signup_revenue_license_uploaded");

      if (savedPersonal) {
        try {
          setPersonal(JSON.parse(savedPersonal));
        } catch (e) {
          console.error(e);
        }
      }
      if (savedVehicles) {
        try {
          setVehicles(JSON.parse(savedVehicles));
        } catch (e) {
          console.error(e);
        }
      }
      if (savedFront) setNicFrontName(savedFront);
      if (savedBack) setNicBackName(savedBack);
      if (savedVehicleReg) setVehicleRegName(savedVehicleReg);
      if (savedRevenueLicense) setRevenueLicenseName(savedRevenueLicense);
    }
  }, []);

  const handleBackStep = () => {
    router.push("/SignUp/page2");
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    setValidationError("");

    if (!agreedToTerms || !consentData) {
      setValidationError("You must agree to the Terms of Service and Privacy Policy to register.");
      return;
    }

    setIsSubmitting(true);

    try {
      const requestBody = {
        personal,
        vehicles,
        documents: {
          nicFront: nicFrontName,
          nicBack: nicBackName,
          vehicleReg: vehicleRegName,
          revenueLicense: revenueLicenseName
        }
      };

      const res = await fetch("http://localhost:5000/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong during sign up.");
      }

      setRefNumber(data.referenceNumber);

      // Clear session cache
      sessionStorage.removeItem("signup_personal_details");
      sessionStorage.removeItem("signup_vehicle_details");
      sessionStorage.removeItem("signup_nic_front_uploaded");
      sessionStorage.removeItem("signup_nic_back_uploaded");
      sessionStorage.removeItem("signup_vehicle_reg_uploaded");
      sessionStorage.removeItem("signup_revenue_license_uploaded");

      setShowSuccessModal(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/Login");
      }, 3000);

    } catch (err: any) {
      setValidationError(err.message || "An error occurred while connecting to the server.");
    } finally {
      setIsSubmitting(false);
    }
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
                const isActive = num === 4;
                const isCompleted = num < 4;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      if (num === 1) {
                        router.push("/SignUp");
                      } else if (num === 2) {
                        router.push("/SignUp/page1");
                      } else if (num === 3) {
                        router.push("/SignUp/page2");
                      }
                    }}
                    disabled={num >= 4}
                    className={`flex-1 h-full rounded-full transition-all duration-500 outline-none border-none ${
                      isCompleted
                        ? "bg-[#00cc66] cursor-pointer hover:opacity-90"
                        : isActive
                        ? "bg-[#ff9800] shadow-[0_0_15px_rgba(255,152,0,0.6)] scale-[1.02]"
                        : "bg-white/15 cursor-default"
                    }`}
                  />
                );
              })}
            </div>
            {/* Step Label Container */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left gap-0.5 mt-1">
              <span className="text-xs md:text-sm font-bold text-[#ff9800] tracking-widest uppercase">
                STEP 04 OF 04
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold text-white">
                Review & Confirm
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

            {/* Form Title & Icon */}
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
              Please review all information before submitting your insurance policy account registration.
            </p>

            {/* Summary Grid wrapper */}
            <div className="flex flex-col gap-6">
              
              {/* Personal details review block */}
              {personal && (
                <div className="flex flex-col gap-3">
                  <span className="text-white font-bold text-base select-none">Personal details</span>
                  <div className="bg-black/20 rounded-3xl p-6 border border-white/10 text-white grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm md:text-base">
                    <div>
                      <span className="text-white/50 font-medium text-xs uppercase block">Full Name</span>
                      <span className="font-bold">{personal.firstName} {personal.lastName}</span>
                    </div>
                    <div>
                      <span className="text-white/50 font-medium text-xs uppercase block">NIC Number</span>
                      <span className="font-bold">{personal.nic}</span>
                    </div>
                    <div>
                      <span className="text-white/50 font-medium text-xs uppercase block">Mobile Number</span>
                      <span className="font-bold">{personal.mobile}</span>
                    </div>
                    <div>
                      <span className="text-white/50 font-medium text-xs uppercase block">Email Address</span>
                      <span className="font-bold">{personal.email}</span>
                    </div>
                    <div>
                      <span className="text-white/50 font-medium text-xs uppercase block">Date of Birth</span>
                      <span className="font-bold">{personal.dob}</span>
                    </div>
                    <div>
                      <span className="text-white/50 font-medium text-xs uppercase block">Location</span>
                      <span className="font-bold">{personal.city}, {personal.province}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-white/50 font-medium text-xs uppercase block">Residential Address</span>
                      <span className="font-bold">{personal.address}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Vehicles details review block */}
              {vehicles.length > 0 && (
                <div className="flex flex-col gap-3">
                  <span className="text-white font-bold text-base select-none">Vehicle details ({vehicles.length})</span>
                  <div className="flex flex-col gap-4">
                    {vehicles.map((v, index) => (
                      <div key={index} className="bg-black/20 rounded-3xl p-6 border border-white/10 text-white grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm md:text-base">
                        <div className="md:col-span-2 border-b border-white/10 pb-2 flex justify-between select-none items-center">
                          <span className="font-bold text-orange-400 flex items-center gap-2">
                            <span>{getVehicleIconSvg(v.vehicleType)}</span>
                            <span>Vehicle #{index + 1}</span>
                          </span>
                          <span className="text-xs uppercase bg-white/10 px-3 py-1 rounded-full">{v.vehicleType}</span>
                        </div>
                        <div>
                          <span className="text-white/50 font-medium text-xs uppercase block">Number Plate</span>
                          <span className="font-bold">{formatNumberPlate(v.numberPlate)}</span>
                        </div>
                        <div>
                          <span className="text-white/50 font-medium text-xs uppercase block">Brand / Company</span>
                          <span className="font-bold">{v.company}</span>
                        </div>
                        <div>
                          <span className="text-white/50 font-medium text-xs uppercase block">Model & Year</span>
                          <span className="font-bold">{v.model} ({v.year})</span>
                        </div>
                        <div>
                          <span className="text-white/50 font-medium text-xs uppercase block">Engine Number</span>
                          <span className="font-bold">{v.engineNumber}</span>
                        </div>
                        <div>
                          <span className="text-white/50 font-medium text-xs uppercase block">Chassis Number</span>
                          <span className="font-bold">{v.chassisNumber}</span>
                        </div>
                        <div>
                          <span className="text-white/50 font-medium text-xs uppercase block">Insurance Vehicle Policy No.</span>
                          <span className="font-bold">{v.policyNumber}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents check block */}
              <div className="flex flex-col gap-3">
                <span className="text-white font-bold text-base select-none">Verification Documents</span>
                <div className="bg-black/20 rounded-3xl p-6 border border-white/10 text-white grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm md:text-base">
                  <div className="min-w-0">
                    <span className="text-white/50 font-medium text-xs uppercase block select-none">KYC Document (Front)</span>
                    <span className="text-green-400 font-bold flex items-center gap-1.5 w-full min-w-0">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      <span className="flex-shrink-0">Verified:</span>
                      <span className="truncate min-w-0 block" title={nicFrontName || "nic_front.png"}>
                        {nicFrontName || "nic_front.png"}
                      </span>
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-white/50 font-medium text-xs uppercase block select-none">KYC Document (Back)</span>
                    <span className="text-green-400 font-bold flex items-center gap-1.5 w-full min-w-0">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      <span className="flex-shrink-0">Verified:</span>
                      <span className="truncate min-w-0 block" title={nicBackName || "nic_back.png"}>
                        {nicBackName || "nic_back.png"}
                      </span>
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-white/50 font-medium text-xs uppercase block select-none">Vehicle Registration</span>
                    <span className="text-green-400 font-bold flex items-center gap-1.5 w-full min-w-0">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      <span className="flex-shrink-0">Verified:</span>
                      <span className="truncate min-w-0 block" title={vehicleRegName || "vehicle_registration.png"}>
                        {vehicleRegName || "vehicle_registration.png"}
                      </span>
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-white/50 font-medium text-xs uppercase block select-none">Revenue License</span>
                    <span className="text-green-400 font-bold flex items-center gap-1.5 w-full min-w-0">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      <span className="flex-shrink-0">Verified:</span>
                      <span className="truncate min-w-0 block" title={revenueLicenseName || "revenue_license.png"}>
                        {revenueLicenseName || "revenue_license.png"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Consent Form checkboxes */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
              <label className="flex items-start gap-3 text-white text-sm select-none cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4.5 h-4.5 rounded text-orange-500 focus:ring-orange-400 cursor-pointer animate-fade-in"
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
                  className="mt-1 w-4.5 h-4.5 rounded text-orange-500 focus:ring-orange-400 cursor-pointer animate-fade-in"
                />
                <span>
                  I consent to the collection and processing of my identity verification details and vehicle details for policy processing.
                </span>
              </label>
            </form>

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

              {/* Confirm & Submit button */}
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

            </div>

            {/* DONE MODAL ON SUBMIT SUCCESS */}
            {showSuccessModal && (
              <div className="absolute inset-0 bg-[#0e3b44]/95 backdrop-blur-xl rounded-[2.5rem] border border-white/20 flex flex-col items-center justify-center p-6 text-center z-30 transition-all duration-500 animate-fade-in">
                <div className="flex flex-col items-center gap-6 max-w-xl px-4 md:px-8">
                  
                  {/* Big Glowing Success Checkmark */}
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-400/40 shadow-[0_0_30px_rgba(74,222,128,0.4)] animate-[pulse_1.5s_infinite]">
                    <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  
                  {/* Done Title */}
                  <h3 className="text-white text-3xl font-extrabold tracking-wide select-none">Done!</h3>
                  
                  {/* Reference Number Pill */}
                  <div className="bg-[#d9d9d9] text-[#0e3b44] font-bold px-10 py-3.5 rounded-full text-xl tracking-wider shadow-inner select-all">
                    {refNumber}
                  </div>
                  
                  {/* Detail message */}
                  <p className="text-white/90 text-sm md:text-base font-medium leading-relaxed max-w-md">
                    Your insurance application has been received. Our office staff will review your documents and activate your account within 1–2 business days.
                  </p>

                  {/* Redirection indicator */}
                  <div className="flex items-center gap-2 mt-2 text-xs text-orange-400 font-bold uppercase tracking-widest select-none">
                    <svg className="animate-spin h-4 w-4 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
