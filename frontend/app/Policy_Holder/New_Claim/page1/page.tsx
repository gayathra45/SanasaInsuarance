"use client";

import React, { useState, useRef } from "react";
import PolicyHolderNavbar from "@/app/Components/Policy_Holder/Navbar";
import PolicyHolderFooter from "@/app/Components/Policy_Holder/footer";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface FileUploadState {
  files: File[];
  previews: string[];
}

export default function UploadDocumentsPage() {
  const router = useRouter();

  // State for uploads
  const [accidentFront, setAccidentFront] = useState<FileUploadState>({ files: [], previews: [] });
  const [accidentRear, setAccidentRear] = useState<FileUploadState>({ files: [], previews: [] });
  const [accidentSide, setAccidentSide] = useState<FileUploadState>({ files: [], previews: [] });
  const [licenseFront, setLicenseFront] = useState<FileUploadState>({ files: [], previews: [] });
  const [licenseRear, setLicenseRear] = useState<FileUploadState>({ files: [], previews: [] });

  // Success Modal States
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedClaimNumber, setGeneratedClaimNumber] = useState("");

  // Refs for file inputs
  const accidentFrontRef = useRef<HTMLInputElement>(null);
  const accidentRearRef = useRef<HTMLInputElement>(null);
  const accidentSideRef = useRef<HTMLInputElement>(null);
  const licenseFrontRef = useRef<HTMLInputElement>(null);
  const licenseRearRef = useRef<HTMLInputElement>(null);

  // Lock background scroll when success modal is open
  React.useEffect(() => {
    if (showSuccessModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showSuccessModal]);

  // File selection handler with 5MB validation
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    stateSetter: React.Dispatch<React.SetStateAction<FileUploadState>>
  ) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit

      const validFiles: File[] = [];
      for (const file of selectedFiles) {
        if (file.size > MAX_SIZE) {
          alert(`File "${file.name}" exceeds the 5MB maximum size limit and was skipped.`);
        } else {
          validFiles.push(file);
        }
      }

      if (validFiles.length === 0) return;

      const newPreviews = validFiles.map((file) => URL.createObjectURL(file));

      stateSetter((prev) => ({
        files: [...prev.files, ...validFiles],
        previews: [...prev.previews, ...newPreviews],
      }));
    }
  };

  // Remove individual file handler
  const handleRemoveFile = (
    index: number,
    stateSetter: React.Dispatch<React.SetStateAction<FileUploadState>>
  ) => {
    stateSetter((prev) => {
      // Revoke the object URL to avoid memory leaks
      URL.revokeObjectURL(prev.previews[index]);
      
      const updatedFiles = [...prev.files];
      updatedFiles.splice(index, 1);
      
      const updatedPreviews = [...prev.previews];
      updatedPreviews.splice(index, 1);

      return {
        files: updatedFiles,
        previews: updatedPreviews,
      };
    });
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if at least some files are uploaded
    const totalAccidentPhotos =
      accidentFront.files.length + accidentRear.files.length + accidentSide.files.length;
    const totalLicensePhotos = licenseFront.files.length + licenseRear.files.length;

    if (totalAccidentPhotos === 0) {
      alert("Please upload at least one accident photo (Front, Rear, or Side).");
      return;
    }

    if (totalLicensePhotos === 0) {
      alert("Please upload at least one Driving License photo.");
      return;
    }

    // Convert helper: File -> base64
    const convertFilesToBase64 = async (files: File[]): Promise<string[]> => {
      const promises = files.map((file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });
      });
      return Promise.all(promises);
    };

    // Show loading indicator or block UI if converting takes time (optional)
    const frontPhotos = await convertFilesToBase64(accidentFront.files);
    const rearPhotos = await convertFilesToBase64(accidentRear.files);
    const sidePhotos = await convertFilesToBase64(accidentSide.files);
    const licFront = await convertFilesToBase64(licenseFront.files);
    const licRear = await convertFilesToBase64(licenseRear.files);

    // Retrieve previous page details
    let combinedPayload: any = {};
    if (typeof window !== "undefined") {
      try {
        const draftStr = sessionStorage.getItem("current_claim_draft");
        if (draftStr) {
          combinedPayload = JSON.parse(draftStr);
        }
      } catch (err) {
        console.error("Error retrieving draft details", err);
      }
    }

    const claimData = {
      userNic: combinedPayload.userNic || "123456789V",
      vehiclePlate: combinedPayload.selectedVehicle || "Unknown Plate",
      incidentDate: combinedPayload.incidentDate || "",
      incidentTime: combinedPayload.incidentTime || "",
      damageType: combinedPayload.damageType || "",
      description: combinedPayload.description || "",
      location: combinedPayload.address || "Colombo, Sri Lanka",
      accidentPhotos: {
        front: frontPhotos,
        rear: rearPhotos,
        side: sidePhotos
      },
      drivingLicense: {
        front: licFront,
        rear: licRear
      }
    };

    try {
      const response = await fetch("http://localhost:5000/api/policy-holder/new-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(claimData)
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Failed to submit claim to database.");
        return;
      }

      // Save success state
      sessionStorage.setItem("last_submitted_claim", JSON.stringify({
        ...claimData,
        claimNumber: data.claimNumber,
        status: "Submitted",
        submittedAt: new Date().toISOString()
      }));
      sessionStorage.removeItem("current_claim_draft");

      // Display the success popup modal showing the generated sequential claim ID
      setGeneratedClaimNumber(data.claimNumber);
      setShowSuccessModal(true);
    } catch (err) {
      console.error("New claim submission failed", err);
      alert("Unable to reach the claims database server. Please try again.");
    }
  };

  // Render Helper for upload cards
  const renderUploadCard = (
    label: string,
    state: FileUploadState,
    stateSetter: React.Dispatch<React.SetStateAction<FileUploadState>>,
    inputRef: React.RefObject<HTMLInputElement | null>,
    isLicense: boolean = false
  ) => {
    const cardText = isLicense ? "Click to upload License Photos" : "Click to upload accident Photos";

    return (
      <div className="flex flex-col flex-1">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={inputRef}
          multiple
          accept="image/*,video/*"
          onChange={(e) => handleFileChange(e, stateSetter)}
          className="hidden"
        />

        {state.files.length === 0 ? (
          /* Empty Card State */
          <div
            onClick={() => inputRef.current?.click()}
            className="w-full h-[170px] bg-[#e2e8f0]/60 hover:bg-slate-200/60 border border-slate-300 rounded-3xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all duration-150 active:scale-[0.98] select-none shadow-sm"
          >
            <svg className="w-10 h-10 text-slate-500 mb-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
            </svg>
            <span className="text-slate-800 text-[14px] font-bold block leading-tight">
              {label}
            </span>
            <span className="text-slate-600 text-[10px] mt-1.5 font-medium leading-tight">
              {cardText}
            </span>
            <span className="text-slate-400 text-[8px] mt-0.5 font-semibold leading-tight select-none">
              JPG,PNG - max 5MB each. Multiple Files Allowed
            </span>
          </div>
        ) : (
          /* Active Card State with Thumbnail Previews */
          <div className="w-full h-[170px] bg-[#e2e8f0]/40 border border-slate-300 rounded-3xl p-3 flex flex-col justify-between shadow-inner">
            <div className="grid grid-cols-3 gap-2 overflow-y-auto h-[95px] pr-1">
              {state.previews.map((preview, idx) => {
                const file = state.files[idx];
                const isVideo = file && file.type.startsWith("video/");

                return (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-slate-200 border border-slate-300 group">
                    {isVideo ? (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    ) : (
                      <img src={preview} alt="upload preview" className="w-full h-full object-cover" />
                    )}
                    {/* Delete item overlay */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(idx, stateSetter);
                      }}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold cursor-pointer border-none shadow"
                    >
                      &times;
                    </button>
                  </div>
                );
              })}
            </div>
            
            {/* Action Bar */}
            <div className="flex items-center justify-between border-t border-slate-300/60 pt-2 mt-2">
              <span className="text-slate-800 text-[11px] font-bold">
                {label} ({state.files.length} selected)
              </span>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="bg-[#00ddff] hover:bg-[#00c8e6] text-white text-[10px] font-bold py-1 px-3 rounded-full cursor-pointer border-none shadow-sm transition-all"
              >
                Add More
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans relative">
      <PolicyHolderNavbar />

      {/* Styled curved header matching the mockup exactly */}
      <div className="max-w-4xl w-full mx-auto px-6 md:px-12 mt-8 relative">
        <div className="absolute top-0 bottom-0 left-[calc(50%-50vw)] right-6 md:right-12 bg-[url('/newclaim1.webp')] bg-cover bg-center rounded-r-[75px] md:rounded-r-[95px] overflow-hidden shadow-md">
          <div className="absolute inset-0 bg-slate-900/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d2a3a]/90 via-[#0d2a3a]/75 to-transparent" />
        </div>

        <header className="relative z-10 h-[210px] flex flex-col justify-center pl-4 md:pl-8 select-none">
          <h1 className="text-white text-3xl md:text-[40px] font-bold tracking-tight leading-none">
            File New Claim
          </h1>
          <p className="text-slate-200 text-xs md:text-sm font-semibold mt-3.5 tracking-wide opacity-95">
            Report an accident or damage incident
          </p>
        </header>
      </div>

      {/* Main Form Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 md:px-12 py-10">
        <form onSubmit={handleSubmit} className="flex flex-col gap-10">
          
          {/* Section: Upload Documents */}
          <section className="flex flex-col gap-8">
            <h2 className="text-2xl md:text-[28px] font-bold text-[#0d2a3a] tracking-tight flex items-center gap-5 mt-4 select-none">
              Upload Documents <span className="font-semibold text-2xl text-[#0d2a3a]">&gt;</span>
            </h2>

            {/* Subsection 1: Accident Photos */}
            <div className="flex flex-col">
              <h3 className="text-[17px] font-bold text-slate-800 mb-4 select-none">
                Accident Photos <span className="text-red-500 ml-0.5">*</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {renderUploadCard("Front", accidentFront, setAccidentFront, accidentFrontRef)}
                {renderUploadCard("Rear", accidentRear, setAccidentRear, accidentRearRef)}
                {renderUploadCard("Side", accidentSide, setAccidentSide, accidentSideRef)}
              </div>
            </div>

            {/* Subsection 2: Driving License */}
            <div className="flex flex-col mt-4">
              <h3 className="text-[17px] font-bold text-slate-800 mb-4 select-none">
                Driving License <span className="text-red-500 ml-0.5">*</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {renderUploadCard("Front", licenseFront, setLicenseFront, licenseFrontRef, true)}
                {renderUploadCard("Rear", licenseRear, setLicenseRear, licenseRearRef, true)}
              </div>
            </div>

          </section>

          {/* Action Button Row */}
          <div className="flex flex-row justify-between items-center mt-6 mb-10">
            <Link
              href="/Policy_Holder/New_Claim"
              className="bg-[#0f2d3a] hover:bg-[#0b222c] text-white font-bold text-base px-10 py-3.5 rounded-full transition-all duration-150 active:scale-[0.97] no-underline shadow-[0_4px_12px_rgba(15,45,58,0.25)] flex items-center justify-center gap-4"
            >
              <span>&lt;</span> <span>Back</span>
            </Link>
            <button
              type="submit"
              className="bg-[#0f2d3a] hover:bg-[#0b222c] text-white font-bold text-base px-12 py-3.5 rounded-full transition-all duration-150 active:scale-[0.97] shadow-[0_4px_12px_rgba(15,45,58,0.25)] border-none cursor-pointer flex items-center justify-center gap-4"
            >
              <span>Submit</span> <span>&gt;</span>
            </button>
          </div>

        </form>
      </main>

      {/* Floating Chat Support Bubble */}
      <button
        type="button"
        className="fixed bottom-8 right-8 z-40 bg-[#00ddff] hover:bg-[#00c8e6] text-white p-4.5 rounded-full shadow-2xl transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer focus:outline-none border-none flex items-center justify-center"
        aria-label="Chat support"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2.1 21.5l4.63-.827A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-3.5 11a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3.5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3.5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Success Modal Popup matching the mockup exactly */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-[#e2e8f0] border border-slate-300 rounded-[35px] md:rounded-[45px] w-full max-w-[480px] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col items-center select-none relative animate-fade-in">
            {/* Green Check Circle */}
            <div className="w-20 h-20 bg-[#00b050] rounded-full flex items-center justify-center shadow-md select-none">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="4.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>

            {/* Thank You & Success messages */}
            <h2 className="text-[25px] font-black text-[#0f2d3a] tracking-tight mt-6 leading-none">
              Thank You.
            </h2>
            <p className="text-[22px] font-bold text-[#0f2d3a] tracking-tight mt-2 leading-none">
              Application Submitted!
            </p>

            {/* Reference Number Pill */}
            <div className="bg-black text-white font-extrabold text-[15px] px-8 py-3 rounded-full mt-7 shadow-md tracking-wider">
              {generatedClaimNumber}
            </div>

            {/* Sub-text description */}
            <p className="text-slate-600 text-xs md:text-[13px] font-semibold text-center leading-relaxed mt-6 max-w-[320px] select-none">
              Your insurance application has been received. Our office staff will review your documents.
            </p>

            {/* Back to Home Button */}
            <button
              onClick={() => {
                router.refresh();
                router.push("/Policy_Holder/Home");
              }}
              className="mt-9 self-start bg-[#0f2d3a] hover:bg-[#0b222c] active:scale-[0.97] text-white font-extrabold text-[14px] px-8 py-3.5 rounded-full transition-all duration-150 shadow-[0_4px_12px_rgba(15,45,58,0.25)] flex items-center gap-3.5 border-none cursor-pointer"
            >
              <span>&lt;</span> <span>Back to Home</span>
            </button>
          </div>
        </div>
      )}

      <PolicyHolderFooter />
    </div>
  );
}
