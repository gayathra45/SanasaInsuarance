"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/Components/Agent/Navbar";
import Footer from "@/app/Components/Agent/Footer";
import { API_URL } from "@/app/config";

interface AdditionalDoc {
  name: string;
  url: string;
  uploadedAt: string;
  uploadedBy?: string;
}

interface ClaimMessage {
  sender: string;
  message: string;
  sentAt: string;
  recipient?: string;
  _id?: string;
}

interface ClaimNote {
  text: string;
  addedBy: string;
  addedAt: string;
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
  documentsRequested?: boolean;
  requestedDocuments?: string[];
  documentRequestTo?: string;
  messages: ClaimMessage[];
  additionalDocuments: AdditionalDoc[];
  createdAt: string;
  priority?: string;
  inspectionReport?: string;
  inspectionSubmitted?: boolean;
  paymentReceipt?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccount?: string;
  rejectionReason?: string;
  notes?: ClaimNote[];
  accidentPhotos?: {
    front: string[];
    rear: string[];
    side: string[];
  };
  drivingLicense?: {
    front: string[];
    rear: string[];
  };
}

interface PolicyHolder {
  _id: string;
  firstName: string;
  lastName: string;
  nic: string;
  mobile: string;
  email: string;
}

interface Activity {
  id: string;
  type: "upload" | "message" | "claim";
  title: string;
  description: string;
  timestamp: string;
  claimNumber: string;
  vehiclePlate: string;
}

