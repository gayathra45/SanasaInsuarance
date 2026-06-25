"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import PolicyHolderNavbar from "@/app/Components/Policy_Holder/Navbar";
import PolicyHolderFooter from "@/app/Components/Policy_Holder/footer";

export default function PolicyHolderContact() {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // User details state (loaded from sessionStorage)
  const [user, setUser] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    nic?: string;
    mobile?: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = sessionStorage.getItem("logged_in_user");
      if (userStr) {
        try {
          setUser(JSON.parse(userStr));
        } catch (e) {
          console.error("Failed to parse logged_in_user from sessionStorage", e);
        }
      }
    }
  }, []);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setModalFeedback({ type: "error", text: "Subject and Message are required." });
      return;
    }

    setIsSending(true);
    setModalFeedback(null);

    const payload = {
      name: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Web Portal Policy Holder",
      email: user?.email || "",
      nic: user?.nic || "",
      phone: user?.mobile || "",
      subject: subject.trim(),
      message: message.trim(),
    };

    try {
      const res = await fetch("http://localhost:5000/api/policy-holder/contact/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setModalFeedback({ type: "success", text: "Email sent successfully! The claims team will respond within 24 hours." });
        setSubject("");
        setMessage("");
        // Close modal after a short delay
        setTimeout(() => {
          setShowEmailModal(false);
          setModalFeedback(null);
        }, 2500);
      } else {
        setModalFeedback({ type: "error", text: data.error || "Failed to send email." });
      }
    } catch (err) {
      console.error("Send email error:", err);
      setModalFeedback({ type: "error", text: "Unable to connect to the server." });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      <PolicyHolderNavbar />

      {/* Styled curved header matching mockup exactly */}
      <div className="max-w-7xl w-full mx-auto px-6 md:px-16 mt-8 relative">
        <div className="absolute top-0 bottom-0 left-[calc(50%-50vw)] right-6 md:right-12 bg-[url('/contact_border.jpeg')] bg-cover bg-center rounded-r-[75px] md:rounded-r-[95px] overflow-hidden shadow-md">
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-[#004f6e]/65 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d2a3a]/90 via-[#0d2a3a]/75 to-transparent" />
        </div>

        {/* Text content aligned automatically with the page container */}
        <header className="relative z-10 h-[190px] flex flex-col justify-center pl-4 md:pl-8 select-none">
          <h1 className="text-white text-3xl md:text-[40px] font-bold tracking-tight leading-none">
            Contact Us
          </h1>
          <p className="text-slate-200 text-xs md:text-sm font-semibold mt-3.5 tracking-wide opacity-95">
            Contact with Anytime with Us
          </p>
        </header>
      </div>

      {/* Main Channels List Section */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 md:px-8 py-12 flex flex-col gap-6 relative z-20">
        
        {/* Card 1: Hotline */}
        <a 
          href="tel:+94112003000" 
          className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 cursor-pointer no-underline text-inherit hover:bg-slate-50/50 group"
        >
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-[#00ddff] group-hover:border-[#00ddff] transition-colors shrink-0">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 0 1-7.108-7.108c-.145-.44.02-.927.396-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg md:text-xl group-hover:text-slate-900 transition-colors">Hotline</h3>
              <p className="text-slate-600 text-sm md:text-base font-semibold mt-1.5 tracking-wide">
                +94 112 003 000 | +94 112 003 000
              </p>
            </div>
          </div>
          <div className="text-red-500 hover:text-red-600 transition-colors font-bold text-xs md:text-sm self-start md:self-center md:pl-0 pl-20 select-none">
            24 Hours Hotline
          </div>
        </a>

        {/* Card 2: Email */}
        <button 
          type="button"
          onClick={() => setShowEmailModal(true)} 
          className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 cursor-pointer no-underline text-inherit hover:bg-slate-50/50 group text-left w-full border-solid font-sans"
        >
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-[#00ddff] group-hover:border-[#00ddff] transition-colors shrink-0">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg md:text-xl group-hover:text-slate-900 transition-colors">Email</h3>
              <p className="text-slate-600 text-sm md:text-base font-semibold mt-1.5 tracking-wide">
                claims@sanasainsurance.lk
              </p>
            </div>
          </div>
          <div className="text-red-500 hover:text-red-600 transition-colors font-bold text-xs md:text-sm self-start md:self-center md:pl-0 pl-20 select-none">
            Response within 24 hours
          </div>
        </button>

        {/* Card 3: Live Chat */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg md:text-xl">Live Chat</h3>
              <p className="text-slate-600 text-sm md:text-base font-semibold mt-1.5 tracking-wide">
                Available Now
              </p>
            </div>
          </div>
          <div className="text-red-500 hover:text-red-600 transition-colors font-bold text-xs md:text-sm self-start md:self-center md:pl-0 pl-20 select-none">
            Mon-Sat 9am-6pm
          </div>
        </div>

      </main>

      {/* Location Section */}
      <section className="relative w-full mt-8 pt-12 md:pt-16">
        {/* Background image for the location section */}
        <div className="absolute inset-0 top-0 h-[430px] md:h-[490px] w-full overflow-hidden">
          <Image 
            src="/contact_location.png" 
            alt="Location Background" 
            fill 
            className="object-cover object-center" 
          />
          {/* Dark gradient overlay on the left to make "Location" text pop */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1b3b55]/95 via-[#1b3b55]/40 to-transparent" />
          {/* Slate gradient overlay from bottom to fade out the background */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-50/50 to-transparent" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 md:px-16 z-10 flex flex-col">
          
          {/* Location Title */}
          <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-md pl-4 md:pl-8 mb-8 select-none">
            Location
          </h2>

          <div className="flex flex-col md:flex-row gap-8 lg:gap-16 items-start">
            
            {/* Map iframe overlapping bottom */}
            <div className="w-full md:w-[60%] lg:w-[55%] -mb-16 md:-mb-24 z-20 pl-4 md:pl-8">
              <div className="relative w-full h-[250px] md:h-[350px] rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-2xl border-[6px] border-white bg-white">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3961.2661808899647!2d79.87076!3d6.918!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae259ab28a0b0f1%3A0x5f5b0b0b0b0b0b0b!2sSanasa%20General%20Insurance!5e0!3m2!1sen!2slk!4v1234567890"
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={true} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 w-full h-full"
                ></iframe>
              </div>
            </div>

            {/* Head Office text next to map */}
            <div className="w-full md:w-[40%] lg:w-[45%] mt-4 md:mt-20 text-slate-800">
              <h3 className="font-extrabold text-slate-900 text-lg md:text-xl mb-3 select-none">Head Office</h3>
              <p className="text-slate-600 text-sm md:text-base font-semibold leading-relaxed">
                No: 172, Elvitigala Mv, Colombo 8,<br />Sri Lanka
              </p>
              
              <hr className="border-t border-slate-300 w-full max-w-[320px] my-6" />

              <h3 className="font-extrabold text-slate-900 text-lg md:text-xl mb-3 select-none">Open Hours</h3>
              <p className="text-slate-600 text-sm md:text-base font-semibold leading-relaxed">
                Monday - Friday<br />
                8:30AM–5:15PM
              </p>
            </div>

          </div>
        </div>
        
        {/* Spacer to prevent overlapping with footer due to negative margin */}
        <div className="h-24 md:h-36"></div>
      </section>

      {/* Floating Chat Bubble Button */}
      <button
        className="fixed bottom-8 right-8 z-40 bg-[#00ddff] hover:bg-[#00c8e6] text-white p-4.5 rounded-full shadow-2xl transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer focus:outline-none border-none flex items-center justify-center"
        aria-label="Chat support"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2.1 21.5l4.63-.827A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-3.5 11a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3.5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3.5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" clipRule="evenodd" />
        </svg>
      </button>

      <PolicyHolderFooter />

      {/* Email Composer Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-all duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col border border-slate-100 relative">
            
            {/* Ambient background glow inside modal */}
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-[#00ddff]/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-[#004f6e]/10 blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="px-12 py-7 border-b border-slate-100 flex justify-between items-center relative z-10 bg-white/80 backdrop-blur-md">
              <div>
                <h3 className="text-2xl font-bold text-[#0d2a3a]">Send Email to Claims</h3>
                <p className="text-xs text-slate-500 font-semibold mt-1">Our support team replies within 24 hours</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEmailModal(false);
                  setModalFeedback(null);
                }}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer border-none bg-transparent transition-colors p-2"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSendEmail} className="p-12 flex flex-col gap-6 relative z-10">
              
              {/* User info display block if logged in */}
              {user && (
                <div className="bg-[#f0f9ff]/80 border border-sky-100 rounded-[24px] p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-700 font-semibold">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sender Name</span>
                    <span className="text-[#0d2a3a] text-base font-extrabold">{user.firstName} {user.lastName}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Email Address</span>
                    <span className="text-slate-800 text-sm truncate">{user.email}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">NIC Number</span>
                    <span className="text-slate-800 text-sm">{user.nic}</span>
                  </div>
                </div>
              )}

              {/* Multi-column grid for Recipient and Subject */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* To (Read-only) */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#0d2a3a] uppercase tracking-wider pl-1">Recipient</label>
                  <input
                    type="text"
                    value="claims@sanasainsurance.lk"
                    disabled
                    className="bg-slate-100/70 text-slate-500 text-sm font-semibold px-5 py-4 rounded-2xl border border-slate-200 outline-none w-full cursor-not-allowed"
                  />
                </div>

                {/* Subject */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#0d2a3a] uppercase tracking-wider pl-1">Subject</label>
                  <input
                    type="text"
                    placeholder="Enter inquiry subject..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-800 text-sm font-semibold px-5 py-4 rounded-2xl border border-slate-200 focus:border-[#0284c7] outline-none w-full transition-all focus:ring-4 focus:ring-sky-100"
                  />
                </div>
              </div>

              {/* Message */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#0d2a3a] uppercase tracking-wider pl-1">Message Body</label>
                <textarea
                  placeholder="Type your message details here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={6}
                  className="bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-800 text-sm font-semibold px-5 py-4 rounded-2xl border border-slate-200 focus:border-[#0284c7] outline-none w-full transition-all resize-none leading-relaxed focus:ring-4 focus:ring-sky-100"
                />
              </div>

              {/* Modal Feedback banner */}
              {modalFeedback && (
                <div
                  className={`rounded-2xl p-4 text-xs font-semibold border ${
                    modalFeedback.type === "success"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : "bg-red-50 text-red-700 border-red-100"
                  }`}
                >
                  {modalFeedback.text}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailModal(false);
                    setModalFeedback(null);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-7 py-3.5 rounded-full transition-all duration-150 active:scale-[0.98] cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="bg-[#0d2a3a] hover:bg-[#0284c7] disabled:bg-slate-400 text-white font-bold text-sm px-9 py-3.5 rounded-full shadow-[0_4px_12px_rgba(13,42,58,0.25)] hover:shadow-[0_4px_16px_rgba(2,132,199,0.3)] transition-all duration-150 active:scale-[0.98] cursor-pointer border-none flex items-center justify-center gap-2 min-w-[130px]"
                >
                  {isSending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    "Send Email"
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      <PolicyHolderFooter />
    </div>
  );
}
