"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/app/Components/Admin/Navbar";
import AdminFooter from "@/app/Components/Admin/Footer";

interface StaffMember {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  branch: string;
  province: string;
  location: string;
  staffCount: number;
  createdAt: string;
}

export default function AdminStaffPage() {
  const router = useRouter();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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

  const loadStaff = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/staff");
      if (!res.ok) {
        throw new Error("Failed to fetch office staff.");
      }
      const data = await res.json();
      setStaffList(data.staff || []);
    } catch (err: any) {
      console.error("Load staff error:", err);
      setError(err.message || "Failed to load office staff list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Authenticated Admin check (Optional dashboard verification)
    loadStaff();
  }, []);

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

      await loadStaff();

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

  const filteredStaff = staffList.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.branch.toLowerCase().includes(q) ||
      s.province.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <div className="flex flex-1 flex-row min-h-0">
        <AdminNavbar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-[#f59e0b] text-white px-8 py-4 flex justify-between items-center select-none shadow-sm flex-shrink-0 h-[80px]">
            <h1 className="text-xl font-bold tracking-wide">Admin Portal — Office Staff Management</h1>
            <div className="text-sm font-semibold bg-white/10 px-4 py-1.5 rounded-full">
              System Admin
            </div>
          </header>

          <main className="flex-1 p-8 bg-slate-50 overflow-y-auto">
            {loading ? (
              <div className="w-full h-full flex flex-col items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f59e0b]"></div>
                <span className="mt-4 text-slate-500 font-bold">Loading system office staff...</span>
              </div>
            ) : error ? (
              <div className="w-full h-full flex flex-col items-center justify-center min-h-[300px] text-red-500 font-bold bg-red-50 rounded-2xl p-8 border border-red-200">
                <span>{error}</span>
              </div>
            ) : (
              <div className="max-w-6xl mx-auto flex flex-col gap-6">
                
                {/* Search & Action Bar */}
                <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
                    <div className="relative w-full md:w-96">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by Name, Email or Branch..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      />
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
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 transition-all border-none outline-none cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <span>Add New Staff</span>
                    </button>
                  </div>
                  <div className="text-xs text-slate-400 font-bold">
                    Active Branches: {filteredStaff.length}
                  </div>
                </div>

                {/* Staff list cards */}
                {filteredStaff.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-bold select-none shadow-sm">
                    No office staff accounts found matching your search.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStaff.map((staff) => (
                      <div
                        key={staff._id}
                        className="bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 shadow-sm"
                      >
                        <div>
                          {/* Card Header */}
                          <div className="flex justify-between items-start mb-4 select-none">
                            <div>
                              <h3 className="font-black text-slate-800 text-base">{staff.name}</h3>
                              <span className="text-[9px] text-amber-600 font-black tracking-wider uppercase bg-amber-50 border border-amber-200 px-2 py-0.5 rounded mt-1.5 inline-block">
                                Branch: {staff.branch}
                              </span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 select-none">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-500">
                                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>

                          {/* Info Fields */}
                          <div className="flex flex-col text-slate-500 text-xs font-semibold gap-2 select-none mt-2">
                            <div className="flex">
                              <span className="w-20 flex-shrink-0 text-slate-400">Email</span>
                              <span className="truncate">: {staff.email}</span>
                            </div>
                            <div className="flex">
                              <span className="w-20 flex-shrink-0 text-slate-400">Mobile</span>
                              <span>: {staff.mobile}</span>
                            </div>
                            <div className="flex">
                              <span className="w-20 flex-shrink-0 text-slate-400">Province</span>
                              <span>: {staff.province}</span>
                            </div>
                            <div className="flex">
                              <span className="w-20 flex-shrink-0 text-slate-400">Location</span>
                              <span className="truncate">: {staff.location}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="mt-6 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold select-none">
                          <span>Staff Count: {staff.staffCount}</span>
                          <span className="text-emerald-500 font-extrabold flex items-center gap-0.5">
                            ● Active
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden transform scale-100 transition-all">
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

      <AdminFooter />
    </div>
  );
}
