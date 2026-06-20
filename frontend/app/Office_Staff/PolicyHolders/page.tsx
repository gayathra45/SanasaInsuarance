"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OfficeStaffNavbar from "@/app/Components/Office Staff/Navbar";
import OfficeStaffFooter from "@/app/Components/Office Staff/Footer";

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

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  nic: string;
  mobile: string;
  email: string;
  dob: string;
  address: string;
  province: string;
  city: string;
  branch: string;
  referenceNumber: string;
  vehicles?: Vehicle[];
  createdAt: string;
}

export default function PolicyHoldersPage() {
  const router = useRouter();
  const [branch, setBranch] = useState("");
  const [policyHolders, setPolicyHolders] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHolder, setSelectedHolder] = useState<User | null>(null);

  useEffect(() => {
    let currentBranch = "";
    if (typeof window !== "undefined") {
      const savedStaff = sessionStorage.getItem("logged_in_staff");
      if (!savedStaff) {
        router.push("/Login");
        return;
      }
      try {
        const staffObj = JSON.parse(savedStaff);
        if (staffObj && staffObj.branch) {
          currentBranch = staffObj.branch;
          setBranch(currentBranch);
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

    async function loadPolicyHolders() {
      try {
        const res = await fetch(`http://localhost:5000/api/office-staff/policy-holders?branch=${currentBranch}`);
        if (!res.ok) {
          throw new Error("Failed to fetch policy holders.");
        }
        const data = await res.json();
        setPolicyHolders(data.policyHolders || []);
      } catch (err: any) {
        console.error("Load policy holders error:", err);
        setError(err.message || "Failed to load policy holders.");
      } finally {
        setLoading(false);
      }
    }

    if (currentBranch) {
      loadPolicyHolders();
    }
  }, [router]);

  // Search filter matching name or NIC or reference number
  const filteredHolders = policyHolders.filter((holder) => {
    const query = searchQuery.toLowerCase();
    const fullName = `${holder.firstName} ${holder.lastName}`.toLowerCase();
    return (
      fullName.includes(query) ||
      holder.nic.toLowerCase().includes(query) ||
      holder.referenceNumber.toLowerCase().includes(query) ||
      holder.email.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <div className="flex flex-1 flex-row min-h-0">
        <OfficeStaffNavbar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-[#f59e0b] text-white px-8 py-4 flex justify-between items-center select-none shadow-sm flex-shrink-0 h-[80px]">
            <h1 className="text-xl font-bold tracking-wide">{branch} Branch — Policy Holders Directory</h1>
            <div className="text-sm font-semibold bg-white/10 px-4 py-1.5 rounded-full">
              Staff Portal
            </div>
          </header>

          <main className="flex-1 p-8 bg-slate-50 overflow-y-auto">
            {loading ? (
              <div className="w-full h-full flex flex-col items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f59e0b]"></div>
                <span className="mt-4 text-slate-500 font-bold">Loading policy holders...</span>
              </div>
            ) : error ? (
              <div className="w-full h-full flex flex-col items-center justify-center min-h-[300px] text-red-500 font-bold bg-red-50 rounded-2xl p-8 border border-red-200">
                <span>{error}</span>
              </div>
            ) : (
              <div className="max-w-6xl mx-auto flex flex-col gap-6">
                
                {/* Search Bar */}
                <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
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
                      placeholder="Search by Name, NIC, Reference No..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="text-xs text-slate-400 font-bold">
                    Active Clients: {filteredHolders.length}
                  </div>
                </div>

                {/* Directory List */}
                {filteredHolders.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-bold select-none shadow-sm">
                    No policy holders found matching your search.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredHolders.map((holder) => (
                      <div
                        key={holder._id}
                        onClick={() => setSelectedHolder(holder)}
                        className="bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-sm relative"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-4 select-none">
                            <div>
                              <h3 className="font-black text-slate-800 text-base">
                                {holder.firstName} {holder.lastName}
                              </h3>
                              <span className="text-[10px] text-slate-400 font-black tracking-wider uppercase bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">
                                Ref: {holder.referenceNumber}
                              </span>
                            </div>
                            <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-black px-2 py-0.5 rounded">
                              {holder.vehicles?.length || 0} Vehicle(s)
                            </span>
                          </div>

                          <div className="flex flex-col text-slate-500 text-xs font-semibold gap-2 select-none">
                            <div className="flex">
                              <span className="w-20 flex-shrink-0 text-slate-400">NIC</span>
                              <span>: {holder.nic}</span>
                            </div>
                            <div className="flex">
                              <span className="w-20 flex-shrink-0 text-slate-400">Mobile</span>
                              <span>: {holder.mobile}</span>
                            </div>
                            <div className="flex">
                              <span className="w-20 flex-shrink-0 text-slate-400">Email</span>
                              <span>: {holder.email}</span>
                            </div>
                            <div className="flex">
                              <span className="w-20 flex-shrink-0 text-slate-400">City</span>
                              <span>: {holder.city}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                          <span className="text-amber-500 font-extrabold text-xs group-hover:underline flex items-center gap-1 select-none">
                            View Vehicles & Profile <span className="font-extrabold">&gt;</span>
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

      {/* Policy Holder Profile Drawer / Modal */}
      {selectedHolder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex justify-end transition-opacity duration-300">
          <div className="w-full max-w-2xl bg-white min-h-screen shadow-2xl flex flex-col p-8 animate-slide-in">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6 select-none">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-wide">
                  {selectedHolder.firstName} {selectedHolder.lastName}
                </h2>
                <p className="text-xs text-slate-400 font-bold mt-1">Reference ID: {selectedHolder.referenceNumber}</p>
              </div>
              <button
                onClick={() => setSelectedHolder(null)}
                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 select-none">
              
              {/* Profile details */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
                <h3 className="col-span-2 font-black text-slate-800 text-xs tracking-wide uppercase text-amber-500 mb-2">Policy Holder Profile</h3>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">NIC Number</span>
                  <span className="text-sm font-extrabold text-slate-700">{selectedHolder.nic}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Date of Birth</span>
                  <span className="text-sm font-extrabold text-slate-700">{selectedHolder.dob}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mobile Number</span>
                  <span className="text-sm font-extrabold text-slate-700">{selectedHolder.mobile}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Email Address</span>
                  <span className="text-sm font-extrabold text-slate-700 truncate block">{selectedHolder.email}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Address Details</span>
                  <span className="text-sm font-extrabold text-slate-700 leading-relaxed block">
                    {selectedHolder.address}, {selectedHolder.city}, {selectedHolder.province} (Branch: {selectedHolder.branch})
                  </span>
                </div>
              </div>

              {/* Registered Vehicles */}
              <div className="space-y-4 pb-6">
                <h3 className="font-black text-slate-800 text-xs tracking-wide uppercase text-amber-500">Registered Vehicles ({selectedHolder.vehicles?.length || 0})</h3>
                {selectedHolder.vehicles && selectedHolder.vehicles.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {selectedHolder.vehicles.map((v, idx) => (
                      <div key={idx} className="border border-slate-150 rounded-xl p-5 bg-white shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                          <span className="text-sm font-black text-slate-800">{v.numberPlate}</span>
                          <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                            {v.vehicleType}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-500">
                          <div>
                            <span className="text-slate-400">Make/Model:</span> {v.company} {v.model} ({v.year})
                          </div>
                          <div>
                            <span className="text-slate-400">Policy No:</span> <strong className="text-slate-700">{v.policyNumber}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Engine No:</span> {v.engineNumber}
                          </div>
                          <div>
                            <span className="text-slate-400">Chassis No:</span> {v.chassisNumber}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-slate-200 border-dashed rounded-xl p-6 text-center text-slate-400 italic text-sm">
                    No registered vehicles found for this profile.
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      <OfficeStaffFooter />
    </div>
  );
}
