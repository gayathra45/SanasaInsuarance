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
  damageType: string;
  status: string;
  amount?: string | number | null;
  createdAt?: string;
  updatedAt?: string;
  documentsRequested?: boolean;
  requestedDocuments?: string[];
  currentStep?: number;
  description?: string;
  location?: string;
  officer?: string;
  documentRequestTo?: string;
  messages?: { sender: string; message: string; sentAt: string; recipient?: string }[];
}

interface NotificationItem {
  id: string;
  type: "urgent" | "approved" | "status";
  title: string;
  description: string;
  subText?: string;
  date: string;
  isUrgent: boolean;
  link: string;
  actionLabel: string;
  createdAtRaw?: string;
  claim: Claim;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "Today";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

export default function PolicyHolderNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filteredNotifs, setFilteredNotifs] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "urgent" | "approved" | "status">("all");
  const [user, setUser] = useState<{ firstName?: string; nic?: string } | null>(null);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  // 1. Initial Load of User Session and LocalStorage Read States
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load user
      const userStr = sessionStorage.getItem("logged_in_user");
      if (userStr) {
        try {
          const parsedUser = JSON.parse(userStr);
          setUser(parsedUser);
          if (parsedUser.nic) {
            fetchNotifications(parsedUser.nic);
          } else {
            setLoading(false);
          }
        } catch (err) {
          console.error("Error parsing logged_in_user session", err);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }

      // Load read notifications
      const savedReadIds = localStorage.getItem("read_notification_ids");
      if (savedReadIds) {
        try {
          setReadIds(JSON.parse(savedReadIds));
        } catch (e) {
          console.error("Failed to load read notification IDs", e);
        }
      }
    }
  }, []);

  // 2. Fetch Claims and compile notifications list
  const fetchNotifications = async (nic: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/policy-holder/user-claims?nic=${encodeURIComponent(nic)}`, {
        cache: "no-store"
      });
      let dbClaims: Claim[] = [];
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.claims)) {
          dbClaims = data.claims;
        }
      }

      // Check for last submitted claim
      let localClaims: Claim[] = [];
      const lastStr = sessionStorage.getItem("last_submitted_claim");
      if (lastStr) {
        try {
          const parsed = JSON.parse(lastStr);
          if (!dbClaims.some((c) => c.claimNumber === parsed.claimNumber)) {
            localClaims.push(parsed);
          }
        } catch (e) {}
      }

      const allClaims = [...localClaims, ...dbClaims];
      const compiled: NotificationItem[] = [];

      allClaims.forEach((claim) => {
        const dateFormatted = formatDate(claim.createdAt || claim.updatedAt);

        // 1. Documents Requested (Urgent Notification)
        if (claim.documentsRequested) {
          compiled.push({
            id: `${claim.claimNumber}-doc`,
            type: "urgent",
            title: "Documents Requested – Action Required",
            description: `Staff has requested a ${
              claim.requestedDocuments && claim.requestedDocuments.length > 0
                ? claim.requestedDocuments.join(" & ")
                : "Police Report / Repair Estimate"
            } for claim ${claim.claimNumber}.`,
            subText: "Please upload within 3 working days to avoid settlement delays.",
            date: dateFormatted,
            isUrgent: true,
            link: "/Policy_Holder/Documents", // Linking directly to documents page as requested
            actionLabel: "Upload Documents",
            createdAtRaw: claim.createdAt,
            claim: claim
          });
        }

        // 2. Claim Approved/Settled
        const statusLower = (claim.status || "").toLowerCase();
        if (statusLower.includes("approved") || statusLower.includes("done") || statusLower.includes("settled")) {
          compiled.push({
            id: `${claim.claimNumber}-approved`,
            type: "approved",
            title: `Claim ${claim.claimNumber} Approved!`,
            description: `Your insurance claim for vehicle ${claim.vehiclePlate} has been approved. The settlement amount will be credited to your registered bank account.`,
            date: dateFormatted,
            isUrgent: false,
            link: "/Policy_Holder/My_claims",
            actionLabel: "View",
            createdAtRaw: claim.createdAt,
            claim: claim
          });
        } else if (!claim.documentsRequested) {
          // 3. Claim In-Progress or standard status updates
          compiled.push({
            id: `${claim.claimNumber}-status`,
            type: "status",
            title: `Claim ${claim.claimNumber} Status: ${claim.status || "Pending"}`,
            description: `Your claim is currently in "${claim.status || "Pending"}" status. Click below to view the detailed progress tracker.`,
            date: dateFormatted,
            isUrgent: false,
            link: `/Policy_Holder/TrackClaims?id=${claim.claimNumber}`,
            actionLabel: "View",
            createdAtRaw: claim.createdAt,
            claim: claim
          });
        }
      });

      // Sort notifications (Urgent first, then newest first)
      compiled.sort((a, b) => {
        if (a.isUrgent && !b.isUrgent) return -1;
        if (!a.isUrgent && b.isUrgent) return 1;
        const timeA = a.createdAtRaw ? new Date(a.createdAtRaw).getTime() : 0;
        const timeB = b.createdAtRaw ? new Date(b.createdAtRaw).getTime() : 0;
        return timeB - timeA;
      });

      setNotifications(compiled);
      setFilteredNotifs(compiled);
    } catch (err) {
      console.error("Error fetching notifications", err);
    } finally {
      setLoading(false);
    }
  };

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

  // 3. Read/Unread Handler Actions
  const toggleReadStatus = (id: string) => {
    let updatedReadIds = [...readIds];
    if (readIds.includes(id)) {
      updatedReadIds = updatedReadIds.filter((item) => item !== id);
    } else {
      updatedReadIds.push(id);
    }
    setReadIds(updatedReadIds);
    localStorage.setItem("read_notification_ids", JSON.stringify(updatedReadIds));
  };

  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      localStorage.setItem("read_notification_ids", JSON.stringify(updated));
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    localStorage.setItem("read_notification_ids", JSON.stringify(allIds));
  };

  // Helper date formatter for claim details modal
  const formatDateString = (dateStr?: string): string => {
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

  const formatNumberPlate = (plate?: string): string => {
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

  // 4. Tab and Query Filtering Effect
  useEffect(() => {
    let result = notifications;

    // Filter by Tab
    if (activeTab === "unread") {
      result = notifications.filter((n) => !readIds.includes(n.id));
    } else if (activeTab === "urgent") {
      result = notifications.filter((n) => n.type === "urgent");
    } else if (activeTab === "approved") {
      result = notifications.filter((n) => n.type === "approved");
    } else if (activeTab === "status") {
      result = notifications.filter((n) => n.type === "status");
    }

    // Filter by Search Query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q) ||
          (n.subText && n.subText.toLowerCase().includes(q))
      );
    }

    setFilteredNotifs(result);
  }, [activeTab, searchQuery, notifications, readIds]);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans relative">
      <PolicyHolderNavbar />

      {/* Styled Curved Header Matching Mockup */}
      <div className="max-w-7xl w-full mx-auto px-6 md:px-16 mt-8 relative">
        <div className="absolute top-0 bottom-0 left-[calc(50%-50vw)] right-6 md:right-12 bg-[url('/contact_border.jpeg')] bg-cover bg-center rounded-r-[75px] md:rounded-r-[95px] overflow-hidden shadow-md">
          {/* Slate Gradient Overlay */}
          <div className="absolute inset-0 bg-slate-900/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d2a3a]/90 via-[#0d2a3a]/75 to-transparent" />
        </div>

        {/* Text Content */}
        <header className="relative z-10 h-[210px] flex flex-col justify-center pl-4 md:pl-8 select-none">
          <h1 className="text-white text-3xl md:text-[40px] font-bold tracking-tight leading-none">
            Notifications
          </h1>
          <p className="text-slate-200 text-xs md:text-sm font-semibold mt-3.5 tracking-wide opacity-95">
            {loading
              ? "Loading updates..."
              : notifications.length > 0
              ? `You have ${notifications.filter(n => !readIds.includes(n.id)).length} unread updates`
              : "All caught up with claim updates"}
          </p>
        </header>
      </div>

      {/* Main Spacious Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-16 py-10">
        
        {/* Horizontal Top Controls Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 select-none">
          
          {/* Search Input */}
          <div className="relative w-full max-w-[420px] bg-slate-50 hover:bg-white focus-within:bg-white border border-slate-200 rounded-full pl-5 pr-2.5 py-2 flex items-center gap-3 transition-all duration-200 shadow-sm focus-within:shadow-md focus-within:border-[#0284c7] focus-within:ring-4 focus-within:ring-[#0284c7]/10">
            <span className="text-slate-400 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search notifications..."
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

          {/* Mark All As Read */}
          {notifications.some(n => !readIds.includes(n.id)) && (
            <button
              onClick={markAllAsRead}
              className="bg-slate-100 hover:bg-slate-200 border-none text-slate-700 font-bold text-xs px-6 py-3 rounded-full transition-all cursor-pointer flex items-center gap-1.5 self-start md:self-center"
            >
              <svg className="w-4.5 h-4.5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.746 3.746 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
              Mark All as Read
            </button>
          )}

        </div>

        {/* Tab Filters row */}
        <div className="flex flex-wrap gap-2.5 mb-8 border-b border-slate-100 pb-5 select-none">
          <button
            onClick={() => setActiveTab("all")}
            className={`font-bold text-sm px-6 py-2.5 rounded-full border border-solid transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-[#0d2a3a] border-[#0d2a3a] text-white shadow-sm"
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            All Alerts ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab("unread")}
            className={`font-bold text-sm px-6 py-2.5 rounded-full border border-solid transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "unread"
                ? "bg-sky-500 border-sky-500 text-white shadow-sm"
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            Unread
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              activeTab === "unread" ? "bg-white/20 text-white" : "bg-red-500 text-white"
            }`}>
              {notifications.filter((n) => !readIds.includes(n.id)).length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("urgent")}
            className={`font-bold text-sm px-6 py-2.5 rounded-full border border-solid transition-all cursor-pointer ${
              activeTab === "urgent"
                ? "bg-red-500 border-red-500 text-white shadow-sm"
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            Urgent ({notifications.filter((n) => n.type === "urgent").length})
          </button>
          <button
            onClick={() => setActiveTab("approved")}
            className={`font-bold text-sm px-6 py-2.5 rounded-full border border-solid transition-all cursor-pointer ${
              activeTab === "approved"
                ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            Approvals ({notifications.filter((n) => n.type === "approved").length})
          </button>
          <button
            onClick={() => setActiveTab("status")}
            className={`font-bold text-sm px-6 py-2.5 rounded-full border border-solid transition-all cursor-pointer ${
              activeTab === "status"
                ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            Status Updates ({notifications.filter((n) => n.type === "status").length})
          </button>
        </div>

        {/* Notifications Container */}
        <div className="flex flex-col gap-5 mb-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border border-slate-200 rounded-[30px] gap-4">
              <svg className="animate-spin h-8 w-8 text-[#0284c7]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-slate-500 font-semibold text-sm">Fetching notifications...</p>
            </div>
          ) : filteredNotifs.length > 0 ? (
            <div className="flex flex-col gap-4.5">
              {filteredNotifs.map((n) => {
                const isUrgent = n.type === "urgent";
                const isApproved = n.type === "approved";
                const isRead = readIds.includes(n.id);

                let borderLeft = "border-l-[6px] border-l-sky-500";
                let iconStyle = "bg-sky-50 text-sky-500";
                let iconSvg = (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                );

                if (isUrgent) {
                  borderLeft = "border-l-[6px] border-l-red-500";
                  iconStyle = "bg-red-50 text-red-500";
                  iconSvg = (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
                    </svg>
                  );
                } else if (isApproved) {
                  borderLeft = "border-l-[6px] border-l-emerald-500";
                  iconStyle = "bg-emerald-50 text-emerald-500";
                  iconSvg = (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  );
                }

                if (isRead) {
                  borderLeft = "border-l-[6px] border-l-slate-300";
                }

                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      // Clicking the notification card opens the claim detail popup modal
                      setSelectedClaim(n.claim);
                      markAsRead(n.id);
                    }}
                    className={`bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-md transition-all duration-200 cursor-pointer ${borderLeft}`}
                  >
                    {/* Top Row with detail info */}
                    <div className="p-6 md:p-8 flex items-start gap-4">
                      
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconStyle}`}>
                        {iconSvg}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h4 className={`font-bold text-slate-800 text-base md:text-lg leading-snug ${isRead ? "opacity-75" : ""}`}>
                            {n.title}
                          </h4>
                          
                          {/* Unread indicator dot */}
                          {!isRead && (
                            <span className="w-2.5 h-2.5 bg-sky-500 rounded-full border border-white" title="Unread Alert" />
                          )}
                        </div>

                        <p className="text-slate-600 text-sm md:text-base font-semibold leading-relaxed mt-2.5">
                          {n.description}
                        </p>
                        {n.subText && (
                          <p className="text-xs text-slate-500 font-medium italic mt-2.5">
                            * {n.subText}
                          </p>
                        )}
                      </div>

                    </div>

                    {/* Bottom Actions footer */}
                    <div
                      onClick={(e) => e.stopPropagation()} // Stop propagation so clicking buttons doesn't trigger modal popup
                      className="bg-slate-50/50 px-6 py-4.5 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
                    >
                      <div className="flex flex-wrap items-center gap-3.5 pl-0 md:pl-14">
                        {n.actionLabel === "View" ? (
                          <button
                            onClick={() => {
                              setSelectedClaim(n.claim);
                              markAsRead(n.id);
                            }}
                            className={`font-bold text-xs md:text-sm px-6 py-2.5 rounded-full transition-all duration-150 active:scale-[0.98] text-center cursor-pointer border-none ${
                              isApproved
                                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                : "bg-[#0d2a3a] hover:bg-[#0284c7] text-white"
                            }`}
                          >
                            View
                          </button>
                        ) : (
                          <Link
                            href={n.link}
                            className={`font-bold text-xs md:text-sm px-6 py-2.5 rounded-full transition-all duration-150 active:scale-[0.98] text-center no-underline ${
                              isUrgent
                                ? "bg-red-500 hover:bg-red-600 text-white"
                                : isApproved
                                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                : "bg-[#0d2a3a] hover:bg-[#0284c7] text-white"
                            }`}
                          >
                            {n.actionLabel}
                          </Link>
                        )}

                        {/* Read/Unread toggler button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleReadStatus(n.id);
                          }}
                          className="bg-transparent hover:bg-slate-200/50 border border-solid border-slate-300 hover:border-slate-400 text-slate-600 font-bold text-xs px-5 py-2.5 rounded-full cursor-pointer transition-all duration-150 active:scale-[0.98]"
                        >
                          {isRead ? "Mark as Unread" : "Mark as Read"}
                        </button>
                      </div>
                      <span className="text-xs text-slate-400 font-bold self-end sm:sm:self-center pr-2">
                        {n.date}
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty state block matching original style */
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-[30px] gap-6 text-center px-8 shadow-sm">
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0M3.124 7.5A8.969 8.969 0 015.292 3m13.416 0a8.969 8.969 0 012.168 4.5" />
                </svg>
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-lg">No Notifications Found</h4>
                <p className="text-slate-500 font-semibold text-sm max-w-sm mt-2 leading-relaxed">
                  We couldn't find any notifications matching the selected tab criteria or search keywords.
                </p>
              </div>
            </div>
          )}
        </div>

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
                    <ul className="list-none flex flex-col gap-3 mb-4 pl-1">
                      {getUserRequestedDocs(selectedClaim).map((doc) => {
                        const note = getDocRequestNote(selectedClaim, doc);
                        return (
                          <li key={doc} className="flex items-start gap-2 text-[#aa4f4f] font-bold text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#df3d3d] flex-shrink-0 mt-1.5" />
                            <div className="flex flex-col">
                              <span>{doc}</span>
                              {note && (
                                <span className="text-[11px] font-medium text-slate-500 italic mt-0.5">
                                  Note: "{note}"
                                </span>
                              )}
                            </div>
                          </li>
                        );
                      })}
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
