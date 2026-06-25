"use client";

import React, { useState, useEffect } from "react";
import PolicyHolderNavbar from "@/app/Components/Policy_Holder/Navbar";
import PolicyHolderFooter from "@/app/Components/Policy_Holder/footer";
import Link from "next/link";
import { API_URL } from "@/app/config";

function formatNumberPlate(plate: string): string {
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
}

function getVehicleIconSvg(type: string, className = "w-9 h-9 text-black") {
  if (!type) type = "car";
  const t = type.toLowerCase().trim();
  
  if (t.includes("suv")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12h20M17 17h3a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3L14 4H6L3 7v8a2 2 0 0 0 2 2h3" />
        <circle cx="7" cy="17" r="2" />
        <path d="M9 17h6" />
        <circle cx="17" cy="17" r="2" />
        <path d="M7 7h6M19 10h-3" />
      </svg>
    );
  }
  if (t.includes("cab") || t.includes("pickup")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 13h13V8H7L4 11H2v2zm13 0h7V10h-7v3z" />
        <path d="M2 13v3a1 1 0 0 0 1 1h3" />
        <path d="M9 17h6" />
        <path d="M19 17h2a1 1 0 0 0 1-1v-3" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    );
  }
  if (t.includes("van") || t.includes("minibus")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 15V7a2 2 0 0 1 2-2h12l5 3v7a2 2 0 0 1-2 2h-1" />
        <path d="M2 15h3" />
        <path d="M9 17h6" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
        <path d="M6 8h4v3H6V8zm6 0h3v3h-3V8z" />
      </svg>
    );
  }
  if (t.includes("bike") || t.includes("motorcycle") || t.includes("scooter")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5" cy="16" r="3" />
        <circle cx="19" cy="16" r="3" />
        <path d="M5 16h8l3-7H9l-2 3M16 9h3M12 9l-3-4H6" />
      </svg>
    );
  }
  if (t.includes("three") || t.includes("rickshaw") || t.includes("tuk")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
        <path d="M3 18h1c.5 0 .9-.4 1-1l1-6h11c.6 0 1-.4 1-1V5h-3l-2 3H8L6 11H3v7z" />
        <path d="M12 11v7M15 11v7" />
      </svg>
    );
  }
  if (t.includes("lorry") || t.includes("truck")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 18H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h11v13zm0-8h7l2 3v5a1 1 0 0 1-1 1h-8v-9z" />
        <circle cx="6" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </svg>
    );
  }
  if (t.includes("bus")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 15V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v9M2 15h20v1a2 2 0 0 1-2 2h-1M5 18H3" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
        <path d="M4 7h3v3H4V7zm5 0h3v3H9V7zm5 0h3v3h-3V7zm5 0h2v3h-2V7z" />
      </svg>
    );
  }
  if (t.includes("tractor")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="17" r="2.5" />
        <circle cx="17" cy="15" r="4.5" />
        <path d="M6 17h6v-2h-3v-4h4v5" />
        <path d="M12.5 15.5h.5M9 11l-3-4H4" />
      </svg>
    );
  }
  
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.8C2.1 11 2 11.3 2 11.5V16c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}

function getVehicleIconContainer(type: string) {
  const svg = getVehicleIconSvg(type);
  return (
    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white border-2 border-black text-black shadow-sm flex-shrink-0 select-none">
      {svg}
    </div>
  );
}


