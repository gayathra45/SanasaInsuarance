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
  accidentPhotos?: {
    front: string[];
    rear: string[];
    side: string[];
  };
  drivingLicense?: {
    front: string[];
    rear: string[];
  };
  rejectionReason?: string;
}

const parseInspectionReport = (reportText: string) => {
  if (!reportText) return null;
  if (!reportText.includes("[1. VEHICLE CONDITION DETAILS]")) {
    return { isRaw: true, rawText: reportText };
  }

  try {
    const lines = reportText.split("\n");
    let odometer = "";
    let fuelLevel = "";
    let recommendedAction = "";
    let estimatedCost = "";
    let preExistingDamage = "";
    let physicalInspectionNotes = "";
    const checklist: { [key: string]: string } = {};

    let currentSection = "";

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith("• Odometer:")) {
        odometer = trimmed.replace("• Odometer:", "").trim();
      } else if (trimmed.startsWith("• Fuel Level:")) {
        fuelLevel = trimmed.replace("• Fuel Level:", "").trim();
      } else if (trimmed.startsWith("• Recommended Action:")) {
        recommendedAction = trimmed.replace("• Recommended Action:", "").trim();
      } else if (trimmed.startsWith("• Estimated Cost:")) {
        estimatedCost = trimmed.replace("• Estimated Cost:", "").trim();
      } else if (trimmed.includes("[3. PRE-EXISTING DAMAGE NOTES]")) {
        currentSection = "pre-existing";
      } else if (trimmed.includes("[4. PHYSICAL INSPECTION NOTES]")) {
        currentSection = "physical-notes";
      } else if (trimmed.includes("==================================") || trimmed.includes("VEHICLE CLAIM INSPECTION")) {
        // skip
      } else if (trimmed.includes("[2. COMPONENT DAMAGE CHECKLIST]")) {
        currentSection = "checklist";
      } else if (currentSection === "checklist" && trimmed.startsWith("• ")) {
        const parts = trimmed.substring(2).split(":");
        if (parts.length >= 2) {
          const compName = parts[0].trim();
          const compVal = parts[1].replace("[", "").replace("]", "").trim();
          checklist[compName] = compVal;
        }
      } else if (currentSection === "pre-existing") {
        if (!trimmed.startsWith("[")) {
          preExistingDamage += (preExistingDamage ? "\n" : "") + trimmed;
        }
      } else if (currentSection === "physical-notes") {
        if (!trimmed.startsWith("[")) {
          physicalInspectionNotes += (physicalInspectionNotes ? "\n" : "") + trimmed;
        }
      }
    });

    return {
      isRaw: false,
      odometer,
      fuelLevel,
      recommendedAction,
      estimatedCost,
      checklist,
      preExistingDamage: preExistingDamage || "None reported.",
      physicalInspectionNotes: physicalInspectionNotes || "None reported."
    };
  } catch (err) {
    console.error("Error parsing inspection report:", err);
    return { isRaw: true, rawText: reportText };
  }
};

