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
  _id?: string;
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

  const fetchClaims = async (nic: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/policy-holder/user-claims?nic=${encodeURIComponent(nic)}&includeDocs=true`);
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

  const handleOpenUpload = (claim: Claim) => {
    setUploadTargetClaim(claim);
    // Initialize file selection state
    const initialFiles: { [docName: string]: { file: File | null; preview: string } } = {};
    const docs = claim.requestedDocuments && claim.requestedDocuments.length > 0 
      ? claim.requestedDocuments 
      : ["Police Report", "Repair Estimate"];
    
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

  const handleOpenView = (title: string, urls: string[] | undefined) => {
    if (!urls || urls.length === 0) return;
    setViewModalTitle(title);
    setViewModalFiles(urls);
    setViewCurrentIndex(0);
    setViewModalOpen(true);
  };

  // Compile Requested Documents List
  const requestedDocsList = claims.filter(c => c.documentsRequested);

  // Compile Grouped Uploaded Documents by Claim ID
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

    // 3. Additional Documents (Police Report, Repair Estimate, etc.)
    if (claim.additionalDocuments && claim.additionalDocuments.length > 0) {
      claim.additionalDocuments.forEach(doc => {
        if (doc.url) {
          docs.push({
            name: doc.name,
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
                        Staff has requested a <span className="text-slate-800 font-extrabold">{claim.requestedDocuments && claim.requestedDocuments.length > 0 ? claim.requestedDocuments.join(" & ") : "Police Report & Repair Estimate"}</span> for <span className="text-slate-800 font-extrabold">{claim.claimNumber}</span>.
                      </p>
                      <p className="text-slate-400 text-xs font-bold mt-2">
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
                      onClick={() => handleOpenView(`Documents – ${claim.claimNumber}`, claim.allFiles)}
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
          <div className="bg-[#e2e8f0] border border-slate-300 rounded-[35px] md:rounded-[45px] w-full max-w-[520px] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col relative animate-fade-in max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              onClick={() => setUploadModalOpen(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-slate-800 text-2xl font-bold bg-transparent border-none cursor-pointer p-1"
            >
              &times;
            </button>

            {!uploadSuccess ? (
              <form onSubmit={handleUploadSubmit} className="flex flex-col gap-6">
                <div className="select-none text-center">
                  <h2 className="text-[22px] font-black text-[#0f2d3a] tracking-tight leading-tight">
                    Upload Documents
                  </h2>
                  <p className="text-slate-500 text-xs font-semibold mt-1">
                    Claim ID: {uploadTargetClaim.claimNumber}
                  </p>
                </div>

                <div className="flex flex-col gap-5 mt-2">
                  {Object.entries(uploadFiles).map(([docName, val]) => (
                    <div key={docName} className="flex flex-col gap-2">
                      <label className="text-slate-800 text-[14px] font-extrabold select-none">
                        {docName} <span className="text-red-500">*</span>
                      </label>

                      {val.file === null ? (
                        /* Empty State Upload Drop Card */
                        <div
                          onClick={() => fileInputRefs.current[docName]?.click()}
                          className="w-full h-[120px] bg-white hover:bg-slate-50 border border-slate-300 border-dashed rounded-2xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all duration-150 active:scale-[0.98] select-none"
                        >
                          <svg className="w-8 h-8 text-slate-400 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                          </svg>
                          <span className="text-slate-800 text-[12px] font-extrabold block">
                            Click to upload {docName}
                          </span>
                          <span className="text-slate-400 text-[9px] mt-1 font-semibold">
                            JPG, PNG or PDF · Max 5MB
                          </span>
                        </div>
                      ) : (
                        /* Selected Image File Preview Card */
                        <div className="w-full h-[120px] bg-white border border-slate-300 rounded-2xl p-3 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* File Type Icon / Thumbnail Preview */}
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                              {val.file.type.startsWith("image/") ? (
                                <img src={val.preview} alt="upload preview" className="w-full h-full object-cover" />
                              ) : (
                                <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M4 4a2 2 0 0 1 2-2h4.586A2 2 0 0 1 12 2.586L15.414 6A2 2 0 0 1 16 7.414V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z" />
                                </svg>
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="text-slate-800 font-extrabold text-[13px] block truncate leading-none">
                                {val.file.name}
                              </span>
                              <span className="text-slate-400 text-[10px] font-bold mt-1.5 block select-none">
                                {(val.file.size / (1024 * 1024)).toFixed(2)} MB
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveFile(docName)}
                            className="bg-red-500 hover:bg-red-600 active:scale-95 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold cursor-pointer border-none shadow-sm flex-shrink-0"
                          >
                            &times;
                          </button>
                        </div>
                      )}

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

                <div className="flex flex-row justify-between items-center mt-4">
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(false)}
                    className="bg-[#0f2d3a] hover:bg-[#0b222c] active:scale-[0.97] text-white font-bold text-xs md:text-sm px-6 py-3 rounded-full transition-all duration-150 cursor-pointer border-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-slate-400 active:scale-[0.97] text-white font-extrabold text-xs md:text-sm px-8 py-3 rounded-full shadow-[0_4px_12px_rgba(220,38,38,0.25)] transition-all duration-150 cursor-pointer border-none flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <span>Upload Files</span>
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

                <h3 className="text-[20px] font-black text-[#0f2d3a] mt-5 leading-none">
                  Upload Complete!
                </h3>
                <p className="text-slate-600 text-[13px] font-semibold mt-2.5 max-w-[285px] leading-relaxed mx-auto">
                  Your files have been submitted successfully. Office staff will review them shortly.
                </p>

                <button
                  onClick={() => setUploadModalOpen(false)}
                  className="mt-8 bg-[#0f2d3a] hover:bg-[#0b222c] active:scale-[0.97] text-white font-extrabold text-[13px] px-8 py-3 rounded-full transition-all duration-150 shadow-md border-none cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* VIEW DOCUMENT VIEWER MODAL */}
      {viewModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="w-full max-w-[800px] h-[85vh] flex flex-col relative bg-transparent rounded-2xl overflow-hidden">
            
            {/* Modal Top Nav Bar */}
            <div className="flex justify-between items-center bg-black/60 backdrop-blur px-6 py-4 text-white z-10 rounded-t-2xl">
              <h3 className="text-base font-extrabold truncate pr-4">{viewModalTitle}</h3>
              <div className="flex items-center gap-6">
                {viewModalFiles.length > 1 && (
                  <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
                    {viewCurrentIndex + 1} / {viewModalFiles.length}
                  </span>
                )}
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="text-white hover:text-red-400 text-3xl font-bold bg-transparent border-none cursor-pointer leading-none p-1"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Viewer Content Frame */}
            <div className="flex-1 bg-black flex items-center justify-center relative p-6">
              {viewModalFiles[viewCurrentIndex].startsWith("data:application/pdf") || viewModalFiles[viewCurrentIndex].includes(".pdf") ? (
                /* PDF Embed Frame */
                <iframe
                  src={viewModalFiles[viewCurrentIndex]}
                  className="w-full h-full border-none rounded-xl"
                  title="PDF Document"
                />
              ) : (
                /* Image View Frame */
                <img
                  src={viewModalFiles[viewCurrentIndex]}
                  alt="document display"
                  className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                />
              )}

              {/* Slider Prev Navigation Arrow */}
              {viewModalFiles.length > 1 && viewCurrentIndex > 0 && (
                <button
                  onClick={() => setViewCurrentIndex(prev => prev - 1)}
                  className="absolute left-6 w-12 h-12 bg-black/40 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all cursor-pointer border-none shadow-md"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
              )}

              {/* Slider Next Navigation Arrow */}
              {viewModalFiles.length > 1 && viewCurrentIndex < viewModalFiles.length - 1 && (
                <button
                  onClick={() => setViewCurrentIndex(prev => prev + 1)}
                  className="absolute right-6 w-12 h-12 bg-black/40 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all cursor-pointer border-none shadow-md"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              )}
            </div>

            {/* Modal Bottom Status Bar */}
            <div className="bg-black/60 backdrop-blur px-6 py-3.5 text-center text-[11px] text-white/50 font-bold select-none rounded-b-2xl">
              Sanasa General Insurance Co. LTD. Document Storage
            </div>

          </div>
        </div>
      )}

      <PolicyHolderFooter />
    </div>
  );
}