export default function PolicyHolderHome() {
  const [userName, setUserName] = useState("");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [pendingClaimsCount, setPendingClaimsCount] = useState(0);
  const [hasDocumentRequest, setHasDocumentRequest] = useState(false);
  const [totalClaimsCount, setTotalClaimsCount] = useState(0);
  const [approvedClaimsCount, setApprovedClaimsCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedVehicleForModal, setSelectedVehicleForModal] = useState<any | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleDownloadCoverNote = (vehicle: any) => {
    triggerToast(`Generating insurance certificate for ${formatNumberPlate(vehicle.numberPlate)}...`);
    setTimeout(() => {
      const element = document.createElement("a");
      const file = new Blob([
        `SANASA GENERAL INSURANCE COMPANY LIMITED\n`,
        `POLICY CERTIFICATE / COVER NOTE\n`,
        `========================================\n`,
        `Policy Number: ${vehicle.policyNumber}\n`,
        `Vehicle Number Plate: ${formatNumberPlate(vehicle.numberPlate)}\n`,
        `Vehicle Type: ${vehicle.vehicleType}\n`,
        `Make & Model: ${vehicle.company} ${vehicle.model} (${vehicle.year})\n`,
        `Engine Number: ${vehicle.engineNumber}\n`,
        `Chassis Number: ${vehicle.chassisNumber}\n`,
        `Coverage Status: ACTIVE\n`,
        `Validity Period: 2026-01-01 to 2026-12-31\n`,
        `Authorized Signature: Sanasa General Insurance Co. LTD.`
      ], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `Sanasa_Policy_${vehicle.numberPlate}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      triggerToast(`Successfully downloaded Cover Note for ${formatNumberPlate(vehicle.numberPlate)}!`);
    }, 1200);
  };

  useEffect(() => {
    if (selectedVehicleForModal || selectedClaim) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedVehicleForModal, selectedClaim]);

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

  const getUserRequestedDocs = (claim: any): string[] => {
    const getRecipientForDoc = (name: string) => {
      const msg = [...(claim.messages || [])]
        .reverse()
        .find((m: any) => m.message.includes(`Requested: ${name}`));
      if (msg) {
        if (msg.message.includes("[Document Request to Agent]")) return "Agent";
        if (msg.message.includes("[Document Request to User]")) return "User";
      }
      return claim.documentRequestTo || "User";
    };
    return (claim.requestedDocuments || []).filter((name: string) => getRecipientForDoc(name) === "User");
  };

  const getDocRequestNote = (claim: any, docName: string): string => {
    if (!claim.messages) return "";
    const msg = [...claim.messages]
      .reverse()
      .find((m: any) => m.message && m.message.includes(`Requested: ${docName}`));
    if (msg && msg.message) {
      const idx = msg.message.indexOf("Message:");
      if (idx !== -1) {
        return msg.message.substring(idx + 8).trim();
      }
    }
    return "";
  };

  const formatDateTimeString = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()} ${hours}:${minutes}`;
    } catch (e) {
      return dateStr;
    }
  };

  const getDocRequestTime = (claim: any, docName: string): string => {
    if (!claim.messages) return "";
    const msg = [...claim.messages]
      .reverse()
      .find((m: any) => m.message && m.message.includes(`Requested: ${docName}`));
    if (msg && msg.sentAt) {
      return formatDateTimeString(msg.sentAt);
    }
    return "";
  };

  const getDocRequestSender = (claim: any, docName: string): string => {
    if (!claim.messages) return "Office Staff";
    const msg = [...claim.messages]
      .reverse()
      .find((m: any) => m.message && m.message.includes(`Requested: ${docName}`));
    return msg ? (msg.sender || "Office Staff") : "Office Staff";
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = sessionStorage.getItem("logged_in_user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.firstName) {
            setUserName(user.firstName);
          }
          if (user.vehicles && Array.isArray(user.vehicles)) {
            setVehicles(user.vehicles);
          }

          if (user.nic) {
            const fetchClaims = async () => {
              try {
                const res = await fetch(`${API_URL}/policy-holder/user-claims?nic=${encodeURIComponent(user.nic)}`, {
                  cache: "no-store"
                });
                let dbClaims: any[] = [];
                if (res.ok) {
                  const data = await res.json();
                  if (Array.isArray(data.claims)) {
                    dbClaims = data.claims;
                  }
                }

                // Check for local session submitted claims
                let localClaims: any[] = [];
                const lastSubmitted = sessionStorage.getItem("last_submitted_claim");
                if (lastSubmitted) {
                  const parsed = JSON.parse(lastSubmitted);
                  const exists = dbClaims.some(c => c.claimNumber === parsed.claimNumber);
                  if (!exists) {
                    localClaims.push(parsed);
                  }
                }

                const allClaims = [...localClaims, ...dbClaims];

                // A claim is pending if status is not approved, done, or rejected
                const pendingClaims = allClaims.filter(c => {
                  const s = (c.status || "Pending").toLowerCase();
                  return !["approved", "done", "rejected"].some(val => s.includes(val));
                });

                const approvedClaims = allClaims.filter(c => {
                  const s = (c.status || "").toLowerCase();
                  return ["approved", "done", "active"].some(val => s.includes(val));
                });

                const docRequest = allClaims.some(c => c.documentsRequested === true);

                // Compile dynamic notifications list
                const compiledNotifications: any[] = [];
                allClaims.forEach((claim: any) => {
                  if (claim.documentsRequested) {
                    compiledNotifications.push({
                      id: claim.claimNumber + "-doc",
                      type: "urgent",
                      title: "Documents Requested – Action Required",
                      description: `Staff has requested a ${claim.requestedDocuments && claim.requestedDocuments.length > 0 ? claim.requestedDocuments.join(' & ') : 'Police Report & Repair Estimate'} for ${claim.claimNumber}.`,
                      subText: "Please upload within 3 days...",
                      date: claim.createdAt ? formatDateString(claim.createdAt) : "Today",
                      actions: [
                        { label: "Upload", href: `/Policy_Holder/Documents?uploadClaim=${claim.claimNumber}`, primary: true },
                        { label: "View", href: `/Policy_Holder/TrackClaims?id=${claim.claimNumber}` }
                      ],
                      isUrgent: true,
                      claim: claim
                    });
                  }

                  const s = (claim.status || "").toLowerCase();
                  if (["approved", "done", "active"].some(val => s.includes(val))) {
                    compiledNotifications.push({
                      id: claim.claimNumber + "-approved",
                      type: "approved",
                      title: `Claim ${claim.claimNumber} Approved!`,
                      description: `Your claim for LKR ${claim.amount ? Number(claim.amount).toLocaleString() : '85,000'} has been approved. Payment processed within 5 days.`,
                      date: claim.createdAt ? formatDateString(claim.createdAt) : "Today",
                      actions: [
                        { label: "View", href: `/Policy_Holder/TrackClaims?id=${claim.claimNumber}` }
                      ],
                      isUrgent: false,
                      claim: claim
                    });
                  } else if (!claim.documentsRequested) {
                    compiledNotifications.push({
                      id: claim.claimNumber + "-status",
                      type: "status",
                      title: `Claim ${claim.claimNumber} Status: ${claim.status || "Pending"}`,
                      description: `Your claim is currently in ${claim.status || "Pending"} stage. Agent is reviewing details.`,
                      date: claim.createdAt ? formatDateString(claim.createdAt) : "Today",
                      actions: [
                        { label: "View", href: `/Policy_Holder/TrackClaims?id=${claim.claimNumber}` }
                      ],
                      isUrgent: false,
                      claim: claim
                    });
                  }
                });

                // Sort: Urgent first
                compiledNotifications.sort((a, b) => (a.isUrgent === b.isUrgent ? 0 : a.isUrgent ? -1 : 1));

                setTotalClaimsCount(allClaims.length);
                setPendingClaimsCount(pendingClaims.length);
                setApprovedClaimsCount(approvedClaims.length);
                setHasDocumentRequest(docRequest);
                setNotifications(compiledNotifications);
              } catch (err) {
                console.error("Error fetching claims for home page banner:", err);
              }
            };
            fetchClaims();
          }
        } catch (err) {
          console.error("Error parsing user session", err);
          window.location.href = "/Login";
        }
      } else {
        window.location.href = "/Login";
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      <PolicyHolderNavbar />

      {/* Immersive curved header with background image and horizontal gradient overlay */}
      <header className="relative w-full h-[450px] md:h-[420px] rounded-b-[60px] md:rounded-b-[90px] overflow-hidden shadow-[0_15px_30px_rgba(0,0,0,0.08)] bg-[url('/policy1.jpg')] bg-cover bg-center">
        {/* Horizontal gradient overlay to darken left text area but keep the right image fold bright and clear */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-transparent" />

        {/* Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto h-full px-6 md:px-16 pt-10 pb-12 flex flex-col justify-between">
          
          {/* Welcome Greeting Row */}
          <div>
            <div className="inline-block border-b-3 border-[#00ddff] pb-1.5 mb-2">
              <h2 className="text-white text-xl md:text-2.5xl font-black tracking-tight">
                Welcome back, {userName} !
              </h2>
            </div>
            <p className="text-slate-200 text-[13px] md:text-sm font-semibold tracking-wide mt-1 animate-fade-in">
              {pendingClaimsCount > 0 || hasDocumentRequest ? (
                <>
                  Your policy is active and up to date. You have{" "}
                  {pendingClaimsCount > 0 && (
                    <>
                      <span className="text-[#ff9800] font-extrabold">
                        {pendingClaimsCount} pending claim{pendingClaimsCount > 1 ? "s" : ""}
                      </span>
                    </>
                  )}
                  {pendingClaimsCount > 0 && hasDocumentRequest && " and "}
                  {hasDocumentRequest && (
                    <>
                      <span className="text-[#ff9800] font-extrabold">
                        a document request awaiting action
                      </span>
                    </>
                  )}
                  .
                </>
              ) : (
                "Your policy is active and up to date. You have no pending claims."
              )}
            </p>
          </div>

          {/* Central Statement */}
          <div className="my-auto max-w-4xl mx-auto text-center px-4">
              <h1 className="text-lg md:text-[24px] font-extrabold text-white leading-relaxed tracking-normal">
                An accident claim with Sanasa General Insurance Company Limited is <br className="hidden md:inline" />
                a request for compensation after an accident.
              </h1>
          </div>

          {/* Action Buttons - Highly highlighted with glowing drop shadows */}
          <div className="flex flex-row justify-center gap-6 mt-2">
            <Link
              href="/Policy_Holder/New_Claim"
              className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-base md:text-lg px-10 py-4.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] no-underline"
              style={{ boxShadow: "0 8px 25px rgba(220, 38, 38, 0.65)" }}
            >
              New Claim
            </Link>
            <Link
              href="/Policy_Holder/TrackClaims"
              className="bg-[#1fcbf2] hover:bg-[#00b2d6] text-white font-extrabold text-base md:text-lg px-10 py-4.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] no-underline"
              style={{ boxShadow: "0 8px 25px rgba(31, 203, 242, 0.65)" }}
            >
              Track Claim
            </Link>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-16 py-10 relative z-20">
        
        {/* Three Stat Cards - Overlapping header area & clickable buttons */}
        <section className="-mt-[60px] md:-mt-[50px] grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          {/* Total Claims */}
          <Link
            href="/Policy_Holder/My_claims"
            className="bg-white px-6 py-5.5 rounded-[24px] border border-slate-100 shadow-[0_12px_32px_rgba(0,0,0,0.06)] flex items-center justify-center gap-6 hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 no-underline text-inherit cursor-pointer"
          >
            <div className="text-slate-400 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6m4 13V10m4 9V14" />
            </svg>
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-1">{totalClaimsCount}</h3>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Total Claims</p>
            </div>
          </Link>

          {/* In Progress */}
          <Link
            href="/Policy_Holder/My_claims"
            className="bg-white px-6 py-5.5 rounded-[24px] border border-slate-100 shadow-[0_12px_32px_rgba(0,0,0,0.06)] flex items-center justify-center gap-6 hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 no-underline text-inherit cursor-pointer"
          >
            <div className="text-slate-400 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-1">{pendingClaimsCount}</h3>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">In Progress</p>
            </div>
          </Link>

          {/* Approved */}
          <Link
            href="/Policy_Holder/My_claims"
            className="bg-white px-6 py-5.5 rounded-[24px] border border-slate-100 shadow-[0_12px_32px_rgba(0,0,0,0.06)] flex items-center justify-center gap-6 hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 no-underline text-inherit cursor-pointer"
          >
            <div className="text-slate-400 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            </svg>
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-1">{approvedClaimsCount}</h3>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Approved</p>
            </div>
          </Link>

        </section>

        {/* Dashboard Grid - Notifications & Vehicles */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Notifications Column */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-2 mb-6 cursor-pointer group">
              <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                Notifications & Reminders
              </h2>
              <svg
                className="w-5 h-5 text-slate-500 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>

            {/* Alert List */}
            <div className="flex flex-col gap-6">
              {notifications.length > 0 ? (
                notifications.slice(0, 3).map((notif: any) => {
                  const isUrgent = notif.type === "urgent";
                  const isApproved = notif.type === "approved";
                  
                  let cardClass = "";
                  let iconClass = "";
                  let iconSvg = null;
                  let titleClass = "";
                  
                  if (isUrgent) {
                    cardClass = "bg-red-50/15 border-2 border-red-100 rounded-[24px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[160px]";
                    iconClass = "p-1.5 bg-red-100 rounded-xl text-red-500 flex-shrink-0 mt-0.5";
                    iconSvg = (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.522a.75.75 0 01-.297 1.228 35.754 35.754 0 01-16.142 0 .75.75 0 01-.297-1.228A9.013 9.013 0 005.25 9.75V9zm4.5 8.25a3.75 3.75 0 007.5 0H9.75z" clipRule="evenodd" />
                      </svg>
                    );
                    titleClass = "text-red-600 font-extrabold text-base leading-none";
                  } else if (isApproved) {
                    cardClass = "bg-emerald-50/15 border-2 border-emerald-100 rounded-[24px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[140px]";
                    iconClass = "p-1.5 bg-emerald-100 rounded-xl text-emerald-500 flex-shrink-0 mt-0.5";
                    iconSvg = (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.74-5.24z" clipRule="evenodd" />
                      </svg>
                    );
                    titleClass = "text-emerald-600 font-extrabold text-base leading-none";
                  } else {
                    cardClass = "bg-blue-50/15 border-2 border-blue-100 rounded-[24px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[140px]";
                    iconClass = "p-1.5 bg-blue-100 rounded-xl text-blue-500 flex-shrink-0 mt-0.5";
                    iconSvg = (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                      </svg>
                    );
                    titleClass = "text-blue-600 font-extrabold text-base leading-none";
                  }

                  return (
                    <div
                      key={notif.id}
                      onClick={() => notif.claim && setSelectedClaim(notif.claim)}
                      className={`${cardClass} animate-fade-in cursor-pointer hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={iconClass}>
                          {iconSvg}
                        </div>
                        <div className="flex-1">
                          <h4 className={titleClass}>
                            {notif.title}
                          </h4>
                          <p className="text-slate-600 text-sm font-semibold mt-2 leading-relaxed">
                            {notif.description}
                          </p>
                          {notif.subText && (
                            <p className="text-slate-400 text-xs font-bold mt-2">
                              {notif.subText}
                            </p>
                          )}
                        </div>
                      </div>

                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100/50"
                      >
                        <div className="flex gap-2">
                          {notif.actions.map((act: any, idx: number) => {
                            const isPrimary = act.primary;
                            return (
                              <Link
                                key={idx}
                                href={act.href}
                                className={`${
                                  isPrimary 
                                    ? "bg-red-600 hover:bg-red-700 text-white font-extrabold text-[13px] px-5 py-1.5 rounded-full transition-all duration-150 no-underline shadow-sm"
                                    : "bg-[#2f3e46] hover:bg-[#1a2327] text-white font-extrabold text-[13px] px-5 py-1.5 rounded-full transition-all duration-150 no-underline"
                                }`}
                              >
                                {act.label}
                              </Link>
                            );
                          })}
                        </div>
                        <span className="text-slate-400 text-xs font-bold">{notif.date}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white border border-slate-200 rounded-[24px] p-8 text-center shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                  <p className="text-slate-400 font-bold text-sm">No notifications or reminders at this time.</p>
                </div>
              )}
            </div>
          </div>

          {/* Vehicles Column */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            <div>
              <Link href="/Policy_Holder/MyVehicles" className="flex items-center gap-2 mb-6 cursor-pointer group no-underline text-inherit select-none">
                <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                  My Vehicles
                </h2>
                <svg
                  className="w-5 h-5 text-slate-500 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>

              {/* Vehicle List */}
              <div className="flex flex-col gap-5">
                {vehicles.length > 0 ? (
                  vehicles.map((vehicle, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-[22px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getVehicleIconContainer(vehicle.vehicleType)}
                        <div>
                          <h4 className="text-slate-800 font-extrabold text-base leading-tight">{formatNumberPlate(vehicle.numberPlate)}</h4>
                          <p className="text-slate-400 font-bold text-xs mt-0.5">{vehicle.company} {vehicle.model} {vehicle.year}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedVehicleForModal(vehicle)}
                        className="border border-slate-300 hover:border-slate-400 text-slate-600 font-extrabold text-xs px-5 py-1.5 rounded-full transition-all bg-transparent cursor-pointer outline-none"
                      >
                        View
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="bg-white border border-slate-200 rounded-[22px] p-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                    <p className="text-slate-400 font-bold text-sm">No vehicles registered under this policy.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Support Card Box */}
            <div className="bg-gradient-to-br from-cyan-50/90 via-sky-50/40 to-blue-50/20 border border-cyan-150/60 rounded-3xl p-6 shadow-md hover:shadow-lg hover:scale-[1.01] transition-all duration-300 relative overflow-hidden flex flex-col gap-4">
              
              {/* Pulsing online status indicator */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/50 rounded-full px-2.5 py-0.5 select-none">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[9px] font-bold text-emerald-700 tracking-wide uppercase">Live Support</span>
              </div>

              <h3 className="text-cyan-800 font-extrabold text-lg tracking-tight flex items-center gap-2 select-none">
                <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Support Helpdesk
              </h3>
              
              <p className="text-xs text-slate-500 font-semibold text-left leading-relaxed -mt-1 select-none">
                Need assistance with an active claim filing, towing service, or coverage terms? Call our staff directly.
              </p>

              <div className="flex flex-col gap-2.5 mt-1">
                <a href="tel:+94112003000" className="flex items-center justify-between bg-white border border-slate-100/60 p-3 rounded-2xl hover:border-cyan-200 hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 font-bold text-sm text-slate-800 group no-underline">
                  <div className="flex items-center gap-2.5">
                    <span className="bg-cyan-50 p-2 rounded-xl text-cyan-600 transition-colors group-hover:bg-cyan-500 group-hover:text-white">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.47-5.112-3.758-6.58-6.58l1.293-.97c.362-.272.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                      </svg>
                    </span>
                    <span className="text-slate-700 tracking-tight font-extrabold">+94 112 003 000</span>
                  </div>
                  <span className="text-[10px] bg-slate-50 border border-slate-150 px-2.5 py-0.5 rounded-full text-slate-400 group-hover:bg-cyan-50 group-hover:text-cyan-600 group-hover:border-cyan-200">
                    Line 1
                  </span>
                </a>

                <a href="tel:+94112003001" className="flex items-center justify-between bg-white border border-slate-100/60 p-3 rounded-2xl hover:border-cyan-200 hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 font-bold text-sm text-slate-800 group no-underline">
                  <div className="flex items-center gap-2.5">
                    <span className="bg-cyan-50 p-2 rounded-xl text-cyan-600 transition-colors group-hover:bg-cyan-500 group-hover:text-white">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.47-5.112-3.758-6.58-6.58l1.293-.97c.362-.272.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                      </svg>
                    </span>
                    <span className="text-slate-700 tracking-tight font-extrabold">+94 112 003 001</span>
                  </div>
                  <span className="text-[10px] bg-slate-50 border border-slate-150 px-2.5 py-0.5 rounded-full text-slate-400 group-hover:bg-cyan-50 group-hover:text-cyan-600 group-hover:border-cyan-200">
                    Line 2
                  </span>
                </a>
              </div>
            </div>
          </div>

        </section>

      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-[#00ddff] text-black font-extrabold px-6 py-4.5 rounded-2xl shadow-xl animate-bounce flex items-center gap-3 border-2 border-black">
          <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Vehicle Detail Popup Modal */}
      {selectedVehicleForModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-[28px] w-full max-w-[620px] max-h-[90vh] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col relative overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-8 pt-6 pb-4 border-b border-slate-200 flex-shrink-0">
              <h2 className="text-[20px] md:text-[22px] font-extrabold text-[#0f2d3a] tracking-tight leading-none text-slate-800">
                Vehicle Specifications
              </h2>
              <button
                onClick={() => setSelectedVehicleForModal(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold border-none bg-transparent cursor-pointer outline-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 flex-1 overflow-y-auto">
              
              {/* Profile Card Header inside modal */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-[22px] p-5 mb-6 flex items-center gap-4.5 shadow-sm select-none text-slate-800">
                {getVehicleIconContainer(selectedVehicleForModal.vehicleType)}
                <div>
                  <h3 className="text-[#0f2d3a] font-black text-xl leading-none tracking-tight">
                    {selectedVehicleForModal.company} {selectedVehicleForModal.model}
                  </h3>
                  <p className="text-slate-400 font-bold text-xs mt-1.5">
                    Year: {selectedVehicleForModal.year} | Type: {selectedVehicleForModal.vehicleType}
                  </p>
                </div>
              </div>

              {/* 2-Column Specs Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 text-sm font-semibold text-slate-700 mb-8 px-2">
                <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Number Plate</span>
                  <span className="font-extrabold text-slate-800 text-base">{formatNumberPlate(selectedVehicleForModal.numberPlate)}</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Policy Number</span>
                  <span className="font-extrabold text-slate-800 text-base tracking-wide">{selectedVehicleForModal.policyNumber || "N/A"}</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Engine Number</span>
                  <span className="font-bold text-slate-800 font-mono text-[13px]">{selectedVehicleForModal.engineNumber || "N/A"}</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Chassis Number</span>
                  <span className="font-bold text-slate-800 font-mono text-[13px]">{selectedVehicleForModal.chassisNumber || "N/A"}</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Insurance Coverage</span>
                  <span className="font-extrabold text-emerald-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    Active Coverage
                  </span>
                </div>
                <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Renewal Cycle</span>
                  <span className="font-extrabold text-slate-800">Annual (Jan 01 - Dec 31)</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-slate-100 pb-2 sm:col-span-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Insurance Plan Type</span>
                  <span className="font-extrabold text-slate-800">Comprehensive Vehicle Insurance Plan</span>
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="flex gap-4 border-t border-slate-100 pt-6">
                <Link
                  href={`/Policy_Holder/New_Claim?plate=${encodeURIComponent(selectedVehicleForModal.numberPlate)}`}
                  onClick={() => setSelectedVehicleForModal(null)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm py-3.5 rounded-full text-center no-underline shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  File a Claim
                </Link>
                <button
                  onClick={() => handleDownloadCoverNote(selectedVehicleForModal)}
                  className="flex-1 bg-[#1fcbf2] hover:bg-[#00b2d6] text-white font-extrabold text-sm py-3.5 rounded-full text-center cursor-pointer border-none shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Cover Note
                </button>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex justify-end flex-shrink-0">
              <button
                onClick={() => setSelectedVehicleForModal(null)}
                className="bg-[#1a365d] hover:bg-[#0f223f] text-white font-extrabold text-[14px] px-8 py-2.5 rounded-full transition-all border-none cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

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
                <h2 className="text-[22px] font-extrabold text-[#0f2d3a] tracking-tight leading-none text-slate-800">
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
                    <span className="font-extrabold text-slate-800">{formatNumberPlate(selectedClaim.vehiclePlate || "")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold w-28 shrink-0">Type:</span>
                    <span className="font-extrabold text-slate-800">{selectedClaim.damageType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold w-28 shrink-0">Est. Amount:</span>
                    <span className="font-extrabold text-slate-800">
                      {selectedClaim.amount
                        ? (typeof selectedClaim.amount === "string"
                          ? (selectedClaim.amount.startsWith("Rs.") ? "LKR " + selectedClaim.amount.substring(4) : selectedClaim.amount)
                          : "LKR " + Number(selectedClaim.amount).toLocaleString())
                        : "Pending"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold w-28 shrink-0">Date:</span>
                    <span className="font-extrabold text-slate-800">{formatDateString(selectedClaim.incidentDate)}</span>
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
                    <ul className="list-none flex flex-col gap-4.5 mb-4 pl-1">
                      {getUserRequestedDocs(selectedClaim).map((doc) => {
                        const note = getDocRequestNote(selectedClaim, doc);
                        const reqTime = getDocRequestTime(selectedClaim, doc);
                        return (
                          <li key={doc} className="flex items-start gap-2 text-[#aa4f4f] font-bold text-xs w-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#df3d3d] flex-shrink-0 mt-1.5" />
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-x-2 gap-y-0.5 items-baseline">
                              <span className="font-extrabold">{doc}</span>
                              {reqTime && (
                                <span className="text-red-600 font-extrabold">
                                  (Requested: {reqTime} by {getDocRequestSender(selectedClaim, doc)})
                                </span>
                              )}
                              {note && (
                                <span className="col-span-1 sm:col-span-2 text-[11px] font-medium text-slate-500 italic mt-0.5 pl-0.5">
                                  Note: "{note}"
                                </span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    <Link
                      href={`/Policy_Holder/Documents?uploadClaim=${selectedClaim.claimNumber}`}
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

      {/* Floating Chat Bubble Button */}
      <button
        className="fixed bottom-8 right-8 z-40 bg-[#00ddff] hover:bg-[#00c8e6] text-white p-4.5 rounded-full shadow-2xl transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer focus:outline-none border-none flex items-center justify-center"
        aria-label="Chat support"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2.1 21.5l4.63-.827A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-3.5 11a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3.5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3.5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" clipRule="evenodd" />
        </svg>
      </button>

      <PolicyHolderFooter />
    </div>
  );
}
