"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/app/Components/Homepage/Navbar";
import Footer from "@/app/Components/Login/Footer";

export default function ResetPassword() {
  const [nic, setNic] = useState("");
  const [email, setEmail] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const router = useRouter();

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccessModal(true);
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
    <div className="min-h-screen w-full flex flex-col font-sans">
      {/* Header Navbar */}
      <Navbar />

      {/* Main Content Area with Background Image */}
      <div
        className="relative flex-1 w-full flex items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat py-12"
        style={{
          backgroundImage: "url('/login_bg.jpg')",
        }}
      >
        {/* Teal/Blue Overlay Layers matching Login design */}
        <div className="absolute inset-0 bg-[#0e3b44]/75 mix-blend-multiply pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c3945]/90 via-[#125867]/75 to-[#0b333b]/90 pointer-events-none" />

        {/* Ambient floating radial glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-400/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-300/15 blur-[120px] pointer-events-none" />

        {/* Outer Layout Grid */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-12 flex flex-col lg:flex-row items-center justify-around gap-12 lg:gap-6">
          
          {/* Left Side: Page Title */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left text-white max-w-md">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight select-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)] leading-tight">
              Reset Password
            </h1>
          </div>

          {/* Right Side: Glassmorphism Card */}
          <div className="relative w-full max-w-[500px] bg-white/10 backdrop-blur-md border border-white/20 rounded-[2.5rem] p-8 md:p-12 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col gap-8 transition-all duration-500 hover:border-white/30">
            
            <form onSubmit={handleConfirm} className="flex flex-col gap-6">
              
              {/* National Identity Card (NIC) Field */}
              <div className="flex flex-col gap-2">
                <label className="text-white text-base font-semibold tracking-wide ml-1 select-none">
                  National Identity Card (NIC)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-700">
                    {/* ID Card SVG */}
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 9h3m-3 3h3m-3 3h3M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    required
                    value={nic}
                    onChange={(e) => setNic(e.target.value)}
                    className="w-full bg-white text-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all placeholder:text-gray-400 font-medium border border-transparent"
                    placeholder="Enter your NIC"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="flex flex-col gap-2">
                <label className="text-white text-base font-semibold tracking-wide ml-1 select-none">
                  Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-700">
                    {/* Mail Envelope SVG */}
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white text-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all placeholder:text-gray-400 font-medium border border-transparent"
                    placeholder="Enter your Email"
                  />
                </div>
                {/* Custom caption text below input */}
                <p className="text-white/80 text-xs mt-1 ml-1 select-none font-medium">
                  After Confirm and check Email
                </p>
              </div>

              {/* Confirm Button */}
              <button
                type="submit"
                className="mt-4 w-full max-w-[220px] mx-auto bg-[#ff9800] hover:bg-[#ff8f00] active:bg-[#f57c00] text-white font-bold py-3.5 px-8 rounded-full transition-all duration-300 transform hover:scale-[1.04] active:scale-95 shadow-lg shadow-orange-500/35 text-center text-lg cursor-pointer select-none outline-none border-none"
              >
                Confirm
              </button>
            </form>

            {/* Bottom Links */}
            <div className="flex justify-between items-center w-full border-t border-white/10 pt-6 text-sm text-white/85 font-medium select-none">
              <Link
                href="/SignUp"
                className="hover:text-white hover:underline transition-all cursor-pointer"
              >
                Create an Account
              </Link>
              <Link
                href="/Login"
                className="hover:text-white hover:underline transition-all cursor-pointer"
              >
                Back to Login
              </Link>
            </div>

            {/* Done Popup Success Modal */}
            {showSuccessModal && (
              <div className="absolute inset-0 bg-[#0e3b44]/80 backdrop-blur-lg rounded-[2.5rem] border border-white/20 flex flex-col items-center justify-center p-6 text-center z-20 transition-all duration-500">
                <div className="flex flex-col items-center gap-6">
                  
                  {/* Glowing Orange Success Checkmark */}
                  <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center border border-orange-400/40 shadow-[0_0_25px_rgba(249,115,22,0.45)] animate-[pulse_1.5s_infinite]">
                    <svg
                      className="w-10 h-10 text-orange-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth="3"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  </div>
                  
                  {/* Done text and message */}
                  <div className="flex flex-col gap-2">
                    <h3 className="text-white text-3xl font-bold tracking-wide">Done</h3>
                    <p className="text-white/80 text-sm max-w-[280px]">
                      A password reset link has been successfully sent to your email.
                    </p>
                  </div>

                  {/* Redirection indicator */}
                  <div className="flex items-center gap-2 mt-4 text-xs text-orange-400 font-semibold uppercase tracking-widest select-none">
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

      {/* Footer */}
      <Footer />
    </div>
  );
}
