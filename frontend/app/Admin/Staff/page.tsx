"use client";

import React, { useState } from "react";
import AdminNavbar from "@/app/Components/Admin/Navbar";

export default function AdminStaffPage() {
  // Modal / Form states
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    branch: "",
    province: "",
    location: "",
    staffCount: 1,
    password: ""
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submittingStaff, setSubmittingStaff] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!formData.name.trim()) return setFormError("Full Name / Branch Name is required.");
    if (!formData.email.trim()) return setFormError("Email Address is required.");
    if (!formData.mobile.trim()) return setFormError("Mobile Number is required.");
    if (!formData.branch.trim()) return setFormError("Branch Name is required.");
    if (!formData.province.trim()) return setFormError("Province is required.");
    if (!formData.location.trim()) return setFormError("Office Location is required.");
    if (formData.staffCount === undefined || formData.staffCount < 1) return setFormError("Staff count must be at least 1.");
    if (formData.password.length < 6) return setFormError("Password must be at least 6 characters.");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      return setFormError("Please enter a valid email address.");
    }

    setSubmittingStaff(true);
    try {
      const res = await fetch("http://localhost:5000/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register staff.");
      }

      setFormSuccess("Office staff registered successfully!");
      setFormData({
        name: "",
        email: "",
        mobile: "",
        branch: "",
        province: "",
        location: "",
        staffCount: 1,
        password: ""
      });

      setTimeout(() => {
        setShowModal(false);
        setFormSuccess("");
      }, 1500);

    } catch (err: any) {
      console.error("Register staff error:", err);
      setFormError(err.message || "Something went wrong.");
    } finally {
      setSubmittingStaff(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <div className="flex flex-1 flex-row min-h-0">
        <AdminNavbar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white border-b border-slate-100 text-slate-800 px-8 py-4 flex justify-between items-center select-none shadow-sm flex-shrink-0 h-[80px]">
            <h1 className="text-xl font-semibold text-slate-800 flex items-center gap-2">Admin Portal — <span className="bg-[#102A43] text-white text-base px-3.5 py-1.5 rounded-xl font-black shadow-sm tracking-wide">Office Staff Management</span></h1>
            <div className="text-sm font-semibold bg-slate-100 px-4 py-1.5 rounded-full text-slate-600 border border-slate-200">
              System Admin
            </div>
          </header>

          <main className="flex-1 p-8 bg-slate-50 flex items-center justify-center">
            {/* Centered Action Card */}
            <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-xl max-w-md w-full text-center flex flex-col items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 shadow-inner select-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-10 h-10">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Branch Office Staff</h2>
                <p className="text-slate-500 font-semibold text-sm mt-2 leading-relaxed">
                  Add new branch office staff members to manage local branches, process claims, and verify policy holder registrations.
                </p>
              </div>

              <button
                onClick={() => {
                  setFormData({
                    name: "",
                    email: "",
                    mobile: "",
                    branch: "",
                    province: "",
                    location: "",
                    staffCount: 1,
                    password: ""
                  });
                  setFormError("");
                  setFormSuccess("");
                  setShowModal(true);
                }}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-2xl text-base font-bold shadow-lg shadow-amber-500/25 transition-all border-none outline-none cursor-pointer flex items-center justify-center gap-2 select-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Add New Staff Member</span>
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
              <h2 className="font-bold text-lg">Register New Office Staff / Branch</h2>
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
                <label className="text-xs font-bold text-slate-500 ml-1">Staff / Branch Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="E.g., Galle Branch Staff"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Form Row: Email & Mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="galle@sanasainsurance.lk"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1">Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="e.g., 0768088176"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Form Row: Branch & Province */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1">Branch Name</label>
                  <input
                    type="text"
                    required
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    placeholder="E.g., Galle"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1">Province</label>
                  <input
                    type="text"
                    required
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    placeholder="E.g., Southern"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Form Row: Staff Count & Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1">Staff Count</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.staffCount}
                    onChange={(e) => setFormData({ ...formData, staffCount: Number(e.target.value) })}
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

              {/* Form Group: Location */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 ml-1">Office Location Address</label>
                <textarea
                  required
                  rows={2}
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Enter branch location address..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
                />
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
                  disabled={submittingStaff}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer border-none outline-none disabled:opacity-60 flex items-center gap-2"
                >
                  {submittingStaff ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Account</span>
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
