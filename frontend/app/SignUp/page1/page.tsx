"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/Components/Homepage/Navbar";
import LoginFooter from "@/app/Components/Login/Footer";

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

const vehicleTypes = [
  "Car",
  "SUV",
  "Cab / Double Cab",
  "Van",
  "Motorbike",
  "Three-Wheeler",
  "Lorry / Truck",
  "Bus",
  "Tractor"
];

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

export default function SignUpPage1() {
  const router = useRouter();
  const [validationError, setValidationError] = useState("");

  // Loopable vehicle list state
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      numberPlate: "",
      vehicleType: "",
      year: "",
      company: "",
      model: "",
      engineNumber: "",
      chassisNumber: "",
      policyNumber: ""
    }
  ]);

  // Load state from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("signup_vehicle_details");
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (Array.isArray(data) && data.length > 0) {
            setVehicles(data);
          }
        } catch (err) {
          console.error("Error loading vehicle details:", err);
        }
      }
    }
  }, []);

  // Update specific vehicle field
  const handleVehicleChange = (index: number, field: keyof Vehicle, value: string) => {
    const updated = [...vehicles];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setVehicles(updated);
  };

  // Add another vehicle block (looping)
  const addVehicle = () => {
    setVehicles([
      ...vehicles,
      {
        numberPlate: "",
        vehicleType: "",
        year: "",
        company: "",
        model: "",
        engineNumber: "",
        chassisNumber: "",
        policyNumber: ""
      }
    ]);
  };

  // Remove a vehicle block
  const removeVehicle = (index: number) => {
    if (vehicles.length > 1) {
      setVehicles(vehicles.filter((_, idx) => idx !== index));
    }
  };
  // Handle Next step
  const handleNextStep = () => {
    setValidationError("");

    // Validate all vehicles
    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i];
      if (!v.numberPlate || !v.vehicleType || !v.year || !v.company || !v.model || !v.engineNumber || !v.chassisNumber || !v.policyNumber) {
        setValidationError(`Please fill out all required fields for Vehicle #${i + 1}`);
        return;
      }

      const cleanPlate = v.numberPlate.replace(/[\s-]/g, "");
      if (cleanPlate.length < 5 || cleanPlate.length > 10 || !/^[A-Za-z0-9]+$/.test(cleanPlate)) {
        setValidationError(`Vehicle #${i + 1} Number Plate must be an alphanumeric mix between 5 and 10 characters.`);
        return;
      }

      if (!/^\d{4}$/.test(v.year)) {
        setValidationError(`Vehicle #${i + 1} Year must be a 4-digit number.`);
        return;
      }

      const cleanPolicy = v.policyNumber.replace(/[\s-]/g, "");
      if (!/^SAN[A-Za-z0-9]{5,9}$/i.test(cleanPolicy)) {
        setValidationError(`Vehicle #${i + 1} Insurance Policy Number must start with 'SAN' and be between 8 and 12 alphanumeric characters.`);
        return;
      }
    }

    if (typeof window !== "undefined") {
      sessionStorage.setItem("signup_vehicle_details", JSON.stringify(vehicles));
    }

    // Navigate to Step 3 (KYC Upload)
    router.push("/SignUp/page2");
  };

  // Handle Back step
  const handleBackStep = () => {
    // Save current state so details are preserved when returning
    if (typeof window !== "undefined") {
      sessionStorage.setItem("signup_vehicle_details", JSON.stringify(vehicles));
    }
    router.push("/SignUp");
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
                const isActive = num === 2;
                const isCompleted = num < 2;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      if (num === 1) {
                        router.push("/SignUp");
                      }
                    }}
                    disabled={num >= 2}
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
                STEP 02 OF 04
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold text-white">
                Vehicle Details
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
                {/* Car Icon */}
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM18.75 18.75a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5M5.25 6.75V4.5a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 .75.75v2.25" />
                </svg>
              </div>
              <h2 className="text-white text-2xl font-bold tracking-wide select-none">
                Vehicle Details
              </h2>
            </div>

            {/* Vehicles Loop Section */}
            <div className="flex flex-col gap-8 divide-y divide-white/10">
              {vehicles.map((v, idx) => (
                <div key={idx} className={`flex flex-col gap-6 ${idx > 0 ? "pt-8" : ""}`}>
                  
                  {/* Vehicle Index Title and Remove Button */}
                  <div className="flex justify-between items-center select-none">
                    <span className="text-white font-bold text-lg">Vehicle #{idx + 1} Details</span>
                    {vehicles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVehicle(idx)}
                        className="text-red-400 hover:text-red-300 text-sm font-semibold underline cursor-pointer"
                      >
                        Remove Vehicle
                      </button>
                    )}
                  </div>

                  {/* Form fields Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Number Plate */}
                    <div className="flex flex-col gap-2">
                      <label className="text-white text-sm font-semibold tracking-wide ml-1 flex gap-0.5 select-none">
                        Number Plate <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={v.numberPlate}
                        onChange={(e) => handleVehicleChange(idx, "numberPlate", e.target.value)}
                        className="w-full bg-white text-slate-800 rounded-full py-3 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-gray-400 font-medium border border-transparent"
                        placeholder="WP ABC-1234"
                      />
                    </div>

                    {/* Vehicle Type Dropdown with custom chevron and dynamic preview */}
                    <div className="flex flex-col gap-2">
                      <label className="text-white text-sm font-semibold tracking-wide ml-1 flex gap-0.5 select-none">
                        Vehicle Type <span className="text-red-500 font-bold">*</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 border border-white/20 text-white flex-shrink-0">
                          {getVehicleIconSvg(v.vehicleType, "w-6 h-6 text-white")}
                        </div>
                        <div className="relative flex-1">
                          <select
                            required
                            value={v.vehicleType}
                            onChange={(e) => handleVehicleChange(idx, "vehicleType", e.target.value)}
                            className="w-full bg-white text-slate-800 rounded-full py-3 px-6 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all font-medium border border-transparent appearance-none"
                          >
                            <option value="" disabled>Select Vehicle Type</option>
                            {vehicleTypes.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                          <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-700">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Year */}
                    <div className="flex flex-col gap-2">
                      <label className="text-white text-sm font-semibold tracking-wide ml-1 flex gap-0.5 select-none">
                        Year <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={v.year}
                        onChange={(e) => handleVehicleChange(idx, "year", e.target.value)}
                        className="w-full bg-white text-slate-800 rounded-full py-3 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-gray-400 font-medium border border-transparent"
                        placeholder="2020"
                      />
                    </div>

                    {/* Company */}
                    <div className="flex flex-col gap-2">
                      <label className="text-white text-sm font-semibold tracking-wide ml-1 flex gap-0.5 select-none">
                        Company <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={v.company}
                        onChange={(e) => handleVehicleChange(idx, "company", e.target.value)}
                        className="w-full bg-white text-slate-800 rounded-full py-3 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-gray-400 font-medium border border-transparent"
                        placeholder="Toyota"
                      />
                    </div>

                    {/* Model */}
                    <div className="flex flex-col gap-2">
                      <label className="text-white text-sm font-semibold tracking-wide ml-1 flex gap-0.5 select-none">
                        Model <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={v.model}
                        onChange={(e) => handleVehicleChange(idx, "model", e.target.value)}
                        className="w-full bg-white text-slate-800 rounded-full py-3 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-gray-400 font-medium border border-transparent"
                        placeholder="Vitz"
                      />
                    </div>

                    {/* Engine Number */}
                    <div className="flex flex-col gap-2">
                      <label className="text-white text-sm font-semibold tracking-wide ml-1 flex gap-0.5 select-none">
                        Engine Number <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={v.engineNumber}
                        onChange={(e) => handleVehicleChange(idx, "engineNumber", e.target.value)}
                        className="w-full bg-white text-slate-800 rounded-full py-3 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-gray-400 font-medium border border-transparent"
                        placeholder="C6786347825N64723"
                      />
                    </div>

                    {/* Chassis Number */}
                    <div className="flex flex-col gap-2">
                      <label className="text-white text-sm font-semibold tracking-wide ml-1 flex gap-0.5 select-none">
                        Chassis Number <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={v.chassisNumber}
                        onChange={(e) => handleVehicleChange(idx, "chassisNumber", e.target.value)}
                        className="w-full bg-white text-slate-800 rounded-full py-3 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-gray-400 font-medium border border-transparent"
                        placeholder="N67GH86"
                      />
                    </div>

                    {/* Policy Number */}
                    <div className="flex flex-col gap-2">
                      <label className="text-white text-sm font-semibold tracking-wide ml-1 flex gap-0.5 select-none">
                        Insurance Vehicle Policy No. <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={v.policyNumber}
                        onChange={(e) => handleVehicleChange(idx, "policyNumber", e.target.value)}
                        className="w-full bg-white text-slate-800 rounded-full py-3 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-gray-400 font-medium border border-transparent"
                        placeholder="POL-987654"
                      />
                    </div>

                  </div>
                </div>
              ))}
            </div>

            {/* Loop Add Button (+ Add Another Vehicle) */}
            <div className="flex justify-center w-full my-4">
              <button
                type="button"
                onClick={addVehicle}
                className="bg-gradient-to-r from-cyan-400 to-teal-400 text-white font-bold py-3.5 px-10 rounded-full shadow-lg transition-all duration-300 hover:opacity-90 active:scale-95 text-center text-base cursor-pointer select-none outline-none border-none"
              >
                + Add Another Vehicle
              </button>
            </div>

            {/* ACTION NAVIGATION BUTTONS (BOTTOM) - identical to Step 1 */}
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
