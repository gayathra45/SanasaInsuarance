"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OfficeStaffNavbar from "@/app/Components/Office Staff/Navbar";
import OfficeStaffFooter from "@/app/Components/Office Staff/Footer";
import { API_URL } from "@/app/config";

interface ClaimMessage {
  sender: string;
  message: string;
  sentAt: string;
  _id?: string;
}

interface AdditionalDoc {
  name: string;
  url: string;
  uploadedAt: string;
  _id?: string;
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
  status: string;
  branch: string;
  assignedAgent: string;
  amount: number | null;
  currentStep: number;
  documentsRequested: boolean;
  requestedDocuments: string[];
  messages: ClaimMessage[];
  additionalDocuments: AdditionalDoc[];
  accidentPhotos?: {
    front: string[];
    rear: string[];
    side: string[];
  };
  drivingLicense?: {
    front: string[];
    rear: string[];
  };
  createdAt: string;
  priority?: string;
}

interface PolicyHolder {
  _id: string;
  firstName: string;
  lastName: string;
  nic: string;
  mobile: string;
  email: string;
}

interface Agent {
  _id: string;
  agentId: string;
  name: string;
  email: string;
  branch: string;
  phone?: string;
}

export default function OfficeStaffClaimsPage() {
  const router = useRouter();
  const [branch, setBranch] = useState("");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [policyHolders, setPolicyHolders] = useState<PolicyHolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | "Pending" | "In Progress" | "Approved" | "Rejected">("All");

  // Modal / Detail / Action states
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<Claim | null>(null);
  const [selectedAgentEmail, setSelectedAgentEmail] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<"Normal" | "Urgent">("Normal");
  const [assignmentMessage, setAssignmentMessage] = useState("");

  // Edit / Input states inside Details Modal
  const [assessmentAmount, setAssessmentAmount] = useState<string>("");
  const [updatingClaim, setUpdatingClaim] = useState(false);
  const [newMessageText, setNewMessageText] = useState("");
  const [activeDetailsPanel, setActiveDetailsPanel] = useState<"tracking" | "request_docs" | null>(null);
  const [tempRequestedDocs, setTempRequestedDocs] = useState<string[]>([]);

  // Load claims and agents
  const loadClaimsAndAgents = async (currentBranch: string) => {
    try {
      setLoading(true);
      setError("");

      // 1. Fetch claims for this branch
      const claimsRes = await fetch(`${API_URL}/office-staff/claims?branch=${currentBranch}`);
      if (!claimsRes.ok) throw new Error("Failed to fetch claims.");
      const claimsData = await claimsRes.json();
      setClaims(claimsData.claims || []);

      // 2. Fetch agents for this branch (for assignment dropdown)
      const agentsRes = await fetch(`${API_URL}/office-staff/agents?branch=${currentBranch}`);
      if (agentsRes.ok) {
        const agentsData = await agentsRes.json();
        setAgents(agentsData.agents || []);
      }

      // 3. Fetch policy holders and registrations for user details lookups
      const phRes = await fetch(`${API_URL}/office-staff/policy-holders?branch=${currentBranch}`);
      const regsRes = await fetch(`${API_URL}/office-staff/registrations?branch=${currentBranch}`);
      
      let allUsers: PolicyHolder[] = [];
      if (phRes.ok) {
        const phData = await phRes.json();
        allUsers = [...allUsers, ...(phData.policyHolders || [])];
      }
      if (regsRes.ok) {
        const regsData = await regsRes.json();
        allUsers = [...allUsers, ...(regsData.registrations || [])];
      }
      setPolicyHolders(allUsers);
    } catch (err: any) {
      console.error("Load claims error:", err);
      setError(err.message || "Something went wrong loading claims.");
    } finally {
      setLoading(false);
    }
  };

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

    if (currentBranch) {
      loadClaimsAndAgents(currentBranch);
    }
  }, [router]);

  // Lock background scroll when modals are open
  useEffect(() => {
    const isAnyModalOpen = !!selectedClaim || !!previewImage || !!showAssignModal;
    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedClaim, previewImage, showAssignModal]);

  // Handle agent assignment
  const handleAssignAgent = async (
    claimNumber: string,
    agentEmail: string,
    priority: "Normal" | "Urgent" = "Normal",
    messageText: string = ""
  ) => {
    try {
      setUpdatingClaim(true);
      const res = await fetch(`${API_URL}/office-staff/claims/${claimNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedAgent: agentEmail,
          status: "In Progress", // Auto set status to In Progress on assignment
          priority,
          messageText: messageText.trim() || undefined,
          messageSender: "Office Staff"
        })
      });
      if (!res.ok) throw new Error("Failed to assign agent.");
      const data = await res.json();
      
      // Update local state
      setClaims(prev => prev.map(c => c.claimNumber === claimNumber ? data.claim : c));
      if (selectedClaim && selectedClaim.claimNumber === claimNumber) {
        setSelectedClaim(data.claim);
      }
      
      setShowAssignModal(null);
      setSelectedAgentEmail("");
      setSelectedPriority("Normal");
      setAssignmentMessage("");
      alert(`Agent assigned successfully!`);
    } catch (err: any) {
      alert(err.message || "Failed to assign agent.");
    } finally {
      setUpdatingClaim(false);
    }
  };

  // Handle general updates (status, amount, etc.)
  const handleUpdateClaim = async (claimNumber: string, updates: Partial<Claim> & { messageText?: string }) => {
    try {
      setUpdatingClaim(true);
      const res = await fetch(`${API_URL}/office-staff/claims/${claimNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updates,
          messageSender: "Office Staff"
        })
      });
      if (!res.ok) throw new Error("Failed to update claim details.");
      const data = await res.json();

      setClaims(prev => prev.map(c => c.claimNumber === claimNumber ? data.claim : c));
      setSelectedClaim(data.claim);
      setAssessmentAmount(data.claim.amount !== null ? data.claim.amount.toString() : "");
      setNewMessageText("");
    } catch (err: any) {
      alert(err.message || "Failed to update claim details.");
    } finally {
      setUpdatingClaim(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${date.getDate().toString().padStart(2, "0")} ${months[date.getMonth()]} ${date.getFullYear()}`;
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

  const getStatusStyle = (status: string, damageType: string = "", priority: string = "") => {
    switch (status.toLowerCase()) {
      case "pending":
        const dmgLower = damageType.toLowerCase();
        const isSevere = (priority && priority.toLowerCase() === "urgent") || dmgLower.includes("fully") || dmgLower.includes("severe") || dmgLower.includes("total") || dmgLower.includes("major") || dmgLower.includes("destruction") || dmgLower.includes("write-off");
        if (isSevere) {
          return "bg-orange-50 text-orange-600 border border-orange-200";
        }
        return "bg-purple-50 text-purple-600 border border-purple-200";
      case "in progress":
        return "bg-blue-50 text-blue-600 border border-blue-200";
      case "approved":
        return "bg-emerald-50 text-emerald-600 border border-emerald-200";
      case "rejected":
        return "bg-red-50 text-red-600 border border-red-200";
      default:
        return "bg-slate-50 text-slate-600 border border-slate-200";
    }
  };

  const getAgentName = (email: string) => {
    if (!email) return "";
    const agent = agents.find(a => a.email.toLowerCase().trim() === email.toLowerCase().trim());
    return agent ? agent.name : email;
  };

  const getPolicyHolderName = (nic: string) => {
    if (!nic) return "-";
    const user = policyHolders.find(u => u.nic.toLowerCase().trim() === nic.toLowerCase().trim());
    return user ? `${user.firstName} ${user.lastName}` : "Unknown Policy Holder";
  };

  const getPolicyHolderContact = (nic: string) => {
    if (!nic) return "-";
    const user = policyHolders.find(u => u.nic.toLowerCase().trim() === nic.toLowerCase().trim());
    return user ? user.mobile : "No Contact Info";
  };

  const getStepperSteps = (claim: Claim) => {
    const isAssigned = !!claim.assignedAgent;
    const isInspection = claim.currentStep >= 2 || claim.status === "In Progress" || claim.status === "Approved";
    const isReview = claim.currentStep >= 3 || claim.status === "Approved";
    const isDecision = claim.status === "Approved" || claim.status === "Rejected" || claim.currentStep >= 4;
    const isPayment = claim.status === "Approved" && claim.amount !== null;

    return [
      { num: "01", label: "Submitted", active: true },
      { num: "02", label: "Assigned", active: isAssigned },
      { num: "03", label: "Inspection", active: isInspection },
      { num: "04", label: "Review", active: isReview },
      { num: "05", label: "Decision", active: isDecision },
      { num: "06", label: "Payment", active: isPayment },
    ];
  };

  const getStepperPercent = (claim: Claim) => {
    const steps = getStepperSteps(claim);
    const activeCount = steps.filter(s => s.active).length;
    if (activeCount <= 1) return 0;
    return ((activeCount - 1) / 5) * 100;
  };

  // Filtering claims based on tabs and search query
  const filteredClaims = claims.filter(claim => {
    // 1. Filter by active tab
    if (activeTab === "Pending" && claim.status !== "Pending") return false;
    if (activeTab === "In Progress" && claim.status !== "In Progress") return false;
    if (activeTab === "Approved" && claim.status !== "Approved") return false;
    if (activeTab === "Rejected" && claim.status !== "Rejected") return false;

    // 2. Filter by search query (Claim Number, Plate, or NIC)
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    return (
      claim.claimNumber.toLowerCase().includes(query) ||
      claim.vehiclePlate.toLowerCase().includes(query) ||
      claim.userNic.toLowerCase().includes(query) ||
      claim.damageType.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <div className="flex flex-1 flex-row min-h-0">
        <OfficeStaffNavbar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header welcome bar */}
          <header className="bg-[#f59e0b] text-white px-8 py-4 flex justify-between items-center select-none shadow-sm flex-shrink-0 h-[80px]">
            <h1 className="text-xl font-bold tracking-wide">{branch} Branch — Claims Portal</h1>
            <div className="text-sm font-semibold bg-white/10 px-4 py-1.5 rounded-full">
              Staff Portal
            </div>
          </header>

          <main className="flex-1 p-8 bg-slate-50 overflow-y-auto">
            {loading ? (
              <div className="w-full h-full flex flex-col items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f59e0b]"></div>
                <span className="mt-4 text-slate-500 font-bold">Loading branch claims...</span>
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
                    Claims Management
                  </h2>
                  <span className="text-lg font-black text-slate-800">&gt;</span>
                </div>

                {/* Filters and Search Bar Container */}
                <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                  {/* Tabs */}
                  <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full md:w-auto">
                    {(["All", "Pending", "In Progress", "Approved", "Rejected"] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border-none outline-none cursor-pointer ${
                          activeTab === tab
                            ? "bg-[#0f2d4a] text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                        }`}
                      >
                        {tab} ({tab === "All" ? claims.length : claims.filter(c => c.status === tab).length})
                      </button>
                    ))}
                  </div>

                  {/* Search input */}
                  <div className="relative w-full md:w-80">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Claim No, Plate or NIC..."
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-slate-700 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d4a] focus:border-transparent transition-all"
                    />
                  </div>
                </div>                {/* Claims list */}
                {filteredClaims.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-[20px] p-12 text-center text-slate-400 font-bold select-none shadow-sm">
                    No claims found in {branch} Branch under active filters.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 animate-fade-in">
                    {/* Header Row for Desktop */}
                    <div className="hidden md:grid md:grid-cols-[1.3fr_0.9fr_1.4fr_1.3fr_2fr_1fr_0.9fr_1.5fr] items-center gap-4 px-5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider select-none border border-transparent border-l-4 border-l-transparent">
                      <div className="flex flex-col select-none min-w-0">Claim Info</div>
                      <div className="flex flex-col select-none min-w-0">Vehicle No</div>
                      <div className="flex flex-col select-none min-w-0">Damage Type</div>
                      <div className="flex flex-col select-none min-w-0">Location</div>
                      <div className="flex flex-col select-none min-w-0">Assigned Agent</div>
                      <div className="flex flex-col select-none min-w-0">Assessment</div>
                      <div className="flex flex-col select-none min-w-0">Status</div>
                      <div className="flex flex-col select-none min-w-0 text-right">Actions</div>
                    </div>

                    {filteredClaims.map((claim) => {
                      const isUrgent = claim.priority === "Urgent" || claim.damageType.toLowerCase().includes("severe") || claim.description.toLowerCase().includes("urgent");
                      return (
                        <div
                          key={claim._id}
                          onClick={() => {
                            setSelectedClaim(claim);
                            setAssessmentAmount(typeof claim.amount === "number" ? claim.amount.toString() : "");
                          }}
                          className={`bg-white border border-slate-200 rounded-xl px-5 py-3.5 flex flex-col md:grid md:grid-cols-[1.3fr_0.9fr_1.4fr_1.3fr_2fr_1fr_0.9fr_1.5fr] md:items-center gap-4 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:border-[#0f2d4a] relative overflow-hidden ${
                            isUrgent ? "border-l-4 border-l-red-500" : "border-l-4 border-l-[#0f2d4a]"
                          }`}
                        >
                          {/* Claim ID & Date */}
                          <div className="flex flex-col select-none min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className={`font-black text-sm ${isUrgent ? "text-red-600" : "text-slate-800"}`}>
                                {claim.claimNumber}
                              </h3>
                              {isUrgent && (
                                <span className="bg-red-100 text-red-700 text-[8px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-md">Urgent</span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold tracking-wider block mt-0.5">
                              Registered: {formatDate(claim.createdAt)}
                            </span>
                          </div>

                          {/* Vehicle Plate */}
                          <div className="flex flex-col select-none min-w-0">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1 md:hidden">Vehicle No</span>
                            <span className="text-slate-800 font-bold text-xs">{formatPlate(claim.vehiclePlate)}</span>
                          </div>

                          {/* Damage Type */}
                          <div className="flex flex-col select-none min-w-0">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1 md:hidden">Damage Type</span>
                            <span className="text-slate-700 text-xs font-semibold truncate block" title={claim.damageType}>{claim.damageType}</span>
                          </div>

                          {/* Location */}
                          <div className="flex flex-col select-none min-w-0">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1 md:hidden">Location</span>
                            <span className="text-slate-700 text-xs font-semibold truncate block" title={claim.location}>{claim.location}</span>
                          </div>

                          {/* Agent Assignment */}
                          <div className="flex flex-col select-none min-w-0">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1 md:hidden">Assigned Agent</span>
                            <span className="text-xs font-semibold truncate block">
                              {claim.assignedAgent ? (
                                <span className="text-slate-700" title={claim.assignedAgent}>{getAgentName(claim.assignedAgent)}</span>
                              ) : (
                                <span className="text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[10px] inline-block w-fit">Unassigned</span>
                              )}
                            </span>
                          </div>

                          {/* Assessment */}
                          <div className="flex flex-col select-none min-w-0">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1 md:hidden">Assessment</span>
                            <span className="text-xs font-bold text-slate-700">
                              {typeof claim.amount === "number" ? (
                                `Rs. ${claim.amount.toLocaleString()}`
                              ) : (
                                <span className="text-slate-400 font-normal italic text-[11px]">Not Assessed</span>
                              )}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div className="flex flex-col select-none items-start min-w-0">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1 md:hidden">Status</span>
                            <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide block text-center ${getStatusStyle(claim.status, claim.damageType, claim.priority)}`}>
                              {claim.status}
                            </span>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center justify-end gap-2 flex-shrink-0 md:pl-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 min-w-0" onClick={(e) => e.stopPropagation()}>
                            {!claim.assignedAgent && (
                              <button
                                onClick={() => {
                                  setShowAssignModal(claim);
                                  setSelectedAgentEmail("");
                                }}
                                className="bg-[#0f2d4a] hover:bg-[#1a3d5e] text-white font-extrabold text-[10px] px-3 py-1.5 rounded-lg transition-all cursor-pointer focus:outline-none shadow-sm border-none active:scale-95 whitespace-nowrap animate-fade-in"
                              >
                                Assign Agent
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedClaim(claim);
                                setAssessmentAmount(typeof claim.amount === "number" ? claim.amount.toString() : "");
                              }}
                              className="border border-slate-300 hover:bg-slate-50 text-slate-600 font-extrabold text-[10px] px-3 py-1.5 rounded-lg transition-all cursor-pointer focus:outline-none shadow-sm bg-white whitespace-nowrap"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Detail Inspection Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white border border-slate-200 rounded-[24px] w-full max-w-[800px] max-h-[90vh] shadow-2xl flex flex-col relative animate-fade-in overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-8 pt-6 pb-4 border-b border-slate-200 flex-shrink-0 select-none bg-slate-50/50">
              <div>
                <h2 className="text-[20px] font-black text-[#0f2d4a] tracking-tight leading-none flex items-center gap-2">
                  Claim Detail - {selectedClaim.claimNumber}
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide ${getStatusStyle(selectedClaim.status, selectedClaim.damageType, selectedClaim.priority)}`}>
                    {selectedClaim.status}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 font-bold mt-1.5">Registered on: {formatDate(selectedClaim.createdAt)} | Nic: {selectedClaim.userNic}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedClaim(null);
                  setActiveDetailsPanel(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold border-none bg-transparent cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 flex-1 overflow-y-auto space-y-6">
              
              {/* Restructured Detail Section (Left column for user & claim details, Right column for agent & status, documents jump, contact jump) */}
              <div className="grid grid-cols-1 md:grid-cols-[1.8fr_1fr] gap-6 select-none">
                {/* Left Side Details Grid */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Vehicle No</span>
                    <span className="text-sm font-extrabold text-slate-800">{formatPlate(selectedClaim.vehiclePlate)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Policy Holder Name</span>
                    <span className="text-sm font-extrabold text-slate-800">{getPolicyHolderName(selectedClaim.userNic)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Contact</span>
                    <span className="text-sm font-extrabold text-slate-800">{getPolicyHolderContact(selectedClaim.userNic)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Location</span>
                    <span className="text-sm font-extrabold text-slate-800 truncate block" title={selectedClaim.location}>{selectedClaim.location}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Time</span>
                    <span className="text-sm font-extrabold text-slate-800">{claimDateString(selectedClaim.incidentDate)} @ {selectedClaim.incidentTime}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Est. Amount</span>
                    <span className="text-sm font-extrabold text-[#0f2d4a]">
                      {selectedClaim.amount ? `LKR ${selectedClaim.amount.toLocaleString()}` : "Not Assessed"}
                    </span>
                  </div>
                  <div className="col-span-1 md:col-span-2 border-t border-slate-200/60 pt-3 mt-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Incident Description</span>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed bg-white p-3 rounded-lg border border-slate-150 line-clamp-3" title={selectedClaim.description}>{selectedClaim.description}</p>
                  </div>
                </div>

                {/* Right Side Column */}
                <div className="flex flex-col justify-between border border-slate-200 rounded-2xl p-5 shadow-sm bg-white">
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Agent</span>
                      <strong className="text-slate-800 text-sm font-black block" title={selectedClaim.assignedAgent || undefined}>
                        {selectedClaim.assignedAgent ? getAgentName(selectedClaim.assignedAgent) : "Unassigned"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Type</span>
                      <span className="text-slate-800 text-sm font-extrabold block">{selectedClaim.damageType}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Status / Priority</span>
                      <span className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide text-center ${getStatusStyle(selectedClaim.status, selectedClaim.damageType, selectedClaim.priority)}`}>
                          {selectedClaim.status}
                        </span>
                        {selectedClaim.priority === "Urgent" && (
                          <span className="bg-red-100 text-red-700 text-[9px] font-black tracking-wider uppercase px-2 py-1 rounded-full border border-red-200">Urgent</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Stack of Cyan buttons */}
                  <div className="mt-6 flex flex-col gap-2.5">
                    <button
                      onClick={() => document.getElementById("documents-section")?.scrollIntoView({ behavior: "smooth" })}
                      className="w-full bg-[#00c5ff] hover:bg-[#00b0e6] text-white font-extrabold text-xs py-2.5 rounded-lg transition-all border-none cursor-pointer text-center select-none shadow-sm active:scale-95"
                    >
                      Documents
                    </button>
                    <button
                      onClick={() => document.getElementById("messages-section")?.scrollIntoView({ behavior: "smooth" })}
                      className="w-full bg-[#00c5ff] hover:bg-[#00b0e6] text-white font-extrabold text-xs py-2.5 rounded-lg transition-all border-none cursor-pointer text-center select-none shadow-sm active:scale-95"
                    >
                      Contact
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress Stepper Section */}
              <div className="py-6 px-4 border-t border-b border-slate-100 select-none">
                <div className="flex items-center justify-between relative max-w-[650px] mx-auto">
                  {/* Connecting Line background */}
                  <div className="absolute top-[18px] left-[20px] right-[20px] h-1 bg-slate-200 -z-10 rounded-full" />
                  {/* Connecting Line active fill */}
                  <div 
                    className="absolute top-[18px] left-[20px] h-1 bg-[#0f2d4a] -z-10 rounded-full transition-all duration-500" 
                    style={{ width: `${getStepperPercent(selectedClaim)}%` }} 
                  />

                  {getStepperSteps(selectedClaim).map((stepObj, idx) => {
                    const isActive = stepObj.active;
                    return (
                      <div key={idx} className="flex flex-col items-center flex-1 relative">
                        {/* Step Circle */}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all duration-300 ${
                          isActive 
                            ? "bg-[#0f2d4a] text-white border-[#0f2d4a] shadow-md shadow-[#0f2d4a]/20" 
                            : "bg-white text-slate-400 border-slate-200"
                        }`}>
                          {stepObj.num}
                        </div>
                        {/* Step Label */}
                        <span className={`text-[10px] font-black mt-2 tracking-wide uppercase ${
                          isActive ? "text-[#0f2d4a]" : "text-slate-400"
                        }`}>
                          {stepObj.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Section (Orange Buttons in Row) */}
              <div className="grid grid-cols-3 gap-4 select-none">
                <button
                  onClick={() => setActiveDetailsPanel(activeDetailsPanel === "tracking" ? null : "tracking")}
                  className={`py-3 px-4 rounded-xl text-xs font-black tracking-wide uppercase transition-all border cursor-pointer ${
                    activeDetailsPanel === "tracking"
                      ? "bg-[#d97706] text-white border-transparent shadow-md"
                      : "bg-[#f59e0b] hover:bg-[#d97706] text-white border-transparent shadow-sm"
                  }`}
                >
                  Update Tracking
                </button>
                <button
                  onClick={() => setActiveDetailsPanel(activeDetailsPanel === "request_docs" ? null : "request_docs")}
                  className={`py-3 px-4 rounded-xl text-xs font-black tracking-wide uppercase transition-all border cursor-pointer ${
                    activeDetailsPanel === "request_docs"
                      ? "bg-[#d97706] text-white border-transparent shadow-md"
                      : "bg-[#f59e0b] hover:bg-[#d97706] text-white border-transparent shadow-sm"
                  }`}
                >
                  Request Documents
                </button>
                <button
                  onClick={() => {
                    document.getElementById("messages-section")?.scrollIntoView({ behavior: "smooth" });
                    setTimeout(() => {
                      document.getElementById("message-input")?.focus();
                    }, 400);
                  }}
                  className="py-3 px-4 rounded-xl text-xs font-black tracking-wide uppercase transition-all border border-transparent bg-[#f59e0b] hover:bg-[#d97706] text-white cursor-pointer shadow-sm"
                >
                  Add Note
                </button>
              </div>

              {/* Dynamic Edit Panel for Tracking */}
              {activeDetailsPanel === "tracking" && (
                <div className="bg-slate-50 border border-[#f59e0b]/20 p-5 rounded-2xl space-y-4 animate-fade-in">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide border-b border-slate-200/60 pb-2">Update Claim Tracking & Status</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Current Portal Step</label>
                      <select
                        value={selectedClaim.currentStep}
                        onChange={(e) => handleUpdateClaim(selectedClaim.claimNumber, { currentStep: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2d4a]"
                      >
                        <option value={1}>01 - Submitted</option>
                        <option value={2}>02 - Assigned</option>
                        <option value={3}>03 - Inspection</option>
                        <option value={4}>04 - Review</option>
                        <option value={5}>05 - Decision</option>
                        <option value={6}>06 - Payment</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Assessment Amount (Rs.)</label>
                      <input
                        type="number"
                        value={assessmentAmount}
                        onChange={(e) => setAssessmentAmount(e.target.value)}
                        placeholder="Not Assessed"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2d4a]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Claim Status</label>
                      <select
                        value={selectedClaim.status}
                        onChange={(e) => handleUpdateClaim(selectedClaim.claimNumber, { status: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2d4a]"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/60">
                    <button
                      onClick={() => handleUpdateClaim(selectedClaim.claimNumber, { amount: assessmentAmount === "" ? null : Number(assessmentAmount) })}
                      disabled={updatingClaim}
                      className="bg-[#0f2d4a] hover:bg-[#1a3d5e] text-white font-extrabold text-xs px-4 py-2 rounded-lg transition-all border-none cursor-pointer"
                    >
                      Save Valuation
                    </button>
                    <button
                      onClick={() => setActiveDetailsPanel(null)}
                      className="border border-slate-200 text-slate-500 hover:bg-slate-100 font-extrabold text-xs px-4 py-2 rounded-lg transition-all cursor-pointer bg-white"
                    >
                      Close Panel
                    </button>
                  </div>
                </div>
              )}

              {/* Dynamic Edit Panel for Request Documents */}
              {activeDetailsPanel === "request_docs" && (
                <div className="bg-slate-50 border border-[#f59e0b]/20 p-5 rounded-2xl space-y-4 animate-fade-in select-none">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide border-b border-slate-200/60 pb-2">Request Additional Documents</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { key: "nicFront", label: "NIC Front Page" },
                      { key: "nicBack", label: "NIC Back Page" },
                      { key: "drivingLicenseFront", label: "License Front" },
                      { key: "drivingLicenseRear", label: "License Rear" },
                      { key: "vehicleRegistration", label: "Vehicle Registration" },
                      { key: "revenueLicense", label: "Revenue License" },
                      { key: "accidentPhotos", label: "Accident Photos" },
                      { key: "repairEstimate", label: "Repair Estimate" },
                    ].map((docItem) => {
                      const isChecked = tempRequestedDocs.includes(docItem.key);
                      return (
                        <label key={docItem.key} className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-lg border border-slate-150 hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setTempRequestedDocs(prev => 
                                isChecked ? prev.filter(k => k !== docItem.key) : [...prev, docItem.key]
                              );
                            }}
                            className="w-4 h-4 accent-[#0f2d4a]"
                          />
                          <span className="text-xs font-bold text-slate-700">{docItem.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/60">
                    <button
                      onClick={async () => {
                        if (tempRequestedDocs.length === 0) {
                          alert("Please select at least one document to request.");
                          return;
                        }
                        const docsListText = tempRequestedDocs.join(", ");
                        await handleUpdateClaim(selectedClaim.claimNumber, {
                          documentsRequested: true,
                          requestedDocuments: tempRequestedDocs,
                          messageText: `Dear Policy Holder, please upload the following requested document(s): ${docsListText}.`,
                        });
                        setActiveDetailsPanel(null);
                        setTempRequestedDocs([]);
                        alert("Documents requested successfully!");
                      }}
                      disabled={updatingClaim}
                      className="bg-[#f59e0b] hover:bg-[#d97706] text-white font-extrabold text-xs px-4 py-2 rounded-lg transition-all border-none cursor-pointer"
                    >
                      Send Request
                    </button>
                    <button
                      onClick={() => {
                        setActiveDetailsPanel(null);
                        setTempRequestedDocs([]);
                      }}
                      className="border border-slate-200 text-slate-500 hover:bg-slate-100 font-extrabold text-xs px-4 py-2 rounded-lg transition-all cursor-pointer bg-white"
                    >
                      Close Panel
                    </button>
                  </div>
                </div>
              )}

              {/* Accident Photos Grid */}
              <div id="documents-section" className="space-y-3 select-none border-t border-slate-150 pt-5 scroll-mt-6">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Accident Damage Photos</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {["front", "rear", "side"].map((category) => {
                    const photos = (selectedClaim.accidentPhotos as any)?.[category] || [];
                    const hasPhoto = photos.length > 0;
                    let photoUrl = hasPhoto ? photos[0] : "";
                    if (photoUrl && !photoUrl.startsWith("http") && !photoUrl.startsWith("data:")) {
                      photoUrl = `${API_URL.replace("/api", "")}/uploads/${photoUrl}`;
                    }

                    return (
                      <div key={category} className="border border-slate-200 rounded-xl p-4 flex flex-col items-center bg-white shadow-sm">
                        <span className="text-xs font-bold text-slate-500 mb-2 capitalize">{category} damage</span>
                        <div className="w-full aspect-[4/3] bg-slate-50 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center relative">
                          {hasPhoto ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photoUrl}
                              alt={`${category} Damage`}
                              onClick={() => setPreviewImage(photoUrl)}
                              className="object-cover w-full h-full hover:scale-105 transition-transform duration-300 cursor-zoom-in"
                            />
                          ) : (
                            <span className="text-xs text-slate-400 italic font-semibold">No Image Uploaded</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Driving License Photos Grid */}
              <div className="space-y-3 select-none border-t border-slate-150 pt-5">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Driving License Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {["front", "rear"].map((category) => {
                    const photos = (selectedClaim.drivingLicense as any)?.[category] || [];
                    const hasPhoto = photos.length > 0;
                    let photoUrl = hasPhoto ? photos[0] : "";
                    if (photoUrl && !photoUrl.startsWith("http") && !photoUrl.startsWith("data:")) {
                      photoUrl = `${API_URL.replace("/api", "")}/uploads/${photoUrl}`;
                    }

                    return (
                      <div key={category} className="border border-slate-200 rounded-xl p-4 flex flex-col items-center bg-white shadow-sm">
                        <span className="text-xs font-bold text-slate-500 mb-2 capitalize">License {category}</span>
                        <div className="w-full aspect-[16/9] bg-slate-50 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center relative">
                          {hasPhoto ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photoUrl}
                              alt={`License ${category}`}
                              onClick={() => setPreviewImage(photoUrl)}
                              className="object-cover w-full h-full hover:scale-105 transition-transform duration-300 cursor-zoom-in"
                            />
                          ) : (
                            <span className="text-xs text-slate-400 italic font-semibold">No Image Uploaded</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Messaging & Discussion board */}
              <div id="messages-section" className="border-t border-slate-150 pt-5 space-y-4 scroll-mt-6">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide select-none">Claim Comments / Message History</h4>
                
                {/* Messages Container */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 max-h-[250px] overflow-y-auto space-y-3.5">
                  {selectedClaim.messages.length === 0 ? (
                    <div className="text-center text-xs text-slate-400 italic py-4 font-semibold select-none">
                      No message history recorded for this claim.
                    </div>
                  ) : (
                    selectedClaim.messages.map((msg, index) => {
                      const isSelf = msg.sender === "Office Staff";
                      return (
                        <div key={index} className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs ${
                            isSelf ? "bg-[#0f2d4a] text-white rounded-tr-none" : "bg-white border border-slate-200 text-slate-700 rounded-tl-none"
                          }`}>
                            <p className="font-semibold leading-relaxed break-words">{msg.message}</p>
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold mt-1 select-none px-1">
                            {msg.sender} · {formatMessageTime(msg.sentAt)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Send New Message */}
                <div className="flex gap-3 items-center">
                  <textarea
                    id="message-input"
                    rows={2}
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Type a message or comment to send to the Policy Holder..."
                    className="flex-1 p-3 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0f2d4a] resize-none"
                  />
                  <button
                    onClick={() => {
                      if (newMessageText.trim()) {
                        handleUpdateClaim(selectedClaim.claimNumber, { messageText: newMessageText.trim() });
                      }
                    }}
                    disabled={updatingClaim || !newMessageText.trim()}
                    className="bg-[#0f2d4a] hover:bg-[#1a3d5e] active:scale-95 text-white font-extrabold text-xs px-5 py-3.5 rounded-xl transition-all border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#0f2d4a]/10"
                  >
                    Send
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex justify-between flex-shrink-0">
              <button
                onClick={() => {
                  setSelectedClaim(null);
                  setActiveDetailsPanel(null);
                }}
                className="bg-slate-600 hover:bg-slate-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-full transition-all border-none cursor-pointer flex items-center gap-1.5"
              >
                &lt; Close
              </button>
              <button
                onClick={() => {
                  setSelectedClaim(null);
                  setActiveDetailsPanel(null);
                }}
                className="bg-[#0f2d4a] hover:bg-[#1a3d5e] text-white font-extrabold text-xs px-6 py-2.5 rounded-full transition-all border-none cursor-pointer flex items-center gap-1.5"
              >
                Submit &gt;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simple Assign Agent Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white border border-slate-200 rounded-[20px] w-full max-w-[450px] shadow-2xl p-6 flex flex-col relative select-none animate-fade-in">
            <h3 className="font-black text-[#0f2d4a] text-lg mb-1">Assign Agent</h3>
             <p className="text-xs text-slate-400 font-bold mb-5">Assign an active agent from {branch} Branch to claim {showAssignModal.claimNumber}.</p>
            
            {/* Claim Quick Details Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 mb-2 text-xs font-semibold text-slate-600 space-y-2 select-none">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Vehicle Plate</span>
                  <span className="text-slate-800 font-extrabold">{formatPlate(showAssignModal.vehiclePlate)}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Damage Type</span>
                  <span className="text-slate-800 font-extrabold">{showAssignModal.damageType}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Location</span>
                  <span className="text-slate-800 font-extrabold truncate block" title={showAssignModal.location}>{showAssignModal.location}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Incident Date / Time</span>
                  <span className="text-slate-800 font-extrabold">{claimDateString(showAssignModal.incidentDate)} @ {showAssignModal.incidentTime}</span>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-2 mt-1">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Description</span>
                <p className="text-slate-700 font-medium leading-relaxed mt-0.5 line-clamp-2" title={showAssignModal.description}>{showAssignModal.description}</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Select Branch Agent</label>
                <select
                  value={selectedAgentEmail}
                  onChange={(e) => setSelectedAgentEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2d4a]"
                >
                  <option value="" className="text-slate-800 bg-white">-- Choose Agent --</option>
                  {agents.map((agent) => (
                    <option key={agent._id} value={agent.email} className="text-slate-800 bg-white">
                      {agent.name} ({agent.phone || "No contact"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Selection Section */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Priority Level</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPriority("Normal")}
                    className={`flex-1 py-2 px-4 rounded-xl text-xs font-black tracking-wide uppercase transition-all border cursor-pointer ${
                      selectedPriority === "Normal"
                        ? "bg-[#0f2d4a] text-white border-transparent shadow-sm"
                        : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPriority("Urgent")}
                    className={`flex-1 py-2 px-4 rounded-xl text-xs font-black tracking-wide uppercase transition-all border cursor-pointer ${
                      selectedPriority === "Urgent"
                        ? "bg-red-600 text-white border-transparent shadow-sm shadow-red-600/10"
                        : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Urgent
                  </button>
                </div>
              </div>

              {/* Assignment Instruction Message Box */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Assignment Message / Instructions</label>
                <textarea
                  rows={3}
                  value={assignmentMessage}
                  onChange={(e) => setAssignmentMessage(e.target.value)}
                  placeholder="Enter optional instructions or comments for the agent..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f2d4a] resize-none bg-white"
                />
              </div>

              {agents.length === 0 && (
                <span className="text-xs text-red-500 font-bold ml-1">⚠️ No agents found in this branch! Add an agent first.</span>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3.5">
              <button
                onClick={() => {
                  setShowAssignModal(null);
                  setSelectedAgentEmail("");
                  setSelectedPriority("Normal");
                  setAssignmentMessage("");
                }}
                className="px-5 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold transition-all text-xs bg-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedAgentEmail) {
                    handleAssignAgent(showAssignModal.claimNumber, selectedAgentEmail, selectedPriority, assignmentMessage);
                  } else {
                    alert("Please select an agent.");
                  }
                }}
                disabled={updatingClaim || !selectedAgentEmail}
                className="px-6 py-2.5 rounded-full bg-[#0f2d4a] hover:bg-[#1a3d5e] text-white font-bold transition-all text-xs border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#0f2d4a]/10"
              >
                Confirm Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Lightbox Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300 select-none cursor-zoom-out animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl flex items-center justify-center bg-[#0a0a0a]/30" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage}
              alt="Damage Document Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-full transition-colors cursor-pointer border border-white/20 select-none shadow-md"
              aria-label="Close preview"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <OfficeStaffFooter />
    </div>
  );
}

// Inline helper for formatting incident dates
function claimDateString(dateStr: string) {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${date.getDate().toString().padStart(2, "0")} ${months[date.getMonth()]} ${date.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
}

// Inline helper for messaging dates
function formatMessageTime(dateStr: string) {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (e) {
    return "";
  }
}
