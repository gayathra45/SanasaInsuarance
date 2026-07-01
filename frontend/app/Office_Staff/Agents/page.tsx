"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OfficeStaffNavbar from "@/app/Components/Office Staff/Navbar";

export default function AgentsPage() {
  const router = useRouter();
  const [branch, setBranch] = useState("");
  
  // Modal / Form states
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    nic: "",
    dob: "",
    address: "",
    password: ""
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submittingAgent, setSubmittingAgent] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedStaff = sessionStorage.getItem("logged_in_staff");
      if (!savedStaff) {
        router.push("/Login");
        return;
      }
      try {
        const staffObj = JSON.parse(savedStaff);
        if (staffObj && staffObj.branch) {
          setBranch(staffObj.branch);
        } else {
          router.push("/Login");
          return;
        }
      } catch (e) {
        console.error("Error parsing logged_in_staff", e);
        router.push("/Login");
        return;
      }
    }
  }, [router]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!formData.name.trim()) return setFormError("Full Name is required.");
    if (!formData.email.trim()) return setFormError("Email Address is required.");
    if (!formData.nic.trim()) return setFormError("NIC Number is required.");
    if (!formData.dob.trim()) return setFormError("Date of Birth is required.");
    if (!formData.address.trim()) return setFormError("Home Address is required.");
    if (formData.password.length < 6) return setFormError("Password must be at least 6 characters.");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      return setFormError("Please enter a valid email address.");
    }

    const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
    if (!nicRegex.test(formData.nic.trim())) {
      return setFormError("Invalid NIC format. Must be 9 digits followed by V/X, or exactly 12 digits.");
    }

    setSubmittingAgent(true);
    try {
      const res = await fetch("http://localhost:5000/api/office-staff/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, branch })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register agent.");
      }

      setFormSuccess("Agent registered successfully!");
      setFormData({ name: "", email: "", nic: "", dob: "", address: "", password: "" });
      
      setTimeout(() => {
        setShowModal(false);
        setFormSuccess("");
      }, 1500);

    } catch (err: any) {
      console.error("Register agent error:", err);
      setFormError(err.message || "Something went wrong.");
    } finally {
      setSubmittingAgent(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <div className="flex flex-1 flex-row min-h-0">
        <OfficeStaffNavbar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white border-b border-slate-100 text-slate-800 px-8 py-4 flex justify-between items-center select-none shadow-sm flex-shrink-0 h-[80px]">
            <h1 className="text-xl font-semibold text-slate-800 flex items-center gap-2"><span className="bg-[#102A43] text-white text-base px-3.5 py-1.5 rounded-xl font-black shadow-sm tracking-wide">{branch} Branch</span> — Insurance Agents</h1>
            <div className="text-sm font-semibold bg-slate-100 px-4 py-1.5 rounded-full text-slate-600 border border-slate-200">
              Staff Portal
            </div>
          </header>

          <main className="flex-1 p-8 bg-slate-50 flex items-center justify-center">
            {/* Centered Action Card */}
            <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-xl max-w-md w-full text-center flex flex-col items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 shadow-inner select-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-10 h-10">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Insurance Agents</h2>
                <p className="text-slate-500 font-semibold text-sm mt-2 leading-relaxed">
                  Register new insurance agents under your branch to manage policy holder claims and verification documents.
                </p>
              </div>

              <button
                onClick={() => {
                  setFormData({ name: "", email: "", nic: "", dob: "", address: "", password: "" });
                  setFormError("");
                  setFormSuccess("");
                  setShowModal(true);
                }}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-2xl text-base font-bold shadow-lg shadow-amber-500/25 transition-all border-none outline-none cursor-pointer flex items-center justify-center gap-2 select-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Add New Agent</span>
              </button>
            </div>
          </main>
        </div>
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden transform scale-100 transition-all animate-scale-up">
            {/* Modal Header */}
            <div className="bg-amber-500 px-6 py-4 flex justify-between items-center text-white select-none">
              <h2 className="font-bold text-lg">Register New Insurance Agent</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:text-slate-100 bg-transparent border-none outline-none cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content / Form */}
            <form onSubmit={handleFormSubmit} className="p-6 flex flex-col gap-4">
              {formError && (
                <div className="bg-red-50 text-red-600 text-xs font-bold px-4 py-2.5 rounded-xl border border-red-100">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="bg-emerald-50 text-emerald-600 text-xs font-bold px-4 py-2.5 rounded-xl border border-emerald-100">
                  {formSuccess}
                </div>
              )}

              {/* Form Group: Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="E.g., John Doe"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Form Row: Email & NIC */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="agent@sanasainsurance.lk"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1">NIC Number</label>
                  <input
                    type="text"
                    required
                    value={formData.nic}
                    onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                    placeholder="e.g. 199912345678 or 991234567V"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Form Row: DOB & Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1">Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min. 6 characters"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Form Group: Address */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 ml-1">Home Address</label>
                <textarea
                  required
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter home address here..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Read-only Branch Info */}
              <div className="flex flex-col gap-1.5 bg-slate-50 border border-slate-100 p-3.5 rounded-xl select-none">
                <span className="text-xs font-bold text-slate-400">Assigned Branch</span>
                <span className="text-sm font-extrabold text-slate-600">{branch} Branch</span>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-bold transition-all cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAgent}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer border-none outline-none disabled:opacity-60 flex items-center gap-2"
                >
                  {submittingAgent ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Application</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
