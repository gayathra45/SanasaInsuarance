"use client";

import React, { useState, useEffect, useRef } from "react";
import Navbar from "@/app/Components/Agent/Navbar";
import Footer from "@/app/Components/Agent/Footer";
import Link from "next/link";
import { API_URL } from "@/app/config";

interface AdditionalDoc {
  name: string;
  url: string;
  uploadedAt: string;
  uploadedBy?: string;
  _id?: string;
}

interface ClaimMessage {
  sender: string;
  message: string;
  sentAt: string;
  recipient?: string;
}

interface Claim {
  claimNumber: string;
  vehiclePlate: string;
  incidentDate: string;
  damageType: string;
  status: string;
  createdAt: string;
  documentsRequested: boolean;
  requestedDocuments: string[];
  documentRequestTo?: string;
  messages?: ClaimMessage[];
  accidentPhotos?: {
    front?: string[];
    rear?: string[];
    side?: string[];
  };
  drivingLicense?: {
    front?: string[];
    rear?: string[];
  };
  additionalDocuments?: AdditionalDoc[];
}

export default function AgentDocuments() {
  const [agent, setAgent] = useState<any>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTargetClaim, setUploadTargetClaim] = useState<Claim | null>(null);
  const [uploadFiles, setUploadFiles] = useState<{ [docName: string]: { file: File | null; preview: string } }>({});
  const [isUploading, setIsUploading] = useState(false);

  // View Document Modal State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewModalTitle, setViewModalTitle] = useState("");
  const [viewModalFiles, setViewModalFiles] = useState<string[]>([]);
  const [viewCurrentIndex, setViewCurrentIndex] = useState(0);

  // Uploaded Documents List Modal State
  const [uploadedListModalOpen, setUploadedListModalOpen] = useState(false);
  const [uploadedListTargetClaim, setUploadedListTargetClaim] = useState<any>(null);

  // Success Confirmation screen in Modal
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // References for inputs
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

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

  const getAgentPendingRequests = (claim: Claim): string[] => {
    if (!claim.requestedDocuments) return [];
    return claim.requestedDocuments.filter(name => {
      const isUploaded = (claim.additionalDocuments || []).some(
        doc => doc.name.trim().toLowerCase() === name.trim().toLowerCase() && doc.uploadedBy === "Agent"
      );
      if (isUploaded) return false;
      return getRecipientForDoc(claim, name) === "Agent";
    });
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const agentStr = sessionStorage.getItem("logged_in_agent");
      if (agentStr) {
        try {
          const a = JSON.parse(agentStr);
          setAgent(a);
          if (a.email) {
            fetchClaims(a.email);
          } else {
            setIsLoading(false);
          }
        } catch (err) {
          console.error("Error parsing logged_in_agent context", err);
          window.location.href = "/Login";
        }
      } else {
        window.location.href = "/Login";
      }
    }
  }, []);

  useEffect(() => {
    if (uploadModalOpen || uploadedListModalOpen || viewModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [uploadModalOpen, uploadedListModalOpen, viewModalOpen]);

  const fetchClaims = async (email: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/agent/claims?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setClaims(data);
      }
    } catch (err) {
      console.error("Error loading agent documents", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch (e) {
      return dateStr;
    }
  };

  const handleOpenUpload = (claim: Claim) => {
    setUploadTargetClaim(claim);
    const initialFiles: { [docName: string]: { file: File | null; preview: string } } = {};
    const agentDocs = getAgentPendingRequests(claim);
    const docs = agentDocs.length > 0 ? agentDocs : ["Police Report", "Repair Estimate"];
    
    docs.forEach(docName => {
      initialFiles[docName] = { file: null, preview: "" };
    });

    setUploadFiles(initialFiles);
    setUploadSuccess(false);
    setUploadModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, docName: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
      
      if (file.size > MAX_SIZE) {
        alert(`File exceeds the 5MB size limit.`);
        return;
      }

      const preview = URL.createObjectURL(file);
      setUploadFiles(prev => ({
        ...prev,
        [docName]: { file, preview }
      }));
    }
  };

  const handleRemoveFile = (docName: string) => {
    setUploadFiles(prev => {
      const current = prev[docName];
      if (current && current.preview) {
        URL.revokeObjectURL(current.preview);
      }
      return {
        ...prev,
        [docName]: { file: null, preview: "" }
      };
    });
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTargetClaim) return;

    const selectedFiles = Object.entries(uploadFiles).filter(([_, val]) => val.file !== null);
    if (selectedFiles.length === 0) {
      alert("Please select at least one document to upload.");
      return;
    }

    setIsUploading(true);

    const convertToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
    };

    try {
      const uploadedDocumentsPayload = await Promise.all(
        selectedFiles.map(async ([docName, val]) => {
          const base64 = await convertToBase64(val.file!);
          return {
            documentName: docName,
            fileData: base64,
            uploadedBy: "Agent"
          };
        })
      );

      const res = await fetch(`${API_URL}/update-claim/${uploadTargetClaim.claimNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadedDocuments: uploadedDocumentsPayload, uploadedBy: "Agent" })
      });

      if (res.ok) {
        setUploadSuccess(true);
        Object.values(uploadFiles).forEach(val => {
          if (val.preview) URL.revokeObjectURL(val.preview);
        });
        if (agent && agent.email) {
          fetchClaims(agent.email);
        }
      } else {
        const data = await res.json();
        alert(data.error || "Failed to upload requested documents.");
      }
    } catch (err) {
      console.error("Document upload failed", err);
      alert("An error occurred. Check your connection and try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenView = (title: string, urls: string[] | undefined) => {
    if (!urls || urls.length === 0) return;
    setViewModalTitle(title);
    setViewModalFiles(urls);
    setViewCurrentIndex(0);
    setViewModalOpen(true);
  };

  // Compile Agent's Requested Documents List
  const requestedDocsList = claims.filter(c => {
    const s = c.status || "";
    return s !== "Approved" && s !== "Rejected" && c.documentsRequested && getAgentPendingRequests(c).length > 0;
  });

  // Compile Grouped Uploaded Documents by Claim ID for display
  const groupedClaimsList = claims.map(claim => {
    const docs: { name: string; files: string[] }[] = [];

    // 1. Driving License
    const licFront = claim.drivingLicense?.front || [];
    const licRear = claim.drivingLicense?.rear || [];
    const allLicPhotos = [...licFront, ...licRear].filter(Boolean);
    if (allLicPhotos.length > 0) {
      docs.push({
        name: "Driving License",
        files: allLicPhotos
      });
    }

    // 2. Accident Photos
    const frontPhotos = claim.accidentPhotos?.front || [];
    const rearPhotos = claim.accidentPhotos?.rear || [];
    const sidePhotos = claim.accidentPhotos?.side || [];
    const allAccidentPhotos = [...frontPhotos, ...rearPhotos, ...sidePhotos].filter(Boolean);
    if (allAccidentPhotos.length > 0) {
      docs.push({
        name: "Rear , Front , Side Photos",
        files: allAccidentPhotos
      });
    }

    // 3. Additional Documents
    if (claim.additionalDocuments && claim.additionalDocuments.length > 0) {
      claim.additionalDocuments.forEach(doc => {
        if (doc.url) {
          docs.push({
            name: `${doc.name} (${doc.uploadedBy || "Policy Holder"})`,
            files: [doc.url]
          });
        }
      });
    }

    const allFiles = docs.flatMap(d => d.files);

    return {
      claimNumber: claim.claimNumber,
      date: formatDateString(claim.createdAt),
      docs,
      allFiles
    };
  }).filter(c => c.docs.length > 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      <Navbar />

      {/* Styled curved header matching mockup */}
      <div className="max-w-7xl w-full mx-auto px-6 md:px-16 mt-8 relative">
        <div className="absolute top-0 bottom-0 left-[calc(50%-50vw)] right-6 md:right-12 bg-[url('/newclaim1.webp')] bg-cover bg-center rounded-r-[75px] md:rounded-r-[95px] overflow-hidden shadow-md">
          {/* Mockup dark slate overlay */}
          <div className="absolute inset-0 bg-slate-900/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-transparent" />
        </div>

        {/* Text content */}
        <header className="relative z-10 h-[210px] flex flex-col justify-center pl-4 md:pl-8 select-none">
          <h1 className="text-white text-3xl md:text-[40px] font-bold tracking-tight leading-none">
            Document Repository
          </h1>
          <p className="text-slate-200 text-xs md:text-sm font-semibold mt-3.5 tracking-wide opacity-95">
            View verified claim documents and submit requested agent specifications
          </p>
        </header>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-16 py-10 relative z-20">
        
        {/* Section 1: Requested Documents */}
        <section className="mb-14">
          <div className="flex items-center gap-2.5 mb-6 select-none">
            <h2 className="text-xl md:text-[24px] font-black text-slate-800 tracking-tight">
              Action Required – Requested Documents
            </h2>
            <span className="font-extrabold text-xl text-slate-800">&gt;</span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 shadow-sm min-h-[140px]">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
              <span className="mt-3 text-slate-400 text-sm font-bold">Checking requested documents...</span>
            </div>
          ) : requestedDocsList.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-10 text-center shadow-sm select-none">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-500">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              </div>
              <p className="text-slate-500 font-extrabold text-[15px]">No Pending Agent Requests</p>
              <p className="text-slate-400 text-xs font-semibold mt-1">All requested documents from your end are verified and up to date.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {requestedDocsList.map((claim) => (
                <div 
                  key={claim.claimNumber}
                  className="bg-red-50/15 border border-red-200 rounded-[28px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex items-start gap-4">
                    {/* Siren Alarm Icon Container */}
                    <div className="p-3 bg-red-100/70 text-red-600 rounded-2xl flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0M3.124 7.5A8.969 8.969 0 015.292 3m13.416 0a8.969 8.969 0 012.168 4.5" />
                      </svg>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-red-600 font-extrabold text-base leading-none">
                        Document Upload Required
                      </h3>
                      <p className="text-slate-600 text-sm font-semibold mt-2.5 leading-relaxed">
                        Office staff has requested <span className="text-slate-800 font-extrabold">{getAgentPendingRequests(claim).join(" & ")}</span> for claim <span className="text-slate-800 font-extrabold">{claim.claimNumber}</span> (Plate: {claim.vehiclePlate}).
                      </p>
                      <p className="text-slate-400 text-xs font-bold mt-2">
                        * Please upload the requested specifications to proceed.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between self-stretch md:self-auto gap-4">
                    <button
                      onClick={() => handleOpenUpload(claim)}
                      className="bg-red-500 hover:bg-red-600 text-white font-extrabold text-[14px] px-8 py-2.5 rounded-full transition-all duration-150 shadow-[0_4px_15px_rgba(220,38,38,0.25)] hover:scale-[1.03] active:scale-[0.98] w-full md:w-auto text-center cursor-pointer border-none"
                    >
                      Upload
                    </button>
                    <span className="text-slate-400 text-[11px] font-bold self-end select-none">
                      {formatDateString(claim.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Uploaded Documents */}
        <section>
          <div className="flex items-center gap-2.5 mb-6 select-none">
            <h2 className="text-xl md:text-[24px] font-black text-slate-800 tracking-tight">
              Claim Documents List
            </h2>
            <span className="font-extrabold text-xl text-slate-800">&gt;</span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[90px] bg-slate-100/70 border border-slate-200 animate-pulse rounded-3xl" />
              ))}
            </div>
          ) : groupedClaimsList.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-sm select-none">
              <p className="text-slate-400 font-bold text-sm">No documents found for your assigned claims.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {groupedClaimsList.map((claim, idx) => (
                <div 
                  key={idx}
                  className="bg-white border border-[#0891b2]/20 rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-row items-center justify-between gap-6"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* File Icon Container */}
                    <div className="w-10 h-10 rounded-full bg-cyan-50 border border-cyan-300 text-cyan-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-cyan-800 font-extrabold text-base leading-none select-none truncate">
                        {claim.claimNumber}
                      </h4>
                      <div className="text-slate-400 text-xs font-semibold mt-2.5 flex flex-col gap-1 leading-tight select-none">
                        {claim.docs.map((doc, dIdx) => (
                          <span key={dIdx}>{doc.name}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 flex-shrink-0">
                    <span className="hidden sm:inline text-slate-400 text-[13px] font-semibold select-none">
                      {claim.date}
                    </span>
                    <button
                      onClick={() => {
                        setUploadedListTargetClaim(claim);
                        setUploadedListModalOpen(true);
                      }}
                      className="border border-[#0891b2] text-[#0891b2] hover:bg-[#0891b2] hover:text-white font-extrabold text-xs px-6 py-2.5 rounded-full transition-all duration-150 cursor-pointer bg-white"
                    >
                      View Documents
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* UPLOAD DOCUMENT DIALOG MODAL */}
      {uploadModalOpen && uploadTargetClaim && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-[32px] md:rounded-[40px] w-full max-w-[760px] p-10 md:p-14 shadow-[0_20px_50px_rgba(0,0,0,0.12)] flex flex-col relative animate-fade-in max-h-[90vh] overflow-y-auto">

            {!uploadSuccess ? (
              <form onSubmit={handleUploadSubmit} className="flex flex-col">
                <div className="select-none text-left">
                  <h2 className="text-[26px] font-bold text-slate-950 tracking-tight leading-tight">
                    Claim {uploadTargetClaim.claimNumber}
                  </h2>
                  <p className="text-slate-400 text-[14px] font-semibold mt-1">
                    Upload specifications requested by office staff
                  </p>
                </div>

                <hr className="border-t border-slate-200 mt-5 mb-5" />

                <div className="flex flex-col gap-4.5 mt-2">
                  {Object.entries(uploadFiles).map(([docName, val]) => (
                    <div 
                      key={docName} 
                      className="w-full border border-slate-300 rounded-full py-4 px-8 flex items-center justify-between min-h-[62px] bg-white transition-all"
                    >
                      <span className="text-slate-800 text-[16px] font-bold select-none">
                        {docName}
                      </span>

                      <div className="flex items-center gap-3">
                        {val.file === null ? (
                          <span
                            onClick={() => fileInputRefs.current[docName]?.click()}
                            className="text-[#0891b2] hover:text-[#06738f] font-extrabold text-[15px] cursor-pointer hover:underline select-none"
                          >
                            Upload
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span 
                              className="text-emerald-600 font-bold text-sm truncate max-w-[200px]"
                              title={val.file.name}
                            >
                              ✓ {val.file.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(docName)}
                              className="text-red-500 hover:text-red-600 cursor-pointer bg-transparent border-none p-1 transition-colors flex items-center justify-center"
                              title="Remove file"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Hidden File Input */}
                      <input
                        type="file"
                        ref={el => { fileInputRefs.current[docName] = el; }}
                        onChange={(e) => handleFileChange(e, docName)}
                        accept="image/*,application/pdf"
                        className="hidden"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex flex-row justify-between items-center mt-10">
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(false)}
                    className="bg-[#0f2d3a] hover:bg-[#0b222c] active:scale-[0.97] text-white font-bold text-sm px-14 py-3.5 rounded-full transition-all duration-150 cursor-pointer border-none min-w-[140px] text-center"
                  >
                    &lt; Close
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="bg-[#0f2d3a] hover:bg-[#0b222c] disabled:bg-slate-400 active:scale-[0.97] text-white font-bold text-sm px-14 py-3.5 rounded-full transition-all duration-150 cursor-pointer border-none flex items-center justify-center gap-2 min-w-[140px] text-center"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        <span>Submitting Documents...</span>
                      </>
                    ) : (
                      <span>Submit Documents &gt;</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Upload Complete Success View */
              <div className="flex flex-col items-center select-none text-center py-6 animate-fade-in">
                {/* Green Checkmark Circle */}
                <div className="w-16 h-16 bg-[#00b050] rounded-full flex items-center justify-center shadow-md select-none">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="4.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>

                <h3 className="text-[22px] font-black text-[#0f2d3a] mt-5 leading-none">
                  Documents Submitted!
                </h3>
                <p className="text-slate-600 text-[14px] font-semibold mt-2.5 max-w-[325px] leading-relaxed mx-auto">
                  Your files have been uploaded successfully. Office staff will verify them shortly.
                </p>

                <button
                  onClick={() => setUploadModalOpen(false)}
                  className="mt-8 bg-[#0f2d3a] hover:bg-[#0b222c] active:scale-[0.97] text-white font-extrabold text-[14px] px-10 py-3.5 rounded-full transition-all duration-150 shadow-md border-none cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* UPLOADED DOCUMENTS LIST DIALOG MODAL */}
      {uploadedListModalOpen && uploadedListTargetClaim && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-[32px] md:rounded-[40px] w-full max-w-[760px] p-10 md:p-14 shadow-[0_20px_50px_rgba(0,0,0,0.12)] flex flex-col relative animate-fade-in max-h-[90vh] overflow-y-auto">

            <div className="select-none text-left">
              <h2 className="text-[26px] font-bold text-slate-950 tracking-tight leading-tight">
                Claim {uploadedListTargetClaim.claimNumber}
              </h2>
              <p className="text-slate-400 text-[14px] font-semibold mt-1">
                Document Repository List
              </p>
            </div>

            <hr className="border-t border-slate-200 mt-5 mb-5" />

            <div className="flex flex-col gap-4.5 mt-2">
              {uploadedListTargetClaim.docs.map((doc: any, dIdx: number) => (
                <div 
                  key={dIdx} 
                  className="w-full border border-slate-300 rounded-full py-4 px-8 flex items-center justify-between min-h-[62px] bg-white transition-all"
                >
                  <span className="text-slate-800 text-[16px] font-bold select-none truncate max-w-[70%]">
                    {doc.name}
                  </span>

                  <span
                    onClick={() => handleOpenView(`${doc.name} – ${uploadedListTargetClaim.claimNumber}`, doc.files)}
                    className="text-[#0891b2] hover:text-[#06738f] font-extrabold text-[15px] cursor-pointer hover:underline select-none"
                  >
                    View File
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-row justify-start items-center mt-10">
              <button
                type="button"
                onClick={() => setUploadedListModalOpen(false)}
                className="bg-[#0f2d3a] hover:bg-[#0b222c] active:scale-[0.97] text-white font-bold text-sm px-14 py-3.5 rounded-full transition-all duration-150 cursor-pointer border-none min-w-[140px] text-center"
              >
                &lt; Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* VIEW DOCUMENT VIEWER MODAL */}
      {viewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-[32px] md:rounded-[40px] w-full max-w-[760px] p-10 md:p-14 shadow-[0_20px_50px_rgba(0,0,0,0.12)] flex flex-col relative animate-fade-in max-h-[90vh] overflow-y-auto">

            {/* Header */}
            {(() => {
              const [docName, claimNumber] = viewModalTitle.includes(" – ") 
                ? viewModalTitle.split(" – ") 
                : [viewModalTitle, ""];
              return (
                <div className="select-none text-left">
                  <h2 className="text-[26px] font-bold text-slate-950 tracking-tight leading-tight">
                    {docName}
                  </h2>
                  <p className="text-slate-400 text-[14px] font-semibold mt-1">
                    {claimNumber ? `Claim ${claimNumber}` : ""}
                  </p>
                </div>
              );
            })()}

            <hr className="border-t border-slate-200 mt-5 mb-5" />

            {/* Viewer Content Frame inside a rounded border container */}
            <div className="relative border border-slate-300 rounded-[28px] p-4 flex items-center justify-center bg-slate-50 min-h-[360px] max-h-[50vh] overflow-hidden select-none">
              {viewModalFiles[viewCurrentIndex]?.startsWith("data:application/pdf") || viewModalFiles[viewCurrentIndex]?.includes(".pdf") ? (
                <iframe
                  src={viewModalFiles[viewCurrentIndex]}
                  className="w-full h-[400px] border-none rounded-[20px]"
                  title="PDF Document"
                />
              ) : (
                <img
                  src={viewModalFiles[viewCurrentIndex]}
                  alt="document display"
                  className="max-w-full max-h-[360px] object-contain rounded-[20px]"
                />
              )}

              {/* Slider Prev Navigation Arrow */}
              {viewModalFiles.length > 1 && viewCurrentIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setViewCurrentIndex(prev => prev - 1)}
                  className="absolute left-4 w-10 h-10 bg-black/50 hover:bg-black/75 text-white rounded-full flex items-center justify-center transition-all cursor-pointer border-none shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
              )}

              {/* Slider Next Navigation Arrow */}
              {viewModalFiles.length > 1 && viewCurrentIndex < viewModalFiles.length - 1 && (
                <button
                  type="button"
                  onClick={() => setViewCurrentIndex(prev => prev + 1)}
                  className="absolute right-4 w-10 h-10 bg-black/50 hover:bg-black/75 text-white rounded-full flex items-center justify-center transition-all cursor-pointer border-none shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              )}

              {/* Page count indicator overlay */}
              {viewModalFiles.length > 1 && (
                <span className="absolute bottom-4 right-4 text-xs font-bold bg-black/60 text-white px-3 py-1 rounded-full">
                  {viewCurrentIndex + 1} / {viewModalFiles.length}
                </span>
              )}
            </div>

            {/* Bottom Button Panel */}
            <div className="flex flex-row justify-between items-center mt-10">
              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                className="bg-[#0f2d3a] hover:bg-[#0b222c] active:scale-[0.97] text-white font-bold text-sm px-14 py-3.5 rounded-full transition-all duration-150 cursor-pointer border-none min-w-[140px] text-center"
              >
                &lt; Close
              </button>
            </div>

          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
