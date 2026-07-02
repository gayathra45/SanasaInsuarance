"use client";

import React, { useState, useEffect } from "react";
import PolicyHolderNavbar from "@/app/Components/Policy_Holder/Navbar";
import PolicyHolderFooter from "@/app/Components/Policy_Holder/footer";
import Link from "next/link";
import { API_URL } from "@/app/config";

interface AdditionalDoc {
  name: string;
  url: string;
  uploadedAt: string;
  uploadedBy?: string;
  _id?: string;
}

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
  accidentPhotos?: {
    front?: string[];
    rear?: string[];
    side?: string[];
  };
  drivingLicense?: {
    front?: string[];
    rear?: string[];
  };
  additionalDocuments?: AdditionalDoc[];
}

export default function MyClaims() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Review" | "Approved" | "Rejected" | "Completed">("All");

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

  const getDocRequestNote = (claim: Claim, docName: string): string => {
    if (!claim.messages) return "";
    const msg = [...claim.messages]
      .reverse()
      .find(m => m.message && m.message.includes(`Requested: ${docName}`));
    if (msg && msg.message) {
      const idx = msg.message.indexOf("Message:");
      if (idx !== -1) {
        return msg.message.substring(idx + 8).trim();
      }
    }
    return "";
  };

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

  const getDocRequestTime = (claim: Claim, docName: string): string => {
    if (!claim.messages) return "";
    const msg = [...claim.messages]
      .reverse()
      .find(m => m.message && m.message.includes(`Requested: ${docName}`));
    if (msg && msg.sentAt) {
      return formatDateTimeString(msg.sentAt);
    }
    return "";
  };

  const getDocRequestSender = (claim: Claim, docName: string): string => {
    if (!claim.messages) return "Office Staff";
    const msg = [...claim.messages]
      .reverse()
      .find(m => m.message && m.message.includes(`Requested: ${docName}`));
    return msg ? (msg.sender || "Office Staff") : "Office Staff";
  };


  const fetchClaims = async (showLoading = true) => {
    if (typeof window === "undefined") return;
    if (showLoading) setIsLoading(true);
    let userNic = "";
    
    // 1. Get Logged In User
    const userStr = sessionStorage.getItem("logged_in_user");
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);
        if (parsedUser.nic) {
          userNic = parsedUser.nic;
        }
      } catch (err) {
        console.error("Error parsing logged_in_user session", err);
      }
    }

    let databaseClaims: Claim[] = [];

    // 2. Fetch Claims from MongoDB API (if NIC exists)
    if (userNic) {
      try {
        const res = await fetch(`${API_URL}/policy-holder/user-claims?nic=${encodeURIComponent(userNic)}&includeDocs=true`, {
          cache: "no-store"
        });
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
              officer: claim.assignedAgent || "Not Assigned",
              documentsRequested: claim.documentsRequested || false,
              requestedDocuments: claim.requestedDocuments || [],
              currentStep: claim.currentStep || 1,
              messages: claim.messages || [],
              accidentPhotos: claim.accidentPhotos || {},
              drivingLicense: claim.drivingLicense || {},
              additionalDocuments: claim.additionalDocuments || [],
              createdAt: claim.createdAt || claim.incidentDate
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
            messages: [],
            accidentPhotos: {},
            drivingLicense: {},
            additionalDocuments: [],
            createdAt: parsed.createdAt || parsed.incidentDate || new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.error("Error parsing local claim draft", err);
    }

    // 4. Combine recently submitted claims with database claims
    setClaims([...localClaims, ...databaseClaims]);
    if (showLoading) setIsLoading(false);
  };

  useEffect(() => {
    fetchClaims(true);
  }, []);

  // Poll database claims periodically in the background
  useEffect(() => {
    if (selectedClaim !== null) return;
    const pollInterval = setInterval(() => {
      fetchClaims(false);
    }, 7000);
    return () => clearInterval(pollInterval);
  }, [selectedClaim]);

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

  // Calculate statistics for the Policy Holder
  const currentYear = new Date().getFullYear();
  const claimsThisYear = claims.filter(c => {
    const dateStr = c.createdAt || c.incidentDate;
    if (!dateStr) return false;
    try {
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) && d.getFullYear() === currentYear;
    } catch {
      return false;
    }
  });

  const totalClaimsThisYear = claimsThisYear.length;
  const pendingClaimsThisYear = claimsThisYear.filter(c => {
    const s = c.status.toLowerCase();
    return s.includes("pending") || s.includes("progress");
  }).length;
  const completedClaimsThisYear = claimsThisYear.filter(c => {
    const s = c.status.toLowerCase();
    return s.includes("approved") || s.includes("active") || s.includes("done") || s.includes("rejected");
  }).length;

  const totalUploads = claims.reduce((acc, c) => {
    let count = 0;
    if (c.drivingLicense?.front && c.drivingLicense.front.length > 0) count++;
    if (c.drivingLicense?.rear && c.drivingLicense.rear.length > 0) count++;
    if (c.accidentPhotos?.front) count += c.accidentPhotos.front.length;
    if (c.accidentPhotos?.rear) count += c.accidentPhotos.rear.length;
    if (c.accidentPhotos?.side) count += c.accidentPhotos.side.length;
    if (c.additionalDocuments) {
      count += c.additionalDocuments.length;
    }
    return acc + count;
  }, 0);
  const totalChats = claims.reduce((acc, c) => acc + (c.messages?.length || 0), 0);

  // Filter claims based on status filter and search query
  const filteredClaims = claims.filter((claim) => {
    let matchesStatus = false;
    const s = claim.status.toLowerCase();
    if (statusFilter === "All") {
      matchesStatus = true;
    } else if (statusFilter === "Completed") {
      matchesStatus = s.includes("approved") || s.includes("active") || s.includes("done") || s.includes("rejected");
    } else if (statusFilter === "Pending") {
      matchesStatus = s.includes("pending") || s.includes("progress");
    } else if (statusFilter === "Review") {
      matchesStatus = s.includes("review") || s.includes("submit");
    } else if (statusFilter === "Approved") {
      matchesStatus = s.includes("approved") || s.includes("active") || s.includes("done");
    } else if (statusFilter === "Rejected") {
      matchesStatus = s.includes("rejected");
    }

    const matchesSearch =
      claim.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.damageType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (claim.location && claim.location.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-16 py-10 flex flex-col gap-8">
        
        {/* Top Overview Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
          
          {/* Card 1: Profile & Status */}
          <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm flex flex-col justify-between min-h-[140px] hover:border-slate-350 transition-all duration-200">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Profile & Status</span>
            <div className="flex items-center gap-3.5 mt-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold shrink-0">
                <svg className="w-6 h-6 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="overflow-hidden">
                <span className="block font-black text-slate-800 text-base truncate">
                  {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : (user?.name || "Policy Holder")}
                </span>
                <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">NIC: {user?.nic || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Performance Summary */}
          <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm flex flex-col justify-between min-h-[140px] hover:border-slate-350 transition-all duration-200">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Performance Summary</span>

            <div className="grid grid-cols-3 gap-3 text-center mt-3">
              <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-2.5 flex flex-col justify-center">
                <span className="text-xl font-black text-slate-800">{totalClaimsThisYear}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Claims</span>
              </div>
              <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-2.5 flex flex-col justify-center">
                <span className="text-xl font-black text-slate-800">{pendingClaimsThisYear}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Pending</span>
              </div>
              <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-2.5 flex flex-col justify-center">
                <span className="text-xl font-black text-slate-800">{completedClaimsThisYear}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Completed</span>
              </div>
            </div>
          </div>

          {/* Card 3: Quick Guidelines */}
          <div className="bg-slate-900 border border-slate-800 rounded-[28px] p-6 shadow-md text-white flex flex-col justify-between min-h-[140px] hover:border-slate-800 transition-all duration-200">
            <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider block flex items-center gap-1.5">
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              Quick Guidelines
            </span>
            <p className="text-slate-300 text-xs font-semibold leading-relaxed mt-3.5">
              Use the status tabs to filter your claims. Click "View" to check live assessment tracking, view officer details, and read message logs.
            </p>
          </div>

        </div>

        {/* Search & Filter row */}
        <div className="bg-white border border-slate-200 rounded-[24px] p-5 flex flex-col lg:flex-row gap-4 items-center justify-between shadow-sm select-none">
          
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-xl w-full lg:w-auto">
            {(["All", "Pending", "Review", "Approved", "Rejected", "Completed"] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all border-none outline-none cursor-pointer ${
                  statusFilter === tab
                    ? "bg-[#0f2d4a] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                }`}
              >
                {tab} ({
                  tab === "All"
                    ? claims.length
                    : tab === "Completed"
                    ? claims.filter(c => {
                        const s = c.status.toLowerCase();
                        return s.includes("approved") || s.includes("active") || s.includes("done") || s.includes("rejected");
                      }).length
                    : tab === "Pending"
                    ? claims.filter(c => {
                        const s = c.status.toLowerCase();
                        return s.includes("pending") || s.includes("progress");
                      }).length
                    : tab === "Review"
                    ? claims.filter(c => {
                        const s = c.status.toLowerCase();
                        return s.includes("review") || s.includes("submit");
                      }).length
                    : tab === "Approved"
                    ? claims.filter(c => {
                        const s = c.status.toLowerCase();
                        return s.includes("approved") || s.includes("active") || s.includes("done");
                      }).length
                    : claims.filter(c => c.status.toLowerCase().includes(tab.toLowerCase())).length
                })
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full lg:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, vehicle, type, or status..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-slate-700 placeholder:text-slate-400 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0f2d4a] focus:border-transparent transition-all bg-slate-50 focus:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Modern Card Grid list */}
        <div className="flex flex-col gap-6">
          
          {/* Grid Table Header (Desktop Only) */}
          <div className="hidden md:grid md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.5fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,0.8fr)] items-center gap-4 px-5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider select-none border border-transparent border-l-4 border-l-transparent">
            <div>Claim Info</div>
            <div>Vehicle No</div>
            <div>Date</div>
            <div>Damage Type</div>
            <div className="text-center">Amount</div>
            <div className="text-center">Status</div>
            <div className="text-right">Actions</div>
          </div>

          {/* List Cards */}
          <div className="flex flex-col gap-3.5">
            {isLoading ? (
              <div className="bg-white border border-slate-200 rounded-[28px] p-16 flex flex-col items-center justify-center text-center shadow-sm min-h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0284c7]"></div>
                <span className="mt-3 text-slate-400 text-sm font-bold">Loading your claims dossier...</span>
              </div>
            ) : filteredClaims.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-[28px] p-16 flex flex-col items-center justify-center text-center shadow-sm min-h-[300px]">
                <h3 className="font-extrabold text-slate-700 text-lg">No Claims Found</h3>
                <p className="text-slate-400 text-xs font-semibold mt-1.5 max-w-sm leading-relaxed">
                  We couldn't find any claims matching the selected filters or search queries.
                </p>
              </div>
            ) : (
              filteredClaims.map((claim) => {
                const s = claim.status.toLowerCase();
                const isUrgent = s.includes("pending") || s.includes("progress") || s.includes("review") || s.includes("submit");
                return (
                  <div
                    key={claim.claimNumber}
                    onClick={() => setSelectedClaim(claim)}
                    className={`bg-white border border-slate-200 hover:border-[#0f2d4a] rounded-xl px-5 py-3.5 flex flex-col md:grid md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.5fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,0.8fr)] md:items-center gap-4 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md relative overflow-hidden ${
                      isUrgent ? "border-l-4 border-l-[#0f2d4a]" : "border-l-4 border-l-slate-300"
                    }`}
                  >
                    {/* Claim Info */}
                    <div className="flex flex-col min-w-0 select-none">
                      <span className="font-black text-slate-800 text-sm whitespace-nowrap">{claim.claimNumber}</span>
                      {claim.createdAt && (
                        <span className="text-[10px] text-slate-400 font-bold mt-1 block">Registered: {formatDateString(claim.createdAt)}</span>
                      )}
                    </div>

                    {/* Vehicle Plate */}
                    <div className="text-xs md:text-sm font-bold text-slate-800">
                      {formatNumberPlate(claim.vehiclePlate)}
                    </div>

                    {/* Incident Date */}
                    <div className="text-xs md:text-sm font-semibold text-slate-700">
                      {claim.incidentDate}
                    </div>

                    {/* Damage Type */}
                    <div className="text-xs md:text-sm font-semibold text-slate-700 truncate" title={claim.damageType}>
                      {claim.damageType}
                    </div>

                    {/* Amount */}
                    <div className="text-xs md:text-sm font-bold text-slate-700 text-center">
                      {claim.amount}
                    </div>

                    {/* Status Badge */}
                    <div className="flex flex-col items-center min-w-0">
                      {getStatusBadge(claim.status)}
                    </div>

                    {/* Action */}
                    <div className="text-left md:text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedClaim(claim)}
                        className="border border-slate-350 hover:bg-slate-50 text-slate-600 font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer focus:outline-none shadow-sm bg-white whitespace-nowrap active:scale-95"
                      >
                        Details
                      </button>
                    </div>

                  </div>
                );
              })
            )}
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

      <PolicyHolderFooter />
    </div>
  );
}
