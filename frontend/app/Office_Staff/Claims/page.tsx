"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OfficeStaffNavbar from "@/app/Components/Office Staff/Navbar";
import OfficeStaffFooter from "@/app/Components/Office Staff/Footer";

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
  accidentPhotos?: {
    front?: string[];
    rear?: string[];
    side?: string[];
  };
  drivingLicense?: {
    front?: string[];
    rear?: string[];
  };
  status: string;
  branch: string;
  assignedAgent: string;
  amount: number | null;
  currentStep: number;
  messages: Array<{
    sender: string;
    message: string;
    sentAt: string;
  }>;
  createdAt: string;
}

interface Agent {
  _id: string;
  agentId: string;
  name: string;
  email: string;
  branch: string;
}

export default function ClaimsPage() {
  const router = useRouter();
  const [branch, setBranch] = useState("");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter and search states
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Selected claim for detail modal / assign modal
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Form states inside detail modal
  const [editStatus, setEditStatus] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editStep, setEditStep] = useState(1);
  const [editAgent, setEditAgent] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [updating, setUpdating] = useState(false);

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

    async function loadData() {
      try {
        const [claimsRes, agentsRes] = await Promise.all([
          fetch(`http://localhost:5000/api/office-staff/claims?branch=${currentBranch}`),
          fetch(`http://localhost:5000/api/office-staff/agents?branch=${currentBranch}`)
        ]);

        if (!claimsRes.ok || !agentsRes.ok) {
          throw new Error("Failed to fetch data from the server.");
        }

        const claimsData = await claimsRes.json();
        const agentsData = await agentsRes.json();

        setClaims(claimsData.claims || []);
        setAgents(agentsData.agents || []);
      } catch (err: any) {
        console.error("Load claims page error:", err);
        setError(err.message || "Failed to load branch details.");
      } finally {
        setLoading(false);
      }
    }

    if (currentBranch) {
      loadData();
    }
  }, [router]);

  // Open full detail modal and pre-fill fields
  const handleOpenDetails = (claim: Claim) => {
    setSelectedClaim(claim);
    setEditStatus(claim.status);
    setEditAmount(claim.amount !== null ? String(claim.amount) : "");
    setEditStep(claim.currentStep);
    setEditAgent(claim.assignedAgent);
    setNewMessage("");
  };

  // Open assign agent modal directly
  const handleOpenAssign = (claim: Claim, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClaim(claim);
    setEditAgent(claim.assignedAgent);
    setShowAssignModal(true);
  };

  // Submit claim updates
  const handleUpdateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;

    setUpdating(true);
    try {
      const response = await fetch(`http://localhost:5000/api/office-staff/claims/${selectedClaim.claimNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          amount: editAmount === "" ? "" : Number(editAmount),
          currentStep: editStep,
          assignedAgent: editAgent,
          messageText: newMessage.trim(),
          messageSender: "Office Staff"
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update claim.");
      }

      // Refresh claims list
      const updatedClaims = claims.map(c => c.claimNumber === selectedClaim.claimNumber ? data.claim : c);
      setClaims(updatedClaims);
      setSelectedClaim(data.claim);
      setNewMessage("");
      alert("Claim updated successfully!");
    } catch (err: any) {
      alert(err.message || "An error occurred updating the claim.");
    } finally {
      setUpdating(false);
    }
  };

  // Quick agent assignment
  const handleQuickAssign = async () => {
    if (!selectedClaim) return;
    try {
      const response = await fetch(`http://localhost:5000/api/office-staff/claims/${selectedClaim.claimNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedAgent: editAgent })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to assign agent.");
      }

      const updatedClaims = claims.map(c => c.claimNumber === selectedClaim.claimNumber ? data.claim : c);
      setClaims(updatedClaims);
      setShowAssignModal(false);
      setSelectedClaim(null);
      alert("Agent assigned successfully!");
    } catch (err: any) {
      alert(err.message || "An error occurred.");
    }
  };

  // Filter and search computation
  const filteredClaims = claims.filter(c => {
    const matchesStatus = statusFilter === "All" || c.status.toLowerCase() === statusFilter.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      c.claimNumber.toLowerCase().includes(query) ||
      c.vehiclePlate.toLowerCase().includes(query) ||
      c.userNic.toLowerCase().includes(query) ||
      c.damageType.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <div className="flex flex-1 flex-row min-h-0">
        <OfficeStaffNavbar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-[#f59e0b] text-white px-8 py-4 flex justify-between items-center select-none shadow-sm flex-shrink-0 h-[80px]">
            <h1 className="text-xl font-bold tracking-wide">{branch} Branch — Claims Management</h1>
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
                
                {/* Search and Filters Bar */}
                <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full md:w-96">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by Claim ID, Vehicle Plate or NIC..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    {["All", "Pending", "In Progress", "Approved", "Rejected"].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer whitespace-nowrap ${
                          statusFilter === status
                            ? "bg-slate-800 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Claims Grid / List */}
                {filteredClaims.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-bold select-none shadow-sm">
                    No claims match your search or filter criteria.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredClaims.map((claim) => {
                      const statusColors: Record<string, string> = {
                        pending: "text-amber-500 border-amber-400 bg-amber-50",
                        "in progress": "text-blue-500 border-blue-400 bg-blue-50",
                        approved: "text-emerald-500 border-emerald-400 bg-emerald-50",
                        rejected: "text-rose-500 border-rose-400 bg-rose-50",
                      };
                      const statusClass = statusColors[claim.status.toLowerCase()] || "text-slate-500 border-slate-400 bg-slate-50";

                      return (
                        <div
                          key={claim._id}
                          onClick={() => handleOpenDetails(claim)}
                          className="bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-sm relative group"
                        >
                          <div>
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                              <span className="font-black text-slate-800 text-base">
                                {claim.claimNumber}
                              </span>
                              <span className={`text-[11px] font-black tracking-wider uppercase px-2.5 py-1 border rounded-full ${statusClass}`}>
                                {claim.status}
                              </span>
                            </div>

                            {/* Attributes */}
                            <div className="flex flex-col text-slate-500 text-xs font-semibold gap-2">
                              <div className="flex">
                                <span className="w-24 flex-shrink-0 text-slate-400">NIC</span>
                                <span>: {claim.userNic}</span>
                              </div>
                              <div className="flex">
                                <span className="w-24 flex-shrink-0 text-slate-400">Vehicle No</span>
                                <span>: {claim.vehiclePlate}</span>
                              </div>
                              <div className="flex">
                                <span className="w-24 flex-shrink-0 text-slate-400">Type</span>
                                <span>: {claim.damageType}</span>
                              </div>
                              <div className="flex">
                                <span className="w-24 flex-shrink-0 text-slate-400">Incident</span>
                                <span>: {claim.incidentDate} at {claim.incidentTime}</span>
                              </div>
                              <div className="flex">
                                <span className="w-24 flex-shrink-0 text-slate-400">Location</span>
                                <span className="truncate">: {claim.location}</span>
                              </div>
                              <div className="flex">
                                <span className="w-24 flex-shrink-0 text-slate-400">Agent</span>
                                <span className={`font-bold ${claim.assignedAgent ? "text-slate-700" : "text-rose-500"}`}>
                                  : {claim.assignedAgent || "Unassigned"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100 flex-shrink-0">
                            <button
                              onClick={(e) => handleOpenAssign(claim, e)}
                              className="flex-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-[12px] py-2 rounded-lg transition-all tracking-wide cursor-pointer focus:outline-none shadow-sm shadow-amber-500/10 whitespace-nowrap text-center"
                            >
                              Assign Agent
                            </button>
                            <button
                              onClick={() => handleOpenDetails(claim)}
                              className="flex-1 bg-slate-700 hover:bg-slate-800 active:scale-95 text-white font-extrabold text-[12px] py-2 rounded-lg transition-all tracking-wide cursor-pointer focus:outline-none whitespace-nowrap text-center"
                            >
                              Details
                            </button>
                          </div>

                          {/* Date footer */}
                          <span className="text-[10px] text-slate-400 font-bold self-end mt-3">
                            Submitted on {new Date(claim.createdAt).toLocaleDateString()}
                          </span>
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

      {/* Main Details Modal */}
      {selectedClaim && !showAssignModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex justify-end transition-opacity duration-300">
          <div className="w-full max-w-3xl bg-white min-h-screen shadow-2xl flex flex-col animate-slide-in p-8">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-wide">{selectedClaim.claimNumber}</h2>
                <p className="text-xs text-slate-400 font-bold mt-1">Submitter NIC: {selectedClaim.userNic}</p>
              </div>
              <button
                onClick={() => setSelectedClaim(null)}
                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-8 select-none">
              
              {/* Grid 2 Column Information */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Vehicle Plate</span>
                  <span className="text-sm font-extrabold text-slate-700">{selectedClaim.vehiclePlate}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Damage Type</span>
                  <span className="text-sm font-extrabold text-slate-700">{selectedClaim.damageType}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Incident Time</span>
                  <span className="text-sm font-extrabold text-slate-700">{selectedClaim.incidentDate} at {selectedClaim.incidentTime}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Incident Location</span>
                  <span className="text-sm font-extrabold text-slate-700 truncate block">{selectedClaim.location}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Accident Description</span>
                  <span className="text-sm text-slate-600 font-medium leading-relaxed block">{selectedClaim.description}</span>
                </div>
              </div>

              {/* Photos Section */}
              <div className="space-y-4">
                <h3 className="font-black text-slate-800 text-sm tracking-wide">Uploaded Documents & Photos</h3>
                
                {/* Accident Photos */}
                <div className="border border-slate-100 rounded-xl p-4">
                  <span className="text-xs font-black text-slate-500 block mb-3">Accident Photos</span>
                  <div className="grid grid-cols-3 gap-3">
                    {["front", "rear", "side"].map((key) => {
                      const photos = (selectedClaim.accidentPhotos as any)?.[key] || [];
                      return (
                        <div key={key} className="flex flex-col items-center">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase mb-1">{key} View</span>
                          <div className="w-full aspect-[4/3] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative group flex items-center justify-center">
                            {photos.length > 0 ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={photos[0]}
                                alt={`${key} accident photo`}
                                className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <span className="text-[10px] text-slate-400 font-semibold italic">No Photo</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Driving License Photos */}
                <div className="border border-slate-100 rounded-xl p-4">
                  <span className="text-xs font-black text-slate-500 block mb-3">Driving License</span>
                  <div className="grid grid-cols-2 gap-4">
                    {["front", "rear"].map((key) => {
                      const photos = (selectedClaim.drivingLicense as any)?.[key] || [];
                      return (
                        <div key={key} className="flex flex-col items-center">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase mb-1">{key} Side</span>
                          <div className="w-full aspect-[1.58/1] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative flex items-center justify-center">
                            {photos.length > 0 ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={photos[0]}
                                alt={`${key} license`}
                                className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <span className="text-[10px] text-slate-400 font-semibold italic">No Photo</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Updates Form */}
              <form onSubmit={handleUpdateClaim} className="space-y-6 pt-4 border-t border-slate-100">
                <h3 className="font-black text-slate-800 text-sm tracking-wide">Update Assessment & Status</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status Dropdown */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-500 font-bold">Claim Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-700 text-sm font-semibold bg-white cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  {/* Assessment Amount */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-500 font-bold">Assessment Amount (LKR)</label>
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      placeholder="e.g. 50000"
                      className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-700 text-sm font-semibold"
                    />
                  </div>

                  {/* Assign Local Agent */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-500 font-bold">Assign Local Agent</label>
                    <select
                      value={editAgent}
                      onChange={(e) => setEditAgent(e.target.value)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-700 text-sm font-semibold bg-white cursor-pointer"
                    >
                      <option value="">No Agent Assigned</option>
                      {agents.map((agent) => (
                        <option key={agent._id} value={agent.email}>
                          {agent.name} ({agent.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Progress Step */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-500 font-bold">Claim Step Progress (1 - 4)</label>
                    <select
                      value={editStep}
                      onChange={(e) => setEditStep(Number(e.target.value))}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-700 text-sm font-semibold bg-white cursor-pointer"
                    >
                      <option value={1}>Step 1: Claim Submitted</option>
                      <option value={2}>Step 2: Under Evaluation</option>
                      <option value={3}>Step 3: Estimation Confirmed</option>
                      <option value={4}>Step 4: Payout Disbursed</option>
                    </select>
                  </div>
                </div>

                {/* Messaging Section */}
                <div className="flex flex-col gap-3">
                  <label className="text-xs text-slate-500 font-bold">Message Thread</label>
                  
                  {/* Messages list */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 max-h-48 overflow-y-auto space-y-3">
                    {selectedClaim.messages.length === 0 ? (
                      <span className="text-xs text-slate-400 font-bold italic block text-center">No messages sent yet.</span>
                    ) : (
                      selectedClaim.messages.map((msg, i) => {
                        const isStaff = msg.sender === "Office Staff";
                        return (
                          <div key={i} className={`flex flex-col ${isStaff ? "items-end" : "items-start"}`}>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-xs font-medium leading-relaxed shadow-sm ${
                              isStaff ? "bg-amber-500 text-white" : "bg-white text-slate-700 border border-slate-200"
                            }`}>
                              <span>{msg.message}</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-bold mt-1 px-1">
                              {msg.sender} · {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Send text input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message to policy holder..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400 font-medium"
                    />
                  </div>
                </div>

                {/* Submit updates button */}
                <button
                  type="submit"
                  disabled={updating}
                  className="w-full bg-[#f59e0b] hover:bg-[#d97706] disabled:bg-slate-400 text-white font-extrabold text-sm py-3.5 rounded-xl transition-all shadow-md shadow-amber-500/25 cursor-pointer focus:outline-none"
                >
                  {updating ? "Saving Claim Details..." : "Save Assessment and Update Claim"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Direct Agent Assignment Modal */}
      {showAssignModal && selectedClaim && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 border border-slate-100 flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4 select-none">
              <h3 className="text-lg font-black text-slate-800 tracking-wide">Assign Agent</h3>
              <button
                onClick={() => { setShowAssignModal(false); setSelectedClaim(null); }}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-400">
                Select an agent registered under the <strong className="text-slate-600">{branch} Branch</strong> to handle Claim <strong className="text-slate-600">{selectedClaim.claimNumber}</strong>.
              </p>

              <div className="flex flex-col gap-1.5 select-none">
                <label className="text-xs text-slate-500 font-bold">Select Local Agent</label>
                <select
                  value={editAgent}
                  onChange={(e) => setEditAgent(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-700 text-sm font-semibold bg-white cursor-pointer"
                >
                  <option value="">No Agent Assigned</option>
                  {agents.map((agent) => (
                    <option key={agent._id} value={agent.email}>
                      {agent.name} ({agent.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6 border-t border-slate-100 pt-4">
              <button
                onClick={() => { setShowAssignModal(false); setSelectedClaim(null); }}
                className="flex-1 py-2 px-4 border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickAssign}
                className="flex-1 py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-lg transition-colors cursor-pointer shadow-sm shadow-amber-500/10"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      <OfficeStaffFooter />
    </div>
  );
}
