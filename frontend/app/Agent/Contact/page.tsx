"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/Components/Agent/Navbar";
import Footer from "@/app/Components/Agent/Footer";
import { API_URL } from "@/app/config";

interface AgentDetails {
  name?: string;
  email?: string;
  nic?: string;
  phone?: string;
  agentId?: string;
}

export default function AgentContactPage() {
  const router = useRouter();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Agent details state (loaded from sessionStorage)
  const [agent, setAgent] = useState<AgentDetails | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const agentData = sessionStorage.getItem("logged_in_agent");
      if (!agentData) {
        router.push("/Login");
        return;
      }
      try {
        setAgent(JSON.parse(agentData));
      } catch (e) {
        console.error("Failed to parse logged_in_agent from sessionStorage", e);
        router.push("/Login");
      }
    }
  }, [router]);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setModalFeedback({ type: "error", text: "Subject and Message are required." });
      return;
    }

    setIsSending(true);
    setModalFeedback(null);

    const payload = {
      name: agent?.name || "Agent Support Inquiry",
      email: agent?.email || "",
      nic: agent?.nic || agent?.agentId || "",
      phone: agent?.phone || "",
      subject: `[Agent Support] ${subject.trim()}`,
      message: message.trim(),
    };

    try {
      const res = await fetch(`${API_URL}/policy-holder/contact/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setModalFeedback({
          type: "success",
          text: "Message sent successfully! Agent support office will respond within 12 hours.",
        });
        setSubject("");
        setMessage("");
        // Close modal after short delay
        setTimeout(() => {
          setShowEmailModal(false);
          setModalFeedback(null);
        }, 2500);
      } else {
        setModalFeedback({ type: "error", text: data.error || "Failed to send message." });
      }
    } catch (err) {
      console.error("Send email error:", err);
      setModalFeedback({ type: "error", text: "Unable to connect to support server." });
    } finally {
      setIsSending(false);
    }
  };

  const faqs = [
    {
      q: "How long does document verification take?",
      a: "Once you upload a requested document (e.g. damage assessment or inspection photos), the branch office staff will typically verify it within 2 to 4 hours. You will see status updates in real-time."
    },
    {
      q: "What should I do if a file upload fails?",
      a: "Ensure the file format is JPEG, PNG, or PDF, and the size is strictly below 5MB. If you continue to experience upload failures, please submit a ticket using our support email form or call the emergency priority hotline."
    },
    {
      q: "How do I update my profile or bank account details?",
      a: "For security and auditing regulations, agents cannot edit core profile or bank routing information directly. Please contact your branch administrator or submit an email ticket detailing the required updates."
    },
    {
      q: "Can I modify a claim inspection report after submission?",
      a: "Once an inspection report or assessment has been submitted, it is locked in the claim history file. If you have discovered an error or need to append additional photos, contact the branch claims supervisor immediately."
    }
  ];

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
            Agent Help & Support
          </h1>
          <p className="text-slate-200 text-xs md:text-sm font-semibold mt-3.5 tracking-wide opacity-95">
            Access immediate support channels, FAQs, and local branch coordinators
          </p>
        </header>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-16 py-12 relative z-20 flex flex-col lg:flex-row gap-10">
        
        {/* Left Column: Contact Channels & FAQs */}
        <div className="flex-1 flex flex-col gap-8">
          
          {/* Contact Cards */}
          <div className="flex flex-col gap-5">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight select-none">
              Communication Channels
            </h2>

            {/* Hotline support */}
            <a
              href="tel:+94112003000"
              className="bg-white border border-slate-200/80 rounded-[24px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.015)] hover:shadow-md hover:border-emerald-200 hover:bg-emerald-50/5 transition-all duration-200 cursor-pointer no-underline text-inherit group"
            >
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 group-hover:border-emerald-300 transition-colors shrink-0 bg-slate-50">
                  <svg className="w-5 h-5 text-slate-500 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 0 1-7.108-7.108c-.145-.44.02-.927.396-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base md:text-lg group-hover:text-emerald-800 transition-colors">Emergency Priority Hotline</h3>
                  <p className="text-slate-500 text-xs md:text-sm font-semibold mt-1 tracking-wide">
                    +94 112 003 000 | +94 112 003 500
                  </p>
                </div>
              </div>
              <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3.5 py-1 rounded-full font-black text-[10px] uppercase self-start md:self-center select-none">
                24/7 Priority Support
              </div>
            </a>

            {/* Email Inquiry trigger */}
            <button
              type="button"
              onClick={() => setShowEmailModal(true)}
              className="bg-white border border-slate-200/80 rounded-[24px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.015)] hover:shadow-md hover:border-emerald-200 hover:bg-emerald-50/5 transition-all duration-200 cursor-pointer no-underline text-inherit group w-full text-left font-sans outline-none"
            >
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 group-hover:border-emerald-300 transition-colors shrink-0 bg-slate-50">
                  <svg className="w-5 h-5 text-slate-500 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base md:text-lg group-hover:text-emerald-800 transition-colors">Agent Support Portal Email</h3>
                  <p className="text-slate-500 text-xs md:text-sm font-semibold mt-1 tracking-wide">
                    agentsupport@sanasainsurance.lk
                  </p>
                </div>
              </div>
              <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3.5 py-1 rounded-full font-black text-[10px] uppercase self-start md:self-center select-none">
                Submit Inquiry Ticket
              </div>
            </button>
          </div>

          {/* FAQ Section */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight select-none">
              Frequently Asked Questions
            </h2>
            <div className="flex flex-col gap-3 select-none">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="bg-white border border-slate-200/80 rounded-[20px] overflow-hidden transition-all duration-200 shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full px-6 py-4.5 flex justify-between items-center text-left bg-transparent border-none outline-none cursor-pointer group"
                    >
                      <span className="font-bold text-slate-700 text-sm md:text-base group-hover:text-emerald-600 transition-colors">
                        {faq.q}
                      </span>
                      <span className={`text-emerald-500 font-extrabold text-sm transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}>
                        &gt;
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 pt-1 text-slate-500 text-xs md:text-sm font-semibold leading-relaxed border-t border-slate-100">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Office Hours & Branch details */}
        <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-6 select-none">
          
          {/* Office hours card */}
          <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm flex flex-col gap-4">
            <h3 className="font-black text-slate-800 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Office Working Hours
            </h3>
            <div className="space-y-3.5 text-xs font-semibold text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Monday - Friday</span>
                <span>8:30 AM - 5:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Saturday</span>
                <span>8:30 AM - 1:30 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sunday & Holidays</span>
                <span className="text-red-500">Closed</span>
              </div>
              <hr className="border-t border-slate-100 my-2" />
              <div className="text-[11px] text-slate-400 leading-relaxed">
                <span className="font-extrabold text-slate-500">Notice:</span> General administrative queries will be reviewed during office hours. Urgent road accidents must be immediately reported to our priority hotline.
              </div>
            </div>
          </div>

          {/* Regional Branches details */}
          <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm flex flex-col gap-4">
            <h3 className="font-black text-slate-800 text-base border-b border-slate-100 pb-3">
              Regional Branch Offices
            </h3>
            
            <div className="space-y-4">
              <div>
                <span className="block font-black text-slate-800 text-xs uppercase tracking-wide">Colombo Central Branch</span>
                <span className="block text-slate-500 text-xs font-semibold mt-1">Tel: +94 112 889 000</span>
                <span className="block text-slate-400 text-xs mt-0.5">Email: colombo@sanasainsurance.lk</span>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="block font-black text-slate-800 text-xs uppercase tracking-wide">Galle District Branch</span>
                <span className="block text-slate-500 text-xs font-semibold mt-1">Tel: +94 912 244 500</span>
                <span className="block text-slate-400 text-xs mt-0.5">Email: galle@sanasainsurance.lk</span>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="block font-black text-slate-800 text-xs uppercase tracking-wide">Matara City Branch</span>
                <span className="block text-slate-500 text-xs font-semibold mt-1">Tel: +94 412 233 400</span>
                <span className="block text-slate-400 text-xs mt-0.5">Email: matara@sanasainsurance.lk</span>
              </div>
            </div>
          </div>

          {/* Head office card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[28px] p-6 shadow-md text-white">
            <h3 className="font-black text-white text-base border-b border-slate-800 pb-3">
              Headquarters Location
            </h3>
            <p className="text-slate-300 text-xs font-semibold mt-3.5 leading-relaxed">
              Sanasa Insurance PLC, <br />
              No 12, Edmonton Road, <br />
              Colombo 06, <br />
              Sri Lanka.
            </p>
          </div>

        </div>

      </main>

      {/* Support Inquiry Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl border border-slate-300 overflow-hidden transform scale-100 transition-all select-none">
            {/* Header */}
            <div className="px-8 pt-6 pb-4 flex justify-between items-center bg-white border-b border-slate-100">
              <h2 className="font-extrabold text-xl text-slate-800">
                Agent Support Ticket
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowEmailModal(false);
                  setModalFeedback(null);
                }}
                className="text-slate-400 hover:text-slate-600 bg-transparent border-none outline-none cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSendEmail} className="p-8 flex flex-col gap-5">
              {modalFeedback && (
                <div
                  className={`text-xs font-bold px-4 py-2.5 rounded-xl border ${
                    modalFeedback.type === "success"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                      : "bg-red-50 text-red-600 border-red-100"
                  }`}
                >
                  {modalFeedback.text}
                </div>
              )}

              {/* Agent metadata view fields (read-only) */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-xs font-semibold text-slate-500">
                <div>
                  <span className="block text-slate-400 text-[10px] uppercase font-black tracking-wide">Agent Name</span>
                  <span className="text-slate-700 truncate block mt-0.5">{agent?.name || "N/A"}</span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[10px] uppercase font-black tracking-wide">Agent ID</span>
                  <span className="text-slate-700 truncate block mt-0.5">{agent?.agentId || "N/A"}</span>
                </div>
              </div>

              {/* Subject */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wide">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Issue with Claims list loading"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wide">Message Details</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Please describe your inquiry or details of the issue..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={isSending}
                className="w-full py-3 bg-[#0f2d4a] hover:bg-[#1a3d5e] active:scale-[0.98] text-white font-extrabold text-sm rounded-xl transition-all cursor-pointer border-none outline-none flex items-center justify-center gap-2 shadow-lg shadow-[#0f2d4a]/20 disabled:opacity-60"
              >
                {isSending ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Submitting Ticket...</span>
                  </>
                ) : (
                  <span>Submit Ticket Inquiry</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
