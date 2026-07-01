"use client";

import React, { useState, useEffect } from "react";
import OfficeStaffNavbar from "@/app/Components/Office_Staff/Navbar";
import Link from "next/link";
import { API_URL } from "@/app/config";

interface ClaimMessage {
  sender: string;
  message: string;
  sentAt: string;
}

interface AdditionalDoc {
  name: string;
  url: string;
  uploadedAt: string;
  uploadedBy?: string;
}

interface Claim {
  _id: string;
  claimNumber: string;
  userNic: string;
  vehiclePlate: string;
  incidentDate: string;
  incidentTime: string;
  damageType: string;
  description: string;
  location: string;
  status: "Pending" | "In Progress" | "Approved" | "Rejected";
  branch: string;
  assignedAgent: string;
  amount: number | null;
  currentStep: number;
  createdAt: string;
  messages: ClaimMessage[];
  additionalDocuments?: AdditionalDoc[];
  inspectionSubmitted?: boolean;
}

interface Vehicle {
  numberPlate: string;
  vehicleType: string;
  year: string;
  company: string;
  model: string;
  policyNumber: string;
}

interface Registration {
  _id: string;
  firstName: string;
  lastName: string;
  nic: string;
  mobile: string;
  email: string;
  branch: string;
  referenceNumber: string;
  vehicles?: Vehicle[];
  createdAt: string;
}

interface NotificationItem {
  id: string;
  type: "action" | "decision" | "info" | "message" | "urgent";
  title: string;
  description: string;
  subText?: string;
  date: string;
  isUrgent: boolean;
  link: string;
  actionLabel: string;
  createdAtRaw?: string;
  claim?: Claim;
  registration?: Registration;
}

function formatDate(dateStr?: string | Date): string {
  if (!dateStr) return "Today";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return String(dateStr);
  }
}

