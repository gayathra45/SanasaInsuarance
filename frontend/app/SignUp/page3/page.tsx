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
          
          {/* STEP TRACKER - Solid black line, active circle 01-04 green, line green */}
          <div className="w-full max-w-xl mx-auto py-2 relative flex justify-between items-center select-none z-10">
            {/* Connecting Line Track */}
            <div className="absolute left-[5%] right-[5%] top-[20px] h-[2.5px] bg-black -z-10" />
            {/* Active Green Line Track fill across all steps */}
            <div className="absolute left-[5%] right-[5%] top-[20px] h-[2.5px] bg-[#00cc66] -z-10" />

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
                onClick={() => router.push("/SignUp/page1")}
                className="w-10 h-10 flex items-center justify-center rounded-full text-base font-bold transition-all duration-300 bg-[#00cc66] text-white border border-transparent shadow-[0_0_12px_rgba(0,204,102,0.4)]"
              >
                02
              </button>
            </div>

            {/* Step 3 Circle (Completed) */}
            <div className="flex flex-col items-center">
              <button 
                type="button" 
                onClick={handleBackStep}
                className="w-10 h-10 flex items-center justify-center rounded-full text-base font-bold transition-all duration-300 bg-[#00cc66] text-white border border-transparent shadow-[0_0_12px_rgba(0,204,102,0.4)]"
              >
                03
              </button>
            </div>

            {/* Step 4 Circle (Active) */}
            <div className="flex flex-col items-center">
              <button 
                type="button" 
                disabled
                className="w-10 h-10 flex items-center justify-center rounded-full text-base font-bold transition-all duration-300 bg-[#00cc66] text-white border border-transparent shadow-[0_0_12px_rgba(0,204,102,0.4)]"
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
                        <div className="md:col-span-2 border-b border-white/10 pb-2 flex justify-between select-none">
                          <span className="font-bold text-orange-400">Vehicle #{index + 1}</span>
                          <span className="text-xs uppercase bg-white/10 px-3 py-1 rounded-full">{v.vehicleType}</span>
                        </div>
                        <div>
                          <span className="text-white/50 font-medium text-xs uppercase block">Number Plate</span>
                          <span className="font-bold">{v.numberPlate}</span>
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
