"use client";

import React, { useState, useEffect, Suspense } from "react";
import PolicyHolderNavbar from "@/app/Components/Policy_Holder/Navbar";
import PolicyHolderFooter from "@/app/Components/Policy_Holder/footer";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
  officer?: string;
  documentsRequested?: boolean;
  requestedDocuments?: string[];
  currentStep?: number;
  messages?: { sender: string; message: string; sentAt: string }[];
}

function TrackClaimsContent() {
  const searchParams = useSearchParams();
  const [claimId, setClaimId] = useState("");
  const [trackedClaim, setTrackedClaim] = useState<Claim | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [claimsList, setClaimsList] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(false);



  useEffect(() => {
    if (typeof window !== "undefined") {
      const loadClaims = async () => {
        setIsLoading(true);
        let userNic = "";
        
        const userStr = sessionStorage.getItem("logged_in_user");
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user.nic) userNic = user.nic;
          } catch (err) {
            console.error("Error parsing logged_in_user session", err);
          }
        }

        let databaseClaims: Claim[] = [];
        if (userNic) {
          try {
            const res = await fetch(`http://localhost:5000/api/policy-holder/user-claims?nic=${encodeURIComponent(userNic)}`);
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
            console.error("Error fetching database claims", err);
          }
        }

        let localClaims: Claim[] = [];
        try {
          const lastSubmitted = sessionStorage.getItem("last_submitted_claim");
          if (lastSubmitted) {
            const parsed = JSON.parse(lastSubmitted);
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

        const combined = [...localClaims, ...databaseClaims];
        setClaimsList(combined);

        // Check if query parameter 'id' exists
        const idParam = searchParams.get("id");
        if (idParam) {
          setClaimId(idParam);
          const found = combined.find(c => c.claimNumber.toLowerCase() === idParam.toLowerCase());
          if (found) {
            setTrackedClaim(found);
          }
          setSearchAttempted(true);
        }
        setIsLoading(false);
      };

      loadClaims();
    }
  }, [searchParams]);

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
  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = claimId.trim().toUpperCase();
    if (!cleanId) return;

    setIsLoading(true);
    setSearchAttempted(true);

    try {
      // 1. Try fetching from Backend API first
      const res = await fetch(`http://localhost:5000/api/policy-holder/track-claim?claimNumber=${encodeURIComponent(cleanId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.claim) {
          setTrackedClaim({
            claimNumber: data.claim.claimNumber,
            vehiclePlate: data.claim.vehiclePlate,
            incidentDate: formatDateString(data.claim.incidentDate),
            incidentTime: data.claim.incidentTime,
            damageType: data.claim.damageType,
            amount: data.claim.amount ? `Rs. ${Number(data.claim.amount).toLocaleString()}` : "Pending",
            status: data.claim.status || "Pending",
            description: data.claim.description,
            location: data.claim.location,
            officer: "Not Assigned",
            documentsRequested: data.claim.documentsRequested || false,
            requestedDocuments: data.claim.requestedDocuments || [],
            currentStep: data.claim.currentStep || 1,
            messages: data.claim.messages || []
          });
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error("API tracking failed, falling back to local list", err);
    }

    // 2. Fallback to current claimsList (mock claims + session drafts)
    const found = claimsList.find(
      c => c.claimNumber.toUpperCase() === cleanId
    );
    setTrackedClaim(found || null);
    setIsLoading(false);
  };
  const formatNumberPlate = (plate: string): string => {
    if (!plate) return "";
    const cleaned = plate.trim();
    if (cleaned.includes("-")) return cleaned;
    const lastNumbersMatch = cleaned.match(/^(.*[A-Za-z]+)(\d+)$/);
    if (lastNumbersMatch) {
      return `${lastNumbersMatch[1].trim().toUpperCase()}-${lastNumbersMatch[2]}`;
    }
    return cleaned;
  };

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
    <div className="min-h-screen bg-white flex flex-col font-sans relative">
      <PolicyHolderNavbar />

      {/* Curved Header */}
      <div className="max-w-7xl w-full mx-auto px-6 md:px-16 mt-8 relative">
        <div className="absolute top-0 bottom-0 left-[calc(50%-50vw)] right-6 md:right-12 bg-[url('/myclaim.png')] bg-cover bg-center rounded-r-[75px] md:rounded-r-[95px] overflow-hidden shadow-md">
          <div className="absolute inset-0 bg-slate-900/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d2a3a]/90 via-[#0d2a3a]/75 to-transparent" />
        </div>

        <header className="relative z-10 h-[210px] flex flex-col justify-center pl-4 md:pl-8 select-none">
          <h1 className="text-white text-3xl md:text-[40px] font-bold tracking-tight leading-none">
            Track Claims
          </h1>
          <p className="text-slate-200 text-xs md:text-sm font-semibold mt-3.5 tracking-wide opacity-95">
            Monitor your claim's progress in real-time
          </p>
        </header>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-16 py-10">
        
        {/* Track search form */}
        <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-4 justify-center items-center mb-10 w-full max-w-xl mx-auto">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              required
              placeholder="Enter Claim ID (e.g. CLM-2074-1487)"
              value={claimId}
              onChange={(e) => setClaimId(e.target.value)}
              className="w-full bg-[#f1f5f9] text-slate-800 rounded-full py-3.5 pl-12 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-[#00ddff] transition-all border border-slate-300 font-bold placeholder:text-slate-400 placeholder:font-medium shadow-inner"
            />
          </div>
          <button
            type="submit"
            className="w-full md:w-auto bg-[#0f2d3a] hover:bg-[#0b222c] text-white font-extrabold text-base py-3.5 px-8 rounded-full shadow-md cursor-pointer border-none transition-all duration-150 active:scale-95 whitespace-nowrap"
          >
            Track Claim
          </button>
        </form>

        {/* Tracking Output Block */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-500 font-bold text-lg">
            Searching details...
          </div>
        ) : trackedClaim ? (
          <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-[24px] shadow-lg overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="px-8 py-5 bg-slate-50 border-b border-slate-200">
              <h3 className="text-[20px] font-extrabold text-[#0f2d3a] tracking-tight leading-none">
                Tracking Details – {trackedClaim.claimNumber}
              </h3>
            </div>

            {/* Tracker Panel */}
            <div className="p-8 flex flex-col">
              
              {/* Progress wizard */}
              {renderClaimProgress(trackedClaim.status, trackedClaim.currentStep)}

              {/* 2-Column Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5 text-[15px] font-semibold text-slate-700 mb-8 px-2 border-b border-slate-100 pb-8">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">Vehicle:</span>
                  <span className="font-extrabold text-slate-800">{formatNumberPlate(trackedClaim.vehiclePlate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">Type:</span>
                  <span className="font-extrabold text-slate-800">{trackedClaim.damageType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">Est. Amount:</span>
                  <span className="font-extrabold text-slate-800">
                    {trackedClaim.amount.startsWith("Rs.") ? "LKR " + trackedClaim.amount.substring(4) : trackedClaim.amount}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">Date:</span>
                  <span className="font-extrabold text-slate-800">{trackedClaim.incidentDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">Officer:</span>
                  <span className="font-extrabold text-slate-800">{trackedClaim.officer || "Agent Saman"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">Location:</span>
                  <span className="font-extrabold text-slate-800">{trackedClaim.location || "N/A"}</span>
                </div>
              </div>

              {/* Incident description */}
              {trackedClaim.description && (
                <div className="px-2 mb-6">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">Description</p>
                  <p className="text-slate-600 text-sm font-medium leading-relaxed italic bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    "{trackedClaim.description}"
                  </p>
                </div>
              )}

              {/* Warning Alert Box */}
              {trackedClaim.documentsRequested && (
                <div className="bg-[#ffeaea]/80 border border-[#ffd1d1] rounded-[20px] p-6">
                  <h4 className="text-[#9c3535] font-extrabold text-sm mb-1.5">Documents Requested</h4>
                  <p className="text-[#aa4f4f] text-[13px] font-semibold leading-relaxed mb-3">
                    The following documents have been requested by staff to process your claim. Please upload them via the Documents section:
                  </p>
                  <ul className="list-none flex flex-col gap-2 mb-4 pl-1">
                    {(trackedClaim.requestedDocuments && trackedClaim.requestedDocuments.length > 0
                      ? trackedClaim.requestedDocuments
                      : ["Police Report", "Repair Estimate"]
                    ).map((doc) => (
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

              {/* Messages & Notifications Section */}
              <div className="px-2 mt-6">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 select-none">Messages & Notifications</p>
                {trackedClaim.messages && trackedClaim.messages.length > 0 ? (
                  <div className="flex flex-col gap-2.5 max-h-[160px] overflow-y-auto pr-1">
                    {trackedClaim.messages.map((msg: any, index: number) => (
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
                ) : (
                  <p className="text-slate-500 text-xs italic font-medium bg-slate-50 border border-slate-100 rounded-xl p-3 m-0 select-none">
                    No notifications or messages have been sent for this claim.
                  </p>
                )}
              </div>

            </div>
          </div>
        ) : searchAttempted ? (
          <div className="text-center py-12 text-red-500 font-bold bg-red-50/20 border border-red-100 rounded-3xl max-w-md mx-auto animate-pulse">
            No claim found with ID "{claimId}". Please verify your reference number.
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400 font-semibold max-w-md mx-auto select-none">
            <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
            </svg>
            Enter your Claim ID in the search bar above to track your claim's status.
          </div>
        )}

      </main>

      <PolicyHolderFooter />
    </div>
  );
}

export default function TrackClaims() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex flex-col font-sans relative">
        <PolicyHolderNavbar />
        <main className="flex-1 flex items-center justify-center font-bold text-slate-500 text-lg">
          Loading tracking...
        </main>
        <PolicyHolderFooter />
      </div>
    }>
      <TrackClaimsContent />
    </Suspense>
  );
}