export default function OfficeStaffNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filteredNotifs, setFilteredNotifs] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read" | "claims" | "registrations">("all");
  const [branch, setBranch] = useState("");
  const [readIds, setReadIds] = useState<string[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  // 1. Load Session & LocalStorage Read states
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedStaff = sessionStorage.getItem("logged_in_staff");
      if (savedStaff) {
        try {
          const parsed = JSON.parse(savedStaff);
          if (parsed.branch) {
            setBranch(parsed.branch);
            fetchNotificationsAndRegistrations(parsed.branch);
          } else {
            setLoading(false);
          }
        } catch (err) {
          console.error("Error parsing logged_in_staff", err);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }

      const savedReadIds = localStorage.getItem("office_staff_read_notification_ids");
      if (savedReadIds) {
        try {
          setReadIds(JSON.parse(savedReadIds));
        } catch (e) {
          console.error("Failed to load read notification IDs", e);
        }
      }
    }
  }, []);

  // 2. Fetch Claims & Registrations, compile notifications dynamically
  const fetchNotificationsAndRegistrations = async (branchName: string) => {
    try {
      setLoading(true);
      const cleanBranch = branchName.trim();
      
      // Fetch Claims
      const claimsRes = await fetch(`${API_URL}/office-staff/claims?branch=${cleanBranch}`);
      const claimsData = claimsRes.ok ? await claimsRes.json() : { claims: [] };
      const claimsList: Claim[] = claimsData.claims || [];

      // Fetch Registrations
      const regsRes = await fetch(`${API_URL}/office-staff/registrations?branch=${cleanBranch}`);
      const regsData = regsRes.ok ? await regsRes.json() : { registrations: [] };
      const registrationsList: Registration[] = regsData.registrations || [];

      const compiled: NotificationItem[] = [];

      // A. Process Claims Notifications
      claimsList.forEach((claim) => {
        const dateFormatted = formatDate(claim.createdAt);

        // 1. Unassigned Claims (Step = 1, assignedAgent is empty, status is Pending)
        if (claim.status === "Pending" && (!claim.assignedAgent || claim.assignedAgent.trim() === "")) {
          compiled.push({
            id: `${claim._id}-unassigned`,
            type: "urgent",
            title: `New Claim Awaiting Agent Assignment`,
            description: `Claim ${claim.claimNumber} for vehicle ${claim.vehiclePlate} has been registered and is waiting for an agent assignment.`,
            date: dateFormatted,
            isUrgent: true,
            link: `/Office_Staff/Claims?claimId=${claim.claimNumber}`,
            actionLabel: "Assign Agent",
            createdAtRaw: claim.createdAt,
            claim
          });
        }

        // 2. Inspection report submitted (Step = 3, inspectionSubmitted = true)
        if (claim.inspectionSubmitted && claim.status !== "Approved" && claim.status !== "Rejected") {
          compiled.push({
            id: `${claim._id}-inspection-submitted`,
            type: "action",
            title: `Inspection Report Submitted`,
            description: `Agent ${claim.assignedAgent || "assigned"} has uploaded the inspection report for claim ${claim.claimNumber}. Ready for review.`,
            date: dateFormatted,
            isUrgent: true,
            link: `/Office_Staff/Claims?claimId=${claim.claimNumber}`,
            actionLabel: "Review Assessment",
            createdAtRaw: claim.createdAt,
            claim
          });
        }

        // 3. New Document uploaded
        if (claim.additionalDocuments && claim.additionalDocuments.length > 0) {
          // Sort to find latest
          const docs = [...claim.additionalDocuments].sort(
            (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
          );
          const latestDoc = docs[0];
          compiled.push({
            id: `${claim._id}-doc-${latestDoc.name}-${latestDoc.uploadedAt}`,
            type: "info",
            title: `New Document Uploaded`,
            description: `Document "${latestDoc.name}" has been uploaded by ${latestDoc.uploadedBy || "User"} for claim ${claim.claimNumber}.`,
            date: formatDate(latestDoc.uploadedAt),
            isUrgent: false,
            link: `/Office_Staff/Claims?claimId=${claim.claimNumber}`,
            actionLabel: "View Document",
            createdAtRaw: latestDoc.uploadedAt,
            claim
          });
        }

        // 4. Client / Agent messages (Latest message not from staff)
        if (claim.messages && claim.messages.length > 0) {
          const lastMsg = claim.messages[claim.messages.length - 1];
          const messageSender = lastMsg.sender || "";
          const isFromStaff = messageSender.toLowerCase().includes("staff") || messageSender.toLowerCase().includes("office");
          if (!isFromStaff) {
            compiled.push({
              id: `${claim._id}-msg-${lastMsg.sentAt}`,
              type: "message",
              title: `New Message on Claim ${claim.claimNumber}`,
              description: `Latest from ${lastMsg.sender}: "${lastMsg.message}"`,
              date: formatDate(lastMsg.sentAt),
              isUrgent: false,
              link: `/Office_Staff/Claims?claimId=${claim.claimNumber}`,
              actionLabel: "Reply",
              createdAtRaw: lastMsg.sentAt,
              claim
            });
          }
        }
      });

      // B. Process Registrations Notifications (all fetched registrations are pending)
      registrationsList.forEach((reg) => {
        compiled.push({
          id: `${reg._id}-pending-reg`,
          type: "decision",
          title: `Pending Portal Registration`,
          description: `Policy Holder registration request from ${reg.firstName} ${reg.lastName} (NIC: ${reg.nic}) is awaiting branch approval.`,
          date: formatDate(reg.createdAt),
          isUrgent: false,
          link: `/Office_Staff/Registrations?ref=${reg.referenceNumber}`,
          actionLabel: "Review Registration",
          createdAtRaw: reg.createdAt,
          registration: reg
        });
      });

      // Sort: Urgent first, then newest first
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
      console.error("Error compilation of notifications", err);
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

  // Read/Unread Handler Actions
  const toggleReadStatus = (id: string) => {
    let updatedReadIds = [...readIds];
    if (readIds.includes(id)) {
      updatedReadIds = updatedReadIds.filter((item) => item !== id);
    } else {
      updatedReadIds.push(id);
    }
    setReadIds(updatedReadIds);
    localStorage.setItem("office_staff_read_notification_ids", JSON.stringify(updatedReadIds));
  };

  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      localStorage.setItem("office_staff_read_notification_ids", JSON.stringify(updated));
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    localStorage.setItem("office_staff_read_notification_ids", JSON.stringify(allIds));
  };

  const formatNumberPlate = (plate?: string): string => {
    if (!plate) return "";
    const cleaned = plate.trim();
    if (cleaned.includes("-")) return cleaned;
    const m = cleaned.match(/^(.*[A-Za-z]+)(\d+)$/);
    if (m) return `${m[1].trim().toUpperCase()}-${m[2]}`;
    return cleaned;
  };

  // Filtering Effect
  useEffect(() => {
    let result = notifications;

    if (activeTab === "unread") {
      result = notifications.filter((n) => !readIds.includes(n.id));
    } else if (activeTab === "read") {
      result = notifications.filter((n) => readIds.includes(n.id));
    } else if (activeTab === "claims") {
      result = notifications.filter((n) => !!n.claim);
    } else if (activeTab === "registrations") {
      result = notifications.filter((n) => !!n.registration);
    }

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
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <div className="flex flex-1 flex-row min-h-0">
        <OfficeStaffNavbar />

        {/* Main Spacious Container */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Header styled matching the Portal color themes */}
          <header className="bg-white border-b border-slate-100 text-slate-800 px-8 py-4 flex justify-between items-center select-none shadow-sm flex-shrink-0 h-[80px]">
            <h1 className="text-xl font-semibold text-slate-800 flex items-center gap-2"><span className="bg-[#102A43] text-white text-base px-3.5 py-1.5 rounded-xl font-black shadow-sm tracking-wide">{branch} Branch</span> — Notifications Center</h1>
            <div className="flex items-center gap-5">
              {/* Active notifications indicator count badge */}
              <div className="text-sm font-semibold bg-slate-100 px-4 py-1.5 rounded-full select-none text-slate-600 border border-slate-200">
                {notifications.filter(n => !readIds.includes(n.id)).length} unread alerts
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-8 bg-slate-50 overflow-y-auto max-w-6xl w-full mx-auto flex flex-col gap-6">
            
            {/* Top controls Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 select-none bg-white p-5 border border-slate-200 rounded-[24px] shadow-sm">
              {/* Search Bar */}
              <div className="relative w-full max-w-[420px] bg-slate-50 border border-slate-200 rounded-full pl-5 pr-2 py-2 flex items-center gap-3 transition-all duration-200 focus-within:bg-white focus-within:border-[#f59e0b] focus-within:ring-4 focus-within:ring-[#f59e0b]/10">
                <span className="text-slate-400 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-slate-800 text-[14px] placeholder-slate-400 focus:outline-none font-semibold"
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
              </div>

              {/* Mark All As Read */}
              {notifications.some(n => !readIds.includes(n.id)) && (
                <button
                  onClick={markAllAsRead}
                  className="bg-slate-100 hover:bg-slate-200 border-none text-slate-700 font-extrabold text-xs px-6 py-3 rounded-full transition-all cursor-pointer flex items-center gap-1.5 self-start md:self-center"
                >
                  <svg className="w-4.5 h-4.5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.746 3.746 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  </svg>
                  Mark All as Read
                </button>
              )}
            </div>

            {/* Tab Filters */}
            <div className="flex flex-wrap gap-2 mb-2 pb-1 select-none">
              <button
                onClick={() => setActiveTab("all")}
                className={`font-black text-xs px-5 py-2.5 rounded-full border border-solid transition-all cursor-pointer ${
                  activeTab === "all"
                    ? "bg-[#f59e0b] border-[#f59e0b] text-white shadow-sm"
                    : "bg-white hover:bg-slate-100 border-slate-200 text-slate-500"
                }`}
              >
                All Alerts ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab("unread")}
                className={`font-black text-xs px-5 py-2.5 rounded-full border border-solid transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "unread"
                    ? "bg-[#e08900] border-[#e08900] text-white shadow-sm"
                    : "bg-white hover:bg-slate-100 border-slate-200 text-slate-500"
                }`}
              >
                Unread
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  activeTab === "unread" ? "bg-white/20 text-white" : "bg-red-500 text-white"
                }`}>
                  {notifications.filter((n) => !readIds.includes(n.id)).length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("read")}
                className={`font-black text-xs px-5 py-2.5 rounded-full border border-solid transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "read"
                    ? "bg-slate-700 border-slate-700 text-white shadow-sm"
                    : "bg-white hover:bg-slate-100 border-slate-200 text-slate-500"
                }`}
              >
                Read
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  activeTab === "read" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {notifications.filter((n) => readIds.includes(n.id)).length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("claims")}
                className={`font-black text-xs px-5 py-2.5 rounded-full border border-solid transition-all cursor-pointer ${
                  activeTab === "claims"
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                    : "bg-white hover:bg-slate-100 border-slate-200 text-slate-500"
                }`}
              >
                Claims Updates ({notifications.filter((n) => !!n.claim).length})
              </button>
              <button
                onClick={() => setActiveTab("registrations")}
                className={`font-black text-xs px-5 py-2.5 rounded-full border border-solid transition-all cursor-pointer ${
                  activeTab === "registrations"
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                    : "bg-white hover:bg-slate-100 border-slate-200 text-slate-500"
                }`}
              >
                Policy Registrations ({notifications.filter((n) => !!n.registration).length})
              </button>
            </div>

            {/* Notifications Alert List */}
            <div className="flex flex-col gap-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-[28px] gap-4 shadow-sm">
                  <svg className="animate-spin h-8 w-8 text-[#f59e0b]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-slate-400 font-black text-sm">Loading alerts...</p>
                </div>
              ) : filteredNotifs.length > 0 ? (
                filteredNotifs.map((n) => {
                  const isUrgent = n.isUrgent;
                  const isRead = readIds.includes(n.id);

                  let borderLeft = "border-l-[6px] border-l-amber-500";
                  let iconStyle = "bg-amber-50 text-amber-600";
                  let iconSvg = (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  );

                  if (isUrgent) {
                    borderLeft = "border-l-[6px] border-l-red-500";
                    iconStyle = "bg-red-50 text-red-600";
                    iconSvg = (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
                      </svg>
                    );
                  } else if (n.type === "decision") {
                    borderLeft = "border-l-[6px] border-l-emerald-500";
                    iconStyle = "bg-emerald-50 text-emerald-600";
                    iconSvg = (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0zM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                      </svg>
                    );
                  } else if (n.type === "message") {
                    borderLeft = "border-l-[6px] border-l-blue-500";
                    iconStyle = "bg-blue-50 text-blue-600";
                    iconSvg = (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l3.055-3.643c.196-.29.516-.475.866-.501a41.8 41.8 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
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
                        if (n.claim) {
                          setSelectedClaim(n.claim);
                        } else if (n.registration) {
                          window.location.href = n.link;
                        }
                        markAsRead(n.id);
                      }}
                      className={`bg-white rounded-[24px] border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${borderLeft}`}
                    >
                      <div className="p-6 md:p-7 flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconStyle}`}>
                          {iconSvg}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h4 className={`font-black text-slate-800 text-base md:text-md leading-snug ${isRead ? "opacity-75" : ""}`}>
                              {n.title}
                            </h4>
                            {!isRead && (
                              <span className="w-2 h-2 bg-[#f59e0b] rounded-full border border-white" title="Unread Alert" />
                            )}
                          </div>

                          <p className="text-slate-500 text-sm font-semibold leading-relaxed mt-2">
                            {n.description}
                          </p>
                        </div>
                      </div>

                      {/* Footer Actions row */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-slate-50/50 px-6 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
                      >
                        <div className="flex flex-wrap items-center gap-3 pl-0 md:pl-14">
                          <Link
                            href={n.link}
                            onClick={() => markAsRead(n.id)}
                            className={`font-black text-xs px-5 py-2 rounded-full transition-all duration-150 active:scale-[0.98] text-center no-underline ${
                              isUrgent
                                ? "bg-red-500 hover:bg-red-600 text-white"
                                : n.type === "decision"
                                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                : "bg-slate-800 hover:bg-slate-900 text-white"
                            }`}
                          >
                            {n.actionLabel}
                          </Link>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleReadStatus(n.id);
                            }}
                            className="bg-transparent hover:bg-slate-200/50 border border-solid border-slate-300 hover:border-slate-400 text-slate-500 font-extrabold text-xs px-4 py-2 rounded-full cursor-pointer transition-all duration-150 active:scale-[0.98]"
                          >
                            {isRead ? "Mark as Unread" : "Mark as Read"}
                          </button>
                        </div>
                        <span className="text-[11px] text-slate-400 font-bold self-end sm:self-center pr-2">
                          {n.date}
                        </span>
                      </div>

                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-[28px] gap-6 text-center px-8 shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0M3.124 7.5A8.969 8.969 0 015.292 3m13.416 0a8.969 8.969 0 012.168 4.5" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-700 text-lg">No Notifications Found</h4>
                    <p className="text-slate-400 font-semibold text-sm max-w-sm mt-2 leading-relaxed">
                      We couldn't find any updates or requests matching the current filters or query.
                    </p>
                  </div>
                </div>
              )}
            </div>

          </main>
        </div>
      </div>

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
              <div className="absolute top-[40px] left-[52px] right-[52px] h-[3px] bg-slate-200 z-0" />
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
              
              <div className="flex justify-between items-center px-8 pt-6 pb-4 border-b border-slate-200 flex-shrink-0">
                <h2 className="text-[20px] font-black text-slate-800 tracking-tight leading-none">
                  Claim Details – {selectedClaim.claimNumber}
                </h2>
                <button
                  onClick={() => setSelectedClaim(null)}
                  className="text-slate-400 hover:text-slate-600 text-2xl font-bold border-none bg-transparent cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="p-8 flex-1 overflow-y-auto">
                {renderClaimProgress(selectedClaim.status, selectedClaim.currentStep)}

                <div className="grid grid-cols-2 gap-x-12 gap-y-5 text-[14px] font-semibold text-slate-600 mb-6 px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold w-28 shrink-0">Vehicle Plate:</span>
                    <span className="font-extrabold text-slate-800">{formatNumberPlate(selectedClaim.vehiclePlate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold w-28 shrink-0">Damage Type:</span>
                    <span className="font-extrabold text-slate-800">{selectedClaim.damageType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold w-28 shrink-0">Evaluated Amount:</span>
                    <span className="font-extrabold text-slate-800">
                      {selectedClaim.amount ? `LKR ${selectedClaim.amount.toLocaleString()}` : "Not Evaluated"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold w-28 shrink-0">Incident Date:</span>
                    <span className="font-extrabold text-slate-800">{formatDate(selectedClaim.incidentDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold w-28 shrink-0">Policy Holder NIC:</span>
                    <span className="font-extrabold text-slate-800">{selectedClaim.userNic}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold w-28 shrink-0">Location:</span>
                    <span className="font-extrabold text-slate-800">{selectedClaim.location || "N/A"}</span>
                  </div>
                </div>

                {selectedClaim.description && (
                  <div className="px-2 mb-6">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Incident Description</p>
                    <p className="text-slate-600 text-sm font-medium leading-relaxed italic bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      "{selectedClaim.description}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
