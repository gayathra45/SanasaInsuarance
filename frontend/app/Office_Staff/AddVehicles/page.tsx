"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import OfficeStaffNavbar from "@/app/Components/Office_Staff/Navbar";
import { API_URL } from "@/app/config";

function getVehicleIconSvg(type: string, className = "w-9 h-9 text-slate-800") {
  if (!type) type = "car";
  const t = type.toLowerCase().trim();
  
  if (t.includes("suv")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12h20M17 17h3a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3L14 4H6L3 7v8a2 2 0 0 0 2 2h3" />
        <circle cx="7" cy="17" r="2" />
        <path d="M9 17h6" />
        <circle cx="17" cy="17" r="2" />
        <path d="M7 7h6M19 10h-3" />
      </svg>
    );
  }
  if (t.includes("cab") || t.includes("pickup")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 13h13V8H7L4 11H2v2zm13 0h7V10h-7v3z" />
        <path d="M2 13v3a1 1 0 0 0 1 1h3" />
        <path d="M9 17h6" />
        <path d="M19 17h2a1 1 0 0 0 1-1v-3" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    );
  }
  if (t.includes("van") || t.includes("minibus")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 15V7a2 2 0 0 1 2-2h12l5 3v7a2 2 0 0 1-2 2h-1" />
        <path d="M2 15h3" />
        <path d="M9 17h6" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
        <path d="M6 8h4v3H6V8zm6 0h3v3h-3V8z" />
      </svg>
    );
  }
  if (t.includes("bike") || t.includes("motorcycle") || t.includes("scooter")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5" cy="16" r="3" />
        <circle cx="19" cy="16" r="3" />
        <path d="M5 16h8l3-7H9l-2 3M16 9h3M12 9l-3-4H6" />
      </svg>
    );
  }
  if (t.includes("three") || t.includes("rickshaw") || t.includes("tuk")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
        <path d="M3 18h1c.5 0 .9-.4 1-1l1-6h11c.6 0 1-.4 1-1V5h-3l-2 3H8L6 11H3v7z" />
        <path d="M12 11v7M15 11v7" />
      </svg>
    );
  }
  if (t.includes("lorry") || t.includes("truck")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 18H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h11v13zm0-8h7l2 3v5a1 1 0 0 1-1 1h-8v-9z" />
        <circle cx="6" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </svg>
    );
  }
  if (t.includes("bus")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 15V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v9M2 15h20v1a2 2 0 0 1-2 2h-1M5 18H3" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
        <path d="M4 7h3v3H4V7zm5 0h3v3H9V7zm5 0h3v3h-3V7zm5 0h2v3h-2V7z" />
      </svg>
    );
  }
  if (t.includes("tractor")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="17" r="2.5" />
        <circle cx="17" cy="15" r="4.5" />
        <path d="M6 17h6v-2h-3v-4h4v5" />
        <path d="M12.5 15.5h.5M9 11l-3-4H4" />
      </svg>
    );
  }
  
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.8C2.1 11 2 11.3 2 11.5V16c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}

function getVehicleIconContainer(type: string) {
  const svg = getVehicleIconSvg(type);
  return (
    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-800 shadow-sm flex-shrink-0 select-none group-hover:scale-105 group-hover:bg-[#f59e0b]/10 group-hover:border-[#f59e0b]/20 transition-all duration-300">
      {svg}
    </div>
  );
}

interface Vehicle {
  numberPlate: string;
  vehicleType: string;
  year: string;
  company: string;
  model: string;
  engineNumber: string;
  chassisNumber: string;
  policyNumber: string;
  status?: string;
}

interface PolicyHolder {
  _id: string;
  firstName: string;
  lastName: string;
  nic: string;
  mobile: string;
  email: string;
  vehicles: Vehicle[];
  branch: string;
  referenceNumber: string;
  status: string;
  dob?: string;
  address?: string;
  province?: string;
  city?: string;
  createdAt?: string;
}

interface PendingVehicleItem {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    nic: string;
    email: string;
    mobile: string;
    referenceNumber: string;
    dob?: string;
    address?: string;
    province?: string;
    city?: string;
    branch?: string;
    status?: string;
    createdAt?: string;
    vehicles?: Vehicle[];
  };
  vehicle: Vehicle;
}

interface ConfirmedVehicleItem {
  user: {
    _id?: string;
    firstName: string;
    lastName: string;
    nic: string;
    email: string;
    mobile: string;
    referenceNumber: string;
    dob?: string;
    address?: string;
    province?: string;
    city?: string;
    branch?: string;
    status?: string;
    createdAt?: string;
    vehicles?: Vehicle[];
  };
  vehicle: Vehicle;
}

