"use client";

import React, { useState, useEffect } from "react";
import PolicyHolderNavbar from "@/app/Components/Policy_Holder/Navbar";
import PolicyHolderFooter from "@/app/Components/Policy_Holder/footer";
import Link from "next/link";
import { API_URL } from "@/app/config";

interface Claim {
  claimNumber: string;
  vehiclePlate: string;
  incidentDate: string;
  incidentTime?: string;
  damageType: string;
  amount: string;
  status: string;
  description?: string;
  location?: string;
  createdAt?: string;
  officer?: string;
  documentsRequested?: boolean;
  requestedDocuments?: string[];
  documentRequestTo?: string;
  currentStep?: number;
  messages?: { sender: string; message: string; sentAt: string; recipient?: string }[];
}

export default function MyClaims() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getUserRequestedDocs = (claim: Claim): string[] => {
    const getRecipientForDoc = (name: string) => {
      const msg = [...(claim.messages || [])]
        .reverse()
        .find(m => m.message.includes(`Requested: ${name}`));
      if (msg) {
        if (msg.message.includes("[Document Request to Agent]")) return "Agent";
        if (msg.message.includes("[Document Request to User]")) return "User";
      }
      return claim.documentRequestTo || "User";
    };
    return (claim.requestedDocuments || []).filter(name => getRecipientForDoc(name) === "User");
  };


  useEffect(() => {
    if (typeof window !== "undefined") {
      const fetchClaims = async () => {
        setIsLoading(true);
        let userNic = "";
        
        // 1. Get Logged In User NIC
        const userStr = sessionStorage.getItem("logged_in_user");
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user.nic) {
              userNic = user.nic;
            }
          } catch (err) {
            console.error("Error parsing logged_in_user session", err);
          }
        }

        let databaseClaims: Claim[] = [];

        // 2. Fetch Claims from MongoDB API (if NIC exists)
        if (userNic) {
          try {
            const res = await fetch(`${API_URL}/policy-holder/user-claims?nic=${encodeURIComponent(userNic)}`);
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data.claims)) {
                databaseClaims = data.claims.map((claim: any) => ({
                  claimNumber: claim.claimNumber,
                  vehiclePlate: claim.vehiclePlate,
                  incidentDate: formatDateString(claim.incidentDate),
                  incidentTime: claim.incidentTime,
                  damageType: claim.damageType,
                  amount: claim.amount ? `Rs. ${Number(claim.amount).toLocaleString()}` : "Pending",
                  status: claim.status || "Pending",
                  description: claim.description,
                  location: claim.location,
                  officer: "Not Assigned",
                  documentsRequested: claim.documentsRequested || false,
                  requestedDocuments: claim.requestedDocuments || [],
                  currentStep: claim.currentStep || 1,
                  messages: claim.messages || []
                }));
              }
            }
          } catch (err) {
            console.error("Error fetching claims from backend API", err);
          }
        }

        // 3. Fallback to check if a claim was recently submitted in current session
        let localClaims: Claim[] = [];
        try {
          const lastSubmitted = sessionStorage.getItem("last_submitted_claim");
          if (lastSubmitted) {
            const parsed = JSON.parse(lastSubmitted);
            // Verify if it is already in database claims to prevent duplication
            const exists = databaseClaims.some(c => c.claimNumber === parsed.claimNumber);
            if (!exists) {
              localClaims.push({
                claimNumber: parsed.claimNumber,
                vehiclePlate: parsed.vehiclePlate,
                incidentDate: formatDateString(parsed.incidentDate),
                incidentTime: parsed.incidentTime,
                damageType: parsed.damageType,
                amount: "Pending",
                status: "Pending",
                description: parsed.description,
                location: parsed.location,
                officer: "Not Assigned",
                documentsRequested: false,
                requestedDocuments: [],
                currentStep: 1,
                messages: []
              });
            }
          }
        } catch (err) {
          console.error("Error parsing local claim draft", err);
        }

        // 4. Combine recently submitted claims with database claims
        setClaims([...localClaims, ...databaseClaims]);
        setIsLoading(false);
      };

      fetchClaims();
    }
  }, []);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (selectedClaim) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedClaim]);

  // Format YYYY-MM-DD to "DD MMM YYYY" (e.g. "12 Jan 2026")
  const formatDateString = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch (e) {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("pending") || s.includes("progress")) {
      return (
        <span className="text-orange-500 bg-orange-50/45 border border-orange-300 rounded-full px-4 py-1 text-center font-bold text-[13px] inline-block min-w-[95px] select-none">
          Pending
        </span>
      );
    }
    if (s.includes("review") || s.includes("submit")) {
      return (
        <span className="text-blue-500 bg-blue-50/45 border border-blue-300 rounded-full px-4 py-1 text-center font-bold text-[13px] inline-block min-w-[95px] select-none">
          Review
        </span>
      );
    }
    if (s.includes("approved") || s.includes("active") || s.includes("done")) {
      return (
        <span className="text-green-500 bg-green-50/45 border border-green-300 rounded-full px-4 py-1 text-center font-bold text-[13px] inline-block min-w-[95px] select-none">
          Approved
        </span>
      );
    }
    // Fallback default badge
    return (
      <span className="text-slate-500 bg-slate-50/45 border border-slate-300 rounded-full px-4 py-1 text-center font-bold text-[13px] inline-block min-w-[95px] select-none">
        {status}
      </span>
    );
  };

  // Format license plates: e.g. CBH3202 -> CBH-3202
  const formatNumberPlate = (plate: string): string => {
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
  };

  // Filter claims based on search query
  const filteredClaims = claims.filter(
    (claim) =>
      claim.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.damageType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans relative">
      <PolicyHolderNavbar />

      {/* Styled curved header matching the mockup exactly */}
      <div className="max-w-7xl w-full mx-auto px-6 md:px-16 mt-8 relative">
        {/* Absolute positioned background banner spanning to left edge of screen */}
        <div className="absolute top-0 bottom-0 left-[calc(50%-50vw)] right-6 md:right-12 bg-[url('/myclaim.png')] bg-cover bg-center rounded-r-[75px] md:rounded-r-[95px] overflow-hidden shadow-md">
          {/* Mockup dark slate overlay */}
          <div className="absolute inset-0 bg-slate-900/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d2a3a]/90 via-[#0d2a3a]/75 to-transparent" />
        </div>

        {/* Text content aligned automatically with the page container */}
        <header className="relative z-10 h-[210px] flex flex-col justify-center pl-4 md:pl-8 select-none">
          <h1 className="text-white text-3xl md:text-[40px] font-bold tracking-tight leading-none">
            My Claims
          </h1>
          <p className="text-slate-200 text-xs md:text-sm font-semibold mt-3.5 tracking-wide opacity-95">
            All your insurance claims
          </p>
        </header>
      </div>

      {/* Main Table Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-16 py-10">
        
        {/* Premium Search Bar */}
        <div className="flex justify-start mb-8 select-none">
          <div className="relative w-full max-w-[420px] bg-slate-50 hover:bg-white focus-within:bg-white border border-slate-200 rounded-full pl-5 pr-2.5 py-2 flex items-center gap-3 transition-all duration-200 shadow-sm focus-within:shadow-md focus-within:border-[#0284c7] focus-within:ring-4 focus-within:ring-[#0284c7]/10">
            <span className="text-slate-400 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search claims by ID, vehicle, type, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-slate-800 text-[15px] placeholder-slate-400 focus:outline-none font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <button
              type="button"
              className="bg-[#0284c7] hover:bg-[#0275a1] active:scale-95 text-white py-2 px-5 rounded-full text-xs font-bold transition-all duration-150 border-none cursor-pointer flex items-center justify-center shadow-md shadow-[#0284c7]/20"
            >
              Search
            </button>
          </div>
        </div>

        {/* Table Container Card */}
        <div className="bg-white border border-slate-200 rounded-[30px] shadow-sm overflow-hidden mb-10">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-[#e2e8f0]/60">
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-4.5 text-center text-base font-extrabold text-slate-800 whitespace-nowrap">Claim ID</th>
                  <th className="px-6 py-4.5 text-center text-base font-extrabold text-slate-800 whitespace-nowrap">Vehicle</th>
                  <th className="px-6 py-4.5 text-center text-base font-extrabold text-slate-800 whitespace-nowrap">Date</th>
                  <th className="px-6 py-4.5 text-center text-base font-extrabold text-slate-800 whitespace-nowrap">Type</th>
                  <th className="px-6 py-4.5 text-center text-base font-extrabold text-slate-800 whitespace-nowrap">Amount</th>
                  <th className="px-6 py-4.5 text-center text-base font-extrabold text-slate-800 whitespace-nowrap">Status</th>
                  <th className="px-6 py-4.5 text-center text-base font-extrabold text-slate-800 whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-500 font-bold">
                      Loading your claims...
                    </td>
                  </tr>
                ) : filteredClaims.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-500 font-bold">
                      No claims found.
                    </td>
                  </tr>
                ) : (
                  filteredClaims.map((claim) => (
                    <tr key={claim.claimNumber} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4.5 text-sm text-slate-700 font-medium whitespace-nowrap">{claim.claimNumber}</td>
                      <td className="px-6 py-4.5 text-sm text-slate-700 font-medium whitespace-nowrap">{formatNumberPlate(claim.vehiclePlate)}</td>
                      <td className="px-6 py-4.5 text-sm text-slate-700 font-medium whitespace-nowrap">{claim.incidentDate}</td>
                      <td className="px-6 py-4.5 text-sm text-slate-700 font-medium whitespace-nowrap">{claim.damageType}</td>
                      <td className="px-6 py-4.5 text-sm text-slate-700 font-medium text-center whitespace-nowrap">{claim.amount}</td>
                      <td className="px-6 py-4.5 text-sm text-slate-700 font-medium text-center whitespace-nowrap">{getStatusBadge(claim.status)}</td>
                      <td className="px-6 py-4.5 text-sm text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedClaim(claim)}
                          className="border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold py-1 px-4.5 rounded-lg transition-all shadow-sm cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Floating Chat Support Bubble matching the mockup */}
      <button
        type="button"
        className="fixed bottom-8 right-8 z-40 bg-[#00ddff] hover:bg-[#00c8e6] text-white p-4.5 rounded-full shadow-2xl transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer focus:outline-none border-none flex items-center justify-center"
        aria-label="Chat support"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2.1 21.5l4.63-.827A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-3.5 11a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3.5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3.5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Claim Detail Modal Popup */}
      {selectedClaim && (() => {
        const renderClaimProgress = (status: string, dbStep?: number) => {
          let currentStep = dbStep || 1;
          if (!dbStep) {
            const s = status.toLowerCase();
            if (s.includes("pending") || s.includes("progress")) {
              currentStep = 3;
            } else if (s.includes("review")) {
              currentStep = 4;
            } else if (s.includes("approved") || s.includes("active") || s.includes("done")) {
              currentStep = 6;
            }
          }

          const steps = [
            { num: "01", label: "Submitted" },
            { num: "02", label: "Assigned" },
            { num: "03", label: "Inspection" },
            { num: "04", label: "Review" },
            { num: "05", label: "Decision" },
            { num: "06", label: "Payment" }
          ];

          const progressPercent = ((currentStep - 1) / (steps.length - 1)) * 100;

          return (
            <div className="bg-[#f8fafc] border border-slate-100 rounded-[24px] pt-6 pb-5 px-8 mb-8 flex justify-between items-center relative select-none w-full max-w-[540px] mx-auto shadow-sm">
              {/* Background Grey Line */}
              <div className="absolute top-[40px] left-[52px] right-[52px] h-[3px] bg-slate-200 z-0" />
              
              {/* Active Green Line */}
              <div
                className="absolute top-[40px] left-[52px] h-[3px] bg-[#00b050] z-0 transition-all duration-300"
                style={{ width: `calc((100% - 104px) * ${currentStep - 1} / 5)` }}
              />

              {steps.map((step, idx) => {
                const stepNum = idx + 1;
                const isCompleted = stepNum < currentStep;
                const isActive = stepNum === currentStep;

                let circleClass = "";
                if (isCompleted) {
                  circleClass = "border-[#00b050] text-[#00b050] bg-white";
                } else if (isActive) {
                  circleClass = "border-blue-500 text-blue-500 bg-[#e8f0fe]";
                } else {
                  circleClass = "border-slate-300 text-slate-400 bg-white";
                }

                return (
                  <div key={step.num} className="flex flex-col items-center z-10 flex-1">
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-[14px] font-extrabold ${circleClass}`}>
                      {step.num}
                    </div>
                    <span className={`text-[11px] font-bold mt-2 leading-none ${isActive ? "text-blue-600 font-extrabold" : isCompleted ? "text-slate-800" : "text-slate-400"}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        };

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
            <div className="bg-white border border-slate-200 rounded-[24px] w-full max-w-[720px] max-h-[90vh] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col relative animate-fade-in overflow-hidden">
              
              {/* Modal Header Title */}
              <div className="flex justify-between items-center px-8 pt-6 pb-4 border-b border-slate-200 flex-shrink-0">
                <h2 className="text-[22px] font-extrabold text-[#0f2d3a] tracking-tight leading-none">
                  Claim Details – {selectedClaim.claimNumber}
                </h2>
                <button
                  onClick={() => setSelectedClaim(null)}
                  className="text-slate-400 hover:text-slate-600 text-2xl font-bold border-none bg-transparent cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8 flex-1 overflow-y-auto">
                
                {/* Dynamic Tracker Wizard */}
                {renderClaimProgress(selectedClaim.status, selectedClaim.currentStep)}

                {/* 2-Column Grid matching mockup inline labels */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-5 text-[15px] font-semibold text-slate-700 mb-6 px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold w-28 shrink-0">Vehicle:</span>
                    <span className="font-extrabold text-slate-800">{formatNumberPlate(selectedClaim.vehiclePlate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold w-28 shrink-0">Type:</span>
                    <span className="font-extrabold text-slate-800">{selectedClaim.damageType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold w-28 shrink-0">Est. Amount:</span>
                    <span className="font-extrabold text-slate-800">
                      {selectedClaim.amount.startsWith("Rs.") ? "LKR " + selectedClaim.amount.substring(4) : selectedClaim.amount}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold w-28 shrink-0">Date:</span>
                    <span className="font-extrabold text-slate-800">{selectedClaim.incidentDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold w-28 shrink-0">Officer:</span>
                    <span className="font-extrabold text-slate-800">{selectedClaim.officer || "Agent Saman"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold w-28 shrink-0">Location:</span>
                    <span className="font-extrabold text-slate-800">{selectedClaim.location || "N/A"}</span>
                  </div>
                </div>

                {/* Description Text (If available) */}
                {selectedClaim.description && (
                  <div className="px-2 mb-6">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Incident Description</p>
                    <p className="text-slate-600 text-sm font-medium leading-relaxed italic bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      "{selectedClaim.description}"
                    </p>
                  </div>
                )}
                {/* Messages & Notifications Section */}
                <div className="px-2 mt-4 mb-2">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 select-none">Messages & Notifications</p>
                  {(() => {
                    const filteredMessages = (selectedClaim.messages || []).filter((msg: any) => msg.recipient !== "Agent");
                    if (filteredMessages.length > 0) {
                      return (
                        <div className="flex flex-col gap-2.5 max-h-[140px] overflow-y-auto pr-1">
                          {filteredMessages.map((msg: any, index: number) => (
                            <div key={index} className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3.5 flex flex-col gap-1 shadow-sm">
                              <div className="flex justify-between items-center text-[11px] select-none">
                                <span className="font-extrabold text-[#0f2d3a]">{msg.sender}</span>
                                <span className="text-slate-400 font-semibold">{formatDateString(msg.sentAt)}</span>
                              </div>
                              <p className="text-slate-700 text-xs font-semibold leading-relaxed m-0">
                                {msg.message}
                              </p>
                            </div>
                          ))}
                        </div>
                      );
                    } else {
                      return (
                        <p className="text-slate-500 text-xs italic font-medium bg-slate-50 border border-slate-100 rounded-xl p-3 m-0 select-none">
                          No notifications or messages have been sent for this claim.
                        </p>
                      );
                    }
                  })()}
                </div>

                {/* Warning Alert Box matching mockup */}
                {selectedClaim.documentsRequested && getUserRequestedDocs(selectedClaim).length > 0 && (
                  <div className="bg-[#ffeaea]/80 border border-[#ffd1d1] rounded-[20px] p-6 mb-2 mt-4">
                    <h4 className="text-[#9c3535] font-extrabold text-sm mb-1.5">Documents Requested</h4>
                    <p className="text-[#aa4f4f] text-[13px] font-semibold leading-relaxed mb-3">
                      The following documents have been requested by staff to process your claim. Please upload them via the Documents section:
                    </p>
                    <ul className="list-none flex flex-col gap-2 mb-4 pl-1">
                      {getUserRequestedDocs(selectedClaim).map((doc) => (
                        <li key={doc} className="flex items-center gap-2 text-[#aa4f4f] font-bold text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#df3d3d] flex-shrink-0" />
                          <span>{doc}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/Policy_Holder/Documents"
                      className="inline-block bg-[#df3d3d] hover:bg-[#c53030] text-white font-extrabold text-xs px-6 py-2.5 rounded-full transition-all duration-150 no-underline shadow-sm cursor-pointer border-none text-center"
                    >
                      Go to Documents
                    </Link>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex justify-end flex-shrink-0">
                <button
                  onClick={() => setSelectedClaim(null)}
                  className="bg-[#1a365d] hover:bg-[#0f223f] text-white font-extrabold text-[14px] px-8 py-2.5 rounded-full transition-all border-none cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      <PolicyHolderFooter />
    </div>
  );
}
