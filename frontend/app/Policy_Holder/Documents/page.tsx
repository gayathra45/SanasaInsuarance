"use client";

import React, { useState, useEffect, useRef } from "react";
import PolicyHolderNavbar from "@/app/Components/Policy_Holder/Navbar";
import PolicyHolderFooter from "@/app/Components/Policy_Holder/footer";
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

export default function PolicyHolderDocuments() {
  const [user, setUser] = useState<any>(null);
  const [claims, setClaims] = useState<Claim[]>([]);

  const getUserRequestedDocs = (claim: Claim): string[] => {
    const getRecipientForDoc = (name: string) => {
      const msg = [...(claim.messages || [])]
        .reverse()
        .find(m => m.message.includes(`Requested: ${name}`));
      if (msg) {
        if (msg.message.includes("[Document Request to Agent]")) return "Agent";
        if (msg.message.includes("[Document Request to User]")) return "User";
      }
      return claim.documentRequestTo || "User";
    };
    return (claim.requestedDocuments || []).filter(name => getRecipientForDoc(name) === "User");
  };

  const getDocRequestNote = (claim: Claim, docName: string): string => {
    if (!claim.messages) return "";
    const msg = [...claim.messages]
      .reverse()
      .find(m => m.message && m.message.includes(`Requested: ${docName}`));
    if (msg && msg.message) {
      const idx = msg.message.indexOf("Message:");
      if (idx !== -1) {
        return msg.message.substring(idx + 8).trim();
      }
    }
    return "";
  };
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
  const [viewUploadedAt, setViewUploadedAt] = useState("");
  const [viewUploadedBy, setViewUploadedBy] = useState("");

  // Uploaded Documents List Modal State
  const [uploadedListModalOpen, setUploadedListModalOpen] = useState(false);
  const [uploadedListTargetClaim, setUploadedListTargetClaim] = useState<any>(null);

  // Success Confirmation screen in Modal
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // References for inputs
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = sessionStorage.getItem("logged_in_user");
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          setUser(u);
          fetchClaims(u.nic);
        } catch (err) {
          console.error("Error parsing logged_in_user context", err);
          window.location.href = "/Login";
        }
      } else {
        window.location.href = "/Login";
      }
    }
  }, []);

  useEffect(() => {
    if (claims.length > 0 && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const uploadClaimNum = params.get("uploadClaim");
      if (uploadClaimNum) {
        const found = claims.find(c => c.claimNumber === uploadClaimNum);
        if (found) {
          handleOpenUpload(found);
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      }
    }
  }, [claims]);

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

  const fetchClaims = async (nic: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/policy-holder/user-claims?nic=${encodeURIComponent(nic)}&includeDocs=true&_=${Date.now()}`, {
        cache: "no-store"
      });
      let databaseClaims: Claim[] = [];
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.claims)) {
          databaseClaims = data.claims;
        }
      }

      // Check local session for recently submitted claims
      let localClaims: Claim[] = [];
      const lastSubmitted = sessionStorage.getItem("last_submitted_claim");
      if (lastSubmitted) {
        try {
          const parsed = JSON.parse(lastSubmitted);
          const exists = databaseClaims.some(c => c.claimNumber === parsed.claimNumber);
          if (!exists) {
            localClaims.push(parsed);
          }
        } catch (err) {
          console.error("Error parsing local claim context", err);
        }
      }

      setClaims([...localClaims, ...databaseClaims]);
    } catch (err) {
      console.error("Error loading user documents", err);
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

  const formatDateTimeString = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()} ${hours}:${minutes}`;
    } catch (e) {
      return dateStr;
    }
  };

  const getDocRequestTime = (claim: Claim, docName: string): string => {
    if (!claim.messages) return "";
    const msg = [...claim.messages]
      .reverse()
      .find(m => m.message && m.message.includes(`Requested: ${docName}`));
    if (msg && msg.sentAt) {
      return formatDateTimeString(msg.sentAt);
    }
    return "";
  };

  const getDocRequestSender = (claim: Claim, docName: string): string => {
    if (!claim.messages) return "Office Staff";
    const msg = [...claim.messages]
      .reverse()
      .find(m => m.message && m.message.includes(`Requested: ${docName}`));
    return msg ? (msg.sender || "Office Staff") : "Office Staff";
  };

  const handleOpenUpload = (claim: Claim) => {
    setUploadTargetClaim(claim);
    // Initialize file selection state
    const initialFiles: { [docName: string]: { file: File | null; preview: string } } = {};
    const userDocs = getUserRequestedDocs(claim);
    const docs = userDocs.length > 0 ? userDocs : ["Police Report", "Repair Estimate"];
    
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

    // Check if at least one file is selected
    const selectedFiles = Object.entries(uploadFiles).filter(([_, val]) => val.file !== null);
    if (selectedFiles.length === 0) {
      alert("Please select at least one document to upload.");
      return;
    }

    setIsUploading(true);

    // Convert selected files to base64
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
            fileData: base64
          };
        })
      );

      const res = await fetch(`${API_URL}/policy-holder/update-claim/${uploadTargetClaim.claimNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadedDocuments: uploadedDocumentsPayload })
      });

      if (res.ok) {
        setUploadSuccess(true);
        // Revoke previews to save memory
        Object.values(uploadFiles).forEach(val => {
          if (val.preview) URL.revokeObjectURL(val.preview);
        });
        // Refresh claim data
        if (user && user.nic) {
          fetchClaims(user.nic);
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

  const handleOpenView = (
    title: string,
    urls: string[] | undefined,
    uploadedAt?: string,
    uploadedBy?: string
  ) => {
    if (!urls || urls.length === 0) return;
    setViewModalTitle(title);
    setViewModalFiles(urls);
    setViewCurrentIndex(0);
    setViewUploadedAt(uploadedAt || "");
    setViewUploadedBy(uploadedBy || "");
    setViewModalOpen(true);
  };

  // Compile Requested Documents List
  const requestedDocsList = claims.filter(c => c.documentsRequested && getUserRequestedDocs(c).length > 0);

  // Compile Grouped Uploaded Documents by Claim ID
  const groupedClaimsList = claims.map(claim => {
    const docs: { name: string; files: string[]; uploadedAt: string; uploadedBy: string }[] = [];

    // 1. Driving License
    const licFront = claim.drivingLicense?.front || [];
    const licRear = claim.drivingLicense?.rear || [];
    const allLicPhotos = [...licFront, ...licRear].filter(Boolean);
    if (allLicPhotos.length > 0) {
      docs.push({
        name: "Driving License",
        files: allLicPhotos,
        uploadedAt: claim.createdAt,
        uploadedBy: "Policy Holder"
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
        files: allAccidentPhotos,
        uploadedAt: claim.createdAt,
        uploadedBy: "Policy Holder"
      });
    }

    // 3. Additional Documents (Police Report, Repair Estimate, etc. - only show User uploaded ones)
    if (claim.additionalDocuments && claim.additionalDocuments.length > 0) {
      claim.additionalDocuments.forEach(doc => {
        if (doc.url && doc.uploadedBy !== "Agent") {
          docs.push({
            name: doc.name,
            files: [doc.url],
            uploadedAt: doc.uploadedAt || claim.createdAt,
            uploadedBy: doc.uploadedBy || "Policy Holder"
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
      <PolicyHolderNavbar />

      {/* Styled curved header matching mockup exactly */}
      <div className="max-w-7xl w-full mx-auto px-6 md:px-16 mt-8 relative">
        <div className="absolute top-0 bottom-0 left-[calc(50%-50vw)] right-6 md:right-12 bg-[url('/policy1.jpg')] bg-cover bg-center rounded-r-[75px] md:rounded-r-[95px] overflow-hidden shadow-md">
          {/* Mockup dark slate overlay */}
          <div className="absolute inset-0 bg-slate-900/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d2a3a]/90 via-[#0d2a3a]/75 to-transparent" />
        </div>

        {/* Text content aligned automatically with the page container */}
        <header className="relative z-10 h-[210px] flex flex-col justify-center pl-4 md:pl-8 select-none">
          <h1 className="text-white text-3xl md:text-[40px] font-bold tracking-tight leading-none">
            My Documents
          </h1>
          <p className="text-slate-200 text-xs md:text-sm font-semibold mt-3.5 tracking-wide opacity-95">
            Requested documents and uploads
          </p>
        </header>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-16 py-10 relative z-20">
        
        {/* Section 1: Requested Documents */}
        <section className="mb-14">
          <div className="flex items-center gap-2.5 mb-6 select-none">
            <h2 className="text-xl md:text-[24px] font-black text-slate-800 tracking-tight">
              Requested Documents
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
              <p className="text-slate-500 font-extrabold text-[15px]">No Pending Document Requests</p>
              <p className="text-slate-400 text-xs font-semibold mt-1">All your claim documents are verified and up to date.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {requestedDocsList.map((claim) => (
                <div 
                  key={claim.claimNumber}
                  className="bg-red-50/15 border-2 border-red-100 rounded-[28px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex items-start gap-4">
                    {/* Siren Alarm Icon Container */}
                    <div className="p-3 bg-red-100/70 text-red-600 rounded-2xl flex-shrink-0 animate-pulse">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0M3.124 7.5A8.969 8.969 0 015.292 3m13.416 0a8.969 8.969 0 012.168 4.5" />
                      </svg>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-red-600 font-extrabold text-base leading-none">
                        Documents Requested – Action Required
                      </h3>
                      <p className="text-slate-600 text-sm font-semibold mt-2.5 leading-relaxed">
                        Staff has requested the following document(s) for <span className="text-slate-800 font-extrabold">{claim.claimNumber}</span>:
                      </p>
                      <div className="mt-2.5 space-y-3 pl-2.5 border-l-2 border-slate-200">
                        {getUserRequestedDocs(claim).map((docName, idx) => {
                          const note = getDocRequestNote(claim, docName);
                          const reqTime = getDocRequestTime(claim, docName);
                          return (
                            <div key={idx} className="text-slate-600 text-xs font-semibold leading-relaxed grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-x-2 gap-y-0.5 items-baseline">
                              <span className="text-slate-800 font-extrabold">• {docName}</span>
                              {reqTime && (
                                <span className="text-red-500 font-bold">
                                  (Requested: {reqTime} by {getDocRequestSender(claim, docName)})
                                </span>
                              )}
                              {note && (
                                <span className="col-span-1 sm:col-span-2 block text-slate-500 pl-3 font-medium italic mt-0.5">
                                  Note: "{note}"
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-slate-400 text-xs font-bold mt-3">
                        Please upload within 3 days...
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between self-stretch md:self-auto gap-4">
                    <button
                      onClick={() => handleOpenUpload(claim)}
                      className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-[14px] px-8 py-2.5 rounded-full transition-all duration-150 shadow-[0_4px_15px_rgba(220,38,38,0.25)] hover:scale-[1.03] active:scale-[0.98] w-full md:w-auto text-center cursor-pointer border-none"
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
              Uploaded Documents
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
              <p className="text-slate-400 font-bold text-sm">You have not uploaded any claim files yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {groupedClaimsList.map((claim, idx) => (
                <div 
                  key={idx}
                  className="bg-white border border-emerald-500/20 rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-row items-center justify-between gap-6"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Checkmark Icon Container */}
                    <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-emerald-700 font-extrabold text-base leading-none select-none truncate">
                        {claim.claimNumber}
                      </h4>
                      <div className="text-slate-400 text-xs font-semibold mt-2.5 flex flex-col gap-2.5 leading-tight select-none w-full">
                        {claim.docs.map((doc, dIdx) => (
                          <div key={dIdx} className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-x-2 gap-y-0.5 items-baseline">
                            <span className="text-slate-750 font-bold">{doc.name}</span>
                            {doc.uploadedAt && (
                              <span className="text-[10px] text-slate-400 font-semibold">
                                (Uploaded: {formatDateTimeString(doc.uploadedAt)})
                              </span>
                            )}
                          </div>
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
                      className="border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white font-extrabold text-xs px-6 py-2.5 rounded-full transition-all duration-150 cursor-pointer bg-white"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Floating Chat Bubble Button */}
      <button
        className="fixed bottom-8 right-8 z-40 bg-[#00ddff] hover:bg-[#00c8e6] text-white p-4.5 rounded-full shadow-2xl transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer focus:outline-none border-none flex items-center justify-center"
        aria-label="Chat support"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2.1 21.5l4.63-.827A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-3.5 11a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3.5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3.5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" clipRule="evenodd" />
        </svg>
      </button>

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
                    Staff has requested a {getUserRequestedDocs(uploadTargetClaim).join(" & ")}
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
                            className="text-red-500 hover:text-red-600 font-extrabold text-[15px] cursor-pointer hover:underline select-none"
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
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>Submit &gt;</span>
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
                  Upload Complete!
                </h3>
                <p className="text-slate-600 text-[14px] font-semibold mt-2.5 max-w-[325px] leading-relaxed mx-auto">
                  Your files have been submitted successfully. Office staff will review them shortly.
                </p>

                <button
                  onClick={() => {
                    setUploadModalOpen(false);
                    setUploadTargetClaim(null);
                    setUploadSuccess(false);
                    if (user && user.nic) {
                      fetchClaims(user.nic);
                    }
                  }}
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
                Uploaded Documents
              </p>
            </div>

            <hr className="border-t border-slate-200 mt-5 mb-5" />

            <div className="flex flex-col gap-4 mt-2">
              {uploadedListTargetClaim.docs.map((doc: any, dIdx: number) => (
                <div 
                  key={dIdx} 
                  className="w-full border border-slate-200 rounded-2xl py-4 px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-h-[62px] bg-white hover:bg-slate-50/30 transition-all shadow-sm"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-slate-800 text-[16px] font-bold select-none truncate max-w-[280px] sm:max-w-[420px]">
                      {doc.name}
                    </span>
                    {doc.uploadedAt && (
                      <span className="text-slate-400 text-xs font-semibold mt-1">
                        Uploaded on: {formatDateTimeString(doc.uploadedAt)}
                      </span>
                    )}
                  </div>

                  <span
                    onClick={() => handleOpenView(`${doc.name} – ${uploadedListTargetClaim.claimNumber}`, doc.files, doc.uploadedAt, doc.uploadedBy)}
                    className="text-red-500 hover:text-red-600 font-extrabold text-[15px] cursor-pointer hover:underline select-none"
                  >
                    View
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
                <div className="select-none text-left flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div>
                    <h2 className="text-[26px] font-bold text-slate-950 tracking-tight leading-tight">
                      {docName}
                    </h2>
                    <p className="text-slate-400 text-[14px] font-semibold mt-1">
                      {claimNumber ? `Claim ${claimNumber}` : ""}
                    </p>
                  </div>
                  {(viewUploadedBy || viewUploadedAt) && (
                    <div className="text-left sm:text-right select-none">
                      {viewUploadedBy && (
                        <p className="text-[#df3d3d] font-black text-xs m-0">
                          Uploaded By: {viewUploadedBy}
                        </p>
                      )}
                      {viewUploadedAt && (
                        <p className="text-slate-400 font-bold text-[11px] mt-0.5 m-0">
                          Uploaded On: {formatDateTimeString(viewUploadedAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            <hr className="border-t border-slate-200 mt-5 mb-5" />

            {/* Viewer Content Frame inside a rounded border container */}
            <div className="relative border border-slate-300 rounded-[28px] p-4 flex items-center justify-center bg-slate-50 min-h-[360px] max-h-[50vh] overflow-hidden select-none">
              {viewModalFiles[viewCurrentIndex]?.startsWith("data:application/pdf") || viewModalFiles[viewCurrentIndex]?.includes(".pdf") ? (
                /* PDF Embed Frame */
                <iframe
                  src={viewModalFiles[viewCurrentIndex]}
                  className="w-full h-[400px] border-none rounded-[20px]"
                  title="PDF Document"
                />
              ) : (
                /* Image View Frame */
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

      <PolicyHolderFooter />
    </div>
  );
}