export default function AddVehiclesPage() {
  const router = useRouter();
  const [branch, setBranch] = useState("");
  const [policyHolders, setPolicyHolders] = useState<PolicyHolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Sub-Navigation Tab: Default to "pending"
  const [activeMenuTab, setActiveMenuTab] = useState<"pending" | "confirmed">("pending");
  const [pendingVehicles, setPendingVehicles] = useState<PendingVehicleItem[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  // Confirmed vehicles search and filter
  const [confirmedSearch, setConfirmedSearch] = useState("");
  const [filteredConfirmed, setFilteredConfirmed] = useState<ConfirmedVehicleItem[]>([]);

  // Verify Action States
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");
  const [selectedUserForModal, setSelectedUserForModal] = useState<any | null>(null);

  // Add Vehicle Modal States
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [selectedUserForAdd, setSelectedUserForAdd] = useState<string>(""); 
  const [addCompany, setAddCompany] = useState("");
  const [addModel, setAddModel] = useState("");
  const [addYear, setAddYear] = useState("");
  const [addNumberPlate, setAddNumberPlate] = useState("");
  const [addVehicleType, setAddVehicleType] = useState("Car");
  const [addPolicyNumber, setAddPolicyNumber] = useState("");
  const [addEngineNumber, setAddEngineNumber] = useState("");
  const [addChassisNumber, setAddChassisNumber] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState("");

  const handleAddVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    setAddSubmitting(true);

    if (!selectedUserForAdd) {
      setAddError("Please select a policy holder.");
      setAddSubmitting(false);
      return;
    }

    if (!addCompany.trim() || !addModel.trim() || !addYear.trim() || !addNumberPlate.trim() || !addVehicleType.trim() || !addPolicyNumber.trim() || !addEngineNumber.trim() || !addChassisNumber.trim()) {
      setAddError("All fields are required.");
      setAddSubmitting(false);
      return;
    }

    const cleanPlate = addNumberPlate.replace(/[\s-]/g, "");
    if (cleanPlate.length < 5 || cleanPlate.length > 10 || !/^[A-Za-z0-9]+$/.test(cleanPlate)) {
      setAddError("Number Plate must be an alphanumeric mix between 5 and 10 characters.");
      setAddSubmitting(false);
      return;
    }

    if (!/^\d{4}$/.test(addYear.trim())) {
      setAddError("Year must be a 4-digit number.");
      setAddSubmitting(false);
      return;
    }

    const cleanPolicy = addPolicyNumber.replace(/[\s-]/g, "");
    if (!/^SAN[A-Za-z0-9]{5,9}$/i.test(cleanPolicy)) {
      setAddError("Policy Number must start with 'SAN' and be between 8 and 12 alphanumeric characters.");
      setAddSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/policy-holder/add-vehicle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nic: selectedUserForAdd,
          company: addCompany.trim(),
          model: addModel.trim(),
          year: addYear.trim(),
          numberPlate: addNumberPlate.trim(),
          vehicleType: addVehicleType.trim(),
          policyNumber: addPolicyNumber.trim(),
          engineNumber: addEngineNumber.trim(),
          chassisNumber: addChassisNumber.trim(),
          status: "Approved" 
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || "Failed to register vehicle.");
        setAddSubmitting(false);
        return;
      }

      setActionSuccess(`Vehicle ${formatNumberPlate(addNumberPlate)} has been registered and verified successfully.`);
      setIsAddVehicleOpen(false);
      
      setSelectedUserForAdd("");
      setAddCompany("");
      setAddModel("");
      setAddYear("");
      setAddNumberPlate("");
      setAddVehicleType("Car");
      setAddPolicyNumber("");
      setAddEngineNumber("");
      setAddChassisNumber("");

      const holdersRes = await fetch(`${API_URL}/office-staff/policy-holders?branch=${branch}`);
      if (holdersRes.ok) {
        const holdersData = await holdersRes.json();
        setPolicyHolders(holdersData.policyHolders || []);
      }
    } catch (err) {
      console.error(err);
      setAddError("Unable to connect to the server.");
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleCancelAddVehicle = () => {
    setIsAddVehicleOpen(false);
    setAddError("");
    setSelectedUserForAdd("");
    setAddCompany("");
    setAddModel("");
    setAddYear("");
    setAddNumberPlate("");
    setAddVehicleType("Car");
    setAddPolicyNumber("");
    setAddEngineNumber("");
    setAddChassisNumber("");
  };

  // 1. Session check & fetch policy holders & pending vehicles
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

    async function loadInitialData() {
      try {
        // Fetch all approved policy holders
        const holdersRes = await fetch(`${API_URL}/office-staff/policy-holders?branch=${currentBranch}`);
        if (!holdersRes.ok) {
          throw new Error("Failed to fetch policy holders.");
        }
        const holdersData = await holdersRes.json();
        setPolicyHolders(holdersData.policyHolders || []);

        // Fetch pending vehicles
        const pendingRes = await fetch(`${API_URL}/office-staff/pending-vehicles?branch=${currentBranch}`);
        if (pendingRes.ok) {
          const pendingData = await pendingRes.json();
          setPendingVehicles(pendingData.pendingVehicles || []);
        }
      } catch (err: any) {
        console.error("Load initial data error:", err);
        setError(err.message || "Failed to load branch records.");
      } finally {
        setLoading(false);
      }
    }

    if (currentBranch) {
      loadInitialData();
    }
  }, [router]);

  // Load pending vehicles on tab switch or reload
  const loadPendingVehicles = async () => {
    if (!branch) return;
    setPendingLoading(true);
    setActionSuccess("");
    setActionError("");
    try {
      const res = await fetch(`${API_URL}/office-staff/pending-vehicles?branch=${branch}`);
      if (!res.ok) {
        throw new Error("Failed to fetch pending vehicles list.");
      }
      const data = await res.json();
      setPendingVehicles(data.pendingVehicles || []);
    } catch (err: any) {
      console.error(err);
      setActionError(err.message || "Could not reload pending vehicles.");
    } finally {
      setPendingLoading(false);
    }
  };

  useEffect(() => {
    if (activeMenuTab === "pending") {
      loadPendingVehicles();
    }
  }, [activeMenuTab]);

  // 2. Compute and filter Confirmed Vehicles
  useEffect(() => {
    const list: ConfirmedVehicleItem[] = [];
    policyHolders.forEach((holder) => {
      (holder.vehicles || []).forEach((v) => {
        if (!v.status || v.status === "Approved") {
          list.push({
            user: {
              _id: holder._id,
              firstName: holder.firstName,
              lastName: holder.lastName,
              nic: holder.nic,
              email: holder.email,
              mobile: holder.mobile,
              dob: holder.dob,
              address: holder.address,
              province: holder.province,
              city: holder.city,
              branch: holder.branch,
              status: holder.status,
              createdAt: holder.createdAt ? String(holder.createdAt) : undefined,
              referenceNumber: holder.referenceNumber,
              vehicles: holder.vehicles
            },
            vehicle: v
          });
        }
      });
    });

    // Sort Confirmed list alphabetically by owner's first name, then plate number
    list.sort((a, b) => {
      const nameA = `${a.user.firstName} ${a.user.lastName}`.toLowerCase();
      const nameB = `${b.user.firstName} ${b.user.lastName}`.toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return a.vehicle.numberPlate.localeCompare(b.vehicle.numberPlate);
    });

    if (confirmedSearch.trim() === "") {
      setFilteredConfirmed(list);
    } else {
      const q = confirmedSearch.toLowerCase().trim();
      const filtered = list.filter(
        (item) =>
          item.vehicle.numberPlate.toLowerCase().includes(q) ||
          item.vehicle.policyNumber.toLowerCase().includes(q) ||
          item.vehicle.company.toLowerCase().includes(q) ||
          item.vehicle.model.toLowerCase().includes(q) ||
          item.user.firstName.toLowerCase().includes(q) ||
          item.user.lastName.toLowerCase().includes(q) ||
          item.user.nic.toLowerCase().includes(q) ||
          item.user.referenceNumber.toLowerCase().includes(q)
      );
      setFilteredConfirmed(filtered);
    }
  }, [confirmedSearch, policyHolders]);

  // 3. Handle Verification Actions (Approve / Reject)
  const handleVerifyVehicle = async (nic: string, plate: string, action: "Approve" | "Reject") => {
    const actionKey = `${nic}-${plate}`;
    setVerifyingId(actionKey);
    setActionSuccess("");
    setActionError("");

    try {
      const res = await fetch(`${API_URL}/office-staff/vehicles/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nic, numberPlate: plate, action })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to ${action.toLowerCase()} vehicle.`);
      }

      setActionSuccess(`Vehicle ${formatNumberPlate(plate)} has been successfully ${action === "Approve" ? "approved" : "rejected"}.`);
      
      // Remove from pending list
      setPendingVehicles((prev) =>
        prev.filter((item) => !(item.user.nic === nic && item.vehicle.numberPlate === plate))
      );

      // Fetch latest policy holders to update the Confirmed Vehicles list
      const holdersRes = await fetch(`${API_URL}/office-staff/policy-holders?branch=${branch}`);
      if (holdersRes.ok) {
        const holdersData = await holdersRes.json();
        setPolicyHolders(holdersData.policyHolders || []);
      }
    } catch (err: any) {
      console.error(err);
      setActionError(err.message || "Failed to process vehicle verification request.");
    } finally {
      setVerifyingId(null);
    }
  };

  const formatNumberPlate = (plate?: string): string => {
    if (!plate) return "";
    const cleaned = plate.trim();
    if (cleaned.includes("-")) return cleaned;
    const m = cleaned.match(/^(.*[A-Za-z]+)(\d+)$/);
    if (m) return `${m[1].trim().toUpperCase()}-${m[2]}`;
    return cleaned;
  };

  const getPlateParts = (plateStr?: string) => {
    const formatted = formatNumberPlate(plateStr).toUpperCase();
    const m = formatted.match(/^(WP|CP|SP|EP|NP|NW|NC|SG|UP|UVA|Uva)[-\s](.*)$/i);
    if (m) {
      return { province: m[1].toUpperCase(), number: m[2] };
    }
    return { province: "LK", number: formatted };
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <div className="flex flex-1 flex-row min-h-0">
        <OfficeStaffNavbar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="bg-white border-b border-slate-100 text-slate-800 px-8 py-4 flex justify-between items-center select-none shadow-sm flex-shrink-0 h-[80px]">
            <h1 className="text-xl font-semibold text-slate-800 flex items-center gap-2">Welcome back, <span className="bg-[#102A43] text-white text-base px-3.5 py-1.5 rounded-xl font-black shadow-sm tracking-wide">{branch} Branch</span></h1>
            <div className="flex items-center gap-5">
              <Link
                href="/Office_Staff/Notifications"
                className="relative p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer focus:outline-none flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6 text-slate-500 hover:text-slate-800"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 1.65.342 3.228.96 4.658A1.875 1.875 0 0 1 18 17.25H6a1.875 1.875 0 0 1-1.71-2.842 9.06 9.06 0 0 0 .96-4.658V9ZM12 18.75a2.25 2.25 0 0 1-2.247-2.118.75.75 0 0 1 .746-.757h3a.75.75 0 0 1 .746.757A2.25 2.25 0 0 1 12 18.75Z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <button className="relative p-1 hover:bg-slate-100 rounded-full transition-colors cursor-pointer focus:outline-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-8 h-8 text-slate-500 hover:text-slate-800"
                >
                  <path
                    fillRule="evenodd"
                    d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12c0 2.754 1.14 5.244 2.98 7.03-.028-.01-.053-.024-.082-.031a.75.75 0 0 1-.502-.879C5.556 14.931 8.193 12 12 12s6.444 2.931 7.352 6.12a.75.75 0 0 1-.502.88c-.029.007-.054.02-.082.031ZM12 11.25a3.375 3.375 0 1 0 0-6.75 3.375 3.375 0 0 0 0 6.75Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </header>

          <main className="flex-1 p-8 bg-slate-50 overflow-y-auto">
            {loading ? (
              <div className="w-full h-full flex flex-col items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f59e0b]"></div>
                <span className="mt-4 text-slate-500 font-bold">Loading Branch Records...</span>
              </div>
            ) : error ? (
              <div className="w-full h-full flex flex-col items-center justify-center min-h-[300px] text-red-500 font-bold bg-red-50 rounded-2xl p-8 border border-red-200">
                <span>{error}</span>
              </div>
            ) : (
              <div className="max-w-7xl mx-auto flex flex-col gap-6">
                
                {/* Page Path / Title */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2 select-none">
                    <h2 className="text-lg font-black text-slate-800 tracking-wide">
                      Add Vehicles
                    </h2>
                    <span className="text-lg font-black text-slate-800">&gt;</span>
                    <span className="text-sm font-semibold text-slate-400">
                      Manage and Verify Registered Vehicles
                    </span>
                  </div>

                  {/* Navigation Tabs & Add Vehicle Action */}
                  <div className="flex flex-wrap items-center gap-3.5 select-none self-start md:self-auto">
                    <button
                      onClick={() => setIsAddVehicleOpen(true)}
                      className="bg-amber-500 hover:bg-amber-600 border-none text-white font-black text-xs px-5 py-2.5 rounded-full cursor-pointer transition-all shadow-sm active:scale-[0.98] flex items-center gap-1.5 h-[36px]"
                    >
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Add Vehicle
                    </button>

                    <div className="flex bg-slate-200/60 p-1.5 rounded-full">
                      <button
                        onClick={() => setActiveMenuTab("pending")}
                        className={`font-black text-xs px-5 py-2 rounded-full border-none transition-all cursor-pointer flex items-center gap-2 relative ${
                          activeMenuTab === "pending"
                            ? "bg-slate-800 text-white shadow-sm"
                            : "bg-transparent hover:text-slate-800 text-slate-500"
                        }`}
                      >
                        Pending Approvals
                        {pendingVehicles.length > 0 && (
                          <span className="text-[10px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full">
                            {pendingVehicles.length}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => setActiveMenuTab("confirmed")}
                        className={`font-black text-xs px-5 py-2 rounded-full border-none transition-all cursor-pointer ${
                          activeMenuTab === "confirmed"
                            ? "bg-slate-800 text-white shadow-sm"
                            : "bg-transparent hover:text-slate-800 text-slate-500"
                        }`}
                      >
                        Confirmed Vehicles
                        {filteredConfirmed.length > 0 && (
                          <span className="ml-1 text-[10px] font-black bg-slate-300 text-slate-700 px-2 py-0.5 rounded-full">
                            {filteredConfirmed.length}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-tab Feedback Alerts */}
                {actionSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl text-xs font-bold flex items-center gap-2 select-none animate-fade-in">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.746 3.746 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                    </svg>
                    {actionSuccess}
                  </div>
                )}

                {actionError && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-2 select-none animate-fade-in">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    {actionError}
                  </div>
                )}

                {/* Tab Content switch */}
                {activeMenuTab === "pending" ? (
                  /* TAB 1: Pending Approvals View (Default) */
                  <div className="flex flex-col gap-6">
                    {pendingLoading ? (
                      <div className="w-full flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-[28px] shadow-sm animate-fade-in">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#f59e0b]"></div>
                        <span className="mt-4 text-slate-500 font-bold text-sm">Fetching pending vehicles...</span>
                      </div>
                    ) : pendingVehicles.length === 0 ? (
                      <div className="bg-white border border-slate-200 rounded-[28px] p-16 text-center select-none shadow-sm flex flex-col items-center justify-center gap-4 min-h-[350px] animate-fade-in">
                        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.746 3.746 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                          </svg>
                        </div>
                        <h4 className="font-extrabold text-slate-700 text-base">All Caught Up!</h4>
                        <p className="text-slate-400 font-semibold text-sm max-w-sm">
                          There are currently no pending vehicle registration verification requests for the {branch} Branch.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                        {pendingVehicles.map((item, idx) => {
                          const actionKey = `${item.user.nic}-${item.vehicle.numberPlate}`;
                          const isProcessing = verifyingId === actionKey;

                          return (
                            <div
                              key={idx}
                              className="bg-white border border-slate-200 rounded-[30px] p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1 text-slate-800"
                            >
                              {/* Decorative faint background accent similar to policy holder dashboard */}
                              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-[100px] pointer-events-none group-hover:bg-amber-50/50 transition-colors" />

                              <div>
                                {/* Header Row: Icon + Plate Number & Year */}
                                <div className="flex items-center justify-between mb-5 select-none">
                                  <div className="flex items-center gap-4">
                                    {getVehicleIconContainer(item.vehicle.vehicleType)}
                                    <div>
                                      {/* Sri Lankan Province License Plate */}
                                      {(() => {
                                        const parts = getPlateParts(item.vehicle.numberPlate);
                                        return (
                                          <div className="inline-flex items-center bg-[#f8fafc] border border-slate-350 rounded-md shadow-sm overflow-hidden font-mono leading-none">
                                            <div className="bg-blue-600 text-white font-sans font-black text-[8px] px-1.5 py-1.5 border-r border-slate-250 flex items-center justify-center shrink-0">
                                              {parts.province}
                                            </div>
                                            <div className="text-slate-900 font-black text-[12px] px-2.5 py-0.5 tracking-wider uppercase bg-white">
                                              {parts.number}
                                            </div>
                                          </div>
                                        );
                                      })()}
                                      <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider mt-1.5 block w-fit">
                                        <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                                        Pending
                                      </span>
                                    </div>
                                  </div>

                                  {/* Small visual card details pill */}
                                  <span className="text-slate-400 font-bold text-xs bg-slate-100 border border-slate-200/50 rounded-full px-3 py-1 self-start select-none">
                                    {item.vehicle.year}
                                  </span>
                                </div>

                                {/* Vehicle Technical details rows */}
                                <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 font-semibold text-xs text-slate-700">
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Make & Model</span>
                                    <span className="text-slate-800 font-extrabold">{item.vehicle.company} {item.vehicle.model}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Vehicle Type</span>
                                    <span className="text-slate-800 font-extrabold">{item.vehicle.vehicleType}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Policy Number</span>
                                    <span className="text-[#f59e0b] font-black font-mono bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 shadow-sm">{item.vehicle.policyNumber}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Engine Number</span>
                                    <span className="text-slate-800 font-bold font-mono bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">{item.vehicle.engineNumber || "N/A"}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Chassis Number</span>
                                    <span className="text-slate-800 font-bold font-mono bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">{item.vehicle.chassisNumber || "N/A"}</span>
                                  </div>
                                </div>

                                {/* Owner Details Section */}
                                <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 mt-4 font-semibold text-xs text-slate-700">
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Owner Name</span>
                                    <span className="text-slate-805 font-extrabold">{item.user.firstName} {item.user.lastName}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Owner NIC</span>
                                    <span className="text-slate-805 font-bold font-mono">{item.user.nic}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Mobile Number</span>
                                    <span className="text-slate-805 font-bold font-mono">{item.user.mobile}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Branch Reference</span>
                                    <span className="text-slate-505 font-bold">{item.user.referenceNumber}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons Row */}
                              <div className="flex items-center gap-2 border-t border-slate-100 pt-4 mt-5 select-none shrink-0 w-full justify-between">
                                <button
                                  onClick={() => setSelectedUserForModal(item.user)}
                                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-650 hover:text-slate-850 font-extrabold text-[11px] px-3.5 py-2.5 rounded-full transition-all active:scale-95 shadow-sm hover:scale-[1.01]"
                                >
                                  Profile
                                </button>
                                <button
                                  onClick={() => handleVerifyVehicle(item.user.nic, item.vehicle.numberPlate, "Approve")}
                                  disabled={isProcessing}
                                  className="flex-grow bg-[#0f2d3a] hover:bg-emerald-600 disabled:bg-slate-200 text-white font-extrabold text-[11px] py-2.5 rounded-full cursor-pointer transition-all duration-300 flex items-center justify-center gap-1 border-none active:scale-95 shadow-sm hover:shadow-[0_4px_12px_rgba(16,185,129,0.2)] hover:scale-[1.01]"
                                >
                                  {isProcessing ? "..." : (
                                    <>
                                      <svg className="w-3 h-3 text-white shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                      </svg>
                                      Approve
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleVerifyVehicle(item.user.nic, item.vehicle.numberPlate, "Reject")}
                                  disabled={isProcessing}
                                  className="bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-650 font-extrabold text-[11px] px-3 py-2.5 rounded-full cursor-pointer transition-all duration-250 active:scale-95 outline-none shadow-sm hover:scale-[1.01]"
                                >
                                  Reject
                                </button>
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  /* TAB 2: Confirmed Vehicles (Searchable list of all approved vehicles in branch) */
                  <div className="bg-white p-6 border border-slate-200 rounded-[28px] shadow-sm flex flex-col gap-6 animate-fade-in">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 select-none">
                      <div>
                        <h3 className="font-black text-slate-800 text-base">
                          All Verified Branch Vehicles
                        </h3>
                        <p className="text-slate-400 font-semibold text-xs mt-1">
                          A listing of all approved vehicles registered by policy holders inside your branch coverage.
                        </p>
                      </div>

                      {/* Search Bar */}
                      <div className="relative w-full max-w-[360px] bg-slate-50 border border-slate-200 rounded-full pl-4 pr-2 py-2 flex items-center gap-2 transition-all duration-200 focus-within:bg-white focus-within:border-[#f59e0b] focus-within:ring-4 focus-within:ring-[#f59e0b]/10">
                        <span className="text-slate-400 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </span>
                        <input
                          type="text"
                          placeholder="Search plate, policy, owner..."
                          value={confirmedSearch}
                          onChange={(e) => setConfirmedSearch(e.target.value)}
                          className="flex-1 bg-transparent text-slate-800 text-[13px] placeholder-slate-400 focus:outline-none font-semibold"
                        />
                      </div>
                    </div>

                    {filteredConfirmed.length === 0 ? (
                      <div className="py-20 text-center text-slate-400 font-bold text-xs select-none">
                        No confirmed vehicles found.
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                        <table className="min-w-full divide-y divide-slate-200 select-none text-left">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-5 py-3 text-slate-400 font-extrabold text-[11px] uppercase">Plate Number</th>
                              <th className="px-5 py-3 text-slate-400 font-extrabold text-[11px] uppercase">Type</th>
                              <th className="px-5 py-3 text-slate-400 font-extrabold text-[11px] uppercase">Make & Model</th>
                              <th className="px-5 py-3 text-slate-400 font-extrabold text-[11px] uppercase">Policy No</th>
                              <th className="px-5 py-3 text-slate-400 font-extrabold text-[11px] uppercase">Policy Holder (Owner)</th>
                              <th className="px-5 py-3 text-slate-400 font-extrabold text-[11px] uppercase">Engine / Chassis</th>
                              <th className="px-5 py-3 text-slate-400 font-extrabold text-[11px] uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-100 font-semibold text-xs text-slate-700">
                            {filteredConfirmed.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="px-5 py-4.5 font-black text-slate-800">
                                  {formatNumberPlate(item.vehicle.numberPlate)}
                                </td>
                                <td className="px-5 py-4.5 text-slate-600">
                                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                    {item.vehicle.vehicleType}
                                  </span>
                                </td>
                                <td className="px-5 py-4.5 text-slate-600">
                                  {item.vehicle.company} {item.vehicle.model} ({item.vehicle.year})
                                </td>
                                <td className="px-5 py-4.5 text-[#f59e0b] font-bold">
                                  {item.vehicle.policyNumber}
                                </td>
                                <td className="px-5 py-4.5">
                                  <div className="font-bold text-slate-800">{item.user.firstName} {item.user.lastName}</div>
                                  <div className="text-[10px] text-slate-400 font-medium">NIC: {item.user.nic} | Mob: {item.user.mobile}</div>
                                </td>
                                <td className="px-5 py-4.5 text-slate-400 text-[10px] leading-tight font-medium">
                                  <div>E: {item.vehicle.engineNumber || "N/A"}</div>
                                  <div className="mt-0.5">C: {item.vehicle.chassisNumber || "N/A"}</div>
                                </td>
                                <td className="px-5 py-4.5">
                                  <button
                                    onClick={() => setSelectedUserForModal(item.user)}
                                    className="text-[10px] font-extrabold text-[#f59e0b] hover:text-[#d97706] bg-[#f59e0b]/10 hover:bg-[#f59e0b]/20 border border-[#f59e0b]/20 px-3 py-1.5 rounded-full cursor-pointer transition-all outline-none"
                                  >
                                    View Owner
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}
          </main>
        </div>
      </div>

      {/* Owner Profile Details Modal */}
      {selectedUserForModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300 animate-fade-in text-slate-800">
          <div className="bg-white border border-slate-200 rounded-[28px] w-full max-w-[640px] max-h-[90vh] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col relative overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100 flex-shrink-0 select-none">
              <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">
                Policy Holder Details
              </h2>
              <button
                onClick={() => setSelectedUserForModal(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold border-none bg-transparent cursor-pointer outline-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 flex-1 overflow-y-auto">
              
              {/* Profile Card Header */}
              <div className="bg-slate-50 border border-slate-200/50 rounded-[22px] p-5 mb-6 flex items-center gap-4.5 shadow-sm select-none">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-amber-500 text-white text-xl font-black shadow-sm select-none">
                  {selectedUserForModal.firstName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-slate-800 font-black text-lg leading-none tracking-tight">
                    {selectedUserForModal.firstName} {selectedUserForModal.lastName}
                  </h3>
                  <p className="text-slate-400 font-bold text-xs mt-1.5">
                    Ref: {selectedUserForModal.referenceNumber} | Status: <span className="font-extrabold text-amber-500">{selectedUserForModal.status}</span>
                  </p>
                </div>
              </div>

              {/* 2-Column Info Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm font-semibold text-slate-700 mb-6 px-2 select-none">
                <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">NIC Number</span>
                  <span className="font-extrabold text-slate-800 text-sm">{selectedUserForModal.nic}</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Date of Birth</span>
                  <span className="font-extrabold text-slate-800 text-sm">{selectedUserForModal.dob || "N/A"}</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Mobile Number</span>
                  <span className="font-extrabold text-slate-800 text-sm">{selectedUserForModal.mobile}</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Email Address</span>
                  <span className="font-extrabold text-slate-800 text-sm">{selectedUserForModal.email}</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Province</span>
                  <span className="font-extrabold text-slate-800 text-sm">{selectedUserForModal.province || "N/A"}</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">City</span>
                  <span className="font-extrabold text-slate-800 text-sm">{selectedUserForModal.city || "N/A"}</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-slate-100 pb-2 sm:col-span-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Residential Address</span>
                  <span className="font-bold text-slate-800 text-sm">{selectedUserForModal.address || "N/A"}</span>
                </div>
              </div>

              {/* Registered Vehicles List */}
              <div className="select-none">
                <h4 className="font-black text-slate-800 text-sm mb-3">Registered Vehicles ({selectedUserForModal.vehicles?.length || 0})</h4>
                {selectedUserForModal.vehicles && selectedUserForModal.vehicles.length > 0 ? (
                  <div className="flex flex-col gap-3 max-h-[180px] overflow-y-auto pr-1">
                    {selectedUserForModal.vehicles.map((v: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-xs">
                        <div>
                          <div className="font-black text-slate-800">{formatNumberPlate(v.numberPlate)}</div>
                          <div className="text-slate-400 font-semibold mt-0.5">{v.company} {v.model} ({v.year})</div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          v.status === "Approved" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                          v.status === "Rejected" ? "bg-red-50 text-red-600 border border-red-100" :
                          "bg-amber-50 text-amber-600 border border-amber-100"
                        }`}>
                          {v.status || "Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 font-bold text-xs bg-slate-50 p-4 rounded-xl text-center border border-dashed border-slate-200">No vehicles registered.</p>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-8 py-4.5 bg-slate-50 border-t border-slate-150 flex justify-end flex-shrink-0">
              <button
                onClick={() => setSelectedUserForModal(null)}
                className="bg-slate-800 hover:bg-slate-900 border-none text-white font-black text-xs px-6 py-2.5 rounded-full transition-all cursor-pointer outline-none"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {isAddVehicleOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300 animate-fade-in text-slate-800">
          <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-[720px] max-h-[95vh] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col relative overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-10 pt-8 pb-5 border-b border-slate-100 flex-shrink-0 select-none">
              <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none">
                Register New Vehicle
              </h2>
              <p className="text-slate-400 font-semibold text-xs mt-2">
                Create and approve a new vehicle record directly for a branch policy holder.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleAddVehicleSubmit} className="flex-1 flex flex-col overflow-hidden">
              
              {/* Form Scrollable Body */}
              <div className="px-10 py-6 overflow-y-auto flex-1 flex flex-col gap-4">
                
                {addError && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-2 select-none animate-fade-in">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    {addError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  
                  {/* Select Policy Holder */}
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label className="text-slate-500 font-bold text-xs uppercase tracking-wider">Select Policy Holder *</label>
                    <select
                      value={selectedUserForAdd}
                      onChange={(e) => setSelectedUserForAdd(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all border border-slate-200 font-medium"
                      required
                    >
                      <option value="">-- Choose Approved Owner --</option>
                      {policyHolders.map((holder) => (
                        <option key={holder.nic} value={holder.nic}>
                          {holder.firstName} {holder.lastName} (NIC: {holder.nic})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Number Plate */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-500 font-bold text-xs uppercase tracking-wider">Number Plate *</label>
                    <input
                      type="text"
                      placeholder="e.g. WP-CAB-1234"
                      value={addNumberPlate}
                      onChange={(e) => setAddNumberPlate(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all border border-slate-200 font-semibold"
                      required
                    />
                  </div>

                  {/* Vehicle Type */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-500 font-bold text-xs uppercase tracking-wider">Vehicle Type *</label>
                    <select
                      value={addVehicleType}
                      onChange={(e) => setAddVehicleType(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all border border-slate-200 font-medium"
                      required
                    >
                      <option value="Car">Car</option>
                      <option value="SUV">SUV</option>
                      <option value="Van">Van</option>
                      <option value="Motorbike">Motorbike</option>
                      <option value="Lorry / Truck">Lorry / Truck</option>
                      <option value="Three-Wheeler">Three-Wheeler</option>
                      <option value="Bus">Bus</option>
                      <option value="Tractor">Tractor</option>
                    </select>
                  </div>

                  {/* Company */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-500 font-bold text-xs uppercase tracking-wider">Make / Brand *</label>
                    <input
                      type="text"
                      placeholder="e.g. Toyota"
                      value={addCompany}
                      onChange={(e) => setAddCompany(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all border border-slate-200 font-medium"
                      required
                    />
                  </div>

                  {/* Model */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-500 font-bold text-xs uppercase tracking-wider">Model *</label>
                    <input
                      type="text"
                      placeholder="e.g. Corolla"
                      value={addModel}
                      onChange={(e) => setAddModel(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all border border-slate-200 font-medium"
                      required
                    />
                  </div>

                  {/* Year */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-500 font-bold text-xs uppercase tracking-wider">Year of Manufacture *</label>
                    <input
                      type="text"
                      placeholder="e.g. 2021"
                      value={addYear}
                      onChange={(e) => setAddYear(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all border border-slate-200 font-medium"
                      required
                    />
                  </div>

                  {/* Policy Number */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-500 font-bold text-xs uppercase tracking-wider">Policy Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. SAN123456"
                      value={addPolicyNumber}
                      onChange={(e) => setAddPolicyNumber(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all border border-slate-200 font-semibold"
                      required
                    />
                  </div>

                  {/* Engine Number */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-500 font-bold text-xs uppercase tracking-wider">Engine Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. 1NZ-FE-77812"
                      value={addEngineNumber}
                      onChange={(e) => setAddEngineNumber(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all border border-slate-200 font-mono font-bold"
                      required
                    />
                  </div>

                  {/* Chassis Number */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-500 font-bold text-xs uppercase tracking-wider">Chassis Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. NZE141-88902"
                      value={addChassisNumber}
                      onChange={(e) => setAddChassisNumber(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all border border-slate-200 font-mono font-bold"
                      required
                    />
                  </div>

                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-10 py-5 bg-slate-50 border-t border-slate-150 flex justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleCancelAddVehicle}
                  className="bg-transparent hover:bg-slate-200/50 border border-solid border-slate-300 text-slate-600 font-black text-xs px-6 py-3 rounded-full transition-all cursor-pointer outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSubmitting}
                  className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 border-none text-white font-black text-xs px-8 py-3 rounded-full cursor-pointer transition-all shadow-sm active:scale-[0.98]"
                >
                  {addSubmitting ? "Registering..." : "Register Vehicle"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
