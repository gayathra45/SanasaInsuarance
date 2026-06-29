"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "@/app/config";
import AdminNavbar from "@/app/Components/Admin/Navbar";
import AdminFooter from "@/app/Components/Admin/Footer";
import Link from "next/link";

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
  messages?: ClaimMessage[];
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
  engineNumber?: string;
  chassisNumber?: string;
  status?: string;
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
  status: string;
  vehicles?: Vehicle[];
  documents?: {
    nicFront?: string;
    nicBack?: string;
    vehicleReg?: string;
    revenueLicense?: string;
  };
  createdAt: string;
}

interface Agent {
  _id: string;
  agentId: string;
  name: string;
  email: string;
  nic: string;
  address: string;
  dob: string;
  branch: string;
  phone?: string;
  city?: string;
  province?: string;
  bankName?: string;
  bankBranch?: string;
  accountNumber?: string;
  accountType?: string;
  accountHolderName?: string;
  nicFront?: string;
  nicBack?: string;
  birthCertificate?: string;
  policeReport?: string;
  status: string;
  availability: string;
  createdAt: string;
}

interface NotificationItem {
  id: string;
  type: "urgent" | "action" | "decision" | "info" | "staff_message";
  category: "claims" | "policy_holders" | "agents" | "staff_messages";
  title: string;
  description: string;
  date: string;
  isUrgent: boolean;
  link: string;
  actionLabel: string;
  claim?: Claim;
  user?: User;
  vehicle?: Vehicle;
  agent?: Agent;
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

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filteredNotifs, setFilteredNotifs] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read" | "claims" | "policy_holders" | "agents" | "staff_messages">("all");
  const [readIds, setReadIds] = useState<string[]>([]);
  
  // Selected details modals state
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // 1. Initial load
  useEffect(() => {
    fetchNotifications();

    if (typeof window !== "undefined") {
      const savedReadIds = localStorage.getItem("admin_read_notification_ids");
      if (savedReadIds) {
        try {
          setReadIds(JSON.parse(savedReadIds));
        } catch (e) {
          console.error("Failed to load read notification IDs", e);
        }
      }
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/admin/notifications`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
          setFilteredNotifs(data.notifications);
        }
      }
    } catch (err) {
      console.error("Error fetching admin notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // Lock background scroll when modal is open
  useEffect(() => {
    if (selectedClaim || selectedUser || selectedAgent) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedClaim, selectedUser, selectedAgent]);

  // 2. Read/unread actions
  const toggleReadStatus = (id: string) => {
    let updatedReadIds = [...readIds];
    if (readIds.includes(id)) {
      updatedReadIds = updatedReadIds.filter((item) => item !== id);
    } else {
      updatedReadIds.push(id);
    }
    setReadIds(updatedReadIds);
    localStorage.setItem("admin_read_notification_ids", JSON.stringify(updatedReadIds));
  };

  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      localStorage.setItem("admin_read_notification_ids", JSON.stringify(updated));
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    localStorage.setItem("admin_read_notification_ids", JSON.stringify(allIds));
  };

  // 3. Filtering logic
  useEffect(() => {
    let result = notifications;

    // Filter by Tab
    if (activeTab === "unread") {
      result = notifications.filter((n) => !readIds.includes(n.id));
    } else if (activeTab === "read") {
      result = notifications.filter((n) => readIds.includes(n.id));
    } else if (activeTab === "claims") {
      result = notifications.filter((n) => n.category === "claims");
    } else if (activeTab === "policy_holders") {
      result = notifications.filter((n) => n.category === "policy_holders");
    } else if (activeTab === "agents") {
      result = notifications.filter((n) => n.category === "agents");
    } else if (activeTab === "staff_messages") {
      result = notifications.filter((n) => n.category === "staff_messages");
    }

    // Filter by Search Query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q)
      );
    }

    setFilteredNotifs(result);
  }, [activeTab, searchQuery, notifications, readIds]);

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      <div className="flex flex-1 flex-row min-h-0">
        {/* Left Sidebar */}
        <AdminNavbar />

        {/* Right Main Container */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Welcome Bar */}
          <header className="bg-[#f59e0b] text-white px-8 py-4 flex justify-between items-center select-none shadow-sm flex-shrink-0 h-[80px]">
            <h1 className="text-xl font-bold tracking-wide">Admin Notifications Panel</h1>
            <div className="flex items-center gap-5">
              {/* User Avatar Icon */}
              <button className="relative p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
                  <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12c0 2.754 1.14 5.244 2.98 7.03-.028-.01-.053-.024-.082-.031a.75.75 0 0 1-.502-.879C5.556 14.931 8.193 12 12 12s6.444 2.931 7.352 6.12a.75.75 0 0 1-.502.88c-.029.007-.054.02-.082.031ZM12 11.25a3.375 3.375 0 1 0 0-6.75 3.375 3.375 0 0 0 0 6.75Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </header>

          {/* Page Content notifications */}
          <main className="flex-1 p-8 bg-white overflow-y-auto">
            {/* Search and Action Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6 mb-8 select-none">
              {/* Search Bar */}
              <div className="relative w-full max-w-[420px] bg-slate-50 hover:bg-white focus-within:bg-white border border-slate-200 rounded-full pl-5 pr-2.5 py-2 flex items-center gap-3 transition-all duration-200 shadow-sm focus-within:shadow-md focus-within:border-[#f59e0b] focus-within:ring-4 focus-within:ring-[#f59e0b]/10">
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
                  className="bg-[#f59e0b] hover:bg-[#d97706] active:scale-95 text-white py-2 px-5 rounded-full text-xs font-bold transition-all duration-150 border-none cursor-pointer flex items-center justify-center shadow-md shadow-[#f59e0b]/20"
                >
                  Search
                </button>
              </div>

              {/* Mark All As Read Button */}
              {notifications.some((n) => !readIds.includes(n.id)) && (
                <button
                  onClick={markAllAsRead}
                  className="bg-slate-100 hover:bg-slate-200 border-none text-slate-700 font-bold text-xs px-6 py-3 rounded-full transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-center"
                >
                  <svg className="w-4.5 h-4.5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.746 3.746 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  </svg>
                  Mark All as Read
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2.5 mb-8 border-b border-slate-100 pb-5 select-none">
              <button
                onClick={() => setActiveTab("all")}
                className={`font-bold text-sm px-6 py-2.5 rounded-full border border-solid transition-all cursor-pointer ${
                  activeTab === "all"
                    ? "bg-[#1a365d] border-[#1a365d] text-white shadow-sm"
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                All Alerts ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab("unread")}
                className={`font-bold text-sm px-6 py-2.5 rounded-full border border-solid transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "unread"
                    ? "bg-[#f59e0b] border-[#f59e0b] text-white shadow-sm"
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
                onClick={() => setActiveTab("claims")}
                className={`font-bold text-sm px-6 py-2.5 rounded-full border border-solid transition-all cursor-pointer ${
                  activeTab === "claims"
                    ? "bg-[#3b82f6] border-[#3b82f6] text-white shadow-sm"
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                Claims ({notifications.filter((n) => n.category === "claims").length})
              </button>
              <button
                onClick={() => setActiveTab("policy_holders")}
                className={`font-bold text-sm px-6 py-2.5 rounded-full border border-solid transition-all cursor-pointer ${
                  activeTab === "policy_holders"
                    ? "bg-[#10b981] border-[#10b981] text-white shadow-sm"
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                Policy Holders ({notifications.filter((n) => n.category === "policy_holders").length})
              </button>
              <button
                onClick={() => setActiveTab("agents")}
                className={`font-bold text-sm px-6 py-2.5 rounded-full border border-solid transition-all cursor-pointer ${
                  activeTab === "agents"
                    ? "bg-[#a855f7] border-[#a855f7] text-white shadow-sm"
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                Agents ({notifications.filter((n) => n.category === "agents").length})
              </button>
              <button
                onClick={() => setActiveTab("staff_messages")}
                className={`font-bold text-sm px-6 py-2.5 rounded-full border border-solid transition-all cursor-pointer ${
                  activeTab === "staff_messages"
                    ? "bg-purple-600 border-purple-600 text-white shadow-sm"
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                Staff Messages ({notifications.filter((n) => n.category === "staff_messages").length})
              </button>
            </div>

            {/* List Content */}
            <div className="flex flex-col gap-5 mb-10">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border border-slate-200 rounded-[30px] gap-4">
                  <svg className="animate-spin h-8 w-8 text-[#f59e0b]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-slate-500 font-semibold text-sm">Fetching notifications...</p>
                </div>
              ) : filteredNotifs.length > 0 ? (
                <div className="flex flex-col gap-4.5">
                  {filteredNotifs.map((n) => {
                    const isRead = readIds.includes(n.id);
                    const isUrgent = n.type === "urgent";

                    let borderLeft = "border-l-[6px] border-l-slate-400";
                    let iconStyle = "bg-slate-50 text-slate-500";
                    let iconSvg = (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                    );

                    if (n.category === "claims") {
                      if (isUrgent) {
                        borderLeft = "border-l-[6px] border-l-red-500";
                        iconStyle = "bg-red-50 text-red-500";
                      } else {
                        borderLeft = "border-l-[6px] border-l-blue-500";
                        iconStyle = "bg-blue-50 text-blue-500";
                        iconSvg = (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        );
                      }
                    } else if (n.category === "policy_holders") {
                      borderLeft = "border-l-[6px] border-l-emerald-500";
                      iconStyle = "bg-emerald-50 text-emerald-500";
                      iconSvg = (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      );
                    } else if (n.category === "agents") {
                      borderLeft = "border-l-[6px] border-l-purple-500";
                      iconStyle = "bg-purple-50 text-purple-500";
                      iconSvg = (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.74-3.53 9.094 9.094 0 00-3.74-3.53M6 18.72A9.094 9.094 0 012.26 15.19 9.094 9.094 0 016 11.66M12 18.75a6.75 6.75 0 100-13.5 6.75 6.75 0 000 13.5z" />
                        </svg>
                      );
                    } else if (n.category === "staff_messages") {
                      borderLeft = "border-l-[6px] border-l-pink-500";
                      iconStyle = "bg-pink-50 text-pink-500";
                      iconSvg = (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501c1.153-.086 2.294-.213 3.423-.379 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v5.018z" />
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
                          markAsRead(n.id);
                          if (n.claim) {
                            setSelectedClaim(n.claim);
                          } else if (n.user) {
                            setSelectedUser(n.user);
                            setSelectedVehicle(n.vehicle || null);
                          } else if (n.agent) {
                            setSelectedAgent(n.agent);
                          }
                        }}
                        className={`bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-md transition-all duration-200 cursor-pointer ${borderLeft}`}
                      >
                        {/* Upper info section */}
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
                                <span className="w-2.5 h-2.5 bg-[#f59e0b] rounded-full border border-white" title="Unread Alert" />
                              )}
                            </div>
                            <p className="text-slate-600 text-sm md:text-base font-semibold leading-relaxed mt-2.5">
                              {n.description}
                            </p>
                          </div>
                        </div>

                        {/* Lower Action section */}
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="bg-slate-50/50 px-6 py-4.5 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
                        >
                          <div className="flex flex-wrap items-center gap-3.5 pl-0 md:pl-14">
                            <button
                              onClick={() => {
                                markAsRead(n.id);
                                if (n.claim) {
                                  setSelectedClaim(n.claim);
                                } else if (n.user) {
                                  setSelectedUser(n.user);
                                  setSelectedVehicle(n.vehicle || null);
                                } else if (n.agent) {
                                  setSelectedAgent(n.agent);
                                }
                              }}
                              className={`font-bold text-xs md:text-sm px-6 py-2.5 rounded-full transition-all duration-150 active:scale-[0.98] text-center cursor-pointer border-none text-white ${
                                n.category === "claims"
                                  ? (isUrgent ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700")
                                  : n.category === "policy_holders"
                                  ? "bg-emerald-600 hover:bg-emerald-700"
                                  : "bg-purple-600 hover:bg-purple-700"
                              }`}
                            >
                              {n.actionLabel}
                            </button>

                            {/* Mark read toggle */}
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
                            {formatDate(n.date)}
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
                      We couldn't find any notifications matching the selected tab criteria or search keywords.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Floating Support Button */}
      <button className="fixed bottom-24 right-8 w-14 h-14 bg-[#00ddff] hover:bg-[#00cceb] text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer z-50">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
          <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75 0 1.776.476 3.44 1.307 4.887L2.14 21.64a.75.75 0 0 0 .935.935l4.753-1.428A9.702 9.702 0 0 0 12 21.75c5.385 0 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-3 9.75a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm3.75 0a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm3.75 0a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" />
        </svg>
      </button>

      {/* 1. Claim Detail Modal Popup */}
      {selectedClaim && (() => {
        let currentStep = selectedClaim.currentStep || 1;
        if (!selectedClaim.currentStep) {
          const s = selectedClaim.status.toLowerCase();
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-slate-200 rounded-[24px] w-full max-w-[720px] max-h-[90vh] shadow-2xl flex flex-col relative overflow-hidden animate-fade-in">
              <div className="flex justify-between items-center px-8 pt-6 pb-4 border-b border-slate-200 flex-shrink-0">
                <h2 className="text-[22px] font-extrabold text-[#1a365d] tracking-tight">
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
                {/* Wizard Tracker */}
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

                    let circleClass = "border-slate-300 text-slate-400 bg-white";
                    if (isCompleted) {
                      circleClass = "border-[#00b050] text-[#00b050] bg-white";
                    } else if (isActive) {
                      circleClass = "border-blue-500 text-blue-500 bg-[#e8f0fe]";
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

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-5 text-[15px] font-semibold text-slate-700 mb-6 px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold w-28 shrink-0">Vehicle Plate:</span>
                    <span className="font-extrabold text-slate-800">{selectedClaim.vehiclePlate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold w-28 shrink-0">Damage Type:</span>
                    <span className="font-extrabold text-slate-800">{selectedClaim.damageType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold w-28 shrink-0">Est. Amount:</span>
                    <span className="font-extrabold text-slate-800">
                      {selectedClaim.amount ? `LKR ${selectedClaim.amount.toLocaleString()}` : "Pending"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold w-28 shrink-0">Incident Date:</span>
                    <span className="font-extrabold text-slate-800">{formatDate(selectedClaim.incidentDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold w-28 shrink-0">Branch:</span>
                    <span className="font-extrabold text-slate-800">{selectedClaim.branch}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold w-28 shrink-0">Assigned Agent:</span>
                    <span className="font-extrabold text-slate-800">{selectedClaim.assignedAgent || "Unassigned"}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <span className="text-slate-400 font-bold w-28 shrink-0">Location:</span>
                    <span className="font-extrabold text-slate-800">{selectedClaim.location}</span>
                  </div>
                </div>

                {/* Description */}
                {selectedClaim.description && (
                  <div className="px-2 mb-6">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Incident Description</p>
                    <p className="text-slate-600 text-sm font-medium leading-relaxed italic bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      "{selectedClaim.description}"
                    </p>
                  </div>
                )}

                {/* Messages */}
                <div className="px-2">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Claim Messages & Logs</p>
                  {selectedClaim.messages && selectedClaim.messages.length > 0 ? (
                    <div className="flex flex-col gap-2.5 max-h-[200px] overflow-y-auto pr-1">
                      {selectedClaim.messages.map((msg, index) => (
                        <div key={index} className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3.5 flex flex-col gap-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-extrabold text-[#1a365d]">{msg.sender}</span>
                            <span className="text-slate-400 font-semibold">{formatDate(msg.sentAt)}</span>
                          </div>
                          <p className="text-slate-700 text-xs font-semibold leading-relaxed m-0">{msg.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs italic font-medium bg-slate-50 border border-slate-100 rounded-xl p-3 m-0">No messages logged for this claim.</p>
                  )}
                </div>
              </div>

              <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex justify-end flex-shrink-0 gap-3">
                <Link
                  href={`/Admin/Claims?claimId=${selectedClaim.claimNumber}`}
                  className="bg-[#f59e0b] hover:bg-[#d97706] text-white font-extrabold text-[14px] px-6 py-2.5 rounded-full transition-all border-none cursor-pointer no-underline flex items-center justify-center"
                >
                  Manage Claim
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

      {/* 2. Registration/Vehicle Detail Modal Popup */}
      {selectedUser && (() => {
        const isVehicleView = selectedVehicle !== null;
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-slate-200 rounded-[24px] w-full max-w-[720px] max-h-[90vh] shadow-2xl flex flex-col relative overflow-hidden animate-fade-in">
              <div className="flex justify-between items-center px-8 pt-6 pb-4 border-b border-slate-200 flex-shrink-0">
                <h2 className="text-[22px] font-extrabold text-[#1a365d] tracking-tight">
                  {isVehicleView
                    ? `Vehicle Verification – ${selectedVehicle?.numberPlate}`
                    : `Portal Registration – ${selectedUser.firstName} ${selectedUser.lastName}`}
                </h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-slate-400 hover:text-slate-600 text-2xl font-bold border-none bg-transparent cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="p-8 flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-x-12 gap-y-5 text-[15px] font-semibold text-slate-700 mb-8 px-2">
                  <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                    <span className="text-slate-400 font-bold w-28 shrink-0">Name:</span>
                    <span className="font-extrabold text-slate-800">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                    <span className="text-slate-400 font-bold w-28 shrink-0">NIC:</span>
                    <span className="font-extrabold text-slate-800">{selectedUser.nic}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                    <span className="text-slate-400 font-bold w-28 shrink-0">Email:</span>
                    <span className="font-extrabold text-slate-800">{selectedUser.email}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                    <span className="text-slate-400 font-bold w-28 shrink-0">Mobile:</span>
                    <span className="font-extrabold text-slate-800">{selectedUser.mobile}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                    <span className="text-slate-400 font-bold w-28 shrink-0">Branch:</span>
                    <span className="font-extrabold text-slate-800">{selectedUser.branch}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                    <span className="text-slate-400 font-bold w-28 shrink-0">Ref Number:</span>
                    <span className="font-extrabold text-slate-800">{selectedUser.referenceNumber}</span>
                  </div>
                </div>

                {isVehicleView && selectedVehicle && (
                  <div className="bg-slate-50 border border-slate-200 rounded-[20px] p-6 mb-8">
                    <h3 className="text-sm font-extrabold text-[#1a365d] uppercase tracking-wider mb-4">Vehicle Details</h3>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold w-24 shrink-0">Plate:</span>
                        <span className="font-extrabold text-slate-800">{selectedVehicle.numberPlate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold w-24 shrink-0">Model:</span>
                        <span className="font-extrabold text-slate-800">{selectedVehicle.company} {selectedVehicle.model}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold w-24 shrink-0">Year:</span>
                        <span className="font-extrabold text-slate-800">{selectedVehicle.year}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold w-24 shrink-0">Policy:</span>
                        <span className="font-extrabold text-slate-800">{selectedVehicle.policyNumber}</span>
                      </div>
                      {selectedVehicle.engineNumber && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-bold w-24 shrink-0">Engine No:</span>
                          <span className="font-extrabold text-slate-800">{selectedVehicle.engineNumber}</span>
                        </div>
                      )}
                      {selectedVehicle.chassisNumber && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-bold w-24 shrink-0">Chassis No:</span>
                          <span className="font-extrabold text-slate-800">{selectedVehicle.chassisNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Documents Preview list */}
                {selectedUser.documents && (
                  <div className="px-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Verification Documents</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedUser.documents.nicFront && (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs text-slate-500 font-bold">NIC Front:</span>
                          <a
                            href={selectedUser.documents.nicFront}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs p-3.5 rounded-xl hover:bg-slate-200 text-center transition-colors no-underline block"
                          >
                            View NIC Front
                          </a>
                        </div>
                      )}
                      {selectedUser.documents.nicBack && (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs text-slate-500 font-bold">NIC Back:</span>
                          <a
                            href={selectedUser.documents.nicBack}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs p-3.5 rounded-xl hover:bg-slate-200 text-center transition-colors no-underline block"
                          >
                            View NIC Back
                          </a>
                        </div>
                      )}
                      {selectedUser.documents.vehicleReg && (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs text-slate-500 font-bold">Vehicle Reg:</span>
                          <a
                            href={selectedUser.documents.vehicleReg}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs p-3.5 rounded-xl hover:bg-slate-200 text-center transition-colors no-underline block"
                          >
                            View Vehicle Reg Document
                          </a>
                        </div>
                      )}
                      {selectedUser.documents.revenueLicense && (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs text-slate-500 font-bold">Revenue License:</span>
                          <a
                            href={selectedUser.documents.revenueLicense}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs p-3.5 rounded-xl hover:bg-slate-200 text-center transition-colors no-underline block"
                          >
                            View Revenue License
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex justify-end flex-shrink-0 gap-3">
                <Link
                  href={`/Admin/PolicyHolders?nic=${selectedUser.nic}`}
                  className="bg-[#f59e0b] hover:bg-[#d97706] text-white font-extrabold text-[14px] px-6 py-2.5 rounded-full transition-all border-none cursor-pointer no-underline flex items-center justify-center"
                >
                  Manage Profile
                </Link>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="bg-[#1a365d] hover:bg-[#0f223f] text-white font-extrabold text-[14px] px-8 py-2.5 rounded-full transition-all border-none cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 3. Agent Detail Modal Popup */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-[24px] w-full max-w-[720px] max-h-[90vh] shadow-2xl flex flex-col relative overflow-hidden animate-fade-in">
            <div className="flex justify-between items-center px-8 pt-6 pb-4 border-b border-slate-200 flex-shrink-0">
              <h2 className="text-[22px] font-extrabold text-[#1a365d] tracking-tight">
                Agent Details – {selectedAgent.name} ({selectedAgent.agentId})
              </h2>
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold border-none bg-transparent cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-8 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-x-12 gap-y-5 text-[15px] font-semibold text-slate-700 mb-8 px-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold w-24 shrink-0">Agent ID:</span>
                  <span className="font-extrabold text-slate-800">{selectedAgent.agentId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold w-24 shrink-0">NIC:</span>
                  <span className="font-extrabold text-slate-800">{selectedAgent.nic}</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <span className="text-slate-400 font-bold w-24 shrink-0">Email:</span>
                  <span className="font-extrabold text-slate-800">{selectedAgent.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold w-24 shrink-0">Phone:</span>
                  <span className="font-extrabold text-slate-800">{selectedAgent.phone || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold w-24 shrink-0">DOB:</span>
                  <span className="font-extrabold text-slate-800">{selectedAgent.dob}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold w-24 shrink-0">Branch:</span>
                  <span className="font-extrabold text-slate-800">{selectedAgent.branch}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold w-24 shrink-0">Status:</span>
                  <span className="font-extrabold text-red-500 uppercase">{selectedAgent.status}</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <span className="text-slate-400 font-bold w-24 shrink-0">Address:</span>
                  <span className="font-extrabold text-slate-800">{selectedAgent.address}</span>
                </div>
              </div>

              {/* Bank accounts information */}
              {(selectedAgent.bankName || selectedAgent.accountNumber) && (
                <div className="bg-slate-50 border border-slate-200 rounded-[20px] p-6 mb-8">
                  <h3 className="text-sm font-extrabold text-[#1a365d] uppercase tracking-wider mb-4">Bank Details</h3>
                  <div className="grid grid-cols-2 gap-y-4 text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold w-24 shrink-0">Bank:</span>
                      <span className="font-extrabold text-slate-800">{selectedAgent.bankName || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold w-24 shrink-0">Branch:</span>
                      <span className="font-extrabold text-slate-800">{selectedAgent.bankBranch || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold w-24 shrink-0">Acc No:</span>
                      <span className="font-extrabold text-slate-800">{selectedAgent.accountNumber || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold w-24 shrink-0">Holder:</span>
                      <span className="font-extrabold text-slate-800">{selectedAgent.accountHolderName || "N/A"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents preview */}
              <div className="px-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Agent Verification Documents</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedAgent.nicFront && (
                    <a
                      href={selectedAgent.nicFront}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs p-3.5 rounded-xl hover:bg-slate-200 text-center transition-colors no-underline block"
                    >
                      NIC Front
                    </a>
                  )}
                  {selectedAgent.nicBack && (
                    <a
                      href={selectedAgent.nicBack}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs p-3.5 rounded-xl hover:bg-slate-200 text-center transition-colors no-underline block"
                    >
                      NIC Back
                    </a>
                  )}
                  {selectedAgent.birthCertificate && (
                    <a
                      href={selectedAgent.birthCertificate}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs p-3.5 rounded-xl hover:bg-slate-200 text-center transition-colors no-underline block"
                    >
                      Birth Certificate
                    </a>
                  )}
                  {selectedAgent.policeReport && (
                    <a
                      href={selectedAgent.policeReport}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs p-3.5 rounded-xl hover:bg-slate-200 text-center transition-colors no-underline block"
                    >
                      Police Report
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex justify-end flex-shrink-0 gap-3">
              <Link
                href={`/Admin/Agents?email=${selectedAgent.email}`}
                className="bg-[#f59e0b] hover:bg-[#d97706] text-white font-extrabold text-[14px] px-6 py-2.5 rounded-full transition-all border-none cursor-pointer no-underline flex items-center justify-center"
              >
                Manage Agent
              </Link>
              <button
                onClick={() => setSelectedAgent(null)}
                className="bg-[#1a365d] hover:bg-[#0f223f] text-white font-extrabold text-[14px] px-8 py-2.5 rounded-full transition-all border-none cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Footer */}
      <AdminFooter />
    </div>
  );
}
