"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "@/app/config";
import AdminNavbar from "@/app/Components/Admin/Navbar";
import Link from "next/link";

interface Branch {
  name: string;
  percentage: number;
  count: number;
  color?: string;
}

interface MonthlyClaim {
  month: string;
  submitted: number;
  approved: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    policyHolders: 0,
    totalClaims: 0,
    activeClaims: 0,
    pendingClaims: 0,
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [monthlyClaims, setMonthlyClaims] = useState<MonthlyClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const branchColorMap: Record<string, string> = {
    Galle: "bg-red-500",
    Matara: "bg-green-500",
    Anuradhapura: "bg-blue-500",
    Embilipitiya: "bg-orange-400",
  };

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`${API_URL}/admin/dashboard-stats`);
        if (!res.ok) {
          throw new Error("Failed to fetch dashboard statistics.");
        }
        const data = await res.json();
        
        setStats(data.stats);
        
        // Map color configuration to branches
        const mappedBranches = data.branches.map((b: any) => ({
          ...b,
          color: branchColorMap[b.name] || "bg-slate-400",
        }));
        setBranches(mappedBranches);
        setMonthlyClaims(data.monthlyClaims);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load dashboard metrics");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
    const intervalId = setInterval(fetchStats, 8000);
    return () => clearInterval(intervalId);
  }, []);

  // Calculate dynamic max height for bar chart to accommodate any data volume
  const maxVal = monthlyClaims.length > 0 
    ? Math.max(...monthlyClaims.map((d) => Math.max(d.submitted, d.approved))) 
    : 0;
  
  // Set chart upper limit (defaults to 30, scales dynamically in multiples of 30)
  const maxLimit = maxVal > 30 ? Math.ceil(maxVal / 30) * 30 : 30;
  const step = maxLimit / 3;

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      {/* Sidebar + Main Content Row */}
      <div className="flex flex-1 flex-row min-h-0">
        {/* Left Sidebar */}
        <AdminNavbar />

        {/* Right Main Container */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Welcome Bar */}
          <header className="bg-white border-b border-slate-100 text-slate-800 px-8 py-4 flex justify-between items-center select-none shadow-sm flex-shrink-0 h-[80px]">
            <h1 className="text-xl font-semibold text-slate-800 flex items-center gap-2">Welcome back, <span className="bg-[#102A43] text-white text-base px-3.5 py-1.5 rounded-xl font-black shadow-sm tracking-wide">Admin Panel</span></h1>
            <div className="flex items-center gap-5">
              {/* Notification Bell Icon */}
              <Link href="/Admin/Notifications" className="relative p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer focus:outline-none flex items-center justify-center">
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

          {/* Page Content Dashboard */}
          <main className="flex-1 p-8 bg-white overflow-y-auto">
            {loading ? (
              <div className="w-full h-full flex flex-col items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f59e0b]"></div>
                <span className="mt-4 text-slate-500 font-bold">Loading dashboard metrics...</span>
              </div>
            ) : error ? (
              <div className="w-full h-full flex flex-col items-center justify-center min-h-[300px] text-red-500 font-bold bg-red-50 rounded-2xl p-8 border border-red-200">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-10 h-10 mb-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                <span>{error}</span>
              </div>
            ) : (
              <>
                {/* 4 Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  {/* Policy Holders Card */}
                  <div className="bg-white rounded-[20px] border border-slate-700/80 p-6 flex flex-col items-center justify-center text-center h-[120px] shadow-sm select-none">
                    <span className="text-3xl font-black text-slate-800 tracking-tight">{stats.policyHolders}</span>
                    <span className="text-slate-500 font-bold text-sm mt-1">Policy Holders</span>
                  </div>

                  {/* Total Claims Card */}
                  <div className="bg-white rounded-[20px] border border-slate-700/80 p-6 flex flex-col items-center justify-center text-center h-[120px] shadow-sm select-none">
                    <span className="text-3xl font-black text-slate-800 tracking-tight">{stats.totalClaims}</span>
                    <span className="text-slate-500 font-bold text-sm mt-1">Total Claims</span>
                  </div>

                  {/* Active Claims Card */}
                  <div className="bg-white rounded-[20px] border border-slate-700/80 p-6 flex flex-col items-center justify-center text-center h-[120px] shadow-sm select-none">
                    <span className="text-3xl font-black text-slate-800 tracking-tight">{stats.activeClaims}</span>
                    <span className="text-slate-500 font-bold text-sm mt-1">Active Claims</span>
                  </div>

                  {/* Pending Claims Card */}
                  <div className="bg-white rounded-[20px] border border-slate-700/80 p-6 flex flex-col items-center justify-center text-center h-[120px] shadow-sm select-none">
                    <span className="text-3xl font-black text-slate-800 tracking-tight">{stats.pendingClaims}</span>
                    <span className="text-slate-500 font-bold text-sm mt-1">Pending Claims</span>
                  </div>
                </div>

                {/* Branch Performance & Monthly Claims split section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                  
                  {/* Branch Performances List (Left: 5 cols) */}
                  <div className="lg:col-span-5 flex flex-col select-none">
                    <h2 className="text-lg font-black text-slate-800 mb-8 tracking-wide">
                      Branch Performances
                    </h2>
                    
                    <div className="flex flex-col gap-6">
                      {branches.map((branch) => (
                        <div key={branch.name} className="flex flex-col">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-slate-700 text-sm">
                              {branch.name}
                            </span>
                            <span className="text-xs text-slate-400 font-bold">
                              {branch.count} {branch.count === 1 ? "claim" : "claims"}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${branch.color} rounded-full transition-all duration-500`}
                              style={{ width: `${branch.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Monthly Claims Chart (Right: 7 cols) */}
                  <div className="lg:col-span-7 flex flex-col select-none">
                    <h2 className="text-lg font-black text-slate-800 mb-8 tracking-wide">
                      Monthly Claims
                    </h2>
                    
                    {/* Visual Chart Area */}
                    <div className="relative flex flex-col w-full bg-white pl-8 pr-4 py-4 min-h-[260px]">
                      
                      {/* Grid background lines and Y-axis labels */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-12">
                        <div className="w-full border-t border-dashed border-slate-200/60 relative">
                          <span className="absolute -left-7 -top-2 text-[10px] text-slate-400 font-bold">{maxLimit}</span>
                        </div>
                        <div className="w-full border-t border-dashed border-slate-200/60 relative">
                          <span className="absolute -left-7 -top-2 text-[10px] text-slate-400 font-bold">{step * 2}</span>
                        </div>
                        <div className="w-full border-t border-dashed border-slate-200/60 relative">
                          <span className="absolute -left-7 -top-2 text-[10px] text-slate-400 font-bold">{step}</span>
                        </div>
                        <div className="w-full border-t border-slate-300 relative">
                          <span className="absolute -left-7 -top-2 text-[10px] text-slate-400 font-bold">0</span>
                        </div>
                      </div>

                      {/* Bars wrapper */}
                      <div className="relative flex-1 flex items-end justify-between w-full h-[200px] z-10 pb-[2px]">
                        {monthlyClaims.map((data) => {
                          const submittedPercent = data.submitted > 0 ? Math.min((data.submitted / maxLimit) * 100, 100) : 0;
                          const approvedPercent = data.approved > 0 ? Math.min((data.approved / maxLimit) * 100, 100) : 0;

                          return (
                            <div key={data.month} className="flex-1 flex flex-col items-center group min-w-0">
                              {/* Bars container */}
                              <div className="h-[180px] w-full flex items-end justify-center gap-[4px] relative">
                                {/* Submitted Bar (Blue) */}
                                {submittedPercent > 0 && (
                                  <div
                                    className="w-[10px] bg-[#3b82f6] rounded-t-sm transition-all duration-300 hover:brightness-110 relative group/bar cursor-pointer"
                                    style={{ height: `${submittedPercent}%` }}
                                  >
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap mb-1 z-20 pointer-events-none">
                                      Submitted: {data.submitted}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Approved Bar (Green) */}
                                {approvedPercent > 0 && (
                                  <div
                                    className="w-[10px] bg-[#10b981] rounded-t-sm transition-all duration-300 hover:brightness-110 relative group/bar cursor-pointer"
                                    style={{ height: `${approvedPercent}%` }}
                                  >
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap mb-1 z-20 pointer-events-none">
                                      Approved: {data.approved}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {/* Month Label */}
                              <span className="text-[10px] text-slate-400 font-bold mt-2.5">
                                {data.month}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Legend underneath the chart */}
                      <div className="flex items-center gap-6 mt-8 pl-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 bg-[#3b82f6] rounded-[3px]"></div>
                          <span className="text-xs text-slate-500 font-bold">Submitted</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 bg-[#10b981] rounded-[3px]"></div>
                          <span className="text-xs text-slate-500 font-bold">Approved</span>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* Floating Action Chat Button */}
      <button className="fixed bottom-24 right-8 w-14 h-14 bg-[#00ddff] hover:bg-[#00cceb] text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer z-50 group">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
          <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75 0 1.776.476 3.44 1.307 4.887L2.14 21.64a.75.75 0 0 0 .935.935l4.753-1.428A9.702 9.702 0 0 0 12 21.75c5.385 0 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-3 9.75a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm3.75 0a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm3.75 0a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" />
        </svg>
      </button>

    </div>
  );
}
