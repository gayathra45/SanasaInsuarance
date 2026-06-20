"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OfficeStaffNavbar from "@/app/Components/Office Staff/Navbar";
import OfficeStaffFooter from "@/app/Components/Office Staff/Footer";

export default function ContactPage() {
  const router = useRouter();
  const [branch, setBranch] = useState("");
  const [branchDetails, setBranchDetails] = useState({
    email: "",
    mobile: "",
    location: "",
    staffCount: 0
  });
  const [loading, setLoading] = useState(true);

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
          setBranchDetails({
            email: staffObj.email || "support@sanasageneral.lk",
            mobile: staffObj.mobile || "0725 575 575",
            location: staffObj.location || "Branch Address",
            staffCount: staffObj.staffCount || 5
          });
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
    setLoading(false);
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <div className="flex flex-1 flex-row min-h-0">
        <OfficeStaffNavbar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-[#f59e0b] text-white px-8 py-4 flex justify-between items-center select-none shadow-sm flex-shrink-0 h-[80px]">
            <h1 className="text-xl font-bold tracking-wide">{branch} Branch — Contact Directory</h1>
            <div className="text-sm font-semibold bg-white/10 px-4 py-1.5 rounded-full">
              Staff Portal
            </div>
          </header>

          <main className="flex-1 p-8 bg-slate-50 overflow-y-auto">
            {loading ? (
              <div className="w-full h-full flex flex-col items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f59e0b]"></div>
                <span className="mt-4 text-slate-500 font-bold">Loading branch directory...</span>
              </div>
            ) : (
              <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6 select-none">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="bg-amber-100 p-3 rounded-full flex items-center justify-center text-[#f59e0b]">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800 tracking-wide">{branch} Branch Office</h2>
                    <p className="text-xs text-slate-400 font-bold">Sanasa General Insurance Co. LTD</p>
                  </div>
                </div>

                <div className="space-y-4 text-sm font-semibold text-slate-600">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Office Location</span>
                    <span className="text-slate-800">{branchDetails.location}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Branch Hotline / Mobile</span>
                    <span className="text-slate-800">{branchDetails.mobile}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Branch Email</span>
                    <span className="text-slate-800">{branchDetails.email}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Staff Count</span>
                    <span className="text-slate-800">{branchDetails.staffCount} Officers</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex flex-col gap-3">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Emergency Helplines</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    For any system difficulties or escalation issues, contact HQ support at <strong className="text-slate-700">it-support@sanasageneral.lk</strong> or dial <strong className="text-slate-700">011 2 200 200</strong>.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <OfficeStaffFooter />
    </div>
  );
}
