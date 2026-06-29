"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/app/Components/Agent/Navbar";
import Footer from "@/app/Components/Agent/Footer";
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
  vehicleModel?: string;
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
  severity: "Urgent" | "Medium" | "Low";
  messages: ClaimMessage[];
  priority?: string;
  inspectionReport?: string;
  inspectionSubmitted?: boolean;
  paymentReceipt?: string;
  additionalDocuments?: AdditionalDoc[];
  documentsRequested?: boolean;
  requestedDocuments?: string[];
  documentRequestTo?: string;
}

interface NotificationItem {
  id: string;
  type: "action" | "decision" | "info" | "message" | "staff_message" | "urgent";
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

export default function AgentNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filteredNotifs, setFilteredNotifs] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read" | "action" | "decision" | "message" | "staff_message">("all");
  const [agent, setAgent] = useState<{ name?: string; email?: string } | null>(null);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  // 1. Load Session & LocalStorage Read states
  useEffect(() => {
    if (typeof window !== "undefined") {
      const agentData = sessionStorage.getItem("logged_in_agent");
      if (agentData) {
        try {
          const parsed = JSON.parse(agentData);
          setAgent(parsed);
          if (parsed.email) {
            fetchNotifications(parsed.email);
          } else {
            setLoading(false);
          }
        } catch (err) {
          console.error("Error parsing logged_in_agent", err);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }

      const savedReadIds = localStorage.getItem("agent_read_notification_ids");
      if (savedReadIds) {
        try {
          setReadIds(JSON.parse(savedReadIds));
        } catch (e) {
          console.error("Failed to load read notification IDs", e);
        }
      }
    }
  }, []);

  const getSeverity = (damageType: string): "Urgent" | "Medium" | "Low" => {
    const type = (damageType || "").toLowerCase();
    if (type.includes("fire")) return "Urgent";
    if (type.includes("accident") || type.includes("crash")) return "Medium";
    return "Low";
  };

  const getRecipientForDoc = (claim: Claim, name: string) => {
    const msg = [...(claim.messages || [])]
      .reverse()
      .find(m => m.message && typeof m.message === "string" && m.message.includes(`Requested: ${name}`));
    if (msg && msg.message) {
      if (msg.message.includes("[Document Request to Agent]")) return "Agent";
      if (msg.message.includes("[Document Request to User]")) return "User";
    }
    return claim.documentRequestTo || "User";
  };

  const getAgentPendingRequests = (claim: Claim) => {
    if (!claim.requestedDocuments) return [];
    return claim.requestedDocuments.filter(name => {
      const isUploaded = (claim.additionalDocuments || []).some(
        doc => doc.name.trim().toLowerCase() === name.trim().toLowerCase() && doc.uploadedBy === "Agent"
      );
      if (isUploaded) return false;
      return getRecipientForDoc(claim, name) === "Agent";
    });
  };

  // 2. Fetch Assigned Claims and compile notifications dynamically
  const fetchNotifications = async (email: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/agent/claims?email=${email}`);
      if (!res.ok) throw new Error("Failed to fetch claims");
      const data: Claim[] = await res.json();
      
      const compiled: NotificationItem[] = [];

      data.forEach((claim) => {
        const dateFormatted = formatDate(claim.createdAt);
        const severity = getSeverity(claim.damageType);
        const isUrgent = severity === "Urgent";

        // 1. Pending Assignment Acceptance (currentStep = 2)
        if (claim.status !== "Approved" && claim.status !== "Rejected" && claim.currentStep === 2) {
          compiled.push({
            id: `${claim._id}-accept`,
            type: "action",
            title: `New Claim Assigned – acceptance required`,
            description: `Claim ${claim.claimNumber} for vehicle ${claim.vehiclePlate} has been assigned to you. Action required to accept this assignment.`,
            date: dateFormatted,
            isUrgent: true,
            link: `/Agent/Dashboard?claimId=${claim.claimNumber}`,
            actionLabel: "Accept Assignment",
            createdAtRaw: claim.createdAt,
            claim
          });
        }

        // 2. Scheduled Inspection (currentStep = 3 and inspectionSubmitted = false)
        if (claim.status !== "Approved" && claim.status !== "Rejected" && claim.currentStep === 3 && !claim.inspectionSubmitted) {
          compiled.push({
            id: `${claim._id}-inspection`,
            type: "action",
            title: `Vehicle Inspection Pending`,
            description: `Please perform a vehicle inspection and submit the report for claim ${claim.claimNumber} (${claim.vehiclePlate}).`,
            date: dateFormatted,
            isUrgent: isUrgent,
            link: `/Agent/Dashboard?claimId=${claim.claimNumber}`,
            actionLabel: "Submit Inspection",
            createdAtRaw: claim.createdAt,
            claim
          });
        }

        // 3. Pending Document Upload for Agent
        const pendingAgentDocs = getAgentPendingRequests(claim);
        if (claim.status !== "Approved" && claim.status !== "Rejected" && pendingAgentDocs.length > 0) {
          compiled.push({
            id: `${claim._id}-doc-request`,
            type: "urgent",
            title: `Document Upload Required`,
            description: `Staff has requested document(s): ${pendingAgentDocs.join(" & ")} for claim ${claim.claimNumber}.`,
            subText: "Please upload the requested specifications to proceed.",
            date: dateFormatted,
            isUrgent: true,
            link: `/Agent/Dashboard?claimId=${claim.claimNumber}`,
            actionLabel: "Upload Documents",
            createdAtRaw: claim.createdAt,
            claim
          });
        }

        // 4. Completed Claims Decision (Approved / Rejected)
        if (claim.status === "Approved" || claim.status === "Rejected") {
          compiled.push({
            id: `${claim._id}-completed`,
            type: "decision",
            title: `Claim ${claim.claimNumber} ${claim.status}`,
            description: `Your assigned claim for vehicle ${claim.vehiclePlate} has been finalized. Final Status: ${claim.status}.`,
            date: dateFormatted,
            isUrgent: false,
            link: `/Agent/Dashboard?claimId=${claim.claimNumber}`,
            actionLabel: "View Activity",
            createdAtRaw: claim.createdAt,
            claim
          });
        }

        // 5. New Messages from Policy Holder/Office Staff (Non-Agent messages)
        const userMessages = (claim.messages || []).filter(m => m.sender !== "Agent" && m.sender !== "Agent (You)");
        if (userMessages.length > 0) {
          const lastMsg = userMessages[userMessages.length - 1];
          const isDocRequest = lastMsg.message && typeof lastMsg.message === "string" && lastMsg.message.includes("[Document Request to Agent]");
          
          if (isDocRequest) {
            let docName = "requested specifications";
            const match = lastMsg.message.match(/Requested:\s*([^.]+)/);
            if (match && match[1]) {
              docName = match[1].trim();
            }
            compiled.push({
              id: `${claim._id}-doc-request-msg-${lastMsg.sentAt}`,
              type: "urgent",
              title: `Document Upload Required`,
              description: `Staff has requested document(s): ${docName} for claim ${claim.claimNumber}.`,
              subText: "Please upload the requested specifications to proceed.",
              date: formatDate(lastMsg.sentAt),
              isUrgent: true,
              link: `/Agent/Dashboard?claimId=${claim.claimNumber}`,
              actionLabel: "Upload Documents",
              createdAtRaw: lastMsg.sentAt,
              claim
            });
          } else {
            const senderLower = (lastMsg.sender || "").toLowerCase();
            const isStaff = senderLower.includes("staff") || senderLower.includes("office") || senderLower.includes("admin");

            if (isStaff) {
              compiled.push({
                id: `${claim._id}-staff-msg-${lastMsg.sentAt}`,
                type: "staff_message",
                title: `Message from Office Staff`,
                description: `Message regarding claim ${claim.claimNumber}: "${lastMsg.message}"`,
                date: formatDate(lastMsg.sentAt),
                isUrgent: false,
                link: `/Agent/Dashboard?claimId=${claim.claimNumber}`,
                actionLabel: "View",
                createdAtRaw: lastMsg.sentAt,
                claim
              });
            } else {
              compiled.push({
                id: `${claim._id}-msg-${lastMsg.sentAt}`,
                type: "message",
                title: `Message from Policy Holder`,
                description: `Message regarding claim ${claim.claimNumber}: "${lastMsg.message}"`,
                date: formatDate(lastMsg.sentAt),
                isUrgent: false,
                link: `/Agent/Dashboard?claimId=${claim.claimNumber}`,
                actionLabel: "View",
                createdAtRaw: lastMsg.sentAt,
                claim
              });
            }
          }
        }
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
      console.error("Error fetching agent notifications", err);
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
    localStorage.setItem("agent_read_notification_ids", JSON.stringify(updatedReadIds));
  };

  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      localStorage.setItem("agent_read_notification_ids", JSON.stringify(updated));
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    localStorage.setItem("agent_read_notification_ids", JSON.stringify(allIds));
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

  // Filtering Effect
  useEffect(() => {
    let result = notifications;

    if (activeTab === "unread") {
      result = notifications.filter((n) => !readIds.includes(n.id));
    } else if (activeTab === "read") {
      result = notifications.filter((n) => readIds.includes(n.id));
    } else if (activeTab === "action") {
      result = notifications.filter((n) => n.type === "action" || n.type === "urgent");
    } else if (activeTab === "decision") {
      result = notifications.filter((n) => n.type === "decision");
    } else if (activeTab === "message") {
      result = notifications.filter((n) => n.type === "message");
    } else if (activeTab === "staff_message") {
      result = notifications.filter((n) => n.type === "staff_message");
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
    <div className="min-h-screen bg-white flex flex-col font-sans relative">
      <Navbar />

      {/* Styled Curved Header Matching Mockup */}
      <div className="max-w-7xl w-full mx-auto px-6 md:px-16 mt-8 relative">
        <div className="absolute top-0 bottom-0 left-[calc(50%-50vw)] right-6 md:right-12 bg-[url('/newclaim1.webp')] bg-cover bg-center rounded-r-[75px] md:rounded-r-[95px] overflow-hidden shadow-md">
          {/* Overlay */}
          <div className="absolute inset-0 bg-slate-900/45" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-transparent" />
        </div>

        {/* Text Content */}
        <header className="relative z-10 h-[210px] flex flex-col justify-center pl-4 md:pl-8 select-none">
          <h1 className="text-white text-3xl md:text-[40px] font-bold tracking-tight leading-none">
            Notifications Center
          </h1>
          <p className="text-slate-200 text-xs md:text-sm font-semibold mt-3.5 tracking-wide opacity-95">
            {loading
              ? "Loading updates..."
              : notifications.length > 0
              ? `You have ${notifications.filter(n => !readIds.includes(n.id)).length} unread claim alerts`
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
              className="bg-[#0891b2] hover:bg-[#06738f] active:scale-95 text-white py-2 px-5 rounded-full text-xs font-bold transition-all duration-150 border-none cursor-pointer flex items-center justify-center shadow-md"
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
                ? "bg-[#0f172a] border-[#0f172a] text-white shadow-sm"
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            All Alerts ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab("unread")}
            className={`font-bold text-sm px-6 py-2.5 rounded-full border border-solid transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "unread"
                ? "bg-cyan-600 border-cyan-600 text-white shadow-sm"
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
            onClick={() => setActiveTab("read")}
            className={`font-bold text-sm px-6 py-2.5 rounded-full border border-solid transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "read"
                ? "bg-slate-600 border-slate-600 text-white shadow-sm"
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            Read
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              activeTab === "read" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
            }`}>
              {notifications.filter((n) => readIds.includes(n.id)).length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("action")}
            className={`font-bold text-sm px-6 py-2.5 rounded-full border border-solid transition-all cursor-pointer ${
              activeTab === "action"
                ? "bg-red-500 border-red-500 text-white shadow-sm"
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            Actions Required ({notifications.filter((n) => n.type === "action" || n.type === "urgent").length})
          </button>
          <button
            onClick={() => setActiveTab("decision")}
            className={`font-bold text-sm px-6 py-2.5 rounded-full border border-solid transition-all cursor-pointer ${
              activeTab === "decision"
                ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            Final Decisions ({notifications.filter((n) => n.type === "decision").length})
          </button>
          <button
            onClick={() => setActiveTab("message")}
            className={`font-bold text-sm px-6 py-2.5 rounded-full border border-solid transition-all cursor-pointer ${
              activeTab === "message"
                ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            Client Messages ({notifications.filter((n) => n.type === "message").length})
          </button>
          <button
            onClick={() => setActiveTab("staff_message")}
            className={`font-bold text-sm px-6 py-2.5 rounded-full border border-solid transition-all cursor-pointer ${
              activeTab === "staff_message"
                ? "bg-purple-600 border-purple-600 text-white shadow-sm"
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            Staff Messages ({notifications.filter((n) => n.type === "staff_message").length})
          </button>
        </div>

        {/* Notifications Container */}
        <div className="flex flex-col gap-5 mb-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border border-slate-200 rounded-[30px] gap-4">
              <svg className="animate-spin h-8 w-8 text-[#0891b2]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-slate-500 font-semibold text-sm">Fetching notifications...</p>
            </div>
          ) : filteredNotifs.length > 0 ? (
            <div className="flex flex-col gap-4.5">
              {filteredNotifs.map((n) => {
                const isUrgent = n.isUrgent;
                const isRead = readIds.includes(n.id);

                let borderLeft = "border-l-[6px] border-l-cyan-500";
                let iconStyle = "bg-cyan-50 text-cyan-500";
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
                } else if (n.type === "decision") {
                  borderLeft = "border-l-[6px] border-l-emerald-500";
                  iconStyle = "bg-emerald-50 text-emerald-500";
                  iconSvg = (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  );
                } else if (n.type === "staff_message") {
                  borderLeft = "border-l-[6px] border-l-purple-500";
                  iconStyle = "bg-purple-50 text-purple-500";
                  iconSvg = (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501c1.153-.086 2.294-.213 3.423-.379 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v5.018z" />
                    </svg>
                  );
                }

                if (n.id.includes("-doc-request")) {
                  iconSvg = (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
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
                      setSelectedClaim(n.claim);
                      markAsRead(n.id);
                    }}
                    className={`bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-md transition-all duration-200 cursor-pointer ${borderLeft}`}
                  >
                    <div className="p-6 md:p-8 flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconStyle}`}>
                        {iconSvg}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h4 className={`font-bold text-slate-800 text-base md:text-lg leading-snug ${isRead ? "opacity-75" : ""}`}>
                            {n.title}
                          </h4>
                          {!isRead && (
                            <span className="w-2.5 h-2.5 bg-cyan-500 rounded-full border border-white" title="Unread Alert" />
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

                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="bg-slate-50/50 px-6 py-4.5 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
                    >
                      <div className="flex flex-wrap items-center gap-3.5 pl-0 md:pl-14">
                        {n.actionLabel === "View" ? (
                          <button
                            onClick={() => {
                              setSelectedClaim(n.claim);
                              markAsRead(n.id);
                            }}
                            className="font-bold text-xs md:text-sm px-6 py-2.5 rounded-full transition-all duration-150 active:scale-[0.98] text-center cursor-pointer border-none bg-[#0f172a] hover:bg-[#0891b2] text-white"
                          >
                            View
                          </button>
                        ) : (
                          <Link
                            href={n.link}
                            className={`font-bold text-xs md:text-sm px-6 py-2.5 rounded-full transition-all duration-150 active:scale-[0.98] text-center no-underline ${
                              isUrgent
                                ? "bg-red-500 hover:bg-red-600 text-white"
                                : n.type === "decision"
                                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                : "bg-[#0f172a] hover:bg-[#0891b2] text-white"
                            }`}
                          >
                            {n.actionLabel}
                          </Link>
                        )}

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
                      <span className="text-xs text-slate-400 font-bold self-end sm:self-center pr-2">
                        {n.date}
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-[30px] gap-6 text-center px-8 shadow-sm">
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0M3.124 7.5A8.969 8.969 0 015.292 3m13.416 0a8.969 8.969 0 012.168 4.5" />
                </svg>
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-lg">No Notifications Found</h4>
                <p className="text-slate-500 font-semibold text-sm max-w-sm mt-2 leading-relaxed">
                  We couldn't find any alerts matching the tab filters or search keywords.
                </p>
              </div>
            </div>
          )}
        </div>

      </main>

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

              <div className="p-8 flex-1 overflow-y-auto">
                {renderClaimProgress(selectedClaim.status, selectedClaim.currentStep)}

                <div className="grid grid-cols-2 gap-x-12 gap-y-5 text-[15px] font-semibold text-slate-700 mb-6 px-2">
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

                {selectedClaim.inspectionReport && (
                  <div className="px-2 mb-6">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Submitted Inspection Report</p>
                    <p className="text-slate-600 text-sm font-medium leading-relaxed whitespace-pre-wrap bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      {selectedClaim.inspectionReport}
                    </p>
                  </div>
                )}

                <div className="px-2 mt-4 mb-2">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 select-none">Messages Log</p>
                  {selectedClaim.messages && selectedClaim.messages.length > 0 ? (
                    <div className="flex flex-col gap-2.5 max-h-[140px] overflow-y-auto pr-1">
                      {selectedClaim.messages.map((msg, index) => (
                        <div key={index} className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3.5 flex flex-col gap-1 shadow-sm">
                          <div className="flex justify-between items-center text-[11px] select-none">
                            <span className="font-extrabold text-[#0f2d3a]">{msg.sender}</span>
                            <span className="text-slate-400 font-semibold">{formatDate(msg.sentAt)}</span>
                          </div>
                          <p className="text-slate-700 text-xs font-semibold leading-relaxed m-0">
                            {msg.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs italic font-medium bg-slate-50 border border-slate-100 rounded-xl p-3 m-0 select-none">
                      No message history found for this claim.
                    </p>
                  )}
                </div>
              </div>

              <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center flex-shrink-0">
                <Link
                  href={`/Agent/Dashboard?claimId=${selectedClaim.claimNumber}`}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-full transition-all duration-150 no-underline shadow-sm"
                >
                  Manage Claim in Dashboard
                </Link>
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

      <Footer />
    </div>
  );
}
