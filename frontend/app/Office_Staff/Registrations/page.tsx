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

interface Registration {
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
  documents?: {
    nicFront?: string;
    nicBack?: string;
    vehicleReg?: string;
    revenueLicense?: string;
  };
  createdAt: string;
}

export default function RegistrationsPage() {
  const router = useRouter();
  const [branch, setBranch] = useState("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);

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

    async function loadRegistrations() {
      try {
        const res = await fetch(`http://localhost:5000/api/office-staff/registrations?branch=${currentBranch}`);
        if (!res.ok) {
          throw new Error("Failed to fetch registrations.");
        }
        const data = await res.json();
        setRegistrations(data.registrations || []);
      } catch (err: any) {
        console.error("Load registrations error:", err);
        setError(err.message || "Failed to load registrations.");
      } finally {
        setLoading(false);
      }
    }

    if (currentBranch) {
      loadRegistrations();
    }
  }, [router]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/office-staff/registrations/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        throw new Error(`Failed to update status to ${newStatus}`);
      }
      
      // Remove approved or rejected item from the view
      setRegistrations(prev => prev.filter(r => r._id !== id));
      if (selectedReg && selectedReg._id === id) {
        setSelectedReg(null);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update status.");
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch (e) {
      return dateStr;
    }
  };

  const formatPlate = (plate: string) => {
    if (!plate) return "-";
    const cleaned = plate.trim();
    if (cleaned.includes("-")) return cleaned.toUpperCase();
    const m = cleaned.match(/^(.*[A-Za-z]+)(\d+)$/);
    if (m) return `${m[1].trim().toUpperCase()} - ${m[2]}`;
    return cleaned.toUpperCase();
  };

  // Search filtering
  const filteredRegs = registrations.filter(r => {
    const query = searchQuery.toLowerCase();
    const matchesVehicle = r.vehicles?.some(v => 
      v.numberPlate.toLowerCase().includes(query) ||
      v.policyNumber.toLowerCase().includes(query)
    );
    return (
      r.firstName.toLowerCase().includes(query) ||
      r.lastName.toLowerCase().includes(query) ||
      r.nic.toLowerCase().includes(query) ||
      r.referenceNumber.toLowerCase().includes(query) ||
      r.email.toLowerCase().includes(query) ||
      matchesVehicle
    );
  });

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      <div className="flex flex-1 flex-row min-h-0">
        <OfficeStaffNavbar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="bg-[#f59e0b] text-white px-8 py-4 flex justify-between items-center select-none shadow-sm flex-shrink-0 h-[80px]">
            <h1 className="text-xl font-bold tracking-wide">Welcome back, {branch} Branch</h1>
            <div className="flex items-center gap-5">
              {/* Notification Bell Icon */}
              <button className="relative p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                  <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 1.65.342 3.228.96 4.658A1.875 1.875 0 0 1 18 17.25H6a1.875 1.875 0 0 1-1.71-2.842 9.06 9.06 0 0 0 .96-4.658V9ZM12 18.75a2.25 2.25 0 0 1-2.247-2.118.75.75 0 0 1 .746-.757h3a.75.75 0 0 1 .746.757A2.25 2.25 0 0 1 12 18.75Z" clipRule="evenodd" />
                </svg>
              </button>
              {/* User Avatar Icon */}
              <button className="relative p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
                  <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12c0 2.754 1.14 5.244 2.98 7.03-.028-.01-.053-.024-.082-.031a.75.75 0 0 1-.502-.879C5.556 14.931 8.193 12 12 12s6.444 2.931 7.352 6.12a.75.75 0 0 1-.502.88c-.029.007-.054.02-.082.031ZM12 11.25a3.375 3.375 0 1 0 0-6.75 3.375 3.375 0 0 0 0 6.75Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </header>

          <main className="flex-1 p-8 bg-white overflow-y-auto">
            {loading ? (
              <div className="w-full h-full flex flex-col items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f59e0b]"></div>
                <span className="mt-4 text-slate-500 font-bold">Loading registrations...</span>
              </div>
            ) : error ? (
              <div className="w-full h-full flex flex-col items-center justify-center min-h-[300px] text-red-500 font-bold bg-red-50 rounded-2xl p-8 border border-red-200">
                <span>{error}</span>
              </div>
            ) : (
              <div className="max-w-6xl mx-auto flex flex-col gap-6">
                
                {/* Title */}
                <div className="flex items-center gap-2 mb-2 select-none">
                  <h2 className="text-lg font-black text-slate-800 tracking-wide">
                    Registrations
                  </h2>
                  <span className="text-lg font-black text-slate-800">&gt;</span>
                </div>

                {/* Search Bar Row */}
                <div className="mb-2">
                  <div className="relative w-[320px]">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4 text-slate-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder=""
                      className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-300 text-slate-700 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-transparent transition-all shadow-sm"
                    />
                  </div>
                </div>

                {/* Grid Table Layout */}
                {filteredRegs.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-[20px] p-12 text-center text-slate-400 font-bold select-none shadow-sm">
                    No registrations found matching your query.
                  </div>
                ) : (
                  <div className="bg-white rounded-[20px] border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse select-none">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-sm font-black text-slate-700 select-none">
                            <th className="px-6 py-4 text-center">Name</th>
                            <th className="px-6 py-4 text-center">Vehicle</th>
                            <th className="px-6 py-4 text-center">Date</th>
                            <th className="px-6 py-4 text-center">Policy No.</th>
                            <th className="px-6 py-4 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 text-sm font-semibold">
                          {filteredRegs.map((reg) => (
                            <tr key={reg._id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 text-center">{reg.firstName} {reg.lastName}</td>
                              <td className="px-6 py-4 text-center">
                                {reg.vehicles && reg.vehicles.length > 0 ? formatPlate(reg.vehicles[0].numberPlate) : "-"}
                              </td>
                              <td className="px-6 py-4 text-center">{formatDate(reg.createdAt)}</td>
                              <td className="px-6 py-4 text-center font-bold">
                                {reg.vehicles && reg.vehicles.length > 0 ? reg.vehicles[0].policyNumber : "-"}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex justify-center items-center gap-2">
                                  <button
                                    onClick={() => handleStatusUpdate(reg._id, "Approved")}
                                    className="bg-[#10b981] hover:bg-[#0ea5e9] text-white font-extrabold text-[11px] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer focus:outline-none shadow-sm"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleStatusUpdate(reg._id, "Rejected")}
                                    className="bg-[#ef4444] hover:bg-[#dc2626] text-white font-extrabold text-[11px] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer focus:outline-none shadow-sm"
                                  >
                                    Reject
                                  </button>
                                  <button
                                    onClick={() => setSelectedReg(reg)}
                                    className="border border-slate-300 hover:bg-slate-50 text-slate-600 font-extrabold text-[11px] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer focus:outline-none shadow-sm"
                                  >
                                    View
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Pagination (decorative style from image) */}
                <div className="flex items-center justify-end gap-3 mt-4 text-slate-400 font-bold select-none text-sm">
                  <button className="hover:text-slate-600 font-extrabold cursor-pointer">&lt;</button>
                  <span className="text-slate-800 font-black">1</span>
                  <button className="hover:text-slate-600 font-extrabold cursor-pointer">&gt;</button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Floating Action Chat Button */}
      <button className="fixed bottom-24 right-8 w-14 h-14 bg-[#00ddff] hover:bg-[#00cceb] text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer z-50 group">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
          <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75 0 1.776.476 3.44 1.307 4.887L2.14 21.64a.75.75 0 0 0 .935.935l4.753-1.428A9.702 9.702 0 0 0 12 21.75c5.385 0 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-3 9.75a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm3.75 0a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm3.75 0a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Profile Details Modal */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex justify-end transition-opacity duration-300">
          <div className="w-full max-w-3xl bg-white min-h-screen shadow-2xl flex flex-col p-8 animate-slide-in">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6 select-none">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-wide">
                  {selectedReg.firstName} {selectedReg.lastName}
                </h2>
                <p className="text-xs text-slate-400 font-bold mt-1">Ref: {selectedReg.referenceNumber}</p>
              </div>
              <button
                onClick={() => setSelectedReg(null)}
                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-8 select-none">
              
              {/* Modal action shortcuts (Approve/Reject inside profile view) */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
                <span className="text-sm font-extrabold text-slate-700">Quick Actions for this registration:</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleStatusUpdate(selectedReg._id, "Approved")}
                    className="bg-[#10b981] hover:bg-[#0ea5e9] text-white font-extrabold text-xs px-4 py-2 rounded-lg transition-all cursor-pointer shadow-sm"
                  >
                    Approve Registration
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedReg._id, "Rejected")}
                    className="bg-[#ef4444] hover:bg-[#dc2626] text-white font-extrabold text-xs px-4 py-2 rounded-lg transition-all cursor-pointer shadow-sm"
                  >
                    Reject Registration
                  </button>
                </div>
              </div>

              {/* Personal Details */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
                <h3 className="col-span-2 font-black text-slate-800 text-xs tracking-wide uppercase text-amber-500 mb-2">Personal Information</h3>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">NIC Number</span>
                  <span className="text-sm font-extrabold text-slate-700">{selectedReg.nic}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Date of Birth</span>
                  <span className="text-sm font-extrabold text-slate-700">{selectedReg.dob}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mobile Number</span>
                  <span className="text-sm font-extrabold text-slate-700">{selectedReg.mobile}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Email Address</span>
                  <span className="text-sm font-extrabold text-slate-700 truncate block">{selectedReg.email}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Permanent Address</span>
                  <span className="text-sm font-extrabold text-slate-700 leading-relaxed block">
                    {selectedReg.address}, {selectedReg.city}, {selectedReg.province}
                  </span>
                </div>
              </div>

              {/* Registered Vehicles */}
              <div className="space-y-4">
                <h3 className="font-black text-slate-800 text-xs tracking-wide uppercase text-amber-500">Registered Vehicles ({selectedReg.vehicles?.length || 0})</h3>
                {selectedReg.vehicles && selectedReg.vehicles.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {selectedReg.vehicles.map((v, idx) => (
                      <div key={idx} className="border border-slate-150 rounded-xl p-5 bg-white shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                          <span className="text-sm font-black text-slate-800">{formatPlate(v.numberPlate)}</span>
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

              {/* Uploaded Documents */}
              <div className="space-y-4 pb-6">
                <h3 className="font-black text-slate-800 text-xs tracking-wide uppercase text-amber-500">Uploaded Documents</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: "nicFront", label: "NIC Front View" },
                    { key: "nicBack", label: "NIC Back View" },
                    { key: "vehicleReg", label: "Vehicle Reg Book" },
                    { key: "revenueLicense", label: "Revenue License" }
                  ].map((doc) => {
                    const docUrl = (selectedReg.documents as any)?.[doc.key];
                    return (
                      <div key={doc.key} className="border border-slate-200 rounded-xl p-4 flex flex-col items-center">
                        <span className="text-xs font-bold text-slate-500 mb-2">{doc.label}</span>
                        <div className="w-full aspect-[4/3] bg-slate-50 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center relative">
                          {docUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={docUrl}
                              alt={doc.label}
                              className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <span className="text-xs text-slate-400 italic font-semibold">No Document Uploaded</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      <OfficeStaffFooter />
    </div>
  );
}