export default function AgentActivityPage() {
  const router = useRouter();
  const [agent, setAgent] = useState<any>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [policyHolders, setPolicyHolders] = useState<PolicyHolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<string>("Active");

  // Page level tabs: "claims" or "timeline"
  const [pageViewTab, setPageViewTab] = useState<"claims" | "timeline">("claims");

  // Claims filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "In Progress" | "Approved" | "Rejected">("All");
  
  // Interactive detail modals
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [activeSubModal, setActiveSubModal] = useState<"documents" | "contact" | "request_docs" | "add_note" | "update_tracking" | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [updatingClaim, setUpdatingClaim] = useState(false);
  const [newMessageText, setNewMessageText] = useState("");
  const [assessmentAmount, setAssessmentAmount] = useState<string>("");
  const [inspectionReportText, setInspectionReportText] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isAcceptingClaim, setIsAcceptingClaim] = useState(false);
  const [showMobileRedirect, setShowMobileRedirect] = useState(false);
  const [contactRecipient, setContactRecipient] = useState<"Policy Holder" | "Office Staff">("Policy Holder");

  // Document Request states
  interface RequestDocItem {
    recipient: "User" | "Agent";
    docType: string;
    customName: string;
    note: string;
  }
  const [requestItems, setRequestItems] = useState<RequestDocItem[]>([
    { recipient: "User", docType: "NIC Front Page", customName: "", note: "" }
  ]);

  // Agent upload states
  const [agentUploadFile, setAgentUploadFile] = useState<File | null>(null);
  const [agentUploadPreview, setAgentUploadPreview] = useState<string | null>(null);
  const [agentUploadDocName, setAgentUploadDocName] = useState<string>("Repair Estimate");
  const [isAgentUploading, setIsAgentUploading] = useState(false);
  const agentFileInputRef = React.useRef<HTMLInputElement>(null);

  // Timeline Filter State
  const [timelineTab, setTimelineTab] = useState<"all" | "upload" | "message" | "claim">("all");

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const agentData = sessionStorage.getItem("logged_in_agent");
      if (!agentData) {
        router.push("/Login");
        return;
      }
      try {
        const parsed = JSON.parse(agentData);
        setAgent(parsed);
        if (parsed.email) {
          fetchClaimsAndStatus(parsed.email, parsed.branch);
        }
      } catch (e) {
        console.error(e);
        router.push("/Login");
      }
    }
  }, [router]);

  // Lock body scroll when selectedClaim modal or previewImage modal is open
  useEffect(() => {
    if (selectedClaim || previewImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedClaim, previewImage]);

  const fetchClaimsAndStatus = async (email: string, branchName?: string) => {
    try {
      setLoading(true);
      const claimsRes = await fetch(`${API_URL}/agent/claims?email=${email}`);
      if (claimsRes.ok) {
        const claimsData = await claimsRes.json();
        setClaims(claimsData || []);
      }

      const availabilityRes = await fetch(`${API_URL}/agent/availability?email=${encodeURIComponent(email)}`);
      if (availabilityRes.ok) {
        const availabilityData = await availabilityRes.json();
        if (availabilityData.availability) {
          setAvailability(availabilityData.availability);
        }
      }

      if (branchName) {
        const phRes = await fetch(`${API_URL}/office-staff/policy-holders?branch=${encodeURIComponent(branchName.trim())}`);
        const regsRes = await fetch(`${API_URL}/office-staff/registrations?branch=${encodeURIComponent(branchName.trim())}`);
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
      }
    } catch (err) {
      console.error("Error loading activity details:", err);
    } finally {
      setLoading(false);
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


  const getSeverity = (damageType: string): "Urgent" | "Medium" | "Low" => {
    const type = (damageType || "").toLowerCase();
    if (type.includes("fire")) return "Urgent";
    if (type.includes("accident") || type.includes("crash")) return "Medium";
    return "Low";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return String(dateStr);
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const hours = d.getHours().toString().padStart(2, "0");
      const minutes = d.getMinutes().toString().padStart(2, "0");
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} ${hours}:${minutes}`;
    } catch {
      return String(dateStr);
    }
  };

  const formatMessageTime = (dateStr: string) => {
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
  };

  const claimDateString = (dateStr: string) => {
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


  // Compile timeline activities from claims
  const getCompiledActivities = (): Activity[] => {
    const list: Activity[] = [];

    claims.forEach(claim => {
      // 1. Document Uploads by the agent
      if (claim.additionalDocuments) {
        claim.additionalDocuments.forEach((doc, idx) => {
          if (doc.uploadedBy === "Agent") {
            list.push({
              id: `upload-${claim.claimNumber}-${idx}-${doc.uploadedAt}`,
              type: "upload",
              title: "Document Uploaded",
              description: `Uploaded "${doc.name}" for Claim verification.`,
              timestamp: doc.uploadedAt || claim.createdAt,
              claimNumber: claim.claimNumber,
              vehiclePlate: claim.vehiclePlate
            });
          }
        });
      }

      // 2. Chat messages sent by the agent
      if (claim.messages) {
        claim.messages.forEach((msg, idx) => {
          if (msg.sender === "Agent" || msg.sender === "Agent (You)") {
            list.push({
              id: `msg-${claim.claimNumber}-${idx}-${msg.sentAt}`,
              type: "message",
              title: "Message Sent",
              description: `Sent message to Office Staff: "${msg.message}"`,
              timestamp: msg.sentAt,
              claimNumber: claim.claimNumber,
              vehiclePlate: claim.vehiclePlate
            });
          }
        });
      }

      // 3. Claims assigned to the agent
      list.push({
        id: `assign-${claim.claimNumber}-${claim.createdAt}`,
        type: "claim",
        title: "Claim Accepted / Assigned",
        description: `Accepted case assignment with status "${claim.status}".`,
        timestamp: claim.createdAt,
        claimNumber: claim.claimNumber,
        vehiclePlate: claim.vehiclePlate
      });
    });

    // Sort by timestamp descending
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const allActivities = getCompiledActivities();
  const filteredActivities = allActivities.filter(act => {
    if (timelineTab === "all") return true;
    return act.type === timelineTab;
  });

  // Filter claims based on status and search query
  const filteredClaims = claims.filter(c => {
    const matchesStatus = statusFilter === "All" ? true : c.status === statusFilter;
    const matchesSearch =
      c.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.damageType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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
          messageSender: "Agent"
        })
      });
      if (!res.ok) throw new Error("Failed to update claim details.");
      const data = await res.json();

      setClaims(prev => prev.map(c => c.claimNumber === claimNumber ? data.claim : c));
      setSelectedClaim(data.claim);
      setNewMessageText("");
    } catch (err: any) {
      alert(err.message || "Failed to update claim details.");
    } finally {
      setUpdatingClaim(false);
    }
  };

  const handleAcceptClaim = async (claimNumber: string) => {
    try {
      setIsAcceptingClaim(true);
      await handleUpdateClaim(claimNumber, {
        status: "In Progress",
        currentStep: 3,
        messageText: "Agent accepted the claim assignment.",
        messageRecipient: "Office Staff"
      });
      setShowMobileRedirect(true);
    } catch (e) {
      console.error(e);
      alert("Error accepting claim.");
    } finally {
      setIsAcceptingClaim(false);
    }
  };

  const handleDeclineClaim = async (claimNumber: string) => {
    try {
      setIsAcceptingClaim(true);
      await handleUpdateClaim(claimNumber, {
        status: "Rejected",
        currentStep: 5,
        rejectionReason: "Rejected by Agent",
        messageText: "Claim rejected by Agent.",
        messageRecipient: "Office Staff"
      });
      alert("Claim rejected successfully!");
    } catch (e) {
      console.error(e);
      alert("Error rejecting claim.");
    } finally {
      setIsAcceptingClaim(false);
    }
  };

  const handleSubmitInspectionReport = async (claimNumber: string) => {
    try {
      if (!inspectionReportText.trim()) {
        alert("Please enter inspection report details.");
        return;
      }
      setIsSubmittingReport(true);
      await handleUpdateClaim(claimNumber, {
        inspectionReport: inspectionReportText.trim(),
        inspectionSubmitted: true,
        status: "In Progress",
        messageText: "Vehicle inspection report submitted by Agent.",
        messageRecipient: "Office Staff"
      });
      alert("Inspection report submitted successfully!");
      setInspectionReportText("");
    } catch (e) {
      console.error(e);
      alert("Error submitting inspection report.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleApproveAssessment = async (claimNumber: string) => {
    try {
      const numAmount = parseFloat(assessmentAmount);
      if (isNaN(numAmount) || numAmount <= 0) {
        alert("Please enter a valid assessment amount.");
        return;
      }
      await handleUpdateClaim(claimNumber, {
        status: "Approved",
        amount: numAmount,
        currentStep: 6,
        messageText: `Claim assessment approved for LKR ${numAmount.toLocaleString()} by Agent.`,
        messageRecipient: "Office Staff"
      });
      alert("Assessment approved and claim status updated to Approved!");
    } catch (e) {
      console.error(e);
      alert("Error approving assessment.");
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
        const data = await res.json();
        alert("Document uploaded successfully!");
        handleFileChange(null);
        
        // Refresh local state with updated claim
        setClaims(prev => prev.map(c => c.claimNumber === selectedClaim.claimNumber ? data.claim : c));
        setSelectedClaim(data.claim);
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

  // Calculate statistics
  const totalUploads = allActivities.filter(a => a.type === "upload").length;
  const totalMessages = allActivities.filter(a => a.type === "message").length;
  const totalAssigned = claims.length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      <Navbar />

      {/* Curved Header matching Document repository layout exactly */}
      <div className="max-w-7xl w-full mx-auto px-6 md:px-16 mt-8 relative">
        <div className="absolute top-0 bottom-0 left-[calc(50%-50vw)] right-6 md:right-12 bg-[url('/newclaim1.webp')] bg-cover bg-center rounded-r-[75px] md:rounded-r-[95px] overflow-hidden shadow-md">
          {/* Dark slate overlay */}
          <div className="absolute inset-0 bg-slate-900/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-transparent" />
        </div>

        {/* Header Text Content */}
        <header className="relative z-10 h-[210px] flex flex-col justify-center pl-4 md:pl-8 select-none">
          <h1 className="text-white text-3xl md:text-[40px] font-bold tracking-tight leading-none">
            My Activity & Claims
          </h1>
          <p className="text-slate-200 text-xs md:text-sm font-semibold mt-3.5 tracking-wide opacity-95">
            Manage your assigned claim files and review historical assessment timelines
          </p>
        </header>
      </div>

      {/* Dual Page Mode Selector Tabs (Highlighted Segmented Control Style) */}
      <div className="max-w-7xl w-full mx-auto px-6 md:px-16 mt-8 select-none">
        <div className="inline-flex p-1.5 bg-slate-100 border border-slate-200/60 rounded-2xl shadow-sm gap-2">
          <button
            onClick={() => setPageViewTab("claims")}
            className={`py-3 px-6 rounded-xl font-black text-sm transition-all border-none outline-none cursor-pointer flex items-center gap-2.5 ${
              pageViewTab === "claims"
                ? "bg-[#0f2d4a] text-white shadow-md animate-fade-in"
                : "bg-transparent text-slate-500 hover:bg-slate-200/50 hover:text-slate-700"
            }`}
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Assigned Claims
            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
              pageViewTab === "claims" ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20" : "bg-slate-200 text-slate-600"
            }`}>
              {claims.length}
            </span>
          </button>
          <button
            onClick={() => setPageViewTab("timeline")}
            className={`py-3 px-6 rounded-xl font-black text-sm transition-all border-none outline-none cursor-pointer flex items-center gap-2.5 ${
              pageViewTab === "timeline"
                ? "bg-[#0f2d4a] text-white shadow-md animate-fade-in"
                : "bg-transparent text-slate-500 hover:bg-slate-200/50 hover:text-slate-700"
            }`}
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Activity Timeline Feed
            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
              pageViewTab === "timeline" ? "bg-cyan-500 text-white shadow-sm shadow-cyan-500/20" : "bg-slate-200 text-slate-600"
            }`}>
              {allActivities.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-16 py-10 relative z-20 flex flex-col lg:flex-row gap-10">
        
        {/* Left Column: Primary Tab Content */}
        <div className="flex-1 flex flex-col gap-6">

          {pageViewTab === "claims" ? (
            /* CLAIMS DIRECTORY VIEW */
            <div className="flex flex-col gap-6">
              
              {/* Search & Filter row */}
              <div className="bg-white border border-slate-200 rounded-[24px] p-5 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm select-none">
                
                {/* Status Tabs */}
                <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-xl w-full md:w-auto">
                  {(["All", "Pending", "In Progress", "Approved", "Rejected"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setStatusFilter(tab)}
                      className={`px-4 py-2 rounded-lg text-xs font-black transition-all border-none outline-none cursor-pointer ${
                        statusFilter === tab
                          ? "bg-[#0f2d4a] text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                      }`}
                    >
                      {tab} ({tab === "All" ? claims.length : claims.filter(c => c.status === tab).length})
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-72">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Claim, Plate, Damage..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-slate-700 placeholder:text-slate-400 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0f2d4a] focus:border-transparent transition-all bg-slate-50 focus:bg-white"
                  />
                </div>

              </div>

              {/* Claims Data grid list */}
              {loading ? (
                <div className="bg-white border border-slate-200 rounded-[28px] p-16 flex flex-col items-center justify-center text-center shadow-sm min-h-[300px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
                  <span className="mt-3 text-slate-400 text-sm font-bold">Fetching claims dossier...</span>
                </div>
              ) : filteredClaims.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-[28px] p-16 flex flex-col items-center justify-center text-center shadow-sm min-h-[300px]">
                  <h3 className="font-extrabold text-slate-700 text-lg">No Claims Found</h3>
                  <p className="text-slate-400 text-xs font-semibold mt-1.5 max-w-sm leading-relaxed">
                    We couldn't find any claims assigned to you under active search queries or filters.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {/* Grid Table Header (Desktop Only) */}
                  <div className="hidden md:grid md:grid-cols-[1.5fr_0.8fr_1.3fr_1.2fr_1.9fr_1fr_0.9fr_1.5fr] items-center gap-4 px-5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider select-none border border-transparent border-l-4 border-l-transparent">
                    <div>Claim Info</div>
                    <div>Vehicle No</div>
                    <div>Damage Type</div>
                    <div>Location</div>
                    <div>Policy Holder</div>
                    <div>Assessment</div>
                    <div>Status</div>
                    <div className="text-right">Actions</div>
                  </div>

                  {/* List Cards */}
                  {filteredClaims.map((claim) => {
                    const isUrgent = getSeverity(claim.damageType) === "Urgent" || claim.priority === "Urgent";
                    return (
                      <div
                        key={claim._id}
                        onClick={() => {
                          setSelectedClaim(claim);
                          setAssessmentAmount(typeof claim.amount === "number" ? claim.amount.toString() : "");
                        }}
                        className={`bg-white border border-slate-200 hover:border-[#0f2d4a] rounded-xl px-5 py-3.5 flex flex-col md:grid md:grid-cols-[1.5fr_0.8fr_1.3fr_1.2fr_1.9fr_1fr_0.9fr_1.5fr] md:items-center gap-4 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md relative overflow-hidden ${
                          isUrgent ? "border-l-4 border-l-red-500" : "border-l-4 border-l-[#0f2d4a]"
                        }`}
                      >
                        {/* Claim Info */}
                        <div className="flex flex-col min-w-0 select-none">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-slate-800 text-sm whitespace-nowrap">{claim.claimNumber}</span>
                            {isUrgent && (
                              <span className="bg-red-100 text-red-700 text-[8px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-md whitespace-nowrap animate-pulse">Urgent</span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold mt-1 block">Registered: {formatDate(claim.createdAt)}</span>
                        </div>

                        {/* Vehicle Plate */}
                        <div className="text-xs md:text-sm font-bold text-slate-800">
                          {formatPlate(claim.vehiclePlate)}
                        </div>

                        {/* Damage type */}
                        <div className="text-xs md:text-sm font-semibold text-slate-700 truncate" title={claim.damageType}>
                          {claim.damageType}
                        </div>

                        {/* Location */}
                        <div className="text-xs md:text-sm font-semibold text-slate-700 truncate" title={claim.location}>
                          {claim.location || "-"}
                        </div>

                        {/* Policy Holder */}
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-slate-800 truncate">{getPolicyHolderName(claim.userNic)}</span>
                          <span className="text-[10px] text-slate-400 font-bold mt-0.5">NIC: {claim.userNic}</span>
                        </div>

                        {/* Assessment */}
                        <div className="text-xs font-bold text-slate-700">
                          {typeof claim.amount === "number" ? (
                            `Rs. ${claim.amount.toLocaleString()}`
                          ) : (
                            <span className="text-slate-400 font-normal italic text-[11px]">Not Assessed</span>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className="flex flex-col items-start min-w-0">
                          <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide block text-center ${getStatusStyle(claim.status, claim.damageType, claim.priority)}`}>
                            {claim.status}
                          </span>
                        </div>

                        {/* Action */}
                        <div className="text-left md:text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClaim(claim);
                              setAssessmentAmount(typeof claim.amount === "number" ? claim.amount.toString() : "");
                            }}
                            className="border border-slate-300 hover:bg-slate-50 text-slate-600 font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer focus:outline-none shadow-sm bg-white whitespace-nowrap active:scale-95"
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
          ) : (
            /* ACTIVITY TIMELINE VIEW */
            <div className="flex flex-col gap-6">
              
              {/* Timeline filters */}
              <div className="bg-[#e2e8f0]/40 p-1 rounded-[16px] flex flex-wrap gap-1 font-bold text-sm select-none border border-slate-200 shadow-inner">
                {(
                  [
                    { label: "All Activities", val: "all" },
                    { label: "Document Uploads", val: "upload" },
                    { label: "Correspondence", val: "message" },
                    { label: "Assignments", val: "claim" }
                  ] as const
                ).map(tab => (
                  <button
                    key={tab.val}
                    type="button"
                    onClick={() => setTimelineTab(tab.val)}
                    className={`px-6 py-2.5 rounded-[12px] text-xs md:text-sm transition-all cursor-pointer border-none outline-none font-black ${
                      timelineTab === tab.val
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 bg-transparent"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Feed timeline log */}
              {loading ? (
                <div className="bg-white border border-slate-200 rounded-[28px] p-16 flex flex-col items-center justify-center text-center shadow-sm min-h-[300px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
                  <span className="mt-3 text-slate-400 text-sm font-bold">Parsing timeline...</span>
                </div>
              ) : filteredActivities.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-[28px] p-16 flex flex-col items-center justify-center text-center shadow-sm min-h-[300px]">
                  <h3 className="font-extrabold text-slate-700 text-lg">No Activities Logged</h3>
                  <p className="text-slate-400 text-xs font-semibold mt-1.5 max-w-sm leading-relaxed">
                    There are no logged activities matching the selected timeline category filter.
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 md:pl-8 border-l border-slate-200/80 ml-4 py-2 space-y-8 select-none">
                  {filteredActivities.map((act) => {
                    let iconBg = "bg-slate-100 text-slate-600 border-slate-200";
                    let iconSvg = null;

                    if (act.type === "upload") {
                      iconBg = "bg-emerald-50 text-emerald-600 border-emerald-100";
                      iconSvg = (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32a1.5 1.5 0 01-2.12-2.121L16.208 8" />
                        </svg>
                      );
                    } else if (act.type === "message") {
                      iconBg = "bg-cyan-50 text-cyan-600 border-cyan-100";
                      iconSvg = (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-1.074-.765 6.003 6.003 0 011.085-3.11 8.261 8.261 0 01-1.672-4.82c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                        </svg>
                      );
                    } else {
                      iconBg = "bg-amber-50 text-amber-600 border-amber-100";
                      iconSvg = (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 12.408l1.5-1.5 3 3m-3-3l1.5 1.5" />
                    </svg>
                      );
                    }

                    return (
                      <div key={act.id} className="relative animate-fade-in">
                        {/* Node Symbol */}
                        <div className={`absolute left-[calc(-24px-20px)] md:left-[calc(-32px-20px)] w-10 h-10 rounded-full border flex items-center justify-center shadow-sm ${iconBg}`}>
                          {iconSvg}
                        </div>

                        {/* Node Card details */}
                        <div className="bg-white border border-slate-200/80 rounded-[24px] p-5 shadow-[0_4px_15px_rgba(0,0,0,0.01)] hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2.5">
                              <h4 className="font-extrabold text-slate-800 text-sm md:text-base leading-none">
                                {act.title}
                              </h4>
                              <span className="text-[10px] text-slate-400 font-extrabold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full uppercase">
                                Plate: {act.vehiclePlate}
                              </span>
                            </div>
                            <p className="text-slate-500 text-xs md:text-sm font-semibold mt-2">
                              {act.description}
                            </p>
                          </div>
                          
                          <div className="flex flex-col items-start md:items-end shrink-0 gap-1.5">
                            <span className="text-[10px] text-slate-400 font-black tracking-wide uppercase">
                              {formatDateTime(act.timestamp)}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-black tracking-wide uppercase bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                              Claim #{act.claimNumber}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Right Column: Statistics & Profile */}
        {pageViewTab === "timeline" && (
          <div className="w-full lg:w-[350px] shrink-0 flex flex-col gap-6 select-none">
            
            {/* Status card */}
            <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm flex flex-col gap-4">
              <h3 className="font-black text-slate-800 text-base border-b border-slate-100 pb-3">
                Profile & Status
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold shrink-0">
                    <svg className="w-6 h-6 text-slate-455" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="overflow-hidden">
                    <span className="block font-black text-slate-800 text-base truncate">{agent?.name || "Insurance Agent"}</span>
                    <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">ID: {agent?.agentId || "N/A"}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wide">Live status:</span>
                  {availability === "Offline" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-[#ef4444] text-white shadow-sm">
                      Offline
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-[#10b981] text-white shadow-sm">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                      </span>
                      Active
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Performance counts */}
            <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm flex flex-col gap-4">
              <h3 className="font-black text-slate-800 text-base border-b border-slate-100 pb-3">
                Performance Summary
              </h3>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-3 flex flex-col justify-center">
                  <span className="text-lg font-black text-slate-800">{totalAssigned}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-1">Claims</span>
                </div>
                <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-3 flex flex-col justify-center">
                  <span className="text-lg font-black text-slate-800">{totalUploads}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-1">Uploads</span>
                </div>
                <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-3 flex flex-col justify-center">
                  <span className="text-lg font-black text-slate-800">{totalMessages}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-1">Chats</span>
                </div>
              </div>
            </div>

            {/* Guide info block */}
            <div className="bg-slate-900 border border-slate-800 rounded-[28px] p-6 shadow-md text-white">
              <h3 className="font-black text-white text-base border-b border-slate-800 pb-3 flex items-center gap-1.5">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                Quick Guidelines
              </h3>
              <p className="text-slate-350 text-xs font-semibold mt-3.5 leading-relaxed">
                Use the **Assigned Claims** tab to view files, status, and download documents. The **Activity Timeline** tab lists your audit logs for verification audits.
              </p>
            </div>

          </div>
        )}

      </main>

      {/* Detailed Claim Modal & Sub-modals (Matching Branch Claims Portal layout) */}
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

                    {/* Uploded Agent Docs List */}
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
                                  className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all border cursor-pointer select-none ${
                                    isSelected
                                      ? "bg-[#0f2d4a] border-[#0f2d4a] text-white shadow-sm"
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
                              className="w-full border-2 border-dashed border-slate-350 hover:border-[#0f2d4a] rounded-2xl py-6 px-4 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all duration-150 group select-none"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-8 h-8 text-slate-400 mb-2 group-hover:text-[#0f2d4a] transition-colors">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                              </svg>
                              <span className="text-slate-800 text-[13px] font-bold">Select document file</span>
                              <span className="text-slate-400 text-[10px] font-semibold mt-1">Image or PDF (Max 5MB)</span>
                            </div>
                          ) : (
                            <div className="w-full border border-emerald-500 bg-emerald-50/5 rounded-2xl p-4 flex items-center justify-between relative shadow-sm">
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
                            className="w-full bg-[#0f2d4a] hover:bg-[#1a3d5e] text-white font-extrabold text-xs py-3 px-4 rounded-xl border-none cursor-pointer active:scale-[0.98] transition-all disabled:opacity-50 mt-1 shadow-md flex items-center justify-center gap-2"
                          >
                            {isAgentUploading ? "Uploading..." : "Upload Document"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
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
                <div className="text-left font-bold text-slate-800 space-y-1.5 text-[13px] select-none leading-relaxed">
                  <p>Vehicle No : <span className="font-medium text-slate-600">{formatPlate(selectedClaim.vehiclePlate)}</span></p>
                </div>

                {/* Fields */}
                <div className="space-y-4 pr-1">
                  {requestItems.map((item, index) => (
                    <div key={index} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 relative space-y-4">
                      {requestItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setRequestItems(prev => prev.filter((_, idx) => idx !== index))}
                          className="absolute top-4 right-4 text-slate-400 hover:text-red-500 font-extrabold text-lg bg-transparent border-none cursor-pointer p-1 transition-colors"
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
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider ml-1 select-none">Request From :</label>
                          <div className="flex gap-4 p-2.5 bg-white border border-slate-200 rounded-xl">
                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                              <input
                                type="radio"
                                checked={item.recipient === "User"}
                                onChange={() => {
                                  setRequestItems(prev => prev.map((it, idx) => idx === index ? { ...it, recipient: "User", docType: "NIC Front Page" } : it));
                                }}
                                className="w-3.5 h-3.5 accent-[#0f2d4a]"
                              />
                              <span className="text-xs font-bold text-slate-700">Policy Holder</span>
                            </label>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider ml-1 select-none">Document Type :</label>
                          <select
                            value={item.docType}
                            onChange={(e) => {
                              setRequestItems(prev => prev.map((it, idx) => idx === index ? { ...it, docType: e.target.value } : it));
                            }}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2d4a]"
                          >
                            <option value="NIC Front Page">NIC Front Page</option>
                            <option value="NIC Back Page">NIC Back Page</option>
                            <option value="License Front">License Front</option>
                            <option value="License Rear">License Rear</option>
                            <option value="Vehicle Registration">Vehicle Registration</option>
                            <option value="Revenue License">Revenue License</option>
                            <option value="Accident Photos">Accident Photos</option>
                            <option value="Repair Estimate">Repair Estimate</option>
                            <option value="Custom / Other">Custom / Other</option>
                          </select>
                        </div>
                      </div>

                      {item.docType === "Custom / Other" && (
                        <div className="flex flex-col gap-1.5 animate-fade-in">
                          <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider ml-1 select-none">Custom Document Name :</label>
                          <input
                            type="text"
                            required
                            value={item.customName}
                            onChange={(e) => {
                              setRequestItems(prev => prev.map((it, idx) => idx === index ? { ...it, customName: e.target.value } : it));
                            }}
                            placeholder="E.g. Bank Book PDF, Towing Receipt..."
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2d4a]"
                          />
                        </div>
                      )}

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider ml-1 select-none">Instructions / Note :</label>
                        <textarea
                          rows={2}
                          value={item.note}
                          onChange={(e) => {
                            setRequestItems(prev => prev.map((it, idx) => idx === index ? { ...it, note: e.target.value } : it));
                          }}
                          placeholder="E.g. Please upload a clear photo of the document..."
                          className="w-full p-4 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2d4a] resize-none"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setRequestItems(prev => [...prev, { recipient: "User", docType: "NIC Front Page", customName: "", note: "" }]);
                    }}
                    className="w-full py-4 border-2 border-dashed border-slate-355 hover:border-[#0f2d4a] rounded-2xl flex items-center justify-center gap-2 bg-slate-50/50 hover:bg-slate-50 text-xs font-bold text-slate-500 hover:text-[#0f2d4a] cursor-pointer transition-all duration-200 group"
                  >
                    Add Another Document Request
                  </button>
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
                  onClick={async () => {
                    for (let i = 0; i < requestItems.length; i++) {
                      const item = requestItems[i];
                      if (item.docType === "Custom / Other" && !item.customName.trim()) {
                        alert(`Please enter a custom document name for Document #${i + 1}.`);
                        return;
                      }
                    }

                    const currentDocs = selectedClaim.requestedDocuments || [];
                    const newDocs = requestItems.map(item => {
                      return item.docType === "Custom / Other" ? item.customName.trim() : item.docType;
                    });

                    const updatedDocs = [...currentDocs];
                    newDocs.forEach(docName => {
                      if (!updatedDocs.includes(docName)) {
                        updatedDocs.push(docName);
                      }
                    });

                    const messageTexts = requestItems.map(item => {
                      const docName = item.docType === "Custom / Other" ? item.customName.trim() : item.docType;
                      const customMsg = item.note.trim() || `Please upload the requested document.`;
                      return {
                        message: `[Document Request to ${item.recipient}] Requested: ${docName}. Message: ${customMsg}`,
                        recipient: "Policy Holder"
                      };
                    });

                    await handleUpdateClaim(selectedClaim.claimNumber, {
                      documentsRequested: true,
                      requestedDocuments: updatedDocs,
                      documentRequestTo: "User",
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
                <div className="text-left font-bold text-slate-800 space-y-1.5 text-[13px] select-none leading-relaxed">
                  <p>Vehicle No : <span className="font-medium text-slate-600">{formatPlate(selectedClaim.vehiclePlate)}</span></p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-slate-800 ml-1 select-none">Add Note :</label>
                    <textarea
                      rows={5}
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      placeholder="Enter internal text note..."
                      className="w-full p-4 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0f2d4a] resize-none border border-slate-200/50"
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

          {/* SUB-MODAL 4: CONTACT */}
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
                <div className="text-left font-bold text-slate-800 space-y-1.5 text-[13px] select-none leading-relaxed">
                  <p>Vehicle No : <span className="font-medium text-slate-600">{formatPlate(selectedClaim.vehiclePlate)}</span></p>
                </div>

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
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Office Staff</span>
                    <h5 className="text-xs font-extrabold text-slate-800">Branch Operations</h5>
                    <div className="text-[11px] text-slate-600 font-semibold">
                      <p>Branch: {selectedClaim.branch || "Branch Office"}</p>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 select-none border-b border-slate-100 pb-2">
                  <button
                    type="button"
                    onClick={() => setContactRecipient("Policy Holder")}
                    className={`py-2 px-6 rounded-full text-xs font-black tracking-wide uppercase transition-all border cursor-pointer ${
                      contactRecipient === "Policy Holder"
                        ? "bg-[#0f2d4a] text-white border-transparent shadow-sm"
                        : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-105"
                    }`}
                  >
                    Policy Holder Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactRecipient("Office Staff")}
                    className={`py-2 px-6 rounded-full text-xs font-black tracking-wide uppercase transition-all border cursor-pointer ${
                      contactRecipient === "Office Staff"
                        ? "bg-[#0f2d4a] text-white border-transparent shadow-sm"
                        : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-105"
                    }`}
                  >
                    Office Staff Chat
                  </button>
                </div>

                {/* Chat Log */}
                <div className="bg-slate-100 rounded-2xl p-5 border border-slate-200 flex-1 overflow-y-auto space-y-3.5 max-h-[160px]">
                  {(() => {
                    const filteredMessages = selectedClaim.messages.filter((msg) => {
                      if (contactRecipient === "Policy Holder") {
                        // Exchanged with Policy Holder
                        return msg.recipient === "Policy Holder" || msg.recipient === "User" || msg.sender === "Policy Holder" || msg.sender === "User";
                      } else {
                        // Exchanged with Agent / Office Staff
                        return msg.recipient === "Agent" || msg.recipient === "Office Staff" || msg.sender === "Office Staff" || msg.sender.includes("Branch Staff");
                      }
                    });

                    if (filteredMessages.length === 0) {
                      return (
                        <div className="text-center text-xs text-slate-400 italic py-2 font-semibold select-none">
                          No messages history recorded with {contactRecipient === "Policy Holder" ? "Policy Holder" : "Office Staff"}.
                        </div>
                      );
                    }

                    return filteredMessages.map((msg, index) => {
                      const isSelf = msg.sender === "Agent" || msg.sender === "Agent (You)";
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

                {/* Message input */}
                <div className="select-none">
                  <div className="flex gap-3">
                    <textarea
                      rows={2}
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      placeholder={`Type a message to ${contactRecipient === "Policy Holder" ? "Policy Holder" : "Office Staff"}...`}
                      className="flex-1 p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none bg-slate-50 focus:ring-2 focus:ring-[#0f2d4a] resize-none"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (newMessageText.trim()) {
                          await handleUpdateClaim(selectedClaim.claimNumber, {
                            messageText: newMessageText.trim(),
                            messageRecipient: contactRecipient === "Policy Holder" ? "Policy Holder" : "Agent"
                          });
                          setNewMessageText("");
                          alert("Message sent!");
                        }
                      }}
                      disabled={updatingClaim || !newMessageText.trim()}
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
                <div className="text-left font-bold text-slate-800 space-y-1.5 text-[13px] select-none leading-relaxed">
                  <p>Vehicle No : <span className="font-medium text-slate-600">{formatPlate(selectedClaim.vehiclePlate)}</span></p>
                </div>

                {selectedClaim.status === "Rejected" ? (
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
                    {/* Stepper details */}
                    {selectedClaim.currentStep === 2 && (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-3.5">
                        <p className="text-slate-650 font-bold text-xs select-none">
                          This claim dossier has been assigned to you. Please accept the case file to start damage inspections.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleAcceptClaim(selectedClaim.claimNumber)}
                          disabled={isAcceptingClaim}
                          className="bg-[#0f2d4a] hover:bg-[#1a3d5e] text-white font-extrabold text-xs py-2.5 px-6 rounded-xl cursor-pointer disabled:opacity-50 select-none shadow-sm active:scale-95 transition-all"
                        >
                          {isAcceptingClaim ? "Accepting..." : "Accept Claim Assignment"}
                        </button>
                      </div>
                    )}

                    {selectedClaim.currentStep === 3 && (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block select-none">Submit Inspection Details</span>
                        {!selectedClaim.inspectionSubmitted ? (
                          <div className="flex flex-col gap-3">
                            <textarea
                              rows={4}
                              value={inspectionReportText}
                              onChange={(e) => setInspectionReportText(e.target.value)}
                              placeholder="Describe structural frame damage, mechanical engine issues, tire statuses, or repair estimations..."
                              className="w-full p-4 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2d4a] resize-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleSubmitInspectionReport(selectedClaim.claimNumber)}
                              disabled={isSubmittingReport || !inspectionReportText.trim()}
                              className="bg-[#0f2d4a] hover:bg-[#1a3d5e] text-white font-extrabold text-xs py-2.5 px-6 rounded-xl cursor-pointer self-end disabled:opacity-50 select-none shadow-sm active:scale-95 transition-all"
                            >
                              {isSubmittingReport ? "Submitting..." : "Submit Inspection Report"}
                            </button>
                          </div>
                        ) : (
                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between shadow-inner">
                            <span className="text-emerald-700 text-xs font-bold select-none">Inspection report submitted successfully. Waiting for staff evaluation.</span>
                          </div>
                        )}
                      </div>
                    )}

                    {(selectedClaim.currentStep === 4 || selectedClaim.currentStep === 5) && (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block select-none">Assessment & Approval</span>
                        <div className="flex flex-col gap-3.5">
                          <p className="text-slate-550 text-xs font-semibold leading-relaxed">
                            Input the evaluated damage assessment amount below and confirm approval to proceed to the payment step.
                          </p>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider select-none">Assessment Amount (LKR) :</label>
                            <input
                              type="number"
                              value={assessmentAmount}
                              onChange={(e) => setAssessmentAmount(e.target.value)}
                              placeholder="E.g. 75000"
                              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-xs font-bold focus:outline-none max-w-[200px]"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleApproveAssessment(selectedClaim.claimNumber)}
                            disabled={updatingClaim || !assessmentAmount.trim()}
                            className="bg-[#0f2d4a] hover:bg-[#1a3d5e] text-white font-extrabold text-xs py-2.5 px-6 rounded-xl cursor-pointer self-start disabled:opacity-50 select-none shadow-sm active:scale-95 transition-all"
                          >
                            Confirm Assessment Approval
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedClaim.currentStep === 6 && (
                      <div className="space-y-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2 select-none leading-relaxed">
                          <h3 className="text-xs font-black text-slate-800 border-b pb-1.5 uppercase tracking-wide">
                            Payment Details
                          </h3>
                          <div className="grid grid-cols-2 gap-y-2 text-xs font-semibold text-slate-700">
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide block">Bank Name</span>
                              <span className="text-slate-900 font-extrabold block mt-0.5">{selectedClaim.bankName || "-"}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide block">Branch Name</span>
                              <span className="text-slate-900 font-extrabold block mt-0.5">{selectedClaim.bankBranch || "-"}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide block">Account Number</span>
                              <span className="text-slate-900 font-extrabold block mt-0.5">{selectedClaim.bankAccount || "-"}</span>
                            </div>
                          </div>
                        </div>

                        {selectedClaim.paymentReceipt && (
                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center justify-between select-none">
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Bank Transfer Completed
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
                        )}
                      </div>
                    )}
                  </div>
                )}
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
                      <span className="text-slate-700 font-black truncate">: {selectedClaim.assignedAgent || "-"}</span>
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
                        <span className="text-slate-700 font-black truncate">: {claimDateString(selectedClaim.incidentDate)} @ {selectedClaim.incidentTime}</span>
                      </div>
                      <div className="grid grid-cols-[110px_1fr] gap-2">
                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Est. Amount</span>
                        <span className="text-slate-700 font-black truncate">: {selectedClaim.amount ? `LKR ${selectedClaim.amount.toLocaleString()}` : "Not Assessed"}</span>
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
                      <span className="text-red-500 font-bold uppercase tracking-wider text-[10px]">Rejection / Rejection reason</span>
                      <span className="text-red-650 font-extrabold mt-1 text-sm">
                        {selectedClaim.rejectionReason}
                      </span>
                    </div>
                  )}
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

              </div>

              {/* Action Buttons: Accept / Reject */}
              {selectedClaim.status.toLowerCase() === "pending" && (
                <div className="flex items-center gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => handleAcceptClaim(selectedClaim.claimNumber)}
                    disabled={isAcceptingClaim}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-3.5 rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all disabled:opacity-50 border-none"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeclineClaim(selectedClaim.claimNumber)}
                    disabled={isAcceptingClaim}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black text-sm py-3.5 rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all disabled:opacity-50 border-none"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject
                  </button>
                </div>
              )}

              {/* Status Banner for Accepted (In Progress / Approved) Claims */}
              {(selectedClaim.status.toLowerCase() === "in progress" || selectedClaim.status.toLowerCase() === "approved") && (
                <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mt-6 text-center select-none animate-fade-in">
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

              {/* Status Banner for Rejected Claims */}
              {selectedClaim.status.toLowerCase() === "rejected" && (
                <div className="w-full bg-red-50 border border-red-200 rounded-2xl p-4 mt-6 flex flex-col items-center text-center select-none gap-3 animate-fade-in">
                  <p className="text-red-800 text-xs md:text-sm font-black flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Claim Assignment Declined
                  </p>
                  <p className="text-red-650 text-xs font-semibold leading-relaxed">
                    This claim dossier assignment has been rejected. If this was a mistake or you need to re-verify details, please contact branch support.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClaim(null);
                      router.push("/Agent/Contact");
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white font-black text-xs py-2.5 px-6 rounded-xl cursor-pointer shadow-sm active:scale-95 transition-all text-center border-none"
                  >
                    Contact Branch Support
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* Preview Image Modal Overlay */}
      {previewImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl p-2 overflow-hidden shadow-2xl flex flex-col items-center">
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
