"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OfficeStaffNavbar from "@/app/Components/Office Staff/Navbar";
import OfficeStaffFooter from "@/app/Components/Office Staff/Footer";

export default function ReportsPage() {
  const router = useRouter();
  const [branch, setBranch] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClaims: 0,
    activeClaims: 0,
    pendingClaims: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalDisbursed: 0
  });

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

    async function loadReportStats() {
      try {
        // Fetch dashboard stats to populate report values
        const res = await fetch(`http://localhost:5000/api/office-staff/dashboard-stats?branch=${currentBranch}`);
        const claimsRes = await fetch(`http://localhost:5000/api/office-staff/claims?branch=${currentBranch}`);
        
        if (!res.ok || !claimsRes.ok) {
          throw new Error("Failed to fetch reports stats.");
        }

        const statsData = await res.json();
        const claimsData = await claimsRes.json();
        const claimsList = claimsData.claims || [];

        const approved = claimsList.filter((c: any) => c.status.toLowerCase() === "approved");
        const rejected = claimsList.filter((c: any) => c.status.toLowerCase() === "rejected");
        const totalPaid = approved.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);

        setStats({
          totalClaims: claimsList.length,
          activeClaims: statsData.stats.activeClaims || 0,
          pendingClaims: statsData.stats.pendingClaims || 0,
          approvedCount: approved.length,
          rejectedCount: rejected.length,
          totalDisbursed: totalPaid
        });
      } catch (err) {
        console.error("Load report stats error:", err);
      } finally {
        setLoading(false);
      }
    }

    if (currentBranch) {
      loadReportStats();
    }
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <div className="flex flex-1 flex-row min-h-0">
        <OfficeStaffNavbar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-[#f59e0b] text-white px-8 py-4 flex justify-between items-center select-none shadow-sm flex-shrink-0 h-[80px]">
            <h1 className="text-xl font-bold tracking-wide">{branch} Branch — Performance & Reports</h1>
            <div className="text-sm font-semibold bg-white/10 px-4 py-1.5 rounded-full">
              Staff Portal
            </div>
          </header>

          <main className="flex-1 p-8 bg-slate-50 overflow-y-auto">
            {loading ? (
              <div className="w-full h-full flex flex-col items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f59e0b]"></div>
                <span className="mt-4 text-slate-500 font-bold">Loading branch analytics...</span>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto flex flex-col gap-8">
                
                {/* Executive Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider mb-1">Total Claims Filed</span>
                    <span className="text-3xl font-black text-slate-800">{stats.totalClaims}</span>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider mb-1">Settlement Disbursed</span>
                    <span className="text-2xl font-black text-emerald-600">LKR {stats.totalDisbursed.toLocaleString()}</span>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider mb-1">Settle Rate</span>
                    <span className="text-3xl font-black text-blue-600">
                      {stats.totalClaims > 0 ? Math.round(((stats.approvedCount + stats.rejectedCount) / stats.totalClaims) * 100) : 0}%
                    </span>
                  </div>
                </div>

                {/* Main Report Breakdown */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
                  <h2 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-3 select-none">Branch Audit Summary</h2>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 select-none">
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-xs font-bold mb-1">Claims Approved</span>
                      <span className="text-xl font-extrabold text-emerald-500">{stats.approvedCount}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-xs font-bold mb-1">Claims Rejected</span>
                      <span className="text-xl font-extrabold text-rose-500">{stats.rejectedCount}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-xs font-bold mb-1">Under Assessment</span>
                      <span className="text-xl font-extrabold text-blue-500">{stats.activeClaims}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-xs font-bold mb-1">Awaiting Review</span>
                      <span className="text-xl font-extrabold text-amber-500">{stats.pendingClaims}</span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex gap-4">
                    <button
                      onClick={() => window.print()}
                      className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      Print Summary
                    </button>
                    <button
                      onClick={() => alert("Report download started (PDF placeholder).")}
                      className="px-6 py-2.5 border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Export Detailed PDF
                    </button>
                  </div>
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
