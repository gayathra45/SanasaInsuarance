"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/Components/Agent/Navbar";
import Footer from "@/app/Components/Agent/Footer";
import Link from "next/link";
import { API_URL } from "@/app/config";

// Interface representing a MongoDB Claim document
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
  inspectionReport?: string;
  inspectionSubmitted?: boolean;
  paymentReceipt?: string;
  additionalDocuments?: AdditionalDoc[];
  documentsRequested?: boolean;
  requestedDocuments?: string[];
  documentRequestTo?: string;
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
  const [inspectionReportText, setInspectionReportText] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [agentUploadFile, setAgentUploadFile] = useState<File | null>(null);
  const [agentUploadPreview, setAgentUploadPreview] = useState<string | null>(null);
  const [agentUploadDocName, setAgentUploadDocName] = useState<string>("Repair Estimate");
  const [isAgentUploading, setIsAgentUploading] = useState(false);
  const [isAcceptingClaim, setIsAcceptingClaim] = useState(false);
  const agentFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | null) => {
    if (agentUploadPreview) {
      URL.revokeObjectURL(agentUploadPreview);
    }
    setAgentUploadFile(file);
    if (file) {
      setAgentUploadPreview(URL.createObjectURL(file));
    } else {
      setAgentUploadPreview(null);
    }
  };

  const fetchClaims = async (email: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/agent/claims?email=${email}`);
      if (!res.ok) throw new Error("Failed to fetch claims");
      const data = await res.json();
      setClaims(data);

      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const claimIdParam = params.get("claimId");
        if (claimIdParam) {
          const found = data.find((c: Claim) => c.claimNumber === claimIdParam || c._id === claimIdParam);
          if (found) {
            setSelectedClaim(found);
          }
        }
      }
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
      setInspectionReportText(selectedClaim.inspectionReport || "");
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

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch { return String(dateStr); }
  };

  const getDocDetails = (claim: Claim, name: string, status: "Pending" | "Submitted") => {
    let requestedAt = "";
    let submittedAt = "";

    const msg = [...(claim.messages || [])]
      .reverse()
      .find(m => m.message && typeof m.message === "string" && m.message.includes(`Requested: ${name}`));
    if (msg) {
      requestedAt = formatDate(msg.sentAt);
    } else {
      requestedAt = formatDate(claim.createdAt);
    }

    if (status === "Submitted") {
      const doc = (claim.additionalDocuments || []).find(
        d => d.name.trim().toLowerCase() === name.trim().toLowerCase()
      );
      if (doc && doc.uploadedAt) {
        submittedAt = formatDate(doc.uploadedAt);
      }
    }

    return { requestedAt, submittedAt };
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

  const claimsWithPendingAgentRequests = activeClaims.filter(
    claim => getAgentPendingRequests(claim).length > 0
  );

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

  const handleAcceptClaim = async (claimId: string) => {
    try {
      setIsAcceptingClaim(true);
      const res = await fetch(`${API_URL}/agent/claims/${claimId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acceptClaim: true })
      });
      if (!res.ok) {
        alert("Failed to accept claim.");
        return;
      }
      alert("Claim accepted successfully! Proceed with vehicle inspection.");
      // Refresh claims list
      await fetchClaims(agentEmail);
      // Also refresh the selectedClaim state with the new data
      const updatedRes = await fetch(`${API_URL}/agent/claims?email=${agentEmail}`);
      if (updatedRes.ok) {
        const data = await updatedRes.json();
        const freshClaim = data.find((c: Claim) => c._id === claimId);
        if (freshClaim) setSelectedClaim(freshClaim);
      }
    } catch (e) {
      console.error(e);
      alert("Error accepting claim.");
    } finally {
      setIsAcceptingClaim(false);
    }
  };

  const handleSubmitInspectionReport = async (claimId: string) => {
    try {
      if (!inspectionReportText.trim()) {
        alert("Please enter inspection report details.");
        return;
      }
      setIsSubmittingReport(true);
      const res = await fetch(`${API_URL}/agent/claims/${claimId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inspectionReport: inspectionReportText.trim(),
          inspectionSubmitted: true,
          status: "In Progress"
        })
      });
      if (!res.ok) {
        alert("Failed to submit inspection report.");
        return;
      }
      alert("Inspection report submitted successfully!");
      setSelectedClaim(null);
      fetchClaims(agentEmail);
      setInspectionReportText("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleAgentUpload = async () => {
    if (!selectedClaim || !agentUploadFile) return;
    setIsAgentUploading(true);
    try {
      const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });
      };
      const base64 = await convertToBase64(agentUploadFile);
      const res = await fetch(`${API_URL}/policy-holder/update-claim/${selectedClaim.claimNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadedDocuments: [
            {
              documentName: agentUploadDocName,
              fileData: base64,
              uploadedBy: "Agent"
            }
          ]
        })
      });
      if (res.ok) {
        alert("Document uploaded successfully!");
        handleFileChange(null);
        // Refresh claims list
        await fetchClaims(agentEmail);
        // Also refresh the selectedClaim state with the new data
        const updatedRes = await fetch(`${API_URL}/agent/claims?email=${agentEmail}`);
        if (updatedRes.ok) {
          const data = await updatedRes.json();
          const freshClaim = data.find((c: Claim) => c.claimNumber === selectedClaim.claimNumber);
          if (freshClaim) setSelectedClaim(freshClaim);
        }
      } else {
        const data = await res.json();
        alert(data.error || "Failed to upload document.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred during upload.");
    } finally {
      setIsAgentUploading(false);
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
          
          {/* Pending Document Requests Section */}
          {claimsWithPendingAgentRequests.length > 0 && (
            <div className="flex flex-col gap-4 bg-gradient-to-br from-white/80 to-slate-50/40 backdrop-blur-md border border-red-200/40 rounded-3xl p-6 shadow-[0_8px_32px_rgba(239,68,68,0.01)] relative overflow-hidden">
              <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200/60 pb-3 mb-2">
                <h2 className="text-lg font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5 select-none">
                  <svg className="w-5 h-5 text-red-500 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Action Required: Pending Agent Document Requests
                  {/* Total Pending Count Badge */}
                  <span className="bg-red-500 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 select-none">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {claimsWithPendingAgentRequests.length}
                  </span>
                </h2>
                {claimsWithPendingAgentRequests.length > 3 && (
                  <Link href="/Agent/Documents" className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-1.5 rounded-full text-xs font-extrabold transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1 select-none">
                    View All
                    <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                )}
              </div>
              <div className="flex flex-col gap-3">
                {claimsWithPendingAgentRequests.slice(0, 3).map((claim) => {
                  const pendingDocs = getAgentPendingRequests(claim);
                  const totalDocs = (claim.requestedDocuments || []).filter(
                    name => getRecipientForDoc(claim, name) === "Agent"
                  );
                  const uploadedDocsCount = totalDocs.length - pendingDocs.length;

                  return (
                    <div key={claim._id} className="bg-white/70 backdrop-blur-sm border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-red-200/60 hover:bg-white transition-all duration-300">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Claim / Plate</span>
                        <span className="text-sm font-bold text-slate-800">{claim.claimNumber} · {claim.vehiclePlate}</span>
                        
                        {/* Received / Requested documents count with Clipboard icon */}
                        <div className="flex items-center gap-1.5 mt-1">
                          <svg className="w-4 h-4 text-cyan-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          <span className="text-xs font-bold text-slate-500 select-none">
                            Received: <span className="text-emerald-600 font-extrabold">{uploadedDocsCount}</span> / <span className="text-slate-800 font-extrabold">{totalDocs.length}</span>
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2">
                          {pendingDocs.map((docName, idx) => (
                            <span key={idx} className="text-[9px] font-bold bg-red-50/60 text-red-600 border border-red-100 px-2.5 py-0.5 rounded-full select-none tracking-wide uppercase">
                              {docName}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedClaim(claim)}
                        className="bg-[#0f2d3a] hover:bg-[#00ddff] hover:text-black text-xs font-bold py-2.5 px-5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-sm border-none self-start md:self-center"
                      >
                        Upload Documents
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
                
                let cardClass = isUrgent
                  ? "bg-red-50/60 border-2 border-red-200 rounded-[24px] p-6 shadow-[0_8px_30px_rgba(239,68,68,0.04)] flex flex-col justify-between min-h-[160px] hover:shadow-[0_12px_36px_rgba(239,68,68,0.1)] hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden"
                  : "bg-cyan-50/50 border-2 border-cyan-200 rounded-[24px] p-6 shadow-[0_8px_30px_rgba(6,182,212,0.03)] flex flex-col justify-between min-h-[160px] hover:shadow-[0_12px_36px_rgba(6,182,212,0.08)] hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden";
                  
                let iconClass = isUrgent
                  ? "p-2 bg-red-100 rounded-xl text-red-500 flex-shrink-0 mt-0.5"
                  : "p-2 bg-cyan-100 rounded-xl text-cyan-500 flex-shrink-0 mt-0.5";
                  
                let iconSvg = isUrgent ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.522a.75.75 0 01-.297 1.228 35.754 35.754 0 01-16.142 0 .75.75 0 01-.297-1.228A9.013 9.013 0 005.25 9.75V9zm4.5 8.25a3.75 3.75 0 007.5 0H9.75z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                  </svg>
                );
                
                let titleClass = isUrgent
                  ? "text-red-600 font-extrabold text-base leading-none"
                  : "text-cyan-600 font-extrabold text-base leading-none";

                return (
                  <div
                    key={claim._id}
                    className={cardClass}
                  >
                    {/* Visual Left Indicator Strip for clear highlighting */}
                    <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${isUrgent ? 'bg-red-500' : 'bg-cyan-500'}`} />

                    <div className="flex items-start gap-4 pl-1.5">
                      <div className={iconClass}>
                        {iconSvg}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={titleClass}>
                          {claim.claimNumber} <span className="text-slate-400 font-medium text-xs ml-1 select-none">· Severity: {severity}</span>
                        </h4>
                        
                        {/* 3-column Typographic Grid Details */}
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-y-3 gap-x-6 text-xs font-semibold text-slate-600 leading-relaxed">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Vehicle Plate</span>
                            <span className="text-slate-800 font-extrabold text-[13px] truncate block">
                              {claim.vehiclePlate} {claim.vehicleModel && <span className="font-semibold text-slate-500">({claim.vehicleModel})</span>}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Damage Type</span>
                            <span className="text-slate-800 font-extrabold text-[13px] truncate block">{claim.damageType}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Location</span>
                            <span className="text-slate-800 font-extrabold text-[13px] truncate block" title={claim.location}>{claim.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row Actions */}
                    <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-slate-100/50 pl-1.5">
                      <button
                        onClick={() => setSelectedClaim(claim)}
                        className="bg-[#2f3e46] hover:bg-[#1a2327] text-white font-extrabold text-[13px] px-6 py-2 rounded-full transition-all duration-150 border-none cursor-pointer"
                      >
                        Details
                      </button>
                      <span className="text-slate-400 text-[11px] font-bold">
                        Step {claim.currentStep} of 4 · Today, {claim.incidentTime}
                      </span>
                    </div>
                  </div>
                );
              }))}
          </div>
        </div>

        {/* Right Column: Notifications, My Activity & Support Details */}
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

              {/* Accept Claim Assignment Section */}
              {selectedClaim.status !== "Approved" && selectedClaim.status !== "Rejected" && selectedClaim.currentStep === 2 && (
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 flex flex-col gap-2.5 animate-fade-in">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b pb-2 border-slate-200">
                    Accept Claim Assignment
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold select-none leading-relaxed">
                    This claim has been assigned to you. Accept the assignment to begin the vehicle inspection process.
                  </p>
                  <button
                    onClick={() => handleAcceptClaim(selectedClaim._id)}
                    disabled={isAcceptingClaim}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white font-extrabold text-xs py-2.5 rounded-xl border-none cursor-pointer self-start px-5 active:scale-95 transition-all disabled:opacity-50 shadow-sm"
                  >
                    {isAcceptingClaim ? "Accepting..." : "Accept Claim Assignment"}
                  </button>
                </div>
              )}

              {/* Inspection Report Section */}
              {selectedClaim.status !== "Approved" && selectedClaim.status !== "Rejected" && selectedClaim.currentStep === 3 && !selectedClaim.inspectionSubmitted && (
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 flex flex-col gap-2.5">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b pb-2 border-slate-200">
                    Submit Inspection Report
                  </h4>
                  <textarea
                    value={inspectionReportText}
                    onChange={(e) => setInspectionReportText(e.target.value)}
                    placeholder="Type the inspection report details (vehicle condition, damage evaluation, etc.)...."
                    rows={4}
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white"
                  />
                  <button
                    onClick={() => handleSubmitInspectionReport(selectedClaim._id)}
                    disabled={!inspectionReportText.trim() || isSubmittingReport}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white font-extrabold text-xs py-2.5 rounded-xl border-none cursor-pointer self-end px-4 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSubmittingReport ? "Submitting..." : "Submit Inspection Report"}
                  </button>
                </div>
              )}

              {selectedClaim.inspectionSubmitted && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between border-b pb-2 mb-2 border-slate-200">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Inspection Report</h4>
                    <span className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded">Submitted</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium whitespace-pre-wrap">{selectedClaim.inspectionReport}</p>
                </div>
              )}

              {/* Requested Documents Status Section */}
              {selectedClaim && selectedClaim.requestedDocuments && selectedClaim.requestedDocuments.length > 0 && (() => {
                const requestedDocsList = [
                  ...(selectedClaim.requestedDocuments || []).map((name) => ({
                    name,
                    status: "Pending" as const,
                    url: null,
                    recipient: getRecipientForDoc(selectedClaim, name),
                  })),
                  ...(selectedClaim.additionalDocuments || []).map((doc) => ({
                    name: doc.name,
                    status: "Submitted" as const,
                    url: doc.url,
                    recipient: doc.uploadedBy === "Agent" ? "Agent" : "User",
                  })),
                ];

                const policyHolderDocs = requestedDocsList.filter((d) => d.recipient === "User");
                const agentDocs = requestedDocsList.filter((d) => d.recipient === "Agent");
                const hasPending = requestedDocsList.some((d) => d.status === "Pending");

                return (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col gap-4">
                    <h3 className="text-sm font-black text-slate-800 border-b border-slate-200 pb-2 uppercase tracking-wider flex items-center gap-2 select-none">
                      {hasPending ? (
                        <svg className="w-4.5 h-4.5 text-amber-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4.5 h-4.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      Requested Documents Status
                    </h3>

                    {/* Policy Holder Docs */}
                    <div className="space-y-2">
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-black tracking-wider uppercase px-2 py-0.5 rounded border border-blue-200">
                        Policy Holder Documents
                      </span>
                      {policyHolderDocs.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {policyHolderDocs.map((item, idx) => {
                            const { requestedAt, submittedAt } = getDocDetails(selectedClaim, item.name, item.status);
                            return (
                              <div key={idx} className="flex items-center justify-between py-2 px-3 bg-white border border-slate-100 rounded-xl">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`w-1.5 h-1.5 rounded-full ${item.status === "Pending" ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-slate-700 truncate">{item.name}</span>
                                    <span className="text-[9px] text-slate-400 font-bold">
                                      {item.status === "Pending" ? `Requested: ${requestedAt}` : `Requested: ${requestedAt} · Uploaded: ${submittedAt || "Recent"}`}
                                    </span>
                                  </div>
                                </div>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${item.status === "Pending" ? "bg-amber-500/10 text-amber-600 border-amber-200" : "bg-emerald-500/10 text-emerald-600 border-emerald-200"}`}>
                                  {item.status}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 font-bold italic pl-1">No requests for policy holder.</p>
                      )}
                    </div>

                    {/* Agent Docs */}
                    <div className="space-y-2 pt-2 border-t border-slate-200/60">
                      <span className="text-[10px] bg-cyan-100 text-cyan-800 font-black tracking-wider uppercase px-2 py-0.5 rounded border border-cyan-200">
                        Agent Documents
                      </span>
                      {agentDocs.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {agentDocs.map((item, idx) => {
                            const { requestedAt, submittedAt } = getDocDetails(selectedClaim, item.name, item.status);
                            return (
                              <div key={idx} className="flex items-center justify-between py-2 px-3 bg-white border border-slate-100 rounded-xl">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`w-1.5 h-1.5 rounded-full ${item.status === "Pending" ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-slate-700 truncate">{item.name}</span>
                                    <span className="text-[9px] text-slate-400 font-bold">
                                      {item.status === "Pending" ? `Requested: ${requestedAt}` : `Requested: ${requestedAt} · Uploaded: ${submittedAt || "Recent"}`}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${item.status === "Pending" ? "bg-amber-500/10 text-amber-600 border-amber-200" : "bg-emerald-500/10 text-emerald-600 border-emerald-200"}`}>
                                    {item.status}
                                  </span>
                                  {item.status === "Submitted" && item.url && (
                                    <a
                                      href={item.url.startsWith("http") || item.url.startsWith("data:") ? item.url : `${API_URL.replace("/api", "")}/uploads/${item.url}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[10px] font-black text-cyan-600 hover:text-cyan-700 hover:underline"
                                    >
                                      View
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 font-bold italic pl-1">No requests for agent.</p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Agent Documents Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b pb-2 border-slate-200">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Agent Documents</h4>
                </div>
                
                {/* List already uploaded agent docs */}
                {(() => {
                  const agentDocs = (selectedClaim.additionalDocuments || []).filter(
                    doc => doc.uploadedBy === "Agent"
                  );
                  if (agentDocs.length === 0) {
                    return <p className="text-xs text-slate-400 font-bold italic">No agent documents uploaded yet.</p>;
                  }
                  return (
                    <div className="flex flex-col gap-2">
                      {agentDocs.map((doc, idx) => {
                        let docUrl = doc.url;
                        if (docUrl && !docUrl.startsWith("http") && !docUrl.startsWith("data:")) {
                          docUrl = `${API_URL.replace("/api", "")}/uploads/${docUrl}`;
                        }
                        return (
                          <div key={idx} className="flex items-center justify-between bg-white border border-slate-100 p-2.5 rounded-xl">
                            <span className="text-xs font-bold text-slate-700">{doc.name}</span>
                            <a
                              href={docUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-extrabold text-cyan-600 hover:text-cyan-700 select-none"
                            >
                              View File
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Upload new agent doc */}
                {selectedClaim.status !== "Approved" && selectedClaim.status !== "Rejected" && (
                  <div className="border-t border-slate-200 pt-4 flex flex-col gap-4">
                    <span className="text-[11px] text-slate-500 font-extrabold uppercase tracking-wider">Upload Claim Document</span>
                    
                    {/* Select Doc Type Pills */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Document Type</label>
                      <div className="flex flex-wrap gap-2">
                        {["Repair Estimate", "Inspection Photos", "Damage Assessment", "Other"].map((type) => {
                          const isSelected = agentUploadDocName === type;
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setAgentUploadDocName(type)}
                              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer select-none ${
                                isSelected
                                  ? "bg-[#ff9800] border-[#ff9800] text-white shadow-sm"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              {type}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Drag and drop / file selector zones */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">File Attachment</label>
                      
                      <input
                        type="file"
                        ref={agentFileInputRef}
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileChange(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />

                      {!agentUploadFile ? (
                        <div
                          onClick={() => agentFileInputRef.current?.click()}
                          className="w-full border-2 border-dashed border-slate-300 hover:border-orange-500 rounded-2xl py-6 px-4 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-orange-50/5 cursor-pointer transition-all duration-150 group"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-8 h-8 text-slate-400 mb-2 group-hover:text-orange-500 transition-colors">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                          </svg>
                          <span className="text-slate-800 text-[13px] font-bold">Select document file</span>
                          <span className="text-slate-400 text-[10px] font-semibold mt-1">Image or PDF (Max 5MB)</span>
                        </div>
                      ) : (
                        <div className="w-full border-2 border-emerald-500 bg-emerald-50/5 rounded-2xl p-4 flex items-center justify-between relative shadow-sm">
                          <div className="flex items-center gap-3">
                            {agentUploadFile.type.startsWith("image/") && agentUploadPreview ? (
                              <img
                                src={agentUploadPreview}
                                alt="preview"
                                className="w-12 h-12 rounded-lg object-cover border border-slate-200 shadow-sm"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                              </div>
                            )}
                            <div className="flex flex-col min-w-0 max-w-[200px] md:max-w-[280px]">
                              <span className="text-emerald-800 text-[13px] font-bold truncate">
                                {agentUploadFile.name}
                              </span>
                              <span className="text-slate-400 text-[10px] font-semibold mt-0.5">
                                {(agentUploadFile.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleFileChange(null)}
                            className="bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 rounded-full p-2 transition-colors cursor-pointer"
                            title="Remove file"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="w-4.5 h-4.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {agentUploadFile && (
                      <button
                        onClick={handleAgentUpload}
                        disabled={isAgentUploading}
                        className="w-full bg-[#ff9800] hover:bg-[#ff8f00] text-white font-extrabold text-xs py-3 px-4 rounded-xl border-none cursor-pointer active:scale-[0.98] transition-all disabled:opacity-50 mt-1 shadow-md hover:shadow-orange-500/25 flex items-center justify-center gap-2"
                      >
                        {isAgentUploading ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                            </svg>
                            <span>Upload to Claim</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
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
