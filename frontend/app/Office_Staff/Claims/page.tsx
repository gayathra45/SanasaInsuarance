"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import OfficeStaffNavbar from "@/app/Components/Office_Staff/Navbar";
import { API_URL } from "@/app/config";

interface ClaimMessage {
  sender: string;
  message: string;
  sentAt: string;
  recipient?: string;
  _id?: string;
}

interface AdditionalDoc {
  name: string;
  url: string;
  uploadedAt: string;
  _id?: string;
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
  status: string;
  branch: string;
  assignedAgent: string;
  amount: number | null;
  currentStep: number;
  documentsRequested: boolean;
  requestedDocuments: string[];
  documentRequestTo?: string;
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
  inspectionReport?: string;
  inspectionSubmitted?: boolean;
  paymentReceipt?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccount?: string;
  policyHolderBankDetails?: {
    bankName: string;
    branchName: string;
    accountNumber: string;
    accountHolderName: string;
  };
  rejectionReason?: string;
  notes?: ClaimNote[];
  isManuallyUpdated?: boolean;
  manualUpdateReason?: string;
  manualUpdateAt?: string;
  manualUpdateBy?: string;
}

interface ClaimNote {
  text: string;
  addedBy: string;
  addedAt: string;
  _id?: string;
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

const renderParsedInspection = (
  reportText: string,
  additionalDocuments: AdditionalDoc[] = [],
  apiUrl: string = "",
  onPhotoClick?: (url: string) => void
) => {
  const parsed = parseInspectionReport(reportText);
  if (!parsed) return null;

  if (parsed.isRaw) {
    return (
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-inner select-text">
        <div className="flex items-center gap-2 mb-3 text-slate-405 select-none">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Raw Inspection Report Text</span>
        </div>
        <p className="text-slate-705 text-xs font-semibold whitespace-pre-wrap leading-relaxed">
          {parsed.rawText}
        </p>
      </div>
    );
  }

  const renderChecklistBadge = (val: string) => {
    let color = "text-slate-500 bg-slate-50 border-slate-200";
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

  const agentPhotos = (additionalDocuments || [])
    .filter((doc) => doc.uploadedBy === "Agent" || doc.name.toLowerCase().includes("inspection photo"))
    .map((doc) => {
      let docUrl = doc.url;
      if (docUrl && !docUrl.startsWith("http") && !docUrl.startsWith("data:")) {
        docUrl = `${apiUrl.replace("/api", "")}/uploads/${docUrl}`;
      }
      return { name: doc.name, url: docUrl };
    });

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
                  {renderChecklistBadge(value)}
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

      {/* Inspection Photos Grid */}
      {agentPhotos.length > 0 && (
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-3 select-none">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block border-b border-slate-100 pb-2.5">
            Inspection Photos ({agentPhotos.length})
          </span>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3 pt-1">
            {agentPhotos.map((photo, index) => (
              <div
                key={index}
                onClick={() => onPhotoClick && onPhotoClick(photo.url)}
                className="aspect-square rounded-xl border border-slate-200 overflow-hidden cursor-zoom-in hover:scale-105 transition-all shadow-sm"
                title={photo.name}
              >
                <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function OfficeStaffClaimsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const claimId = searchParams.get("claimId");
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
  const [previewReportText, setPreviewReportText] = useState<string | null>(null);
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
  const [decisionAction, setDecisionAction] = useState<"Approve" | "Reject" | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [paymentReceiptFile, setPaymentReceiptFile] = useState<File | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

  const [staffName, setStaffName] = useState("");
  // Manual override states
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualStep, setManualStep] = useState<number | "">("");
  const [manualReason, setManualReason] = useState<string>("");
  const [manualUpdateByVal, setManualUpdateByVal] = useState("");

  // Sub-modal overlay states
  const [activeSubModal, setActiveSubModal] = useState<"documents" | "contact" | "request_docs" | "add_note" | "update_tracking" | null>(null);
  interface RequestDocItem {
    recipient: "User" | "Agent";
    docType: string;
    customName: string;
    note: string;
  }
  const [requestItems, setRequestItems] = useState<RequestDocItem[]>([
    { recipient: "User", docType: "NIC Front Page", customName: "", note: "" }
  ]);
  const [contactRecipient, setContactRecipient] = useState<"Policy Holder" | "Agent">("Policy Holder");

  const handleAddRequestItem = () => {
    setRequestItems(prev => [
      ...prev,
      { recipient: "User", docType: "NIC Front Page", customName: "", note: "" }
    ]);
  };

  const handleRemoveRequestItem = (index: number) => {
    setRequestItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleRequestItemChange = (index: number, fields: Partial<RequestDocItem>) => {
    setRequestItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        const updated = { ...item, ...fields };
        if (fields.recipient) {
          if (fields.recipient === "Agent") {
            const agentOptions = ["Repair Estimate", "Inspection Photos", "Damage Assessment", "Underwriting Report", "Custom / Other"];
            if (!agentOptions.includes(updated.docType)) {
              updated.docType = "Repair Estimate";
            }
          } else {
            const userOptions = ["NIC Front Page", "NIC Back Page", "License Front", "License Rear", "Vehicle Registration", "Revenue License", "Accident Photos", "Repair Estimate", "Custom / Other"];
            if (!userOptions.includes(updated.docType)) {
              updated.docType = "NIC Front Page";
            }
          }
        }
        return updated;
      }
      return item;
    }));
  };

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
          setStaffName(staffObj.name || "");
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

  // Poll claims in background for real-time updates
  useEffect(() => {
    if (!branch || selectedClaim !== null || showAssignModal) return;
    const pollInterval = setInterval(async () => {
      try {
        const claimsRes = await fetch(`${API_URL}/office-staff/claims?branch=${branch}`);
        if (claimsRes.ok) {
          const claimsData = await claimsRes.json();
          setClaims(claimsData.claims || []);
        }
      } catch (err) {
        console.warn("Background claims polling failed:", err);
      }
    }, 7000);
    return () => clearInterval(pollInterval);
  }, [branch, selectedClaim, showAssignModal]);

  useEffect(() => {
    if (claimId && claims.length > 0) {
      const matched = claims.find(c => c._id === claimId || c.claimNumber === claimId);
      if (matched) {
        setSelectedClaim(matched);
      }
    }
  }, [claimId, claims]);

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

  useEffect(() => {
    if (selectedClaim) {
      setAssessmentAmount(selectedClaim.amount !== null ? selectedClaim.amount.toString() : "");
      setBankName(selectedClaim.bankName || selectedClaim.policyHolderBankDetails?.bankName || "");
      setBankBranch(selectedClaim.bankBranch || selectedClaim.policyHolderBankDetails?.branchName || "");
      setBankAccount(selectedClaim.bankAccount || selectedClaim.policyHolderBankDetails?.accountNumber || "");
      setRejectionReasonText(selectedClaim.rejectionReason || "");
      setDecisionAction(null);
      setPaymentReceiptFile(null);
      setIsManualMode(false);
      setManualStep("");
      setManualReason("");
      setManualUpdateByVal("");
    }
  }, [selectedClaim]);

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
  const handleUpdateClaim = async (
    claimNumber: string,
    updates: Partial<Claim> & { 
      messageText?: string; 
      messageTexts?: { message: string; recipient: string }[];
      messageRecipient?: string; 
      noteText?: string; 
      documentRequestTo?: string; 
    }
  ) => {
    try {
      setUpdatingClaim(true);
      const res = await fetch(`${API_URL}/office-staff/claims/${claimNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updates,
          messageSender: branch ? `${branch} Branch Staff` : "Office Staff"
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
    const isAssigned = claim.currentStep >= 2;
    const isInspection = claim.currentStep >= 3;
    const isReview = claim.currentStep >= 4;
    const isDecision = claim.currentStep >= 5 || claim.status === "Approved" || claim.status === "Rejected";
    const isPayment = claim.currentStep >= 6 || (claim.status === "Approved" && claim.amount !== null);

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
          <header className="bg-white border-b border-slate-100 text-slate-800 px-8 py-4 flex justify-between items-center select-none shadow-sm flex-shrink-0 h-[80px]">
            <h1 className="text-xl font-semibold text-slate-800 flex items-center gap-2"><span className="bg-[#102A43] text-white text-base px-3.5 py-1.5 rounded-xl font-black shadow-sm tracking-wide">{branch} Branch</span> — Claims Portal</h1>
            <div className="flex items-center gap-5">
              {/* Notification Bell Icon */}
              <Link href="/Office_Staff/Notifications" className="relative p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer focus:outline-none flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-slate-500 hover:text-slate-800">
                  <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 1.65.342 3.228.96 4.658A1.875 1.875 0 0 1 18 17.25H6a1.875 1.875 0 0 1-1.71-2.842 9.06 9.06 0 0 0 .96-4.658V9ZM12 18.75a2.25 2.25 0 0 1-2.247-2.118.75.75 0 0 1 .746-.757h3a.75.75 0 0 1 .746.757A2.25 2.25 0 0 1 12 18.75Z" clipRule="evenodd" />
                </svg>
              </Link>
              {/* User Avatar Icon */}
              <button className="relative p-1 hover:bg-slate-100 rounded-full transition-colors cursor-pointer focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-slate-500 hover:text-slate-800">
                  <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12c0 2.754 1.14 5.244 2.98 7.03-.028-.01-.053-.024-.082-.031a.75.75 0 0 1-.502-.879C5.556 14.931 8.193 12 12 12s6.444 2.931 7.352 6.12a.75.75 0 0 1-.502.88c-.029.007-.054.02-.082.031ZM12 11.25a3.375 3.375 0 1 0 0-6.75 3.375 3.375 0 0 0 0 6.75Z" clipRule="evenodd" />
                </svg>
              </button>
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
                  <div className="flex flex-col gap-3 animate-fade-in">                    {/* Header Row for Desktop */}
                    <div className="hidden md:grid md:grid-cols-[minmax(0,1.5fr)_minmax(0,0.9fr)_minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1.8fr)_minmax(0,1.0fr)_minmax(0,1.2fr)_minmax(0,1.4fr)] items-center gap-4 px-5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider select-none border border-transparent border-l-4 border-l-transparent">
                      <div className="flex flex-col select-none min-w-0">Claim Info</div>
                      <div className="flex flex-col select-none min-w-0">Vehicle No</div>
                      <div className="flex flex-col select-none min-w-0">Damage Type</div>
                      <div className="flex flex-col select-none min-w-0">Location</div>
                      <div className="flex flex-col select-none min-w-0">Assigned Agent</div>
                      <div className="flex flex-col select-none min-w-0">Assessment</div>
                      <div className="flex flex-col select-none min-w-0 text-center">Status</div>
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
                          className={`bg-white border border-slate-200 rounded-xl px-5 py-3.5 flex flex-col md:grid md:grid-cols-[minmax(0,1.5fr)_minmax(0,0.9fr)_minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1.8fr)_minmax(0,1.0fr)_minmax(0,1.2fr)_minmax(0,1.4fr)] md:items-center gap-4 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:border-[#0f2d4a] relative overflow-hidden ${
                            isUrgent ? "border-l-4 border-l-red-500" : "border-l-4 border-l-[#0f2d4a]"
                          }`}
                        >
                          {/* Claim ID & Date */}
                          <div className="flex flex-col select-none min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-black text-sm text-slate-800 whitespace-nowrap">
                                {claim.claimNumber}
                              </h3>
                              {isUrgent && (
                                <span className="bg-red-100 text-red-700 text-[8px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-md whitespace-nowrap">Urgent</span>
                              )}
                              {claim.isManuallyUpdated && (
                                <span 
                                  title={`Reason: ${claim.manualUpdateReason}\nBy: ${claim.manualUpdateBy}\nOn: ${claim.manualUpdateAt ? formatDate(claim.manualUpdateAt) : ""}`} 
                                  className="bg-amber-100 text-amber-800 text-[8px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-md whitespace-nowrap cursor-help flex items-center gap-0.5"
                                >
                                  ⚠️ Manual Override
                                </span>
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
                          <div className="flex flex-col select-none items-center min-w-0">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1 md:hidden">Status</span>
                            <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide block text-center whitespace-nowrap ${getStatusStyle(claim.status, claim.damageType, claim.priority)}`}>
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
                                setActiveSubModal(null);
                                setRequestItems([
                                  { recipient: "User", docType: "NIC Front Page", customName: "", note: "" }
                                ]);
                                setContactRecipient("Policy Holder");
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
                {/* Claim Summary */}
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
                        
                        // License
                        const dlFront = selectedClaim.drivingLicense?.front?.[0];
                        const dlRear = selectedClaim.drivingLicense?.rear?.[0];
                        if (dlFront) phDocs.push({ name: "Driving License (Front)", url: dlFront });
                        if (dlRear) phDocs.push({ name: "Driving License (Rear)", url: dlRear });
                        
                        // Accident Photos
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
                        
                        // Additional Docs
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

                  {/* Category 2: Agent Documents */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-black text-slate-800 border-b border-slate-200 pb-2 uppercase tracking-wider flex items-center gap-2 select-none">
                      <svg className="w-4 h-4 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                      </svg>
                      Agent Documents
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(() => {
                        const agentDocs: { name: string; url?: string; textContent?: string }[] = [];
                        
                        // Inspection Report
                        if (selectedClaim.inspectionSubmitted && selectedClaim.inspectionReport) {
                          agentDocs.push({
                            name: "Inspection Report (Text)",
                            textContent: selectedClaim.inspectionReport
                          });
                        }

                        // Additional Docs
                        (selectedClaim.additionalDocuments || []).forEach((doc) => {
                          const uploadedBy = doc.uploadedBy || "Policy Holder";
                          if (uploadedBy === "Agent") {
                            agentDocs.push({ name: doc.name, url: doc.url });
                          }
                        });

                        if (agentDocs.length === 0) {
                          return <p className="text-xs text-slate-400 font-bold italic select-none col-span-2 py-2">No agent documents.</p>;
                        }

                        return agentDocs.map((doc, idx) => {
                          if (doc.textContent) {
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setPreviewReportText(doc.textContent || null);
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
                  </div>

                  {(() => {
                    const getRecipientForDoc = (name: string) => {
                      const msg = [...(selectedClaim.messages || [])]
                        .reverse()
                        .find(m => m.message.includes(`Requested: ${name}`));
                      if (msg) {
                        if (msg.message.includes("[Document Request to Agent]")) return "Agent";
                        if (msg.message.includes("[Document Request to User]")) return "User";
                      }
                      return selectedClaim.documentRequestTo || "User";
                    };

                    const getDocDetails = (name: string, status: "Pending" | "Submitted") => {
                      let requestedAt = "";
                      let submittedAt = "";

                      const msg = [...(selectedClaim.messages || [])]
                        .reverse()
                        .find(m => m.message.includes(`Requested: ${name}`));
                      if (msg) {
                        requestedAt = formatDate(msg.sentAt);
                      } else {
                        requestedAt = formatDate(selectedClaim.createdAt);
                      }

                      if (status === "Submitted") {
                        const doc = (selectedClaim.additionalDocuments || []).find(
                          d => d.name.trim().toLowerCase() === name.trim().toLowerCase()
                        );
                        if (doc && doc.uploadedAt) {
                          submittedAt = formatDate(doc.uploadedAt);
                        }
                      }

                      return { requestedAt, submittedAt };
                    };

                    const requestedDocsList = [
                      ...(selectedClaim.requestedDocuments || []).map((name) => ({
                        name,
                        status: "Pending" as const,
                        url: null,
                        recipient: getRecipientForDoc(name),
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

                    if (requestedDocsList.length === 0) return null;

                    const hasPending = requestedDocsList.some((d) => d.status === "Pending");

                    return (
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
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

                        <div className="space-y-3">
                          <div className="flex items-center gap-2 select-none">
                            <span className="text-[10px] bg-blue-100 text-blue-800 font-black tracking-wider uppercase px-2 py-0.5 rounded border border-blue-200">
                              Policy Holder Requests
                            </span>
                          </div>
                          {policyHolderDocs.length > 0 ? (
                            <div className="flex flex-col gap-2">
                              {policyHolderDocs.map((item, idx) => {
                                const { requestedAt, submittedAt } = getDocDetails(item.name, item.status);
                                return (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between py-2.5 px-4 bg-white border border-slate-200/70 rounded-xl hover:border-slate-300 transition-all shadow-sm"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                        item.status === "Pending" ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                                      }`} />
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-extrabold text-slate-800 truncate">{item.name}</span>
                                        <span className="text-[9px] text-slate-400 font-bold leading-none mt-0.5">
                                          {item.status === "Pending" ? (
                                            `Requested: ${requestedAt}`
                                          ) : (
                                            `Requested: ${requestedAt} · Uploaded: ${submittedAt || "Recent"}`
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded select-none border ${
                                        item.status === "Pending"
                                          ? "bg-amber-100/80 text-amber-800 border-amber-200"
                                          : "bg-emerald-100/80 text-emerald-800 border-emerald-200"
                                      }`}>
                                        {item.status}
                                      </span>
                                      {item.status === "Submitted" && item.url && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            let docUrl = item.url;
                                            if (docUrl && !docUrl.startsWith("http") && !docUrl.startsWith("data:")) {
                                              docUrl = `${API_URL.replace("/api", "")}/uploads/${docUrl}`;
                                            }
                                            setPreviewImage(docUrl || null);
                                          }}
                                          className="text-[10px] font-black text-cyan-600 hover:text-cyan-700 bg-transparent border-none cursor-pointer hover:underline"
                                        >
                                          View
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 font-bold italic select-none py-1 pl-1">
                              No active requests or submissions.
                            </p>
                          )}
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-200/60">
                          <div className="flex items-center gap-2 select-none">
                            <span className="text-[10px] bg-cyan-100 text-cyan-800 font-black tracking-wider uppercase px-2 py-0.5 rounded border border-cyan-200">
                              Agent Requests
                            </span>
                          </div>
                          {agentDocs.length > 0 ? (
                            <div className="flex flex-col gap-2">
                              {agentDocs.map((item, idx) => {
                                const { requestedAt, submittedAt } = getDocDetails(item.name, item.status);
                                return (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between py-2.5 px-4 bg-white border border-slate-200/70 rounded-xl hover:border-slate-300 transition-all shadow-sm"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                        item.status === "Pending" ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                                      }`} />
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-extrabold text-slate-800 truncate">{item.name}</span>
                                        <span className="text-[9px] text-slate-400 font-bold leading-none mt-0.5">
                                          {item.status === "Pending" ? (
                                            `Requested: ${requestedAt}`
                                          ) : (
                                            `Requested: ${requestedAt} · Uploaded: ${submittedAt || "Recent"}`
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded select-none border ${
                                        item.status === "Pending"
                                          ? "bg-amber-100/80 text-amber-800 border-amber-200"
                                          : "bg-emerald-100/80 text-emerald-800 border-emerald-200"
                                      }`}>
                                        {item.status}
                                      </span>
                                      {item.status === "Submitted" && item.url && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            let docUrl = item.url;
                                            if (docUrl && !docUrl.startsWith("http") && !docUrl.startsWith("data:")) {
                                              docUrl = `${API_URL.replace("/api", "")}/uploads/${docUrl}`;
                                            }
                                            setPreviewImage(docUrl || null);
                                          }}
                                          className="text-[10px] font-black text-cyan-600 hover:text-cyan-700 bg-transparent border-none cursor-pointer hover:underline"
                                        >
                                          View
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 font-bold italic select-none py-1 pl-1">
                              No active requests or submissions.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-4 bg-white border-t border-slate-200 flex justify-between flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveSubModal(null)}
                  className="bg-[#0f2d4a] hover:bg-[#1a3d5e] text-white font-bold text-sm px-6 py-2 rounded-full transition-all border-none cursor-pointer flex items-center shadow-sm active:scale-95"
                >
                  &lt; Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRequestItems([
                      { recipient: "User", docType: "NIC Front Page", customName: "", note: "" }
                    ]);
                    setActiveSubModal("request_docs");
                  }}
                  className="bg-[#f97316] hover:bg-orange-600 text-white font-bold text-sm px-6 py-2 rounded-full transition-all border-none cursor-pointer flex items-center shadow-sm active:scale-95"
                >
                  Request Document &gt;
                </button>
              </div>
            </div>
          )}

          {/* SUB-MODAL 2: REQUEST DOCUMENTS */}
          {activeSubModal === "request_docs" && (
            <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-[800px] h-[650px] max-h-[90vh] shadow-2xl flex flex-col relative animate-fade-in overflow-hidden">
              {/* Header */}
              <div className="px-8 pt-6 pb-2 select-none bg-white">
                <h2 className="text-[24px] font-black text-slate-900 tracking-tight leading-none">
                  Request Documents - {selectedClaim.claimNumber}
                </h2>
              </div>
              <div className="border-b border-black mx-8 mb-6" />

              {/* Body */}
              <div className="px-8 pb-4 flex-1 overflow-y-auto space-y-6">
                {/* Claim Summary */}
                <div className="text-left font-bold text-slate-800 space-y-1.5 text-[13px] select-none leading-relaxed">
                  <p>Vehicle No : <span className="font-medium text-slate-600">{formatPlate(selectedClaim.vehiclePlate)}</span></p>
                </div>

                {/* Fields */}
                <div className="space-y-4 pr-1">
                  {requestItems.map((item, index) => (
                    <div key={index} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 relative space-y-4">
                      {/* Remove Button on top right */}
                      {requestItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRequestItem(index)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-red-500 font-extrabold text-lg bg-transparent border-none cursor-pointer p-1 transition-colors"
                          title="Remove this document request"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}

                      <div className="flex items-center gap-2 select-none mb-1">
                        <span className="w-6 h-6 rounded-full bg-[#0f2d4a] text-white flex items-center justify-center text-xs font-black">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <h4 className="text-slate-800 font-black text-xs uppercase tracking-wider">Document #{index + 1}</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Request From Selector */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider ml-1 select-none">Request From :</label>
                          <div className="flex gap-4 p-2.5 bg-white border border-slate-200 rounded-xl">
                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                              <input
                                type="radio"
                                name={`reqRecipient-${index}`}
                                checked={item.recipient === "User"}
                                onChange={() => handleRequestItemChange(index, { recipient: "User" })}
                                className="w-3.5 h-3.5 accent-[#0f2d4a]"
                              />
                              <span className="text-xs font-bold text-slate-700">Policy Holder (User)</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                              <input
                                type="radio"
                                name={`reqRecipient-${index}`}
                                checked={item.recipient === "Agent"}
                                onChange={() => handleRequestItemChange(index, { recipient: "Agent" })}
                                className="w-3.5 h-3.5 accent-[#0f2d4a]"
                              />
                              <span className="text-xs font-bold text-slate-700">Assigned Agent</span>
                            </label>
                          </div>
                        </div>

                        {/* Document Type Dropdown */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider ml-1 select-none">Document Type :</label>
                          <select
                            value={item.docType}
                            onChange={(e) => handleRequestItemChange(index, { docType: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2d4a]"
                          >
                            {item.recipient === "Agent" ? (
                              <>
                                <option value="Repair Estimate">Repair Estimate</option>
                                <option value="Inspection Photos">Inspection Photos</option>
                                <option value="Damage Assessment">Damage Assessment</option>
                                <option value="Underwriting Report">Underwriting Report</option>
                                <option value="Custom / Other">Custom / Other</option>
                              </>
                            ) : (
                              <>
                                <option value="NIC Front Page">NIC Front Page</option>
                                <option value="NIC Back Page">NIC Back Page</option>
                                <option value="License Front">License Front</option>
                                <option value="License Rear">License Rear</option>
                                <option value="Vehicle Registration">Vehicle Registration</option>
                                <option value="Revenue License">Revenue License</option>
                                <option value="Accident Photos">Accident Photos</option>
                                <option value="Repair Estimate">Repair Estimate</option>
                                <option value="Custom / Other">Custom / Other</option>
                              </>
                            )}
                          </select>
                        </div>
                      </div>

                      {/* Custom Document Name input field if Custom / Other is selected */}
                      {(item.docType === "Custom / Other" || item.docType === "Other") && (
                        <div className="flex flex-col gap-1.5 animate-fade-in">
                          <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider ml-1 select-none">Custom Document Name :</label>
                          <input
                            type="text"
                            required
                            value={item.customName}
                            onChange={(e) => handleRequestItemChange(index, { customName: e.target.value })}
                            placeholder="E.g. Bank Book PDF, Towing Receipt..."
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2d4a]"
                          />
                        </div>
                      )}

                      {/* Add Note textarea */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider ml-1 select-none">Instructions / Note :</label>
                        <textarea
                          rows={2}
                          value={item.note}
                          onChange={(e) => handleRequestItemChange(index, { note: e.target.value })}
                          placeholder="E.g. Please upload a clear photo of the document..."
                          className="w-full p-4 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2d4a] resize-none"
                        />
                      </div>
                    </div>
                  ))}

                  {/* Add Another Document Button */}
                  <button
                    type="button"
                    onClick={handleAddRequestItem}
                    className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-[#0f2d4a] rounded-2xl flex items-center justify-center gap-2 bg-slate-50/50 hover:bg-slate-50 text-xs font-bold text-slate-500 hover:text-[#0f2d4a] cursor-pointer transition-all duration-200 group"
                  >
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-[#0f2d4a] transition-colors" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add Another Document Request
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-4 bg-white border-t border-slate-200 flex justify-between flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubModal(null);
                  }}
                  className="bg-[#0f2d4a] hover:bg-[#1a3d5e] text-white font-bold text-sm px-6 py-2 rounded-full transition-all border-none cursor-pointer flex items-center shadow-sm active:scale-95"
                >
                  &lt; Close
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    // Validation
                    for (let i = 0; i < requestItems.length; i++) {
                      const item = requestItems[i];
                      const isCustom = item.docType === "Custom / Other" || item.docType === "Other";
                      if (isCustom && !item.customName.trim()) {
                        alert(`Please enter a custom document name for Document #${i + 1}.`);
                        return;
                      }
                    }

                    const currentDocs = selectedClaim.requestedDocuments || [];
                    const newDocs = requestItems.map(item => {
                      const isCustom = item.docType === "Custom / Other" || item.docType === "Other";
                      return isCustom ? item.customName.trim() : item.docType;
                    });

                    // Merge new docs into current requested docs
                    const updatedDocs = [...currentDocs];
                    newDocs.forEach(docName => {
                      if (!updatedDocs.includes(docName)) {
                        updatedDocs.push(docName);
                      }
                    });

                    // Prepare messages to append
                    const messageTexts = requestItems.map(item => {
                      const docName = item.docType === "Custom / Other" || item.docType === "Other" ? item.customName.trim() : item.docType;
                      const customMsg = item.note.trim() || `Please upload the requested document.`;
                      return {
                        message: `[Document Request to ${item.recipient}] Requested: ${docName}. Message: ${customMsg}`,
                        recipient: item.recipient === "Agent" ? "Agent" : "Policy Holder"
                      };
                    });

                    // Make the single API update request
                    const lastRecipient = requestItems[requestItems.length - 1].recipient;

                    await handleUpdateClaim(selectedClaim.claimNumber, {
                      documentsRequested: true,
                      requestedDocuments: updatedDocs,
                      documentRequestTo: lastRecipient,
                      messageTexts: messageTexts
                    });

                    setActiveSubModal(null);
                    alert("Document requests sent successfully!");
                  }}
                  disabled={updatingClaim}
                  className="bg-[#0f2d4a] hover:bg-[#1a3d5e] text-white font-bold text-sm px-6 py-2 rounded-full transition-all border-none cursor-pointer flex items-center shadow-sm active:scale-95 disabled:opacity-50"
                >
                  Submit &gt;
                </button>
              </div>
            </div>
          )}

          {/* SUB-MODAL 3: ADD NOTE */}
          {activeSubModal === "add_note" && (
            <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-[800px] h-[650px] max-h-[90vh] shadow-2xl flex flex-col relative animate-fade-in overflow-hidden">
              {/* Header */}
              <div className="px-8 pt-6 pb-2 select-none bg-white">
                <h2 className="text-[24px] font-black text-slate-900 tracking-tight leading-none">
                  Add Note - {selectedClaim.claimNumber}
                </h2>
              </div>
              <div className="border-b border-black mx-8 mb-6" />

              {/* Body */}
              <div className="px-8 pb-8 flex-1 overflow-y-auto space-y-6">
                {/* Claim Summary */}
                <div className="text-left font-bold text-slate-800 space-y-1.5 text-[13px] select-none leading-relaxed">
                  <p>Vehicle No : <span className="font-medium text-slate-600">{formatPlate(selectedClaim.vehiclePlate)}</span></p>
                </div>

                {/* Fields */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-slate-800 ml-1 select-none">Add Note :</label>
                    <textarea
                      rows={5}
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      placeholder="Enter internal text note..."
                      className="w-full p-4 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 bg-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#0f2d4a] resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-4 bg-white border-t border-slate-200 flex justify-between flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubModal(null);
                    setNewMessageText("");
                  }}
                  className="bg-[#0f2d4a] hover:bg-[#1a3d5e] text-white font-bold text-sm px-6 py-2 rounded-full transition-all border-none cursor-pointer flex items-center shadow-sm active:scale-95"
                >
                  &lt; Close
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!newMessageText.trim()) {
                      alert("Please enter a note.");
                      return;
                    }
                    await handleUpdateClaim(selectedClaim.claimNumber, {
                      noteText: newMessageText.trim()
                    });
                    setActiveSubModal(null);
                    setNewMessageText("");
                    alert("Internal note added successfully!");
                  }}
                  disabled={updatingClaim || !newMessageText.trim()}
                  className="bg-[#0f2d4a] hover:bg-[#1a3d5e] text-white font-bold text-sm px-6 py-2 rounded-full transition-all border-none cursor-pointer flex items-center shadow-sm active:scale-95 disabled:opacity-50"
                >
                  Submit &gt;
                </button>
              </div>
            </div>
          )}

          {/* SUB-MODAL 4: CONTACT & TIMELINE */}
          {activeSubModal === "contact" && (
            <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-[800px] h-[650px] max-h-[90vh] shadow-2xl flex flex-col relative animate-fade-in overflow-hidden">
              {/* Header */}
              <div className="px-8 pt-6 pb-2 select-none bg-white">
                <h2 className="text-[24px] font-black text-slate-900 tracking-tight leading-none">
                  Contact - {selectedClaim.claimNumber}
                </h2>
              </div>
              <div className="border-b border-black mx-8 mb-6" />

              {/* Body */}
              <div className="px-8 pb-8 flex-1 overflow-y-auto space-y-4">
                {/* Claim Summary */}
                <div className="text-left font-bold text-slate-800 space-y-1.5 text-[13px] select-none leading-relaxed">
                  <p>Vehicle No : <span className="font-medium text-slate-600">{formatPlate(selectedClaim.vehiclePlate)}</span></p>
                </div>

                {/* Stakeholders details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 select-none">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Policy Holder</span>
                    <h5 className="text-xs font-extrabold text-slate-800">{getPolicyHolderName(selectedClaim.userNic)}</h5>
                    <div className="text-[11px] text-slate-600 font-semibold">
                      <p>NIC: {selectedClaim.userNic}</p>
                      <p>Phone: {getPolicyHolderContact(selectedClaim.userNic)}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Assigned Agent</span>
                    {selectedClaim.assignedAgent ? (
                      <>
                        <h5 className="text-xs font-extrabold text-slate-800">{getAgentName(selectedClaim.assignedAgent)}</h5>
                        <div className="text-[11px] text-slate-600 font-semibold">
                          <p>Email: {selectedClaim.assignedAgent}</p>
                          {(() => {
                            const agentObj = agents.find(a => a.email.toLowerCase().trim() === selectedClaim.assignedAgent.toLowerCase().trim());
                            return agentObj ? <p>Phone: {agentObj.phone || "—"}</p> : null;
                          })()}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-amber-600 font-bold italic py-2">No agent assigned.</p>
                    )}
                  </div>
                </div>

                {/* Chat Partner Selector Tabs */}
                <div className="flex gap-2 select-none border-b border-slate-100 pb-2">
                  <button
                    type="button"
                    onClick={() => setContactRecipient("Policy Holder")}
                    className={`flex-1 md:flex-none py-2 px-6 rounded-full text-xs font-black tracking-wide uppercase transition-all border cursor-pointer ${
                      contactRecipient === "Policy Holder"
                        ? "bg-[#0f2d4a] text-white border-transparent shadow-sm"
                        : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Policy Holder Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactRecipient("Agent")}
                    className={`flex-1 md:flex-none py-2 px-6 rounded-full text-xs font-black tracking-wide uppercase transition-all border cursor-pointer ${
                      contactRecipient === "Agent"
                        ? "bg-[#0f2d4a] text-white border-transparent shadow-sm"
                        : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Agent Chat
                  </button>
                </div>

                {/* Chat timeline */}
                <div className="bg-slate-100 rounded-2xl p-5 border border-slate-200 flex-1 overflow-y-auto space-y-3.5 max-h-[160px]">
                  {(() => {
                    const filteredMessages = selectedClaim.messages.filter((msg) => {
                      if (contactRecipient === "Policy Holder") {
                        return msg.recipient === "Policy Holder" || !msg.recipient;
                      } else {
                        return msg.recipient === "Agent";
                      }
                    });

                    if (contactRecipient === "Agent" && !selectedClaim.assignedAgent) {
                      return (
                        <div className="text-center text-xs text-amber-600 italic py-6 font-bold select-none">
                          ⚠️ No agent has been assigned to this claim yet. Please assign an agent first.
                        </div>
                      );
                    }

                    if (filteredMessages.length === 0) {
                      return (
                        <div className="text-center text-xs text-slate-400 italic py-2 font-semibold select-none">
                          No message history recorded with {contactRecipient === "Policy Holder" ? "Policy Holder" : "Agent"}.
                        </div>
                      );
                    }

                    return filteredMessages.map((msg, index) => {
                      const isSelf = msg.sender === "Office Staff";
                      return (
                        <div key={index} className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-xs shadow-sm ${
                            isSelf ? "bg-[#0f2d4a] text-white rounded-tr-none" : "bg-white border border-slate-200 text-slate-700 rounded-tl-none"
                          }`}>
                            <p className="font-semibold leading-relaxed break-words whitespace-pre-wrap">{msg.message}</p>
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold mt-1 select-none px-1">
                            {msg.sender} · {formatMessageTime(msg.sentAt)}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Send message text box */}
                <div className="select-none">
                  <div className="flex gap-3">
                    <textarea
                      id="message-input"
                      rows={2}
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      placeholder={contactRecipient === "Agent" && !selectedClaim.assignedAgent ? "Cannot message (No agent assigned)" : `Type a message to ${contactRecipient === "Policy Holder" ? "Policy Holder" : "Agent"}...`}
                      disabled={contactRecipient === "Agent" && !selectedClaim.assignedAgent}
                      className="flex-1 p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none bg-[#e2e8f0] focus:ring-2 focus:ring-[#0f2d4a] resize-none disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (newMessageText.trim()) {
                          await handleUpdateClaim(selectedClaim.claimNumber, {
                            messageText: newMessageText.trim(),
                            messageRecipient: contactRecipient
                          });
                          setNewMessageText("");
                        }
                      }}
                      disabled={updatingClaim || !newMessageText.trim() || (contactRecipient === "Agent" && !selectedClaim.assignedAgent)}
                      className="bg-[#0f2d4a] hover:bg-[#1a3d5e] text-white font-extrabold text-xs px-5 py-3.5 rounded-xl border-none cursor-pointer disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-4 bg-white border-t border-slate-200 flex justify-between flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubModal(null);
                    setNewMessageText("");
                  }}
                  className="bg-[#0f2d4a] hover:bg-[#1a3d5e] text-white font-bold text-sm px-6 py-2 rounded-full transition-all border-none cursor-pointer flex items-center shadow-sm active:scale-95"
                >
                  &lt; Close
                </button>
              </div>
            </div>
          )}

          {/* SUB-MODAL 5: UPDATE TRACKING */}
          {activeSubModal === "update_tracking" && (
            <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-[800px] h-[650px] max-h-[90vh] shadow-2xl flex flex-col relative animate-fade-in overflow-hidden">
              {/* Header */}
              <div className="px-8 pt-6 pb-2 select-none bg-white">
                <h2 className="text-[24px] font-black text-slate-900 tracking-tight leading-none">
                  Update Tracking - {selectedClaim.claimNumber}
                </h2>
              </div>
              <div className="border-b border-black mx-8 mb-6" />

              {/* Body */}
              <div className="px-8 pb-8 flex-1 overflow-y-auto space-y-6">
                {/* Claim Summary */}
                <div className="text-left font-bold text-slate-800 space-y-1.5 text-[13px] select-none leading-relaxed flex items-center justify-between">
                  <p>Vehicle No : <span className="font-medium text-slate-600">{formatPlate(selectedClaim.vehiclePlate)}</span></p>
                  <button
                    type="button"
                    onClick={() => setIsManualMode(!isManualMode)}
                    className="bg-[#f97316] hover:bg-orange-600 text-white font-extrabold text-[11px] px-4 py-2 rounded-full transition-all border-none cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5"
                  >
                    {isManualMode ? "⚙️ Standard Flow" : "✏️ Update Manually"}
                  </button>
                </div>

                {isManualMode ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-5 animate-fade-in text-left">
                    <div className="bg-slate-900 border border-slate-800 rounded-[24px] p-5 shadow-md text-white flex flex-col justify-between hover:border-slate-800 transition-all duration-200 select-none">
                      <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider block flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        Manual Override Guidelines
                      </span>
                      <p className="text-slate-300 text-xs font-semibold leading-relaxed mt-3">
                        Manually updating the tracking step overrides standard background automated workflows (such as waiting for agent assignments, report submissions, or system document checks). Use this feature only when standard automated progression cannot continue, and document a valid justification below.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Select Step */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-bold text-slate-800 ml-1">Target Tracking Step :</label>
                        <select
                          value={manualStep}
                          onChange={(e) => setManualStep(e.target.value ? Number(e.target.value) : "")}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2d4a]"
                        >
                          <option value="">Select Target Step</option>
                          <option value={1}>Step 1: Assignment / Registration</option>
                          <option value={2}>Step 2: Agent Acceptance</option>
                          <option value={3}>Step 3: Inspection in Progress</option>
                          <option value={4}>Step 4: Review Inspection Report</option>
                          <option value={5}>Step 5: Underwriting / Decision</option>
                          <option value={6}>Step 6: Payment Processing</option>
                        </select>
                      </div>

                      {/* Updated Person Name */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-bold text-slate-800 ml-1">Updated Person Name :</label>
                        <input
                          type="text"
                          value={manualUpdateByVal}
                          onChange={(e) => setManualUpdateByVal(e.target.value)}
                          placeholder="Enter your name"
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2d4a]"
                        />
                      </div>
                    </div>

                    {/* Reason Textbox */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-slate-800 ml-1">Reason for Manual Update :</label>
                      <textarea
                        rows={3}
                        value={manualReason}
                        onChange={(e) => setManualReason(e.target.value)}
                        placeholder="Explain why you are overriding tracking (e.g. holder provided documents offline, override agent inspection lock...)"
                        className="w-full p-4 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2d4a] resize-none"
                      />
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={async () => {
                          if (manualStep === "") {
                            alert("Please select a target tracking step.");
                            return;
                          }
                          if (!manualUpdateByVal.trim()) {
                            alert("Please enter the name of the person performing this manual update.");
                            return;
                          }
                          if (!manualReason.trim()) {
                            alert("Please enter a reason for manually updating the tracking status.");
                            return;
                          }
                          let targetStatus = "In Progress";
                          if (manualStep === 1) targetStatus = "Pending";
                          else if (manualStep === 6) targetStatus = "Approved";

                          const confirmMsg = `Warning:\nYou are about to perform a manual override on the tracking step for claim ${selectedClaim.claimNumber}.\n\n` +
                            `New Step: ${manualStep}\n` +
                            `New Status: ${targetStatus}\n` +
                            `Updated By: ${manualUpdateByVal.trim()}\n` +
                            `Reason: ${manualReason.trim()}\n\n` +
                            `This bypasses normal workflow automation rules. Are you sure you want to proceed?`;
                          
                          if (window.confirm(confirmMsg)) {
                            await handleUpdateClaim(selectedClaim.claimNumber, {
                              currentStep: manualStep,
                              status: targetStatus,
                              isManuallyUpdated: true,
                              manualUpdateReason: manualReason.trim(),
                              manualUpdateBy: manualUpdateByVal.trim()
                            });
                            alert("Claim tracking step has been manually updated.");
                            setActiveSubModal(null);
                          }
                        }}
                        disabled={updatingClaim}
                        className="bg-[#0f2d4a] hover:bg-[#1a3d5e] text-white font-extrabold text-xs px-6 py-3 rounded-full transition-all border-none cursor-pointer disabled:opacity-50"
                      >
                        {updatingClaim ? "Processing..." : "Confirm Override"}
                      </button>
                    </div>
                  </div>
                ) : selectedClaim.status === "Rejected" ? (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-2">
                    <p className="text-red-700 font-bold text-sm">
                      This claim has been Rejected.
                    </p>
                    {selectedClaim.rejectionReason && (
                      <p className="text-xs text-red-600 font-semibold leading-relaxed">
                        Reason: {selectedClaim.rejectionReason}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Render Step-Specific UI */}
                    {selectedClaim.currentStep === 1 && (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
                        <p className="text-slate-600 font-bold text-sm">
                          Policy holder has applied for the claim. Waiting to assign an agent.
                        </p>
                      </div>
                    )}

                    {selectedClaim.currentStep === 2 && (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
                        <p className="text-slate-600 font-bold text-sm">
                          Agent assigned. Waiting for the agent to accept the claim.
                        </p>
                      </div>
                    )}

                    {selectedClaim.currentStep === 3 && (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
                        <p className="text-slate-600 font-bold text-sm">
                          Inspection in progress. Waiting for agent report.
                        </p>
                      </div>
                    )}

                    {selectedClaim.currentStep === 4 && (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-4">
                        <p className="text-slate-600 font-bold text-sm">
                          Inspection report has been submitted by the agent. Please review the details.
                        </p>
                        <button
                          type="button"
                          onClick={async () => {
                            await handleUpdateClaim(selectedClaim.claimNumber, { currentStep: 5 });
                            alert("Advanced to Decision (Step 5) successfully!");
                          }}
                          disabled={updatingClaim}
                          className="bg-[#0f2d4a] hover:bg-[#1a3d5e] text-white font-extrabold text-xs px-6 py-3 rounded-full transition-all border-none cursor-pointer disabled:opacity-50"
                        >
                          {updatingClaim ? "Updating..." : "Proceed to Decision (Step 5)"}
                        </button>
                      </div>
                    )}

                    {selectedClaim.currentStep === 5 && (
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={() => setDecisionAction("Approve")}
                            className={`flex-1 py-3 px-6 rounded-xl text-xs font-black tracking-wide uppercase transition-all border cursor-pointer ${
                              decisionAction === "Approve"
                                ? "bg-emerald-600 text-white border-transparent shadow-sm"
                                : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            Approve Claim
                          </button>
                          <button
                            type="button"
                            onClick={() => setDecisionAction("Reject")}
                            className={`flex-1 py-3 px-6 rounded-xl text-xs font-black tracking-wide uppercase transition-all border cursor-pointer ${
                              decisionAction === "Reject"
                                ? "bg-red-600 text-white border-transparent shadow-sm"
                                : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            Reject Claim
                          </button>
                        </div>

                        {decisionAction === "Approve" && (
                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 animate-fade-in">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[13px] font-bold text-slate-800 ml-1">Estimate Amount (LKR) :</label>
                              <input
                                type="number"
                                value={assessmentAmount}
                                onChange={(e) => setAssessmentAmount(e.target.value)}
                                placeholder="Enter estimate amount"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2d4a]"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                const amountNum = parseFloat(assessmentAmount);
                                if (isNaN(amountNum) || amountNum <= 0) {
                                  alert("Please enter a valid estimate amount.");
                                  return;
                                }
                                await handleUpdateClaim(selectedClaim.claimNumber, {
                                  status: "Approved",
                                  amount: amountNum,
                                  currentStep: 6
                                });
                                alert("Claim approved and advanced to Payment step!");
                              }}
                              disabled={updatingClaim}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-full transition-all border-none cursor-pointer disabled:opacity-50"
                            >
                              {updatingClaim ? "Processing..." : "Confirm Approval"}
                            </button>
                          </div>
                        )}

                        {decisionAction === "Reject" && (
                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 animate-fade-in">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[13px] font-bold text-slate-800 ml-1">Rejection Reason :</label>
                              <textarea
                                rows={3}
                                value={rejectionReasonText}
                                onChange={(e) => setRejectionReasonText(e.target.value)}
                                placeholder="Enter reason for rejection"
                                className="w-full p-4 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2d4a] resize-none"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!rejectionReasonText.trim()) {
                                  alert("Please specify a rejection reason.");
                                  return;
                                }
                                await handleUpdateClaim(selectedClaim.claimNumber, {
                                  status: "Rejected",
                                  rejectionReason: rejectionReasonText.trim(),
                                  currentStep: 5
                                });
                                alert("Claim has been rejected.");
                              }}
                              disabled={updatingClaim}
                              className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-6 py-3 rounded-full transition-all border-none cursor-pointer disabled:opacity-50"
                            >
                              {updatingClaim ? "Processing..." : "Confirm Rejection"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedClaim.currentStep === 6 && (
                      <div className="space-y-4">
                        {selectedClaim.policyHolderBankDetails && (
                          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 space-y-3">
                            <div className="flex items-center gap-2 text-emerald-800">
                              <svg className="w-4.5 h-4.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.3m-15 0V21M3 21h18" />
                              </svg>
                              <span className="text-[10px] font-black uppercase tracking-wider select-none">Registered Bank Settlement Profile</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
                              <div>
                                <span className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-wider select-none">Account Holder Name</span>
                                <span className="block text-slate-800 text-xs font-bold mt-0.5">{selectedClaim.policyHolderBankDetails.accountHolderName || "N/A"}</span>
                              </div>
                              <div>
                                <span className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-wider select-none">Bank Name</span>
                                <span className="block text-slate-800 text-xs font-bold mt-0.5">{selectedClaim.policyHolderBankDetails.bankName || "N/A"}</span>
                              </div>
                              <div>
                                <span className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-wider select-none">Branch Name</span>
                                <span className="block text-slate-800 text-xs font-bold mt-0.5">{selectedClaim.policyHolderBankDetails.branchName || "N/A"}</span>
                              </div>
                              <div>
                                <span className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-wider select-none">Account Number</span>
                                <span className="block text-slate-800 text-xs font-bold mt-0.5">{selectedClaim.policyHolderBankDetails.accountNumber || "N/A"}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                          <h3 className="text-sm font-black text-slate-800 border-b pb-2 uppercase tracking-wide">
                            Confirm Payout Details
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[11px] font-bold text-slate-500 uppercase">Bank Name</label>
                              <input
                                type="text"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                placeholder="e.g. Bank of Ceylon"
                                className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2d4a]"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[11px] font-bold text-slate-500 uppercase">Branch Name</label>
                              <input
                                type="text"
                                value={bankBranch}
                                onChange={(e) => setBankBranch(e.target.value)}
                                placeholder="e.g. Colombo Fort"
                                className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2d4a]"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[11px] font-bold text-slate-500 uppercase">Account Number</label>
                              <input
                                type="text"
                                value={bankAccount}
                                onChange={(e) => setBankAccount(e.target.value)}
                                placeholder="e.g. 12345678"
                                className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2d4a]"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                          <h3 className="text-sm font-black text-slate-800 border-b pb-2 uppercase tracking-wide">
                            Payment Receipt
                          </h3>
                          
                          {selectedClaim.paymentReceipt ? (
                            <div className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 select-none">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Receipt Uploaded
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  let docUrl = selectedClaim.paymentReceipt;
                                  if (docUrl && !docUrl.startsWith("http") && !docUrl.startsWith("data:")) {
                                    docUrl = `${API_URL.replace("/api", "")}/uploads/${docUrl}`;
                                  }
                                  setPreviewImage(docUrl || null);
                                }}
                                className="text-xs font-extrabold text-cyan-600 hover:text-cyan-700 bg-transparent border-none cursor-pointer"
                              >
                                View Receipt File
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <label className="text-xs font-bold text-slate-600 select-none">Upload Bank Transfer Receipt (Image/PDF) :</label>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    setPaymentReceiptFile(e.target.files[0]);
                                  }
                                }}
                                className="text-xs font-semibold text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-extrabold file:bg-slate-200 file:text-slate-800 file:cursor-pointer"
                              />
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            if (!bankName.trim() || !bankBranch.trim() || !bankAccount.trim()) {
                              alert("Please fill in all policy holder bank details first.");
                              return;
                            }

                            try {
                              setIsUploadingReceipt(true);
                              let receiptBase64 = undefined;
                              
                              if (paymentReceiptFile) {
                                const convertToBase64 = (file: File): Promise<string> => {
                                  return new Promise((resolve, reject) => {
                                    const reader = new FileReader();
                                    reader.readAsDataURL(file);
                                    reader.onload = () => resolve(reader.result as string);
                                    reader.onerror = error => reject(error);
                                  });
                                };
                                receiptBase64 = await convertToBase64(paymentReceiptFile);
                              }

                              await handleUpdateClaim(selectedClaim.claimNumber, {
                                bankName: bankName.trim(),
                                bankBranch: bankBranch.trim(),
                                bankAccount: bankAccount.trim(),
                                paymentReceipt: receiptBase64,
                                status: "Approved"
                              });

                              alert("Claim details and bank transfer receipt updated successfully! Claim process completed.");
                              setActiveSubModal(null);
                            } catch (uploadErr) {
                              console.error(uploadErr);
                              alert("An error occurred while uploading the receipt.");
                            } finally {
                              setIsUploadingReceipt(false);
                            }
                          }}
                          disabled={updatingClaim || isUploadingReceipt}
                          className="w-full bg-[#0f2d4a] hover:bg-[#1a3d5e] text-white font-extrabold text-xs py-3.5 rounded-xl border-none cursor-pointer text-center select-none shadow-sm active:scale-95 disabled:opacity-50"
                        >
                          {isUploadingReceipt ? "Uploading Receipt..." : updatingClaim ? "Completing claim..." : "Complete Claim Process"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-8 py-4 bg-white border-t border-slate-200 flex justify-end flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubModal(null);
                    setDecisionAction(null);
                  }}
                  className="bg-[#0f2d4a] hover:bg-[#1a3d5e] text-white font-bold text-sm px-6 py-2 rounded-full transition-all border-none cursor-pointer flex items-center shadow-sm active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* MAIN DETAILS MODAL */}
          {activeSubModal === null && (
            <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-[800px] h-[650px] max-h-[90vh] shadow-2xl flex flex-col relative animate-fade-in overflow-hidden">
              {/* Modal Header */}
              <div className="px-8 pt-6 pb-2 select-none bg-white">
                <h2 className="text-[24px] font-black text-slate-900 tracking-tight leading-none">
                  {selectedClaim.claimNumber}
                </h2>
              </div>
              <div className="border-b border-black mx-8 mb-6" />

              {/* Modal Body */}
              <div className="px-8 pb-8 flex-1 overflow-y-auto space-y-6">
                {selectedClaim.isManuallyUpdated && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-left animate-fade-in select-none">
                    <span className="text-xl">⚠️</span>
                    <div className="flex-1">
                      <h4 className="text-xs font-black text-amber-800 uppercase tracking-wide">Manual Override Active</h4>
                      <p className="text-xs text-amber-700 font-semibold mt-1">
                        Reason: <span className="font-bold text-slate-800">{selectedClaim.manualUpdateReason}</span>
                      </p>
                      <p className="text-[10px] text-amber-600 font-bold mt-0.5">
                        Updated by: {selectedClaim.manualUpdateBy} {selectedClaim.manualUpdateAt ? `on ${formatDate(selectedClaim.manualUpdateAt)}` : ""}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* 2-Column Details Block */}
                <div className="grid grid-cols-1 md:grid-cols-[1.8fr_1fr] gap-8 select-none">
                  {/* Left Side Details Grid */}
                  <div className="space-y-4 text-sm font-bold text-slate-800 leading-normal">
                    <div>
                      Vehicle No : <span className="font-medium text-slate-600">{formatPlate(selectedClaim.vehiclePlate)}</span>
                    </div>
                    <div>
                      Policy Holder Name - <span className="font-medium text-slate-600">{getPolicyHolderName(selectedClaim.userNic)}</span>
                    </div>
                    <div>
                      Contact - <span className="font-medium text-slate-600">{getPolicyHolderContact(selectedClaim.userNic)}</span>
                    </div>
                    <div className="pt-4 border-t border-slate-200 space-y-4 mt-2">
                      <p>
                        Location : <span className="font-medium text-slate-600">{selectedClaim.location}</span>
                      </p>
                      <p>
                        Time : <span className="font-medium text-slate-600">{claimDateString(selectedClaim.incidentDate)} @ {selectedClaim.incidentTime}</span>
                      </p>
                      <p>
                        Est. Amount : <span className="font-medium text-slate-600">{selectedClaim.amount ? `LKR ${selectedClaim.amount.toLocaleString()}` : "Not Assessed"}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right Side Column */}
                  <div className="flex flex-col space-y-4">
                    <div className="space-y-2 text-sm font-bold text-slate-800">
                      <div>
                        Agent : <span className="font-medium text-slate-600">{selectedClaim.assignedAgent ? getAgentName(selectedClaim.assignedAgent) : "Unassigned"}</span>
                      </div>
                      <div>
                        Type : <span className="font-medium text-slate-600">{selectedClaim.damageType}</span>
                      </div>
                      <div>
                        Status : <span className={selectedClaim.priority === "Urgent" || selectedClaim.status === "Rejected" ? "text-red-500 font-extrabold" : "font-medium text-slate-600"}>{selectedClaim.status}</span>
                      </div>
                    </div>

                    {/* Cyan Buttons Stack */}
                    <div className="pt-2 flex flex-col gap-3">
                      {selectedClaim.inspectionSubmitted && selectedClaim.inspectionReport && (
                        <button
                          type="button"
                          onClick={() => setPreviewReportText(selectedClaim.inspectionReport || null)}
                          className="bg-[#10b981] hover:bg-[#059669] text-white font-extrabold text-xs py-2.5 rounded-full transition-all border-none cursor-pointer text-center select-none shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                          Inspection Report
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveSubModal("documents")}
                        className="bg-[#00c5ff] hover:bg-[#00b0e6] text-white font-extrabold text-xs py-2.5 rounded-full transition-all border-none cursor-pointer text-center select-none shadow-sm active:scale-95"
                      >
                        Documents
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveSubModal("contact")}
                        className="bg-[#00c5ff] hover:bg-[#00b0e6] text-white font-extrabold text-xs py-2.5 rounded-full transition-all border-none cursor-pointer text-center select-none shadow-sm active:scale-95"
                      >
                        Contact
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress Stepper Section */}
                <div className="py-6 px-2 select-none border-t border-slate-100">
                  <div className="flex items-center justify-between relative max-w-[650px] mx-auto">
                    {/* Connecting Line background (navy) */}
                    <div className="absolute top-[18px] left-[20px] right-[20px] h-1 bg-[#0f2d4a] -z-10 rounded-full" />
                    {/* Connecting Line active fill (green or red) */}
                    <div 
                      className={`absolute top-[18px] left-[20px] h-1 -z-10 rounded-full transition-all duration-500 ${
                        selectedClaim.status === "Rejected" ? "bg-red-500" : "bg-[#22c55e]"
                      }`} 
                      style={{ width: `${getStepperPercent(selectedClaim)}%` }} 
                    />

                    {getStepperSteps(selectedClaim).map((stepObj, idx) => {
                      const isActive = stepObj.active;
                      return (
                        <div key={idx} className="flex flex-col items-center flex-1 relative">
                          {/* Step Circle */}
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border-2 bg-white transition-all duration-300 ${
                            isActive 
                              ? selectedClaim.status === "Rejected"
                                ? "text-red-500 border-red-500 shadow-sm shadow-red-500/10"
                                : "text-[#22c55e] border-[#22c55e] shadow-sm shadow-[#22c55e]/10" 
                              : "text-[#0f2d4a] border-[#0f2d4a]"
                          }`}>
                            {stepObj.num}
                          </div>
                          {/* Step Label */}
                          <span className="text-[10px] font-semibold mt-2 tracking-wide text-slate-400 select-none text-center">
                            {stepObj.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Section (Orange Buttons in Row) */}
                <div className="flex flex-wrap items-center justify-center gap-4 select-none pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveSubModal("update_tracking")}
                    className="bg-[#f97316] hover:bg-orange-600 text-white font-extrabold text-xs px-6 py-2.5 rounded-full transition-all border-none cursor-pointer shadow-sm active:scale-95"
                  >
                    Update Tracking
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRequestItems([
                        { recipient: "User", docType: "NIC Front Page", customName: "", note: "" }
                      ]);
                      setActiveSubModal("request_docs");
                    }}
                    className="bg-[#f97316] hover:bg-orange-600 text-white font-extrabold text-xs px-6 py-2.5 rounded-full transition-all border-none cursor-pointer shadow-sm active:scale-95"
                  >
                    Request Documents
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSubModal("add_note")}
                    className="bg-[#f97316] hover:bg-orange-600 text-white font-extrabold text-xs px-6 py-2.5 rounded-full transition-all border-none cursor-pointer shadow-sm active:scale-95"
                  >
                    Add Note
                  </button>
                </div>

                {/* On-Site Physical Inspection Report Section */}
                {selectedClaim.inspectionSubmitted && selectedClaim.inspectionReport && (
                  <div className="border-t border-slate-100 pt-5 text-left">
                    <div className="flex items-center justify-between mb-3 select-none">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        On-Site Physical Inspection Report
                      </h4>
                      {selectedClaim.assignedAgent && (
                        <button
                          type="button"
                          onClick={() => {
                            setContactRecipient("Agent");
                            setActiveSubModal("contact");
                          }}
                          className="text-cyan-600 hover:text-cyan-700 font-extrabold text-[11px] bg-transparent border-none cursor-pointer flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                          </svg>
                          Discuss with Agent
                        </button>
                      )}
                    </div>
                    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col p-5">
                      {renderParsedInspection(
                        selectedClaim.inspectionReport,
                        selectedClaim.additionalDocuments || [],
                        API_URL,
                        setPreviewImage
                      )}
                    </div>
                  </div>
                )}

                {/* Internal Notes — Bottom Section */}
                <div className="border-t border-slate-100 pt-5 select-none">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      Internal Notes
                    </h4>
                    <button
                      type="button"
                      onClick={() => setActiveSubModal("add_note")}
                      className="text-[#f97316] hover:text-orange-600 p-1.5 rounded-xl hover:bg-orange-50 transition-all border-none cursor-pointer flex items-center justify-center bg-transparent"
                      title="Add Note"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                  </div>

                  {selectedClaim.notes && selectedClaim.notes.length > 0 ? (
                    <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 space-y-3">
                      {selectedClaim.notes.map((note, idx) => (
                        <div key={idx} className="flex gap-3 border-b border-amber-100/50 last:border-0 pb-3 last:pb-0">
                          <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-3.5 h-3.5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-slate-700 leading-relaxed">{note.text}</p>
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                              {note.addedBy} &middot; {formatMessageTime(note.addedAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-5 text-center">
                      <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <span className="text-[12px] text-slate-400 font-semibold italic">No notes added yet. Click the icon above to add a note.</span>
                    </div>
                  )}
                </div>

                {/* Category 3: Requested Documents */}
                {(() => {
                  const getRecipientForDoc = (name: string) => {
                    const msg = [...(selectedClaim.messages || [])]
                      .reverse()
                      .find(m => m.message.includes(`Requested: ${name}`));
                    if (msg) {
                      if (msg.message.includes("[Document Request to Agent]")) return "Agent";
                      if (msg.message.includes("[Document Request to User]")) return "User";
                    }
                    return selectedClaim.documentRequestTo || "User";
                  };

                  const getDocDetails = (name: string, status: "Pending" | "Submitted") => {
                    let requestedAt = "";
                    let submittedAt = "";

                    const msg = [...(selectedClaim.messages || [])]
                      .reverse()
                      .find(m => m.message.includes(`Requested: ${name}`));
                    if (msg) {
                      requestedAt = formatDate(msg.sentAt);
                    } else {
                      requestedAt = formatDate(selectedClaim.createdAt);
                    }

                    if (status === "Submitted") {
                      const doc = (selectedClaim.additionalDocuments || []).find(
                        d => d.name.trim().toLowerCase() === name.trim().toLowerCase()
                      );
                      if (doc && doc.uploadedAt) {
                        submittedAt = formatDate(doc.uploadedAt);
                      }
                    }

                    return { requestedAt, submittedAt };
                  };

                  const requestedDocsList = [
                    ...(selectedClaim.requestedDocuments || []).map((name) => ({
                      name,
                      status: "Pending" as const,
                      url: null,
                      recipient: getRecipientForDoc(name),
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

                  if (requestedDocsList.length === 0) return null;

                  const hasPending = requestedDocsList.some((d) => d.status === "Pending");

                  return (
                    <div className="border-t border-slate-100 pt-5">
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
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

                        <div className="space-y-3">
                          <div className="flex items-center gap-2 select-none">
                            <span className="text-[10px] bg-blue-100 text-blue-800 font-black tracking-wider uppercase px-2 py-0.5 rounded border border-blue-200">
                              Policy Holder Requests
                            </span>
                          </div>
                          {policyHolderDocs.length > 0 ? (
                            <div className="flex flex-col gap-2">
                              {policyHolderDocs.map((item, idx) => {
                                const { requestedAt, submittedAt } = getDocDetails(item.name, item.status);
                                return (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between py-2.5 px-4 bg-white border border-slate-200/70 rounded-xl hover:border-slate-300 transition-all shadow-sm"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                        item.status === "Pending" ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                                      }`} />
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-extrabold text-slate-800 truncate">{item.name}</span>
                                        <span className="text-[9px] text-slate-400 font-bold leading-none mt-0.5">
                                          {item.status === "Pending" ? (
                                            `Requested: ${requestedAt}`
                                          ) : (
                                            `Requested: ${requestedAt} · Uploaded: ${submittedAt || "Recent"}`
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded select-none border ${
                                        item.status === "Pending"
                                          ? "bg-amber-100/80 text-amber-800 border-amber-200"
                                          : "bg-emerald-100/80 text-emerald-800 border-emerald-200"
                                      }`}>
                                        {item.status}
                                      </span>
                                      {item.status === "Submitted" && item.url && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            let docUrl = item.url;
                                            if (docUrl && !docUrl.startsWith("http") && !docUrl.startsWith("data:")) {
                                              docUrl = `${API_URL.replace("/api", "")}/uploads/${docUrl}`;
                                            }
                                            setPreviewImage(docUrl || null);
                                          }}
                                          className="text-[10px] font-black text-cyan-600 hover:text-cyan-700 bg-transparent border-none cursor-pointer hover:underline"
                                        >
                                          View
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 font-bold italic select-none py-1 pl-1">
                              No active requests or submissions.
                            </p>
                          )}
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-200/60">
                          <div className="flex items-center gap-2 select-none">
                            <span className="text-[10px] bg-cyan-100 text-cyan-800 font-black tracking-wider uppercase px-2 py-0.5 rounded border border-cyan-200">
                              Agent Requests
                            </span>
                          </div>
                          {agentDocs.length > 0 ? (
                            <div className="flex flex-col gap-2">
                              {agentDocs.map((item, idx) => {
                                const { requestedAt, submittedAt } = getDocDetails(item.name, item.status);
                                return (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between py-2.5 px-4 bg-white border border-slate-200/70 rounded-xl hover:border-slate-300 transition-all shadow-sm"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                        item.status === "Pending" ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                                      }`} />
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-extrabold text-slate-800 truncate">{item.name}</span>
                                        <span className="text-[9px] text-slate-400 font-bold leading-none mt-0.5">
                                          {item.status === "Pending" ? (
                                            `Requested: ${requestedAt}`
                                          ) : (
                                            `Requested: ${requestedAt} · Uploaded: ${submittedAt || "Recent"}`
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded select-none border ${
                                        item.status === "Pending"
                                          ? "bg-amber-100/80 text-amber-800 border-amber-200"
                                          : "bg-emerald-100/80 text-emerald-800 border-emerald-200"
                                      }`}>
                                        {item.status}
                                      </span>
                                      {item.status === "Submitted" && item.url && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            let docUrl = item.url;
                                            if (docUrl && !docUrl.startsWith("http") && !docUrl.startsWith("data:")) {
                                              docUrl = `${API_URL.replace("/api", "")}/uploads/${docUrl}`;
                                            }
                                            setPreviewImage(docUrl || null);
                                          }}
                                          className="text-[10px] font-black text-cyan-600 hover:text-cyan-700 bg-transparent border-none cursor-pointer hover:underline"
                                        >
                                          View
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 font-bold italic select-none py-1 pl-1">
                              No active requests or submissions.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* Modal Footer */}
              <div className="px-8 py-4 bg-white border-t border-slate-200 flex justify-between flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClaim(null);
                    setActiveDetailsPanel(null);
                  }}
                  className="bg-[#0f2d4a] hover:bg-[#1a3d5e] text-white font-bold text-sm px-6 py-2 rounded-full transition-all border-none cursor-pointer flex items-center shadow-sm active:scale-95"
                >
                  &lt; Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClaim(null);
                    setActiveDetailsPanel(null);
                  }}
                  className="bg-[#0f2d4a] hover:bg-[#1a3d5e] text-white font-bold text-sm px-6 py-2 rounded-full transition-all border-none cursor-pointer flex items-center shadow-sm active:scale-95"
                >
                  Submit &gt;
                </button>
              </div>
            </div>
          )}
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

      {/* Inspection Report Text Preview Modal */}
      {previewReportText && (
        <div 
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300 select-none animate-fade-in"
          onClick={() => setPreviewReportText(null)}
        >
          <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col p-6 max-h-[85vh] animate-scale-up select-text" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4 select-none">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <h3 className="font-extrabold text-slate-800 text-base">Vehicle Physical Inspection Report</h3>
              </div>
              <button
                onClick={() => setPreviewReportText(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-50 transition-colors cursor-pointer border-none outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 pr-1 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              {renderParsedInspection(
                previewReportText,
                selectedClaim ? selectedClaim.additionalDocuments : [],
                API_URL,
                setPreviewImage
              )}
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-between items-center select-none">
              {selectedClaim && selectedClaim.assignedAgent ? (
                <button
                  type="button"
                  onClick={() => {
                    setPreviewReportText(null);
                    setContactRecipient("Agent");
                    setActiveSubModal("contact");
                  }}
                  className="px-5 py-2.5 rounded-full border border-[#0f2d4a] hover:bg-[#0f2d4a]/5 text-[#0f2d4a] font-extrabold text-xs transition-all cursor-pointer bg-white flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <svg className="w-4 h-4 text-[#0f2d4a]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                  Chat with Agent
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={() => setPreviewReportText(null)}
                className="px-6 py-2.5 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs transition-colors cursor-pointer border-none shadow-sm active:scale-95"
              >
                Dismiss Preview
              </button>
            </div>
          </div>
        </div>
      )}

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

export default function OfficeStaffClaimsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading claims...</div>}>
      <OfficeStaffClaimsPageContent />
    </Suspense>
  );
}

