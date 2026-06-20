"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OfficeStaffNavbar from "@/app/Components/Office Staff/Navbar";
import OfficeStaffFooter from "@/app/Components/Office Staff/Footer";

interface Agent {
  _id: string;
  agentId: string;
  name: string;
  email: string;
  nic: string;
  address: string;
  dob: string;
  branch: string;
}

export default function AgentsPage() {
  const router = useRouter();
  const [branch, setBranch] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

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

    async function loadAgents() {
      try {
        const res = await fetch(`http://localhost:5000/api/office-staff/agents?branch=${currentBranch}`);
        if (!res.ok) {
          throw new Error("Failed to fetch agents.");
        }
        const data = await res.json();
        setAgents(data.agents || []);
      } catch (err: any) {
        console.error("Load agents error:", err);
        setError(err.message || "Failed to load branch agents.");
      } finally {
        setLoading(false);
      }
    }

    if (currentBranch) {
      loadAgents();
    }
  }, [router]);

  // Search filtering
  const filteredAgents = agents.filter(agent => {
    const query = searchQuery.toLowerCase();
    return (
      agent.name.toLowerCase().includes(query) ||
      agent.email.toLowerCase().includes(query) ||
      agent.agentId.toLowerCase().includes(query) ||
      agent.nic.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <div className="flex flex-1 flex-row min-h-0">
        <OfficeStaffNavbar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-[#f59e0b] text-white px-8 py-4 flex justify-between items-center select-none shadow-sm flex-shrink-0 h-[80px]">
            <h1 className="text-xl font-bold tracking-wide">{branch} Branch — Insurance Agents</h1>
            <div className="text-sm font-semibold bg-white/10 px-4 py-1.5 rounded-full">
              Staff Portal
            </div>
          </header>

          <main className="flex-1 p-8 bg-slate-50 overflow-y-auto">
            {loading ? (
              <div className="w-full h-full flex flex-col items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f59e0b]"></div>
                <span className="mt-4 text-slate-500 font-bold">Loading branch agents...</span>
              </div>
            ) : error ? (
              <div className="w-full h-full flex flex-col items-center justify-center min-h-[300px] text-red-500 font-bold bg-red-50 rounded-2xl p-8 border border-red-200">
                <span>{error}</span>
              </div>
            ) : (
              <div className="max-w-6xl mx-auto flex flex-col gap-6">
                
                {/* Search Bar */}
                <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full md:w-96">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by Agent Name, Email or ID..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="text-xs text-slate-400 font-bold">
                    Active Agents in {branch}: {filteredAgents.length}
                  </div>
                </div>

                {/* Agents list */}
                {filteredAgents.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-bold select-none shadow-sm">
                    No agents found matching your query.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAgents.map((agent) => (
                      <div
                        key={agent._id}
                        className="bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 shadow-sm"
                      >
                        <div>
                          {/* Card Header */}
                          <div className="flex justify-between items-start mb-4 select-none">
                            <div>
                              <h3 className="font-black text-slate-800 text-base">{agent.name}</h3>
                              <span className="text-[9px] text-amber-600 font-black tracking-wider uppercase bg-amber-50 border border-amber-200 px-2 py-0.5 rounded mt-1.5 inline-block">
                                ID: {agent.agentId}
                              </span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 select-none">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-500">
                                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>

                          {/* Info Fields */}
                          <div className="flex flex-col text-slate-500 text-xs font-semibold gap-2 select-none mt-2">
                            <div className="flex">
                              <span className="w-20 flex-shrink-0 text-slate-400">Email</span>
                              <span className="truncate">: {agent.email}</span>
                            </div>
                            <div className="flex">
                              <span className="w-20 flex-shrink-0 text-slate-400">NIC</span>
                              <span>: {agent.nic}</span>
                            </div>
                            <div className="flex">
                              <span className="w-20 flex-shrink-0 text-slate-400">DOB</span>
                              <span>: {agent.dob}</span>
                            </div>
                            <div className="flex">
                              <span className="w-20 flex-shrink-0 text-slate-400">Address</span>
                              <span className="truncate">: {agent.address}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="mt-6 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold select-none">
                          <span>Assign Area: {agent.branch}</span>
                          <span className="text-emerald-500 font-extrabold flex items-center gap-0.5">
                            ● Active
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      <OfficeStaffFooter />
    </div>
  );
}
