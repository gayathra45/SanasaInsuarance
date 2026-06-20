"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/Components/Agent/Navbar";
import Footer from "@/app/Components/Agent/Footer";
import { API_URL } from "@/app/config";

// Interface representing a MongoDB Claim document
interface ClaimMessage {
  sender: string;
  message: string;
  sentAt: string;
}

interface Claim {
  _id: string;
  claimNumber: string;
  userNic: string;
  vehiclePlate: string;
  vehicleModel?: string; // Extra details for nice display
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
}

export default function AgentDashboard() {
  const router = useRouter();
  const [agentName, setAgentName] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatLogs, setChatLogs] = useState<{ sender: string; text: string }[]>([]);

  const [claims, setClaims] = useState<Claim[]>([]);
  const [agentEmail, setAgentEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [assessmentAmount, setAssessmentAmount] = useState<string>("");

  const fetchClaims = async (email: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/agent/claims?email=${email}`);
      if (!res.ok) throw new Error("Failed to fetch claims");
      const data = await res.json();
      setClaims(data);
    } catch (e) {
      console.error("Fetch claims error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const agentData = sessionStorage.getItem("logged_in_agent");
    if (!agentData) {
      router.push("/Login");
      return;
    }
    try {
      const parsed = JSON.parse(agentData);
      if (parsed.name) setAgentName(parsed.name);
      if (parsed.email) {
        setAgentEmail(parsed.email);
        fetchClaims(parsed.email);
      }
    } catch (e) {
      console.error(e);
      router.push("/Login");
    }
  }, []);

  useEffect(() => {
    if (selectedClaim) {
      setAssessmentAmount(selectedClaim.amount ? String(selectedClaim.amount) : "");
    }
  }, [selectedClaim]);

  // Lock background scroll when selectedClaim is open
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

  const getSeverity = (damageType: string): "Urgent" | "Medium" | "Low" => {
    const type = (damageType || "").toLowerCase();
    if (type.includes("fire")) return "Urgent";
    if (type.includes("accident") || type.includes("crash")) return "Medium";
    return "Low";
  };

  // Derive columns from MongoDB collection
  const activeClaims = claims
    .filter(c => c.status !== "Approved" && c.status !== "Rejected")
    .sort((a, b) => {
      const aSev = getSeverity(a.damageType);
      const bSev = getSeverity(b.damageType);
      if (aSev === "Urgent" && bSev !== "Urgent") return -1;
      if (aSev !== "Urgent" && bSev === "Urgent") return 1;
      return 0;
    });
  const completedClaims = claims.filter(c => c.status === "Approved" || c.status === "Rejected");

  const totalAssigned = activeClaims.length;
  const urgentCount = activeClaims.filter(c => getSeverity(c.damageType) === "Urgent").length;

  const handleApproveAssessment = async (claimId: string) => {
    try {
      const numAmount = parseFloat(assessmentAmount);
      if (isNaN(numAmount) || numAmount <= 0) {
        alert("Please enter a valid assessment amount.");
        return;
      }

      const res = await fetch(`${API_URL}/agent/claims/${claimId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Approved", amount: numAmount })
      });
      if (!res.ok) {
        alert("Failed to update claim assessment status.");
        return;
      }
      alert("Assessment approved and status updated to Approved!");
      setSelectedClaim(null);
      fetchClaims(agentEmail);
    } catch (e) {
      console.error(e);
      alert("Error sending update request.");
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const newLogs = [...chatLogs, { sender: "Agent (You)", text: chatMessage }];
    setChatLogs(newLogs);
    setChatMessage("");

    // Mock automatic responder
    setTimeout(() => {
      setChatLogs(prev => [
        ...prev,
        { sender: "Support Staff", text: "We have received your message. An agent support officer will connect shortly." }
      ]);
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex flex-col font-sans antialiased">
      <Navbar />

      {/* Main Banner Area */}
      <div className="w-full relative overflow-hidden bg-slate-900 text-white py-14 md:py-20 px-6 md:px-16 flex flex-col justify-center rounded-b-[4rem] shadow-2xl">
        {/* Background Image with Dark Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-multiply transition-all duration-750 ease-out"
          style={{ backgroundImage: "url('/newclaim1.webp')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/90 to-cyan-950/40 pointer-events-none" />

        {/* Ambient Floating Glow Circles */}
        <div className="absolute top-[-20%] right-[-10%] w-[45%] h-[60%] rounded-full bg-cyan-400/10 blur-[130px] pointer-events-none animate-pulse duration-10000" />
        <div className="absolute bottom-[-10%] left-[5%] w-[40%] h-[50%] rounded-full bg-orange-400/5 blur-[120px] pointer-events-none animate-pulse duration-8000" />

        <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm select-none">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-200">{agentName}</span>!
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-3xl leading-relaxed font-medium">
              You have <span className="text-[#ffa500] font-extrabold">{totalAssigned} assigned claims</span> today including{" "}
              <span className="text-red-500 font-extrabold">{urgentCount} urgent</span> case. Stay safe on the road!
            </p>
          </div>

          {/* Floating Metric Badges - Placed below the text in a row */}
          <div className="flex flex-wrap gap-6 mt-2">
            {/* Urgent Card */}
            <div className="bg-gradient-to-br from-[#7f1d1d]/85 to-[#991b1b]/80 border border-red-500/40 rounded-2xl px-6 py-4 flex items-center gap-5 w-64 shadow-[0_10px_30px_rgba(239,68,68,0.15)] hover:bg-[#7f1d1d]/90 hover:scale-[1.02] hover:border-red-400 transition-all duration-300">
              {/* Siren/Alarm Light Icon on the left */}
              <svg className="w-10 h-10 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a1 1 0 011 1v1.085A8.005 8.005 0 0119.5 12v1H20a1 1 0 110 2h-1.05a5.002 5.002 0 01-13.9 0H4a1 1 0 110-2h.5v-1A8.005 8.005 0 0111 4.085V3a1 1 0 011-1zm0 17a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              {/* Stacked Text in the middle */}
              <div className="flex flex-col text-left">
                <span className="text-xs text-red-200 opacity-90 font-bold uppercase tracking-wider">Urgent</span>
                <span className="text-base text-white font-extrabold tracking-wide -mt-0.5">Claims</span>
              </div>
              {/* Large count number on the right */}
              <span className="text-3xl font-black text-white ml-auto">{urgentCount}</span>
            </div>

            {/* Assigned Card */}
            <div className="bg-gradient-to-br from-[#0e7490]/85 to-[#0891b2]/80 border border-cyan-400/40 rounded-2xl px-6 py-4 flex items-center gap-5 w-64 shadow-[0_10px_30px_rgba(6,182,212,0.15)] hover:bg-[#0e7490]/90 hover:scale-[1.02] hover:border-cyan-300 transition-all duration-300">
              {/* ID Badge Icon on the left */}
              <svg className="w-9 h-9 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5zm3 3a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm0 6.5C6 13.12 8.68 13 10 13c1.32 0 4 .12 4 1.5V16H6v-1.5zM14 7h4v1.5h-4V7zm0 3h4v1.5h-4V10zm-4 7h8v1.5h-8V17z" clipRule="evenodd" />
              </svg>
              {/* Stacked Text in the middle */}
              <div className="flex flex-col text-left">
                <span className="text-xs text-cyan-200 opacity-90 font-bold uppercase tracking-wider">Assigned</span>
                <span className="text-base text-white font-extrabold tracking-wide -mt-0.5">Claims</span>
              </div>
              {/* Large count number on the right */}
              <span className="text-3xl font-black text-white ml-auto">{totalAssigned}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Dashboard Content */}
      <main className="max-w-7xl mx-auto w-full px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: New Claims (Takes 2 grid columns on large screens) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              New Claims
              <span className="text-slate-400 font-normal text-xl">&gt;</span>
            </h2>
          </div>

          <div className="flex flex-col gap-6">
            {loading ? (
              <div className="text-slate-400 font-bold py-10 text-center text-sm animate-pulse">
                Fetching claims from database...
              </div>
            ) : activeClaims.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center shadow-sm text-slate-500 font-semibold text-sm">
                No new claims assigned to you.
              </div>
            ) : (
              activeClaims.map((claim) => {
                const severity = getSeverity(claim.damageType);
                const isUrgent = severity === "Urgent";
                const borderStyles = isUrgent 
                  ? "border-red-200 hover:border-red-300 bg-gradient-to-br from-white to-red-50/10 shadow-[0_10px_25px_rgba(239,68,68,0.01)]" 
                  : "border-cyan-200 hover:border-cyan-300 bg-gradient-to-br from-white to-cyan-50/10 shadow-[0_10px_25px_rgba(6,182,212,0.01)]";
                const textStyles = isUrgent ? "text-red-600" : "text-cyan-600";
                const sideStrip = isUrgent ? "bg-red-500" : "bg-cyan-500";
                const headerIconColor = isUrgent ? "text-red-500 animate-pulse" : "text-cyan-500";

                return (
                  <div
                    key={claim._id}
                    className={`w-full border rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_16px_32px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden ${borderStyles}`}
                  >
                    {/* Visual Left Indicator Strip */}
                    <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${sideStrip}`} />

                    <div className="flex justify-between items-center relative z-10 pl-2">
                      <div className="flex items-center gap-2.5">
                        {isUrgent ? (
                          /* Urgent Light Siren Icon */
                          <svg className={`w-5 h-5 ${headerIconColor}`} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2a1 1 0 0 1 1 1v1.085A8.005 8.005 0 0 1 19.5 12v1H20a1 1 0 1 1 0 2h-1.05a5 5 0 0 1-13.9 0H4a1 1 0 1 1 0-2h.5v-1A8.005 8.005 0 0 1 11 4.085V3a1 1 0 0 1 1-1zm6 11V12a6 6 0 0 0-12 0v1h12z" />
                            <circle cx="12" cy="18" r="1.5" />
                          </svg>
                        ) : (
                          /* Medium Shield Alert Icon */
                          <svg className={`w-5 h-5 ${headerIconColor}`} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2s-8 3-8 8v4.5c0 5 8 7.5 8 7.5s8-2.5 8-7.5V10c0-5-8-8-8-8zm0 13a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm1-5H11V6h2v4z" />
                          </svg>
                        )}
                        <h3 className={`font-bold text-lg tracking-wide uppercase ${textStyles}`}>
                          {severity} - {claim.claimNumber}
                        </h3>
                      </div>

                    <button
                      onClick={() => setSelectedClaim(claim)}
                      className="bg-slate-900 hover:bg-[#ff9800] active:bg-[#f57c00] text-white text-sm font-bold py-2 px-6 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                    >
                      Details
                    </button>
                  </div>

                  {/* Vehicle & Location Information */}
                  <div className="mt-5 pl-2 grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-2 text-sm text-slate-600 leading-relaxed relative z-10 font-semibold">
                    <div>
                      <span className="text-slate-400 block text-xs uppercase tracking-wider mb-0.5">Vehicle Plate</span>
                      <span className="text-slate-800 font-bold text-[15px]">
                        {claim.vehiclePlate} {claim.vehicleModel && <span className="font-semibold text-slate-500">({claim.vehicleModel})</span>}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs uppercase tracking-wider mb-0.5">Damage Type</span>
                      <span className="text-slate-800 font-bold text-[15px]">{claim.damageType}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs uppercase tracking-wider mb-0.5">Location</span>
                      <span className="text-slate-800 font-bold text-[15px]">{claim.location}</span>
                    </div>
                  </div>

                  {/* Formatted Date / Time */}
                  <div className="absolute bottom-4 right-6 text-xs text-slate-400 font-bold">
                    Today, {claim.incidentTime}
                  </div>
                </div>
              );
            }))}
          </div>
        </div>

        {/* Right Column: My Activity & Support Details */}
        <div className="flex flex-col gap-8">
          
          {/* My Activity Card Section */}
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              My Activity
              <span className="text-slate-400 font-normal text-xl">&gt;</span>
            </h2>

            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_10px_35px_rgba(0,0,0,0.015)] flex flex-col gap-4">
              {loading ? (
                <div className="text-slate-400 text-center text-xs py-4 animate-pulse">Loading activity...</div>
              ) : completedClaims.length === 0 ? (
                <div className="text-slate-400 text-center text-xs py-4 font-semibold">No past activity.</div>
              ) : (
                completedClaims.map((act) => {
                  const isApproved = act.status === "Approved";
                  const badgeBg = isApproved 
                    ? "bg-emerald-50/80 text-emerald-700 border-emerald-200" 
                    : "bg-rose-50/80 text-rose-700 border-rose-200";

                  return (
                    <div key={act._id} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className="flex flex-col">
                        <span className="font-bold text-base text-slate-800 tracking-tight">{act.claimNumber}</span>
                        <span className="text-xs text-slate-400 font-extrabold tracking-wider uppercase mt-0.5">{act.vehiclePlate}</span>
                      </div>

                      <span className={`px-4 py-1 rounded-full text-xs font-bold border tracking-wide uppercase ${badgeBg}`}>
                        {act.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Contact Support Card Box */}
          <div className="bg-gradient-to-br from-cyan-50/90 to-blue-50/40 border border-cyan-150 rounded-3xl p-6 shadow-[0_8px_30px_rgba(6,182,212,0.03)] flex flex-col gap-4 text-center hover:scale-[1.01] transition-transform duration-300">
            <h3 className="text-cyan-800 font-extrabold text-xl tracking-tight flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-cyan-700" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Support
            </h3>
            
            <div className="flex flex-col gap-3 font-bold text-[17px] text-cyan-950">
              <a href="tel:+94112003000" className="hover:text-cyan-600 transition-colors flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-cyan-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.47-5.112-3.758-6.58-6.58l1.293-.97c.362-.272.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
                +94 112 003 000
              </a>
              <a href="tel:+94112003001" className="hover:text-cyan-600 transition-colors flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-cyan-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.47-5.112-3.758-6.58-6.58l1.293-.97c.362-.272.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
                +94 112 003 001
              </a>
            </div>
          </div>

        </div>

      </main>

      {/* MongoDB Data Inspector / Claim Details Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 flex justify-between items-center border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold tracking-tight">Claim Details - {selectedClaim.claimNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedClaim(null)}
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-all duration-200 cursor-pointer"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content Scroll Area */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 text-sm text-slate-800">
              {/* Document Overview Section */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 flex flex-col gap-3 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]">
                <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-xs border-b pb-2.5 border-slate-200/80">
                  Claim Information
                </h4>
                <div className="grid grid-cols-2 gap-y-3.5 gap-x-6">
                  <div>
                    <span className="text-slate-400 block font-bold text-[10px] uppercase tracking-wider">User NIC</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedClaim.userNic}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold text-[10px] uppercase tracking-wider">Vehicle Plate</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedClaim.vehiclePlate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold text-[10px] uppercase tracking-wider">Damage Type</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedClaim.damageType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold text-[10px] uppercase tracking-wider">Severity</span>
                    <span className="font-bold text-slate-900 text-sm">{getSeverity(selectedClaim.damageType)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold text-[10px] uppercase tracking-wider">Status</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedClaim.status}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold text-[10px] uppercase tracking-wider">Claim Amount</span>
                    {selectedClaim.status !== "Approved" && selectedClaim.status !== "Rejected" ? (
                      <div className="flex flex-col gap-1 mt-1">
                        <input
                          type="number"
                          value={assessmentAmount}
                          onChange={(e) => setAssessmentAmount(e.target.value)}
                          placeholder="Enter LKR amount"
                          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-bold max-w-[150px]"
                        />
                      </div>
                    ) : (
                      <span className="font-bold text-slate-900 text-sm">
                        {selectedClaim.amount ? `LKR ${selectedClaim.amount.toLocaleString()}` : "Not Evaluated"}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold text-[10px] uppercase tracking-wider">Assigned Agent</span>
                    <span className="font-bold text-slate-900 text-sm" title={selectedClaim.assignedAgent}>
                      {agentName || selectedClaim.assignedAgent}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold text-[10px] uppercase tracking-wider">Created At</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {new Date(selectedClaim.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-bold text-slate-800 mb-1.5 text-sm uppercase tracking-wider">Incident Description</h4>
                <p className="text-slate-700 bg-slate-50 border border-slate-100 p-4 rounded-2xl leading-relaxed font-medium">
                  {selectedClaim.description}
                </p>
              </div>

              {/* Actions / Operations */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-2">
                {selectedClaim.status !== "Approved" && selectedClaim.status !== "Rejected" && (
                  <button
                    onClick={() => handleApproveAssessment(selectedClaim._id)}
                    className="bg-[#ff9800] hover:bg-[#ff8f00] text-white text-sm font-bold py-2.5 px-6 rounded-xl cursor-pointer hover:shadow-lg transition-all duration-300"
                  >
                    Approve Assessment
                  </button>
                )}
                <button
                  onClick={() => setSelectedClaim(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold py-2.5 px-6 rounded-xl cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Bubble / Support Helpdesk Chat */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {showSupportChat && (
          <div className="bg-white border border-slate-100 rounded-3xl w-[320px] md:w-[350px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
            {/* Header */}
            <div className="bg-[#00ddff] text-black px-5 py-4 flex justify-between items-center font-bold">
              <span className="text-[15px] tracking-tight">Agent Helpdesk Live Chat</span>
              <button onClick={() => setShowSupportChat(false)} className="text-black/70 hover:text-black bg-black/5 hover:bg-black/10 p-1.5 rounded-full transition-colors cursor-pointer">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chat Body */}
            <div className="h-64 p-4 overflow-y-auto flex flex-col gap-3 text-xs bg-slate-50">
              {chatLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`max-w-[85%] rounded-2xl p-3 leading-normal shadow-sm ${
                    log.sender === "Agent (You)"
                      ? "bg-slate-900 text-white self-end rounded-tr-none"
                      : "bg-white text-slate-800 self-start border border-slate-100 rounded-tl-none"
                  }`}
                >
                  <div className="font-extrabold text-[9px] uppercase opacity-75 mb-0.5">{log.sender}</div>
                  <div className="font-semibold text-xs leading-normal">{log.text}</div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="border-t border-slate-100 p-3 flex gap-2 bg-white">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-400 font-semibold"
              />
              <button
                type="submit"
                className="bg-[#00ddff] text-black font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-sm active:scale-95 transition-all"
              >
                Send
              </button>
            </form>
          </div>
        )}

        {/* Chat Toggle Button */}
        <button
          onClick={() => setShowSupportChat(!showSupportChat)}
          className="bg-[#00ddff] hover:bg-[#00c5e3] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl shadow-cyan-300/35 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
          aria-label="Toggle Live Helpdesk Chat"
        >
          <svg
            className="w-7 h-7 text-black"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.75.75 0 0 1-1.074-.83l1.22-3.72C4.181 15.047 3 13.136 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
            />
          </svg>
        </button>
      </div>

      <Footer />
    </div>
  );
}