const renderPremiumInspectionReport = (reportText: string) => {
  const parsed = parseInspectionReport(reportText);
  if (!parsed) return null;

  if (parsed.isRaw) {
    return (
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-inner select-text">
        <div className="flex items-center gap-2 mb-3 text-slate-400 select-none">
          <svg className="w-5 h-5 text-slate-455" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Raw Inspection Report Text</span>
        </div>
        <p className="text-slate-700 text-xs font-semibold whitespace-pre-wrap leading-relaxed">
          {parsed.rawText}
        </p>
      </div>
    );
  }

  const renderBadge = (val: string) => {
    let color = "text-slate-500 bg-slate-55 border-slate-200";
    let icon = null;
    
    if (val === "None") {
      color = "text-emerald-600 bg-emerald-50/40 border-emerald-200/60";
      icon = (
        <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      );
    } else if (val === "Minor") {
      color = "text-amber-600 bg-amber-50/40 border-amber-200/60";
      icon = (
        <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      );
    } else if (val === "Major") {
      color = "text-rose-600 bg-rose-50/40 border-rose-200/60";
      icon = (
        <svg className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.03V3m0 0a8.001 8.001 0 00-7.797 6.138m15.594 0A8.001 8.001 0 0012 3M3.243 9.75a8.002 8.002 0 008.757 8.757m0 0A8.002 8.002 0 0020.757 9.75" />
        </svg>
      );
    }

    return (
      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border flex items-center gap-1.5 select-none ${color}`}>
        {icon}
        {val}
      </span>
    );
  };

  return (
    <div className="border border-slate-200/80 rounded-[32px] overflow-hidden bg-slate-50/20 p-6 space-y-6 shadow-sm select-text text-left font-sans w-full">
      {/* Dashboard Title */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 select-none">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider leading-none">Vehicle Inspection Report</h4>
            <span className="text-[10px] font-bold text-slate-400 block mt-1 tracking-wider">OFFICIAL PHYSICAL ASSESSMENT SUMMARY</span>
          </div>
        </div>
        <span className="bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[10px] font-extrabold tracking-wider uppercase px-3.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
          </svg>
          Verified By Agent
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Odometer */}
        <div className="bg-white border border-slate-150 rounded-2xl p-4.5 flex flex-col justify-between shadow-sm relative overflow-hidden h-[95px] border-t-4 border-t-blue-500">
          <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest leading-none select-none">Odometer</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-[17px] font-black text-slate-800">{parsed.odometer || "N/A"}</span>
          </div>
          <span className="text-[9px] text-slate-400 font-semibold select-none">Total Distance Travelled</span>
        </div>

        {/* Card 2: Fuel Level */}
        <div className="bg-white border border-slate-150 rounded-2xl p-4.5 flex flex-col justify-between shadow-sm relative overflow-hidden h-[95px] border-t-4 border-t-indigo-500">
          <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest leading-none select-none">Fuel Level</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-[17px] font-black text-slate-800">{parsed.fuelLevel || "N/A"}</span>
          </div>
          <span className="text-[9px] text-slate-400 font-semibold select-none">Current Tank Level</span>
        </div>

        {/* Card 3: Estimated Cost */}
        <div className="bg-white border border-slate-150 rounded-2xl p-4.5 flex flex-col justify-between shadow-sm relative overflow-hidden h-[95px] border-t-4 border-t-emerald-500">
          <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest leading-none select-none">Estimated Cost</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-[17px] font-black text-emerald-600">{parsed.estimatedCost || "N/A"}</span>
          </div>
          <span className="text-[9px] text-slate-400 font-semibold select-none">Assessment Valuation</span>
        </div>

        {/* Card 4: Recommendation */}
        <div className="bg-white border border-slate-150 rounded-2xl p-4.5 flex flex-col justify-between shadow-sm relative overflow-hidden h-[95px] border-t-4 border-t-violet-500">
          <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest leading-none select-none">Recommendation</span>
          <div className="flex items-baseline gap-1 mt-2 overflow-hidden">
            <span className="text-[13px] font-black text-slate-800 truncate" title={parsed.recommendedAction}>{parsed.recommendedAction || "N/A"}</span>
          </div>
          <span className="text-[9px] text-slate-400 font-semibold select-none">Suggested Action Payout</span>
        </div>
      </div>

      {/* Checklist & Notes Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Component Damage Checklist */}
        <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-4 shadow-sm">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block border-b border-slate-100 pb-2.5 mb-3 select-none">Component Damage Checklist</span>
            <div className="space-y-2">
              {Object.entries(parsed.checklist || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                  <span className="text-slate-655 font-bold text-xs">{key}</span>
                  {renderBadge(value)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Remarks Column */}
        <div className="flex flex-col gap-4">
          {parsed.preExistingDamage && parsed.preExistingDamage !== "None reported." && (
            <div className="bg-amber-50/20 border border-amber-200/50 rounded-2xl p-5 shadow-sm space-y-2.5 flex-1">
              <span className="text-[10px] text-amber-800 font-black uppercase tracking-wider flex items-center gap-1.5 select-none">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.03V3m0 0a8.001 8.001 0 00-7.797 6.138m15.594 0A8.001 8.001 0 0012 3M3.243 9.75a8.002 8.002 0 008.757 8.757m0 0A8.002 8.002 0 0020.757 9.75" />
                </svg>
                Pre-Existing Damage Remarks
              </span>
              <p className="text-slate-700 text-xs font-semibold leading-relaxed whitespace-pre-wrap">{parsed.preExistingDamage}</p>
            </div>
          )}

          <div className="bg-slate-50/50 border border-slate-200/70 rounded-2xl p-5 shadow-sm space-y-2.5 flex-1">
            <span className="text-[10px] text-slate-555 font-black uppercase tracking-wider flex items-center gap-1.5 select-none">
              <svg className="w-4 h-4 text-slate-505" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Physical Inspection Remarks
            </span>
            <p className="text-slate-700 text-xs font-semibold leading-relaxed whitespace-pre-wrap">{parsed.physicalInspectionNotes}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AgentDashboard() {
  const router = useRouter();
  const [agentName, setAgentName] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [activeSubModal, setActiveSubModal] = useState<"documents" | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [policyHolders, setPolicyHolders] = useState<any[]>([]);
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatLogs, setChatLogs] = useState<{ sender: string; text: string }[]>([]);

  const [claims, setClaims] = useState<Claim[]>([]);
  const [agentEmail, setAgentEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<"Active" | "Offline">("Active");

  const fetchAvailability = async (email: string) => {
    try {
      const res = await fetch(`${API_URL}/agent/availability?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.availability) {
          setAvailability(data.availability);
        }
      }
    } catch (e) {
      console.error("Error fetching availability:", e);
    }
  };

  const toggleAvailability = async (status: "Active" | "Offline") => {
    try {
      setAvailability(status);
      const res = await fetch(`${API_URL}/agent/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: agentEmail, availability: status })
      });
      if (!res.ok) throw new Error("Failed to update availability");
    } catch (e) {
      console.error("Error updating availability:", e);
      alert("Failed to update status. Please try again.");
    }
  };

  const fetchPolicyHolders = async (branchName: string) => {
    try {
      const phRes = await fetch(`${API_URL}/office-staff/policy-holders?branch=${encodeURIComponent(branchName.trim())}`);
      const regsRes = await fetch(`${API_URL}/office-staff/registrations?branch=${encodeURIComponent(branchName.trim())}`);
      let allUsers: any[] = [];
      if (phRes.ok) {
        const phData = await phRes.json();
        allUsers = [...allUsers, ...(phData.policyHolders || [])];
      }
      if (regsRes.ok) {
        const regsData = await regsRes.json();
        allUsers = [...allUsers, ...(regsData.registrations || [])];
      }
      setPolicyHolders(allUsers);
    } catch (e) {
      console.error("Fetch policy holders error:", e);
    }
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

  const getPolicyHolderEmail = (nic: string) => {
    if (!nic) return "-";
    const user = policyHolders.find(u => u.nic.toLowerCase().trim() === nic.toLowerCase().trim());
    return user ? user.email : "-";
  };

  const formatPlate = (plate: string) => {
    if (!plate) return "-";
    const cleaned = plate.trim();
    if (cleaned.includes("-")) return cleaned.toUpperCase();
    const m = cleaned.match(/^(.*[A-Za-z]+)(\d+)$/);
    if (m) return `${m[1].trim().toUpperCase()} - ${m[2]}`;
    return cleaned.toUpperCase();
  };

  const [assessmentAmount, setAssessmentAmount] = useState<string>("");
  const [inspectionReportText, setInspectionReportText] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [agentUploadFile, setAgentUploadFile] = useState<File | null>(null);
  const [agentUploadPreview, setAgentUploadPreview] = useState<string | null>(null);
  const [agentUploadDocName, setAgentUploadDocName] = useState<string>("Repair Estimate");
  const [isAgentUploading, setIsAgentUploading] = useState(false);
  const [isAcceptingClaim, setIsAcceptingClaim] = useState(false);
  const [showMobileRedirect, setShowMobileRedirect] = useState(false);
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
        fetchAvailability(parsed.email);
        if (parsed.branch) {
          fetchPolicyHolders(parsed.branch);
        }
      }
    } catch (e) {
      console.error(e);
      router.push("/Login");
    }
  }, []);

  // Poll availability status
  useEffect(() => {
    if (!agentEmail) return;
    const interval = setInterval(() => {
      fetchAvailability(agentEmail);
    }, 5000);
    return () => clearInterval(interval);
  }, [agentEmail]);

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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch { return String(dateStr); }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} ${hours}:${minutes}`;
    } catch { return String(dateStr); }
  };

  const getDocDetails = (claim: Claim, name: string, status: "Pending" | "Submitted") => {
    let requestedAt = "";
    let submittedAt = "";
    let sender = "Office Staff";

    const msg = [...(claim.messages || [])]
      .reverse()
      .find(m => m.message && typeof m.message === "string" && m.message.includes(`Requested: ${name}`));
    if (msg) {
      requestedAt = formatDateTime(msg.sentAt);
      sender = msg.sender || "Office Staff";
    } else {
      requestedAt = formatDateTime(claim.createdAt);
    }

    if (status === "Submitted") {
      const doc = (claim.additionalDocuments || []).find(
        d => d.name.trim().toLowerCase() === name.trim().toLowerCase()
      );
      if (doc && doc.uploadedAt) {
        submittedAt = formatDateTime(doc.uploadedAt);
      }
    }

    return { requestedAt, submittedAt, sender };
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
  const latestActivities = [...claims]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 4);

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
      setShowMobileRedirect(true);
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

  const handleDeclineClaim = async (claimId: string, claimNumber: string) => {
    try {
      setIsAcceptingClaim(true);
      const res = await fetch(`${API_URL}/office-staff/claims/${claimNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Rejected",
          currentStep: 5,
          rejectionReason: "Rejected by Agent",
          messageText: "Claim rejected by Agent.",
          messageRecipient: "Office Staff",
          messageSender: "Agent"
        })
      });
      if (!res.ok) {
        alert("Failed to decline claim.");
        return;
      }
      alert("Claim rejected successfully!");
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
      alert("Error declining claim.");
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
        <div className="absolute bottom-[-10%] left-[5%] w-[40%] h-[50%] rounded-full bg-red-500/10 blur-[120px] pointer-events-none animate-pulse duration-8000" />

        <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm select-none">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-200">{agentName}</span>!
              </h1>
              {/* Availability Status Selector */}
              <div className="flex items-center gap-2 bg-slate-950/45 border border-white/10 rounded-full p-1 self-start md:self-center select-none shadow-md">
                <span className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase pl-3 pr-1">Status</span>
                <button
                  onClick={() => toggleAvailability("Active")}
                  className={`px-4 py-1.5 rounded-full text-xs font-black cursor-pointer transition-all border-none flex items-center gap-1.5 ${
                    availability === "Active"
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                      : "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }`}
                >
                  {availability === "Active" && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                  Active
                </button>
                <button
                  onClick={() => toggleAvailability("Offline")}
                  className={`px-4 py-1.5 rounded-full text-xs font-black cursor-pointer transition-all border-none flex items-center gap-1.5 ${
                    availability === "Offline"
                      ? "bg-red-500 text-white shadow-md shadow-red-500/30"
                      : "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }`}
                >
                  {availability === "Offline" && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                  Offline
                </button>
              </div>
            </div>
            <p className="text-lg md:text-xl text-slate-300 max-w-3xl leading-relaxed font-medium">
              You have <span className="text-red-500 font-extrabold">{totalAssigned} assigned claims</span> today including{" "}
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

            {/* Completed Card */}
            <div className="bg-gradient-to-br from-[#065f46]/85 to-[#047857]/80 border border-emerald-500/40 rounded-2xl px-6 py-4 flex items-center gap-5 w-64 shadow-[0_10px_30px_rgba(16,185,129,0.15)] hover:bg-[#065f46]/90 hover:scale-[1.02] hover:border-emerald-400 transition-all duration-300">
              {/* Checkmark Shield Icon on the left */}
              <svg className="w-9 h-9 text-white flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
              {/* Stacked Text in the middle */}
              <div className="flex flex-col text-left">
                <span className="text-xs text-emerald-200 opacity-90 font-bold uppercase tracking-wider">Completed</span>
                <span className="text-base text-white font-extrabold tracking-wide -mt-0.5">Claims</span>
              </div>
              {/* Large count number on the right */}
              <span className="text-3xl font-black text-white ml-auto">{completedClaims.length}</span>
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
            <div className="flex flex-col gap-4 bg-gradient-to-br from-white/90 to-slate-50/50 backdrop-blur-md border border-red-200/40 rounded-3xl p-6 shadow-lg shadow-red-500/[0.005] relative overflow-hidden">
              <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200/60 pb-3 mb-2">
                <h2 className="text-lg font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5 select-none">
                  <svg className="w-5 h-5 text-red-500 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Action Required: Pending Agent Document Requests
                  {/* Total Pending Count Badge */}
                  <span className="bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 select-none shadow-[0_2px_8px_rgba(239,68,68,0.25)] animate-pulse">
                    {claimsWithPendingAgentRequests.length}
                  </span>
                </h2>
                {claimsWithPendingAgentRequests.length > 3 && (
                  <Link href="/Agent/Documents" className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-1.5 rounded-full text-xs font-extrabold transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1 select-none shadow-sm">
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
                    <div
                      key={claim._id}
                      className="relative overflow-hidden bg-white/70 backdrop-blur-sm border border-slate-100/80 rounded-2xl p-4 pl-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-[0_8px_24px_rgba(239,68,68,0.03)] hover:border-red-200/50 hover:bg-white hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-300 group"
                    >
                      {/* Vertical Red Accent Strip */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 to-rose-600 group-hover:w-1.5 transition-all duration-300" />
                      
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mr-2">
                        {/* Col 1: Claim ID & Plate */}
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Claim / Plate</span>
                          <span className="text-sm font-bold text-slate-800 truncate">
                            {claim.claimNumber} · {claim.vehiclePlate}
                          </span>
                        </div>

                        {/* Col 2: Received Progress */}
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Documents Received</span>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 select-none">
                            <svg className="w-4 h-4 text-cyan-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            <span>
                              <span className="text-emerald-600 font-extrabold">{uploadedDocsCount}</span> / <span className="text-slate-800 font-extrabold">{totalDocs.length}</span>
                            </span>
                          </div>
                        </div>

                        {/* Col 3: Pending Documents List */}
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Pending Files</span>
                          <div className="flex flex-wrap gap-1.5 mt-0.5">
                            {pendingDocs.map((docName, idx) => (
                              <span key={idx} className="text-[9px] font-black bg-red-50/70 text-red-600 border border-red-150 px-2.5 py-0.5 rounded-full select-none tracking-wide uppercase transition-colors hover:bg-red-100/50">
                                {docName}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/Agent/Documents?uploadClaim=${claim.claimNumber}`}
                        className="bg-[#0f2d3a] hover:bg-[#00ddff] hover:text-black hover:shadow-[0_4px_14px_rgba(0,221,255,0.3)] text-xs font-black py-2.5 px-5 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-sm border-none self-start md:self-center flex-shrink-0 text-center no-underline"
                      >
                        Upload Documents
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* New Claims Section */}
          <div className="flex flex-col gap-4 bg-gradient-to-br from-white/90 to-slate-50/50 backdrop-blur-md border border-slate-200/40 rounded-3xl p-6 shadow-lg shadow-slate-500/[0.005] relative overflow-hidden">
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200/60 pb-3 mb-2">
              <h2 className="text-lg font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5 select-none">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                New Claims
                {/* Total Count Badge */}
                <span className="bg-gradient-to-r from-slate-700 to-slate-800 text-white text-xs font-black px-2.5 py-0.5 rounded-full flex items-center justify-center select-none shadow-[0_2px_8px_rgba(15,23,42,0.12)] border border-slate-700/30">
                  {activeClaims.length}
                </span>
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              {loading ? (
                <div className="text-slate-400 font-bold py-10 text-center text-sm animate-pulse">
                  Fetching claims from database...
                </div>
              ) : activeClaims.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-slate-500 font-semibold text-sm">
                  No new claims assigned to you.
                </div>
              ) : (
                activeClaims.map((claim) => {
                  const severity = getSeverity(claim.damageType);
                  const isUrgent = severity === "Urgent";
                  
                  return (
                    <div
                      key={claim._id}
                      className="relative overflow-hidden bg-white/70 backdrop-blur-sm border border-slate-100/80 rounded-2xl p-4 pl-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-[0_8px_24px_rgba(0,0,0,0.03)] hover:border-slate-200 hover:bg-white hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-300 group"
                    >
                      {/* Decorative vertical color bar that glows/width-increases on card hover */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 group-hover:w-1.5 transition-all duration-300 ${isUrgent ? 'bg-gradient-to-b from-red-500 to-rose-600' : 'bg-gradient-to-b from-cyan-400 to-cyan-500'}`} />
                      
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-center mr-2">
                        {/* Col 1: Claim ID & Severity */}
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Claim Number</span>
                          <div className="text-sm font-bold text-slate-800 truncate flex items-center gap-1.5 flex-wrap">
                            {claim.claimNumber}
                            {isUrgent ? (
                              <span className="text-[9px] font-black uppercase bg-red-50 text-red-600 border border-red-200 px-2.5 py-0.5 rounded-full select-none tracking-wide">
                                Urgent
                              </span>
                            ) : (
                              <span className="text-[9px] font-black uppercase bg-cyan-50 text-cyan-700 border border-cyan-200 px-2.5 py-0.5 rounded-full select-none tracking-wide">
                                {severity}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Col 2: Vehicle */}
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Vehicle</span>
                          <span className="text-xs font-bold text-slate-700 truncate">
                            {claim.vehiclePlate} {claim.vehicleModel && <span className="font-semibold text-slate-500">({claim.vehicleModel})</span>}
                          </span>
                        </div>

                        {/* Col 3: Damage Type */}
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Damage Type</span>
                          <span className="text-xs font-bold text-slate-700 truncate">{claim.damageType}</span>
                        </div>

                        {/* Col 4: Location */}
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Location</span>
                          <span className="text-xs font-bold text-slate-700 truncate" title={claim.location}>{claim.location}</span>
                        </div>

                        {/* Col 5: Progress / Time */}
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Progress / Time</span>
                          <span className="text-xs font-bold text-slate-700 truncate">
                            Step {claim.currentStep} of 4 · <span className="text-slate-400 font-semibold">{claim.incidentTime}</span>
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setSelectedClaim(claim)}
                        className="bg-[#0f2d3a] hover:bg-[#00ddff] hover:text-black hover:shadow-[0_4px_14px_rgba(0,221,255,0.3)] text-xs font-black py-2.5 px-5 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-sm border-none self-start md:self-center flex-shrink-0"
                      >
                        Details
                      </button>
                    </div>
                  );
                })
              )}
            </div>
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

            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_10px_35px_rgba(0,0,0,0.015)] flex flex-col gap-4 relative">
              {loading ? (
                <div className="text-slate-400 text-center text-xs py-4 animate-pulse">Loading activity...</div>
              ) : latestActivities.length === 0 ? (
                <div className="text-slate-400 text-center text-xs py-4 font-semibold">No recent activity.</div>
              ) : (
                <div className="relative border-l border-slate-100 ml-3 pl-6 space-y-6">
                  {latestActivities.map((act) => {
                    let badgeBg = "";
                    let dotBg = "";
                    
                    if (act.status === "Approved") {
                      badgeBg = "bg-emerald-50/80 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-500/[0.05]";
                      dotBg = "bg-emerald-500 ring-4 ring-emerald-100";
                    } else if (act.status === "Rejected") {
                      badgeBg = "bg-rose-50/80 text-rose-700 border-rose-200 shadow-sm shadow-rose-500/[0.05]";
                      dotBg = "bg-rose-500 ring-4 ring-rose-100";
                    } else if (act.status === "In Progress") {
                      badgeBg = "bg-cyan-50/80 text-cyan-700 border-cyan-200 shadow-sm shadow-cyan-500/[0.05]";
                      dotBg = "bg-cyan-500 ring-4 ring-cyan-100";
                    } else { // Pending
                      badgeBg = "bg-amber-50/80 text-amber-700 border-amber-200 shadow-sm shadow-amber-500/[0.05]";
                      dotBg = "bg-amber-500 ring-4 ring-amber-100";
                    }

                    return (
                      <div key={act._id} className="relative group transition-all duration-355 hover:translate-x-0.5">
                        {/* Timeline Node Dot */}
                        <div className={`absolute -left-[30px] top-1.5 w-3.5 h-3.5 rounded-full transition-transform duration-300 group-hover:scale-125 ${dotBg}`} />

                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-extrabold text-sm text-slate-800 tracking-tight transition-colors group-hover:text-cyan-600">{act.claimNumber}</span>
                            <span className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase mt-0.5">{act.vehiclePlate}</span>
                          </div>

                          <span className={`px-3 py-0.5 rounded-full text-[10px] font-black border tracking-wide uppercase ${badgeBg}`}>
                            {act.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Contact Support Card Box */}
          <div className="bg-gradient-to-br from-cyan-50/90 via-sky-50/40 to-blue-50/20 border border-cyan-150/60 rounded-3xl p-6 shadow-md hover:shadow-lg hover:scale-[1.01] transition-all duration-300 relative overflow-hidden flex flex-col gap-4">
            
            {/* Pulsing online status indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/50 rounded-full px-2.5 py-0.5 select-none">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] font-bold text-emerald-700 tracking-wide uppercase">Live Support</span>
            </div>

            <h3 className="text-cyan-800 font-extrabold text-lg tracking-tight flex items-center gap-2 select-none">
              <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Support Helpdesk
            </h3>
            
            <p className="text-xs text-slate-500 font-semibold text-left leading-relaxed -mt-1 select-none">
              Need assistance with an active inspection or claim payout details? Call our staff directly.
            </p>

            <div className="flex flex-col gap-2.5 mt-1">
              <a href="tel:+94112003000" className="flex items-center justify-between bg-white border border-slate-100/60 p-3 rounded-2xl hover:border-cyan-200 hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 font-bold text-sm text-slate-800 group">
                <div className="flex items-center gap-2.5">
                  <span className="bg-cyan-50 p-2 rounded-xl text-cyan-600 transition-colors group-hover:bg-cyan-500 group-hover:text-white">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.47-5.112-3.758-6.58-6.58l1.293-.97c.362-.272.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                    </svg>
                  </span>
                  <span className="text-slate-700 tracking-tight font-extrabold">+94 112 003 000</span>
                </div>
                <span className="text-[10px] bg-slate-50 border border-slate-150 px-2.5 py-0.5 rounded-full text-slate-400 group-hover:bg-cyan-50 group-hover:text-cyan-600 group-hover:border-cyan-200">
                  Line 1
                </span>
              </a>

              <a href="tel:+94112003001" className="flex items-center justify-between bg-white border border-slate-100/60 p-3 rounded-2xl hover:border-cyan-200 hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 font-bold text-sm text-slate-800 group">
                <div className="flex items-center gap-2.5">
                  <span className="bg-cyan-50 p-2 rounded-xl text-cyan-600 transition-colors group-hover:bg-cyan-500 group-hover:text-white">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.47-5.112-3.758-6.58-6.58l1.293-.97c.362-.272.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                    </svg>
                  </span>
                  <span className="text-slate-700 tracking-tight font-extrabold">+94 112 003 001</span>
                </div>
                <span className="text-[10px] bg-slate-50 border border-slate-150 px-2.5 py-0.5 rounded-full text-slate-400 group-hover:bg-cyan-50 group-hover:text-cyan-600 group-hover:border-cyan-200">
                  Line 2
                </span>
              </a>
            </div>
          </div>

        </div>

      </main>
      {/* Detailed Claim Modal & Sub-modals (Matching Branch Claims Portal layout) */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300 animate-in fade-in">
          
          {/* SUB-MODAL 1: DOCUMENTS */}
          {activeSubModal === "documents" && (
            <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-[800px] h-[650px] max-h-[90vh] shadow-2xl flex flex-col relative animate-fade-in overflow-hidden">
              {/* Header */}
              <div className="px-8 pt-6 pb-2 select-none bg-white">
                <h2 className="text-[24px] font-black text-slate-900 tracking-tight leading-none">
                  Documents - {selectedClaim.claimNumber}
                </h2>
              </div>
              <div className="border-b border-black mx-8 mb-6" />

              {/* Body */}
              <div className="px-8 pb-8 flex-1 overflow-y-auto space-y-6">
                <div className="text-left font-bold text-slate-800 space-y-1.5 text-[13px] select-none leading-relaxed">
                  <p>Vehicle No : <span className="font-medium text-slate-600">{formatPlate(selectedClaim.vehiclePlate)}</span></p>
                </div>

                {/* Categorized Document Lists */}
                <div className="space-y-6">
                  {/* Category 1: Policy Holder Documents */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-black text-slate-800 border-b border-slate-200 pb-2 uppercase tracking-wider flex items-center gap-2 select-none">
                      <svg className="w-4 h-4 text-[#0f2d4a]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                      </svg>
                      Policy Holder Documents
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(() => {
                        const phDocs: { name: string; url: string }[] = [];
                        
                        // License & Accident Photos
                        const dlFront = selectedClaim.drivingLicense?.front?.[0];
                        const dlRear = selectedClaim.drivingLicense?.rear?.[0];
                        if (dlFront) phDocs.push({ name: "Driving License (Front)", url: dlFront });
                        if (dlRear) phDocs.push({ name: "Driving License (Rear)", url: dlRear });
                        
                        let photoIndex = 1;
                        const fPhotos = selectedClaim.accidentPhotos?.front || [];
                        const rPhotos = selectedClaim.accidentPhotos?.rear || [];
                        const sPhotos = selectedClaim.accidentPhotos?.side || [];
                        
                        fPhotos.forEach((url: string) => {
                          phDocs.push({ name: `Accident Photo ${photoIndex++} (Front)`, url });
                        });
                        rPhotos.forEach((url: string) => {
                          phDocs.push({ name: `Accident Photo ${photoIndex++} (Rear)`, url });
                        });
                        sPhotos.forEach((url: string) => {
                          phDocs.push({ name: `Accident Photo ${photoIndex++} (Side)`, url });
                        });
                        
                        (selectedClaim.additionalDocuments || []).forEach((doc) => {
                          const uploadedBy = doc.uploadedBy || "Policy Holder";
                          if (uploadedBy === "Policy Holder") {
                            phDocs.push({ name: doc.name, url: doc.url });
                          }
                        });

                        if (phDocs.length === 0) {
                          return <p className="text-xs text-slate-400 font-bold italic select-none col-span-2 py-2">No policy holder documents.</p>;
                        }

                        return phDocs.map((doc, idx) => {
                          let docUrl = doc.url;
                          if (docUrl && !docUrl.startsWith("http") && !docUrl.startsWith("data:")) {
                            docUrl = `${API_URL.replace("/api", "")}/uploads/${docUrl}`;
                          }
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setPreviewImage(docUrl || null)}
                              className="bg-white border border-slate-200 hover:bg-slate-50 transition-all p-3.5 rounded-[15px] flex items-center justify-start gap-3 cursor-pointer outline-none shadow-sm active:scale-98 text-left"
                            >
                              <svg className="w-5 h-5 text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                              </svg>
                              <span className="text-xs font-extrabold text-slate-700 truncate">{doc.name}</span>
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Category 2: Agent Documents & Upload Panel */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-black text-slate-800 border-b border-slate-200 pb-2 uppercase tracking-wider flex items-center gap-2 select-none">
                      <svg className="w-4 h-4 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                      </svg>
                      Agent Documents
                    </h3>

                    {/* Uploaded Agent Docs List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(() => {
                        const agentDocs: { name: string; url?: string; textContent?: string }[] = [];
                        
                        if (selectedClaim.inspectionSubmitted && selectedClaim.inspectionReport) {
                          agentDocs.push({
                            name: "Inspection Report (Text)",
                            textContent: selectedClaim.inspectionReport
                          });
                        }

                        (selectedClaim.additionalDocuments || []).forEach((doc) => {
                          const uploadedBy = doc.uploadedBy || "Policy Holder";
                          if (uploadedBy === "Agent") {
                            agentDocs.push({ name: doc.name, url: doc.url });
                          }
                        });

                        if (agentDocs.length === 0) {
                          return <p className="text-xs text-slate-400 font-bold italic select-none col-span-2 py-2">No agent documents uploaded.</p>;
                        }

                        return agentDocs.map((doc, idx) => {
                          if (doc.textContent) {
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  alert(`--- Inspection Report ---\n\n${doc.textContent}`);
                                }}
                                className="bg-white border border-slate-200 hover:bg-slate-50 transition-all p-3.5 rounded-[15px] flex items-center justify-start gap-3 cursor-pointer outline-none shadow-sm active:scale-98 text-left"
                              >
                                <svg className="w-5 h-5 text-cyan-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                                <span className="text-xs font-extrabold text-slate-700 truncate">{doc.name}</span>
                              </button>
                            );
                          }
                          let docUrl = doc.url;
                          if (docUrl && !docUrl.startsWith("http") && !docUrl.startsWith("data:")) {
                            docUrl = `${API_URL.replace("/api", "")}/uploads/${docUrl}`;
                          }
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setPreviewImage(docUrl || null)}
                              className="bg-white border border-slate-200 hover:bg-slate-50 transition-all p-3.5 rounded-[15px] flex items-center justify-start gap-3 cursor-pointer outline-none shadow-sm active:scale-98 text-left"
                            >
                              <svg className="w-5 h-5 text-cyan-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                              </svg>
                              <span className="text-xs font-extrabold text-slate-700 truncate">{doc.name}</span>
                            </button>
                          );
                        });
                      })()}
                    </div>

                    {/* Agent File Upload Panel */}
                    {selectedClaim.status !== "Approved" && selectedClaim.status !== "Rejected" && (
                      <div className="border-t border-slate-200/60 pt-4 flex flex-col gap-4">
                        <span className="text-[11px] text-slate-500 font-extrabold uppercase tracking-wider select-none">Upload Claim Document</span>
                        
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider select-none">Document Type</label>
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
                                      ? "bg-red-650 border-red-650 text-white shadow-sm"
                                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                  }`}
                                >
                                  {type}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider select-none">File Attachment</label>
                          
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
                              className="w-full border-2 border-dashed border-slate-300 hover:border-red-500 rounded-2xl py-6 px-4 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-red-50/5 cursor-pointer transition-all duration-150 group"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-8 h-8 text-slate-400 mb-2 group-hover:text-red-500 transition-colors">
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
                                className="bg-red-550 hover:bg-red-100 text-red-500 border border-red-200 rounded-full p-2 transition-colors cursor-pointer border-none"
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
                            className="w-full bg-red-650 hover:bg-red-700 text-white font-extrabold text-xs py-3 px-4 rounded-xl border-none cursor-pointer active:scale-[0.98] transition-all disabled:opacity-50 mt-1 shadow-md flex items-center justify-center gap-2"
                          >
                            {isAgentUploading ? "Uploading..." : "Upload Document to Claim"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-4 bg-white border-t border-slate-200 flex justify-end flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveSubModal(null)}
                  className="bg-[#0f2d4a] hover:bg-[#1a3d5e] text-white font-bold text-sm px-6 py-2 rounded-full transition-all border-none cursor-pointer flex items-center shadow-sm active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* MAIN DETAILS MODAL */}
          {activeSubModal === null && (
            <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-[780px] max-h-[90vh] p-8 shadow-2xl relative flex flex-col animate-fade-in select-none">
              
              {/* Close Button X */}
              <button
                type="button"
                onClick={() => setSelectedClaim(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer border-none bg-transparent"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Header: Title, Tags & Avatar */}
              <div className="flex items-start justify-between gap-4">
                <div className="overflow-hidden">
                  <h2 className="font-black text-slate-800 text-xl tracking-tight truncate">
                    {getPolicyHolderName(selectedClaim.userNic)}
                  </h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="border border-amber-300 text-amber-700 bg-amber-50/50 rounded-lg px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                      ID: {selectedClaim.claimNumber}
                    </span>
                    <span className={`border rounded-lg px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                      selectedClaim.status.toLowerCase() === "pending"
                        ? "border-amber-300 text-amber-700 bg-amber-50/50"
                        : selectedClaim.status.toLowerCase() === "in progress"
                        ? "border-blue-300 text-blue-700 bg-blue-50/50"
                        : selectedClaim.status.toLowerCase() === "approved"
                        ? "border-emerald-300 text-emerald-700 bg-emerald-50/50"
                        : "border-red-300 text-red-700 bg-red-50/50"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        selectedClaim.status.toLowerCase() === "pending"
                          ? "bg-amber-500 animate-pulse"
                          : selectedClaim.status.toLowerCase() === "in progress"
                          ? "bg-blue-500"
                          : selectedClaim.status.toLowerCase() === "approved"
                          ? "bg-emerald-500"
                          : "bg-red-500"
                      }`} />
                      {selectedClaim.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100 my-5" />

              {/* Details Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs md:text-sm font-semibold select-none leading-relaxed flex-1 overflow-y-auto pr-1">
                {/* Column 1: Policy Holder Details */}
                <div className="space-y-3.5 bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                  <h3 className="text-slate-800 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200 pb-2 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#0f2d4a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    Policy Holder Details
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-[100px_1fr] gap-2">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Email</span>
                      <span className="text-slate-700 font-black truncate">: {getPolicyHolderEmail(selectedClaim.userNic)}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">NIC</span>
                      <span className="text-slate-700 font-black truncate">: {selectedClaim.userNic}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Contact</span>
                      <span className="text-slate-700 font-black truncate">: {getPolicyHolderContact(selectedClaim.userNic)}</span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Vehicle Details */}
                <div className="space-y-3.5 bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                  <h3 className="text-slate-800 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200 pb-2 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#0f2d4a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124l-.847-13.486c-.035-.56-1.178-.941-1.745-.941H3.66c-.567 0-1.71.381-1.745.941l-.847 13.486c-.04.62.469 1.124 1.09 1.124H4.5m12-5.25a2.25 2.25 0 00-2.25-2.25H9.75A2.25 2.25 0 007.5 12.75V15h9v-2.25z" />
                    </svg>
                    Vehicle Details
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-[100px_1fr] gap-2">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Vehicle No</span>
                      <span className="text-slate-700 font-black truncate">: {formatPlate(selectedClaim.vehiclePlate)}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Branch</span>
                      <span className="text-slate-700 font-black truncate">: {selectedClaim.branch || "-"}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Assigned Agent</span>
                      <span className="text-slate-700 font-black truncate">: {agentName || selectedClaim.assignedAgent || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Large Dedicated Section: Incident Details */}
                <div className="col-span-1 md:col-span-2 space-y-4 bg-slate-50 border border-slate-200 p-6 rounded-2xl">
                  <h3 className="text-slate-800 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200 pb-2 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    Incident Details & Assessment
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="grid grid-cols-[110px_1fr] gap-2">
                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Damage Type</span>
                        <span className="text-slate-700 font-black truncate">: {selectedClaim.damageType || "-"}</span>
                      </div>
                      <div className="grid grid-cols-[110px_1fr] gap-2">
                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Incident Date</span>
                        <span className="text-slate-700 font-black truncate">: {formatDate(selectedClaim.incidentDate)} @ {selectedClaim.incidentTime}</span>
                      </div>
                      <div className="grid grid-cols-[110px_1fr] gap-2">
                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Est. Amount</span>
                        {selectedClaim.amount ? (
                          <span className="text-slate-700 font-black truncate">: LKR {selectedClaim.amount.toLocaleString()}</span>
                        ) : (
                          <div className="flex items-center gap-2 mt-0.5">
                            <input
                              type="number"
                              value={assessmentAmount}
                              onChange={(e) => setAssessmentAmount(e.target.value)}
                              placeholder="Enter LKR amount"
                              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-bold focus:outline-none max-w-[150px]"
                            />
                            <button
                              onClick={() => handleApproveAssessment(selectedClaim._id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] px-3.5 py-1.5 rounded-lg border-none cursor-pointer transition-colors active:scale-95 whitespace-nowrap"
                            >
                              Approve
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-[110px_1fr] gap-2 items-start">
                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Location</span>
                        <span className="text-slate-700 font-black whitespace-normal break-words leading-relaxed">: {selectedClaim.location || "-"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3 flex flex-col gap-1">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Incident Description</span>
                    <span className="text-slate-900 font-semibold break-words leading-relaxed whitespace-pre-wrap mt-1">
                      {selectedClaim.description || "No description provided."}
                    </span>
                  </div>

                  {selectedClaim.rejectionReason && (
                    <div className="flex flex-col gap-1 border-t border-slate-200/60 pt-3 mt-3">
                      <span className="text-red-500 font-bold uppercase tracking-wider text-[10px]">Rejection Reason</span>
                      <span className="text-red-650 font-extrabold mt-1 text-sm">
                        {selectedClaim.rejectionReason}
                      </span>
                    </div>
                  )}

                  {/* Documents & Contact Info Actions Row */}
                  <div className="border-t border-slate-200 pt-4 flex items-center justify-start gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveSubModal("documents")}
                      className="bg-[#0f2d4a] hover:bg-[#1a3d5e] text-white font-extrabold text-xs py-2.5 px-5 rounded-xl cursor-pointer shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      Dossier Documents ({selectedClaim.additionalDocuments?.length || 0})
                    </button>
                  </div>
                </div>

                {/* Policy Holder Attachments / Photos Section */}
                {(() => {
                  const attachments: { name: string; url: string }[] = [];
                  
                  const dlFront = selectedClaim.drivingLicense?.front?.[0];
                  const dlRear = selectedClaim.drivingLicense?.rear?.[0];
                  if (dlFront) attachments.push({ name: "License (Front)", url: dlFront });
                  if (dlRear) attachments.push({ name: "License (Rear)", url: dlRear });
                  
                  let photoIndex = 1;
                  const fPhotos = selectedClaim.accidentPhotos?.front || [];
                  const rPhotos = selectedClaim.accidentPhotos?.rear || [];
                  const sPhotos = selectedClaim.accidentPhotos?.side || [];
                  
                  fPhotos.forEach((url: string) => {
                    attachments.push({ name: `Accident Front #${photoIndex++}`, url });
                  });
                  rPhotos.forEach((url: string) => {
                    attachments.push({ name: `Accident Rear #${photoIndex++}`, url });
                  });
                  sPhotos.forEach((url: string) => {
                    attachments.push({ name: `Accident Side #${photoIndex++}`, url });
                  });

                  return (
                    <div className="col-span-1 md:col-span-2 space-y-4 bg-slate-50 border border-slate-200 p-6 rounded-2xl">
                      <h3 className="text-slate-800 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200 pb-2 mb-3 flex items-center gap-2">
                        <svg className="w-4.5 h-4.5 text-[#0f2d4a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                        Policy Holder Attachments & Photos
                      </h3>

                      {attachments.length === 0 ? (
                        <p className="text-xs text-slate-450 font-black italic select-none py-2">
                          No driving license or accident photos attached to this claim dossier.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                          {attachments.map((doc, idx) => {
                            let docUrl = doc.url;
                            if (docUrl && !docUrl.startsWith("http") && !docUrl.startsWith("data:")) {
                              docUrl = `${API_URL.replace("/api", "")}/uploads/${docUrl}`;
                            }
                            return (
                              <div
                                key={idx}
                                onClick={() => setPreviewImage(docUrl || null)}
                                className="group cursor-pointer flex flex-col items-center"
                              >
                                <div className="w-full h-24 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm group-hover:shadow transition-all relative">
                                  <img
                                    src={docUrl}
                                    alt={doc.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                                  />
                                </div>
                                <span className="text-[9px] text-slate-500 font-black text-center mt-2 uppercase tracking-wider truncate w-full px-1">
                                  {doc.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Submit Inspection Report Section */}
                {selectedClaim.status !== "Approved" && selectedClaim.status !== "Rejected" && selectedClaim.currentStep === 3 && !selectedClaim.inspectionSubmitted && (
                  <div className="col-span-1 md:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-2.5">
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

                {selectedClaim.inspectionSubmitted && selectedClaim.inspectionReport && (
                  <div className="col-span-1 md:col-span-2">
                    {renderPremiumInspectionReport(selectedClaim.inspectionReport)}
                  </div>
                )}

              </div>

              {/* Action Buttons: Accept / Decline */}
              {selectedClaim.status.toLowerCase() === "pending" && selectedClaim.currentStep === 2 && (
                <div className="flex items-center gap-4 mt-6 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAcceptClaim(selectedClaim._id)}
                    disabled={isAcceptingClaim}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-3.5 rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all disabled:opacity-50 border-none"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Accept Assignment
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeclineClaim(selectedClaim._id, selectedClaim.claimNumber)}
                    disabled={isAcceptingClaim}
                    className="flex-1 bg-red-650 hover:bg-red-750 text-white font-black text-sm py-3.5 rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all disabled:opacity-50 border-none"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Decline Assignment
                  </button>
                </div>
              )}

              {/* Status Banner for Accepted (In Progress / Approved) Claims */}
              {(selectedClaim.status.toLowerCase() === "in progress" || selectedClaim.currentStep === 3) && !selectedClaim.inspectionSubmitted && (
                <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mt-6 text-center select-none animate-fade-in flex-shrink-0 animate-in slide-in-from-bottom-5">
                  <p className="text-emerald-800 text-xs md:text-sm font-black flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                    </svg>
                    Claim Assignment Accepted
                  </p>
                  <p className="text-emerald-600 text-xs font-semibold mt-2 leading-relaxed">
                    Please open the <strong>Sanasa Agent Mobile App</strong> on your smartphone to complete the physical damage evaluation, snap accident scene/license photos, and submit inspection reports.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* Preview Image Modal Overlay */}
      {previewImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl p-2 overflow-hidden shadow-2xl flex flex-col items-center animate-in zoom-in-95">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 text-white bg-slate-900/60 hover:bg-slate-900 p-2 rounded-full border border-slate-700/50 transition-all select-none cursor-pointer z-10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {previewImage.toLowerCase().endsWith(".pdf") ? (
              <iframe src={previewImage} className="w-[80vw] h-[80vh] border-none rounded-xl" title="PDF Document Preview" />
            ) : (
              <img src={previewImage} className="max-w-full max-h-[85vh] object-contain rounded-xl shadow" alt="Document Preview" />
            )}
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

      {/* Styled UI Redirect Modal Overlay */}
      {showMobileRedirect && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl flex flex-col items-center text-center">
            {/* Close Button */}
            <button
              onClick={() => setShowMobileRedirect(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-all border-none bg-transparent cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Glowing Mobile Icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-5 relative">
              <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-20"></span>
              <svg className="w-8 h-8 relative z-10" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
              </svg>
            </div>

            {/* Content */}
            <h3 className="text-slate-900 font-black text-xl tracking-tight leading-none">
              Claim Accepted Successfully!
            </h3>
            <p className="text-slate-500 text-xs md:text-sm font-semibold mt-4 leading-relaxed">
              To proceed with the vehicle physical damage inspection, snap photos, and submit reports, please open the **Sanasa Agent Mobile App** on your smartphone.
            </p>

            {/* Quick Steps */}
            <div className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl p-4 mt-5 text-left space-y-2.5">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block select-none">Next Steps:</span>
              <div className="flex gap-2.5 items-start text-xs font-semibold text-slate-700">
                <span className="w-5 h-5 rounded-full bg-[#0f2d4a] text-white flex items-center justify-center font-bold shrink-0 text-[10px] mt-0.5">1</span>
                <span className="leading-relaxed">Launch the Sanasa Agent app on your phone.</span>
              </div>
              <div className="flex gap-2.5 items-start text-xs font-semibold text-slate-700">
                <span className="w-5 h-5 rounded-full bg-[#0f2d4a] text-white flex items-center justify-center font-bold shrink-0 text-[10px] mt-0.5">2</span>
                <span className="leading-relaxed">Go to <strong>Active Claims</strong> tab or notifications.</span>
              </div>
              <div className="flex gap-2.5 items-start text-xs font-semibold text-slate-700">
                <span className="w-5 h-5 rounded-full bg-[#0f2d4a] text-white flex items-center justify-center font-bold shrink-0 text-[10px] mt-0.5">3</span>
                <span className="leading-relaxed">Tap on your newly accepted claim plate number.</span>
              </div>
              <div className="flex gap-2.5 items-start text-xs font-semibold text-slate-700">
                <span className="w-5 h-5 rounded-full bg-[#0f2d4a] text-white flex items-center justify-center font-bold shrink-0 text-[10px] mt-0.5">4</span>
                <span className="leading-relaxed">Submit the inspection details directly.</span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowMobileRedirect(false)}
              className="w-full mt-6 bg-[#0f2d4a] hover:bg-[#193d61] text-white font-extrabold text-xs py-3.5 rounded-xl border-none cursor-pointer shadow-md hover:shadow-slate-900/10 active:scale-95 transition-all select-none"
            >
              Okay, Got It
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
