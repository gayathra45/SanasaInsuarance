"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/app/Components/Homepage/Navbar";
import Footer from "@/app/Components/Login/Footer";

type Role = "policy_holder" | "insurance_agent" | "office_staff" | "admin";

export default function Login() {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<Role>("policy_holder");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.clear();
    }
  }, []);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeRole !== "policy_holder") {
      const isGmail = loginId.trim().toLowerCase().endsWith("@gmail.com");
      if (!isGmail) {
        alert("Please enter a valid Gmail address.");
        return;
      }
      alert(`Logging in as ${activeRole.replace("_", " ").toUpperCase()}\nGmail: ${loginId}`);
      router.push("/Policy_Holder/Home");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/policy-holder/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nic: loginId, password })
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Login failed.");
        return;
      }
      sessionStorage.setItem("logged_in_user", JSON.stringify(data.user));
      router.push("/Policy_Holder/Home");
    } catch (err) {
      console.error("Login request failed", err);
      alert("Unable to connect to the server.");
    }
  };

  const rolesList: { id: Role; label: string }[] = [
    { id: "policy_holder", label: "Policy Holder" },
    { id: "insurance_agent", label: "Insurance Agent" },
    { id: "office_staff", label: "Office Staff" },
    { id: "admin", label: "Admin" },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col">
      <Navbar />
      <div
        className="relative flex-1 w-full flex items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/login_bg.jpg')",
        }}
      >
      {/* Visual Teal/Blue Overlay Layers for Modern Depth */}
      <div className="absolute inset-0 bg-[#0e3b44]/75 mix-blend-multiply pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0c3945]/90 via-[#125867]/75 to-[#0b333b]/90 pointer-events-none" />

      {/* Floating ambient light effects to wow the user */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-300/15 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-12 flex flex-col lg:flex-row items-center justify-around gap-12 lg:gap-6">
        
        {/* Left Side: Large Title */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left text-white max-w-md">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight select-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)] animate-fade-in">
            Login
          </h1>
        </div>

        {/* Right Side: Glass effect Login Card */}
        <div className="w-full max-w-[500px] bg-white/10 backdrop-blur-md border border-white/20 rounded-[2.5rem] p-8 md:p-12 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col gap-8 transition-all duration-500 hover:border-white/30">
          
          <form onSubmit={handleConfirm} className="flex flex-col gap-6">
            
            {/* 2x2 Grid of Roles */}
            <div className="grid grid-cols-2 gap-4">
              {rolesList.map((role) => {
                const isSelected = activeRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setActiveRole(role.id)}
                    className={`
                      w-full py-3 px-3 text-center rounded-2xl cursor-pointer select-none text-sm md:text-base font-semibold
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

            {/* Dynamic NIC / Gmail Input Field */}
            <div className="flex flex-col gap-2">
              <label className="text-white text-base font-semibold tracking-wide ml-1 select-none">
                {activeRole === "policy_holder" ? "National Identity Card (NIC)" : "Gmail / Email"}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-700">
                  {activeRole === "policy_holder" ? (
                    /* Custom ID Card / NIC Icon */
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
                  ) : (
                    /* Mail Icon */
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                      />
                    </svg>
                  )}
                </span>
                <input
                  type={activeRole === "policy_holder" ? "text" : "email"}
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full bg-white text-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all placeholder:text-gray-400 font-medium border border-transparent"
                  placeholder={activeRole === "policy_holder" ? "Enter your NIC" : "Enter your Gmail address"}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <label className="text-white text-base font-semibold tracking-wide ml-1 select-none">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-700">
                  {/* Custom Lock SVG Icon */}
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white text-slate-800 rounded-2xl py-3.5 pl-12 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all placeholder:text-gray-400 font-medium border border-transparent"
                  placeholder="Enter your password"
                />
                {password.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-700 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? (
                      /* Eye Slash Icon (Hide) */
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                        />
                      </svg>
                    ) : (
                      /* Eye Icon (Show) */
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
                        />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Confirm Button */}
            <button
              type="submit"
              className="mt-4 w-full max-w-[220px] mx-auto bg-[#ff9800] hover:bg-[#ff8f00] active:bg-[#f57c00] text-white font-bold py-3.5 px-8 rounded-full transition-all duration-300 transform hover:scale-[1.04] active:scale-95 shadow-lg shadow-orange-500/35 text-center text-lg cursor-pointer select-none outline-none border-none"
            >
              Confirm
            </button>
          </form>

          {/* Footer Links */}
          <div className="flex justify-between items-center w-full border-t border-white/10 pt-6 text-sm text-white/85 font-medium select-none">
            {activeRole === "policy_holder" ? (
              <Link
                href="/SignUp"
                className="hover:text-white hover:underline transition-all cursor-pointer"
              >
                Create an Account
              </Link>
            ) : (
              <div />
            )}
            <Link
              href="/Reset_password"
              className="hover:text-white hover:underline transition-all cursor-pointer"
            >
              Reset Password
            </Link>
          </div>

        </div>

      </div>
      </div>
      <Footer />
    </div>
  );
}