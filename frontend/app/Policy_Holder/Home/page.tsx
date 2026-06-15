"use client";

import React, { useState, useEffect } from "react";
import PolicyHolderNavbar from "@/app/Components/Policy_Holder/Navbar";
import PolicyHolderFooter from "@/app/Components/Policy_Holder/footer";
import Link from "next/link";

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
  const [userName, setUserName] = useState("Kamal");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [pendingClaimsCount, setPendingClaimsCount] = useState(1);
  const [hasDocumentRequest, setHasDocumentRequest] = useState(false);
  const [totalClaimsCount, setTotalClaimsCount] = useState(3);
  const [approvedClaimsCount, setApprovedClaimsCount] = useState(1);
  const [notifications, setNotifications] = useState<any[]>([]);

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
                const res = await fetch(`http://localhost:5000/api/policy-holder/user-claims?nic=${encodeURIComponent(user.nic)}`);
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
                        { label: "Upload", href: "/Policy_Holder/Documents", primary: true },
                        { label: "View", href: "/Policy_Holder/My_claims" }
                      ],
                      isUrgent: true
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
                        { label: "View", href: "/Policy_Holder/My_claims" }
                      ],
                      isUrgent: false
                    });
                  } else if (!claim.documentsRequested) {
                    compiledNotifications.push({
                      id: claim.claimNumber + "-status",
                      type: "status",
                      title: `Claim ${claim.claimNumber} Status: ${claim.status || "Pending"}`,
                      description: `Your claim is currently in ${claim.status || "Pending"} stage. Agent is reviewing details.`,
                      date: claim.createdAt ? formatDateString(claim.createdAt) : "Today",
                      actions: [
                        { label: "View", href: "/Policy_Holder/My_claims" }
                      ],
                      isUrgent: false
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
        }
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
                An accident claim with Sansa General Insurance Company Limited is <br className="hidden md:inline" />
                a request for compensation after an accident.
              </h1>
          </div>

          {/* Action Buttons - Highly highlighted with glowing drop shadows */}
          <div className="flex flex-row justify-center gap-6 mt-2">
            <Link
              href="/Policy_Holder/New_Claim/page"
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
                notifications.map((notif: any) => {
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
                    <div key={notif.id} className={`${cardClass} animate-fade-in`}>
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

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100/50">
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
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2 mb-6 cursor-pointer group">
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
            </div>

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
                    <Link
                      href="/Policy_Holder/MyVehicles"
                      className="border border-slate-300 hover:border-slate-400 text-slate-600 font-extrabold text-xs px-5 py-1.5 rounded-full transition-all no-underline"
                    >
                      View
                    </Link>
                  </div>
                ))
              ) : (
                <>
                  {/* Vehicle 1 */}
                  <div className="bg-white border border-slate-200 rounded-[22px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600 flex-shrink-0">
                        <svg className="w-10 h-10 text-slate-700" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.16 8a2 2 0 0 0-1.8-1.1H6.64a2 2 0 0 0-1.8 1.1L3.2 11h17.6l-1.64-3zM2 13h20v3a2 2 0 0 1-2 2h-1.18a3 3 0 0 1-5.64 0h-2.36a3 3 0 0 1-5.64 0H4a2 2 0 0 1-2-2v-3zm4 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm12 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-slate-800 font-extrabold text-base leading-tight">CBH-3202</h4>
                        <p className="text-slate-400 font-bold text-xs mt-0.5">Toyota Corolla 2019</p>
                      </div>
                    </div>
                    <Link
                      href="/Policy_Holder/MyVehicles"
                      className="border border-slate-300 hover:border-slate-400 text-slate-600 font-extrabold text-xs px-5 py-1.5 rounded-full transition-all no-underline"
                    >
                      View
                    </Link>
                  </div>

                  {/* Vehicle 2 */}
                  <div className="bg-white border border-slate-200 rounded-[22px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600 flex-shrink-0">
                        <svg className="w-10 h-10 text-slate-700" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20 8h-3V4H2v11h2a3 3 0 0 0 6 0h4a3 3 0 0 0 6 0h2v-4c0-1.7-1.3-3-3-3zm-13 8c-.8 0-1.5-.7-1.5-1.5S6.2 13 7 13s1.5.7 1.5 1.5S7.8 16 7 16zm11 0c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z" />
                          <path d="M17 9.5h3c.8 0 1.5.7 1.5 1.5v1H17v-2.5z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-slate-800 font-extrabold text-base leading-tight">NE-7856</h4>
                        <p className="text-slate-400 font-bold text-xs mt-0.5">Ashok Leyland Lorry</p>
                      </div>
                    </div>
                    <Link
                      href="/Policy_Holder/MyVehicles"
                      className="border border-slate-300 hover:border-slate-400 text-slate-600 font-extrabold text-xs px-5 py-1.5 rounded-full transition-all no-underline"
                    >
                      View
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

        </section>

      </main>

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
