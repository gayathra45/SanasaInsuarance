"use client";

import React, { useState, useEffect } from "react";
import PolicyHolderNavbar from "@/app/Components/Policy_Holder/Navbar";
import PolicyHolderFooter from "@/app/Components/Policy_Holder/footer";
import Link from "next/link";
import { API_URL } from "@/app/config";

interface Vehicle {
  numberPlate: string;
  vehicleType: string;
  year: string;
  company: string;
  model: string;
  engineNumber: string;
  chassisNumber: string;
  policyNumber: string;
}

function formatNumberPlate(plate: string): string {
  if (!plate) return "";
  const cleaned = plate.trim();
  if (cleaned.includes("-")) {
    return cleaned;
  }
  const lastNumbersMatch = cleaned.match(/^(.*[A-Za-z]+)(\d+)$/);
  if (lastNumbersMatch) {
    return `${lastNumbersMatch[1].trim().toUpperCase()}-${lastNumbersMatch[2]}`;
  }
  return cleaned;
}

function getVehicleIconSvg(type: string, className = "w-10 h-10 text-slate-800") {
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
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-800 shadow-sm transition-all group-hover:scale-105 group-hover:bg-cyan-50 group-hover:border-cyan-200">
      {svg}
    </div>
  );
}

export default function MyVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVehicleForModal, setSelectedVehicleForModal] = useState<Vehicle | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newNumberPlate, setNewNumberPlate] = useState("");
  const [newVehicleType, setNewVehicleType] = useState("Car");
  const [newPolicyNumber, setNewPolicyNumber] = useState("");
  const [newEngineNumber, setNewEngineNumber] = useState("");
  const [newChassisNumber, setNewChassisNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const getAddCardTitle = () => {
    switch (activeCategory) {
      case "Car": return "Add a Car";
      case "SUV": return "Add an SUV";
      case "Bike": return "Add a Motorbike";
      case "Truck": return "Add a Lorry / Truck";
      default: return "Add Another Vehicle";
    }
  };

  const handleOpenAddVehicle = () => {
    if (activeCategory === "Car") setNewVehicleType("Car");
    else if (activeCategory === "SUV") setNewVehicleType("SUV");
    else if (activeCategory === "Bike") setNewVehicleType("Motorbike");
    else if (activeCategory === "Truck") setNewVehicleType("Lorry / Truck");
    else if (activeCategory === "Other") setNewVehicleType("Van");
    else setNewVehicleType("Car");
    setIsAddVehicleOpen(true);
  };

  const handleAddVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!newCompany.trim() || !newModel.trim() || !newYear.trim() || !newNumberPlate.trim() || !newVehicleType.trim() || !newPolicyNumber.trim() || !newEngineNumber.trim() || !newChassisNumber.trim()) {
      setValidationError("All fields are required.");
      return;
    }

    const cleanPlate = newNumberPlate.replace(/[\s-]/g, "");
    if (cleanPlate.length < 5 || cleanPlate.length > 10 || !/^[A-Za-z0-9]+$/.test(cleanPlate)) {
      setValidationError("Number Plate must be an alphanumeric mix between 5 and 10 characters.");
      return;
    }

    if (!/^\d{4}$/.test(newYear.trim())) {
      setValidationError("Year must be a 4-digit number.");
      return;
    }

    const cleanPolicy = newPolicyNumber.replace(/[\s-]/g, "");
    if (!/^SAN[A-Za-z0-9]{5,9}$/i.test(cleanPolicy)) {
      setValidationError("Policy Number must start with 'SAN' and be between 8 and 12 alphanumeric characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const userStr = sessionStorage.getItem("logged_in_user");
      if (!userStr) {
        setValidationError("User session expired. Please log in again.");
        setIsSubmitting(false);
        return;
      }
      const user = JSON.parse(userStr);
      const nic = user.nic;

      const res = await fetch(`${API_URL}/policy-holder/add-vehicle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nic,
          company: newCompany.trim(),
          model: newModel.trim(),
          year: newYear.trim(),
          numberPlate: newNumberPlate.trim(),
          vehicleType: newVehicleType.trim(),
          policyNumber: newPolicyNumber.trim(),
          engineNumber: newEngineNumber.trim(),
          chassisNumber: newChassisNumber.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setValidationError(data.error || "Failed to add vehicle.");
        setIsSubmitting(false);
        return;
      }

      setVehicles(data.vehicles || [...vehicles, data.vehicle]);
      
      const updatedUser = { ...user, vehicles: data.vehicles || [...user.vehicles, data.vehicle] };
      sessionStorage.setItem("logged_in_user", JSON.stringify(updatedUser));

      setIsAddVehicleOpen(false);
      setNewCompany("");
      setNewModel("");
      setNewYear("");
      setNewNumberPlate("");
      setNewVehicleType("Car");
      setNewPolicyNumber("");
      setNewEngineNumber("");
      setNewChassisNumber("");

      triggerToast("Vehicle added successfully!");
    } catch (err) {
      console.error("Add vehicle request failed", err);
      setValidationError("Unable to connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };


  // 1. Fetch vehicles list from Database
  useEffect(() => {
    if (typeof window !== "undefined") {
      const fetchVehicles = async () => {
        setIsLoading(true);
        const userStr = sessionStorage.getItem("logged_in_user");
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user.nic) {
              const res = await fetch(`${API_URL}/policy-holder/vehicles?nic=${encodeURIComponent(user.nic)}`, {
                cache: "no-store"
              });
              if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data.vehicles) && data.vehicles.length > 0) {
                  setVehicles(data.vehicles);
                  setIsLoading(false);
                  return;
                }
              }
              // Fallback to locally stored user vehicles
              if (user.vehicles && Array.isArray(user.vehicles)) {
                setVehicles(user.vehicles);
                setIsLoading(false);
                return;
              }
            }
          } catch (err) {
            console.error("Error fetching vehicles:", err);
          }
        }
        
        // Fallback mockup details
        const fallbackVehicles: Vehicle[] = [
          {
            numberPlate: "CBH-3202",
            vehicleType: "Car",
            year: "2019",
            company: "Toyota",
            model: "Corolla",
            engineNumber: "1NZ-FE-3849204",
            chassisNumber: "NZE141-8930492",
            policyNumber: "POL-V-930492"
          },
          {
            numberPlate: "NE-7856",
            vehicleType: "Lorry",
            year: "2016",
            company: "Ashok Leyland",
            model: "Lorry",
            engineNumber: "AL-6DTI-930294",
            chassisNumber: "AL-TRK-7492049",
            policyNumber: "POL-V-120492"
          }
        ];
        setVehicles(fallbackVehicles);
        setIsLoading(false);
      };

      fetchVehicles();
    }
  }, []);

  // 2. Auto-open modal if plate query param is present in URL
  useEffect(() => {
    if (typeof window !== "undefined" && vehicles.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const plate = urlParams.get("plate");
      if (plate) {
        const matchingVehicle = vehicles.find(
          v => v.numberPlate.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() === plate.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
        );
        if (matchingVehicle) {
          setSelectedVehicleForModal(matchingVehicle);
        }
      }
    }
  }, [vehicles]);

  // 3. Disable body scroll when modal is active
  useEffect(() => {
    if (selectedVehicleForModal || isAddVehicleOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedVehicleForModal, isAddVehicleOpen]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleDownloadCoverNote = (vehicle: Vehicle) => {
    triggerToast(`Generating insurance certificate for ${formatNumberPlate(vehicle.numberPlate)}...`);
    setTimeout(() => {
      const element = document.createElement("a");
      const file = new Blob([
        `SANASA GENERAL INSURANCE COMPANY LIMITED\n`,
        `POLICY CERTIFICATE / COVER NOTE\n`,
        `========================================\n`,
        `Policy Number: ${vehicle.policyNumber}\n`,
        `Vehicle Number Plate: ${formatNumberPlate(vehicle.numberPlate)}\n`,
        `Vehicle Type: ${vehicle.vehicleType}\n`,
        `Make & Model: ${vehicle.company} ${vehicle.model} (${vehicle.year})\n`,
        `Engine Number: ${vehicle.engineNumber}\n`,
        `Chassis Number: ${vehicle.chassisNumber}\n`,
        `Coverage Status: ACTIVE\n`,
        `Validity Period: 2026-01-01 to 2026-12-31\n`,
        `Authorized Signature: Sanasa General Insurance Co. LTD.`
      ], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `Sanasa_Policy_${vehicle.numberPlate}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      triggerToast(`Successfully downloaded Cover Note for ${formatNumberPlate(vehicle.numberPlate)}!`);
    }, 1200);
  };

  // Filter criteria: Search query & Category Tab
  const filteredVehicles = vehicles.filter((v) => {
    const term = searchQuery.toLowerCase();
    const matchesSearch =
      v.numberPlate.toLowerCase().includes(term) ||
      v.company.toLowerCase().includes(term) ||
      v.model.toLowerCase().includes(term) ||
      v.policyNumber.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (activeCategory === "All") return true;
    const cat = activeCategory.toLowerCase();
    const vType = v.vehicleType.toLowerCase();

    if (cat === "car") return vType.includes("car");
    if (cat === "suv") return vType.includes("suv");
    if (cat === "bike") return vType.includes("bike") || vType.includes("motorcycle") || vType.includes("scooter");
    if (cat === "truck") return vType.includes("truck") || vType.includes("lorry");
    if (cat === "other") {
      return !vType.includes("car") && !vType.includes("suv") && !vType.includes("bike") && !vType.includes("motorcycle") && !vType.includes("scooter") && !vType.includes("truck") && !vType.includes("lorry");
    }

    return true;
  });

  const categories = [
    { id: "All", label: "All Vehicles" },
    { id: "Car", label: "Cars" },
    { id: "SUV", label: "SUVs" },
    { id: "Bike", label: "Motorbikes" },
    { id: "Truck", label: "Trucks / Lorries" },
    { id: "Other", label: "Others" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      <PolicyHolderNavbar />

      {/* Styled curved header with premium background gradient */}
      <div className="max-w-7xl w-full mx-auto px-6 md:px-16 mt-8 relative">
        {/* Absolute positioned background banner spanning to left edge of screen */}
        <div className="absolute top-0 bottom-0 left-[calc(50%-50vw)] right-6 md:right-12 bg-[url('/policy1.jpg')] bg-cover bg-center rounded-r-[75px] md:rounded-r-[95px] overflow-hidden shadow-md">
          {/* Dark slate/teal gradient overlay */}
          <div className="absolute inset-0 bg-slate-950/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
        </div>

        {/* Text content aligned automatically with the page container */}
        <header className="relative z-10 h-[210px] flex flex-col justify-center pl-4 md:pl-8 select-none">
          <h1 className="text-white text-3xl md:text-[40px] font-extrabold tracking-tight leading-none">
            My Vehicles
          </h1>
          <p className="text-slate-200 text-xs md:text-sm font-semibold mt-3.5 tracking-wide opacity-95">
            Manage your registered vehicles and view coverage policies
          </p>
        </header>
      </div>

      {/* Main Grid Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-16 py-10 relative z-20">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-8 z-50 bg-[#00ddff] text-black font-extrabold px-6 py-4.5 rounded-2xl shadow-xl animate-bounce flex items-center gap-3 border-2 border-black">
            <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Dynamic Stat Summary Section */}
        <section className="-mt-14 grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          {/* Total Vehicles Card */}
          <div className="bg-white px-6 py-5 rounded-[22px] border border-slate-100 shadow-[0_12px_32px_rgba(0,0,0,0.04)] flex items-center gap-5">
            <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center text-cyan-600 flex-shrink-0">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.8C2.1 11 2 11.3 2 11.5V16c0 .6.4 1 1 1h2" />
                <circle cx="7" cy="17" r="2" />
                <path d="M9 17h6" />
                <circle cx="17" cy="17" r="2" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 leading-none">{vehicles.length}</h3>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mt-1">Total Insured</p>
            </div>
          </div>

          {/* Active Policies Card */}
          <div className="bg-white px-6 py-5 rounded-[22px] border border-slate-100 shadow-[0_12px_32px_rgba(0,0,0,0.04)] flex items-center gap-5">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 leading-none">
                {vehicles.filter(v => v.policyNumber).length}
              </h3>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mt-1">Active Policies</p>
            </div>
          </div>
        </section>

        {/* Filtering & Search Controls Panel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8 bg-white border border-slate-200/80 p-5 rounded-[26px] shadow-sm select-none">
          {/* Real-time Category Selector tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2.5 rounded-full font-bold text-[13px] md:text-sm tracking-wide transition-all outline-none border cursor-pointer select-none ${
                  activeCategory === cat.id
                    ? "bg-[#00ddff] border-[#00c8e6] text-black shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search bar matching design guidelines */}
          <div className="relative w-full md:max-w-[300px]">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search make, plate, or policy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 rounded-full py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#00ddff] transition-all border border-slate-200 font-medium"
            />
            {searchQuery.length > 0 && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Vehicles Display Grid */}
        {isLoading ? (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-[30px] p-8 shadow-sm flex flex-col items-center justify-center">
            <svg className="w-12 h-12 text-[#00ddff] animate-spin mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-slate-500 font-bold text-base">Retrieving your vehicles list...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* If no vehicles match the criteria, show a helpful inner-grid card */}
            {filteredVehicles.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-[30px] p-6.5 shadow-sm flex flex-col justify-center items-center text-center min-h-[280px]">
                <div className="w-16 h-16 bg-slate-50 border border-slate-200/50 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <h4 className="text-slate-800 font-extrabold text-base mb-1">
                  No {activeCategory === "All" ? "Vehicles" : activeCategory === "Bike" ? "Motorbikes" : activeCategory === "Truck" ? "Trucks / Lorries" : activeCategory + "s"} Found
                </h4>
                <p className="text-slate-400 font-semibold text-xs max-w-[240px] leading-relaxed mb-4">
                  {searchQuery ? `We couldn't find any vehicles matching "${searchQuery}".` : `No vehicles are currently registered under this category.`}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="bg-[#0f2d3a] hover:bg-[#0b222c] text-white font-bold text-xs px-4 py-2 rounded-full transition-all cursor-pointer border-none"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}

            {filteredVehicles.map((vehicle) => {
              return (
                <div
                  key={vehicle.numberPlate}
                  className="bg-white border border-slate-200 rounded-[30px] p-6.5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1"
                >
                  {/* Decorative faint background accent */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-[100px] pointer-events-none group-hover:bg-cyan-50/50 transition-colors" />

                  <div>
                    {/* Header Row: Icon + Plate Number & Status */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-4">
                        {getVehicleIconContainer(vehicle.vehicleType)}
                        <div>
                          <h3 className="text-slate-800 font-black text-lg md:text-xl tracking-tight leading-none">
                            {formatNumberPlate(vehicle.numberPlate)}
                          </h3>
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-50/70 border border-emerald-100 rounded-full px-2.5 py-0.5 mt-1.5 select-none">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Active Coverage</span>
                          </span>
                        </div>
                      </div>

                      {/* Small visual card details pill */}
                      <span className="text-slate-400 font-bold text-xs bg-slate-100 border border-slate-200/50 rounded-full px-3 py-1 self-start select-none">
                        {vehicle.year}
                      </span>
                    </div>

                    {/* Technical details rows */}
                    <div className="flex flex-col gap-3.5 border-t border-slate-100 pt-4.5">
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <span className="text-slate-400">Make & Model</span>
                        <span className="text-slate-800 font-extrabold">{vehicle.company} {vehicle.model}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <span className="text-slate-400">Policy Number</span>
                        <span className="text-slate-800 font-extrabold tracking-wide">{vehicle.policyNumber || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <span className="text-slate-400">Vehicle Type</span>
                        <span className="text-slate-800 font-extrabold">{vehicle.vehicleType}</span>
                      </div>
                    </div>
                  </div>

                  {/* View Details CTA Button */}
                  <div className="mt-6 pt-4.5 border-t border-slate-100 flex-shrink-0">
                    <button
                      onClick={() => setSelectedVehicleForModal(vehicle)}
                      className="w-full bg-[#00ddff] hover:bg-[#00c8e6] text-black font-extrabold text-xs md:text-sm py-3 rounded-full text-center transition-all flex items-center justify-center gap-2 cursor-pointer border-none shadow-sm hover:scale-[1.02] active:scale-[0.98] outline-none"
                    >
                      <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Dashed Add Vehicle Card in the Grid */}
            <button
              onClick={handleOpenAddVehicle}
              className="bg-transparent border-2 border-dashed border-slate-300 hover:border-[#00ddff] hover:bg-slate-50/50 rounded-[30px] p-6.5 min-h-[280px] flex flex-col items-center justify-center gap-4 transition-all duration-300 group cursor-pointer w-full text-slate-800"
            >
              <div className="w-16 h-16 rounded-full bg-slate-100 group-hover:bg-cyan-50 flex items-center justify-center text-slate-400 group-hover:text-[#00ddff] transition-all">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div className="text-center select-none">
                <h4 className="text-slate-700 font-extrabold text-base mb-1 group-hover:text-[#0f2d3a] transition-all">
                  {getAddCardTitle()}
                </h4>
                <p className="text-slate-400 font-semibold text-xs max-w-[220px] leading-relaxed">Register another vehicle to your active policy coverage</p>
              </div>
            </button>
          </div>
        )}

        {/* Supportive Help Banner */}
        <section className="bg-slate-800 border border-slate-900 rounded-[30px] p-6.5 mt-12 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_15px_30px_rgba(0,0,0,0.06)]">
          <div className="max-w-2xl text-center md:text-left select-none">
            <h4 className="text-lg font-black tracking-tight mb-1 text-white">Need to update your vehicle registry?</h4>
            <p className="text-slate-300 text-xs md:text-sm font-semibold leading-relaxed m-0">
              If any of your insured vehicles are missing, or if you recently upgraded your coverage plan, please reach out to our Galle regional office staff or message your assigned insurance agent.
            </p>
          </div>
          <Link
            href="/Policy_Holder/Contact"
            className="bg-[#ff9800] hover:bg-[#e68900] text-white font-extrabold text-sm px-8 py-3.5 rounded-full transition-all no-underline shadow-md whitespace-nowrap"
          >
            Contact Support
          </Link>
        </section>

      </main>

      {/* Vehicle Detail Popup Modal */}
      {selectedVehicleForModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-[28px] w-full max-w-[620px] max-h-[90vh] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col relative overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-8 pt-6 pb-4 border-b border-slate-200 flex-shrink-0">
              <h2 className="text-[20px] md:text-[22px] font-extrabold text-[#0f2d3a] tracking-tight leading-none">
                Vehicle Specifications
              </h2>
              <button
                onClick={() => setSelectedVehicleForModal(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold border-none bg-transparent cursor-pointer outline-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 flex-1 overflow-y-auto">
              
              {/* Profile Card Header inside modal */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-[22px] p-5 mb-6 flex items-center gap-4.5 shadow-sm select-none">
                {getVehicleIconContainer(selectedVehicleForModal.vehicleType)}
                <div>
                  <h3 className="text-[#0f2d3a] font-black text-xl leading-none tracking-tight">
                    {selectedVehicleForModal.company} {selectedVehicleForModal.model}
                  </h3>
                  <p className="text-slate-400 font-bold text-xs mt-1.5">
                    Year: {selectedVehicleForModal.year} | Type: {selectedVehicleForModal.vehicleType}
                  </p>
                </div>
              </div>

              {/* 2-Column Specs Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 text-sm font-semibold text-slate-700 mb-8 px-2">
                <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Number Plate</span>
                  <span className="font-extrabold text-slate-800 text-base">{formatNumberPlate(selectedVehicleForModal.numberPlate)}</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Policy Number</span>
                  <span className="font-extrabold text-slate-800 text-base tracking-wide">{selectedVehicleForModal.policyNumber || "N/A"}</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Engine Number</span>
                  <span className="font-bold text-slate-800 font-mono text-[13px]">{selectedVehicleForModal.engineNumber || "N/A"}</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Chassis Number</span>
                  <span className="font-bold text-slate-800 font-mono text-[13px]">{selectedVehicleForModal.chassisNumber || "N/A"}</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Insurance Coverage</span>
                  <span className="font-extrabold text-emerald-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    Active Coverage
                  </span>
                </div>
                <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Renewal Cycle</span>
                  <span className="font-extrabold text-slate-800">Annual (Jan 01 - Dec 31)</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-slate-100 pb-2 sm:col-span-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Insurance Plan Type</span>
                  <span className="font-extrabold text-slate-800">Comprehensive Vehicle Insurance Plan</span>
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="flex gap-4 border-t border-slate-100 pt-6">
                <Link
                  href={`/Policy_Holder/New_Claim?plate=${encodeURIComponent(selectedVehicleForModal.numberPlate)}`}
                  onClick={() => setSelectedVehicleForModal(null)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm py-3.5 rounded-full text-center no-underline shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  File a Claim
                </Link>
                <button
                  onClick={() => handleDownloadCoverNote(selectedVehicleForModal)}
                  className="flex-1 bg-[#1fcbf2] hover:bg-[#00b2d6] text-white font-extrabold text-sm py-3.5 rounded-full text-center cursor-pointer border-none shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Cover Note
                </button>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex justify-end flex-shrink-0">
              <button
                onClick={() => setSelectedVehicleForModal(null)}
                className="bg-[#1a365d] hover:bg-[#0f223f] text-white font-extrabold text-[14px] px-8 py-2.5 rounded-full transition-all border-none cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add Vehicle Popup Modal */}
      {isAddVehicleOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-[720px] max-h-[95vh] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col relative overflow-hidden text-slate-800">
            
            {/* Modal Header */}
            <div className="px-10 pt-8 pb-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-2xl font-black text-black tracking-tight leading-none">
                Add Vehicle
              </h2>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddVehicleSubmit} className="flex-1 flex flex-col overflow-hidden">
              
              {/* Form Content */}
              <div className="px-10 py-6 overflow-y-auto flex-1 flex flex-col gap-4">
                
                {validationError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 font-bold text-xs rounded-xl p-3 select-none">
                    {validationError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  {/* Number Plate */}
                  <div className="flex flex-col gap-1">
                    <label className="text-black text-[13.5px] font-bold block mb-1">
                      Number Plate <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. WP-CBH-3202"
                      value={newNumberPlate}
                      onChange={(e) => setNewNumberPlate(e.target.value)}
                      className="w-full bg-slate-100/90 text-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#00ddff] focus:bg-white transition-all border border-transparent font-semibold"
                    />
                  </div>

                  {/* Vehicle Type select with dynamic preview */}
                  <div className="flex flex-col gap-1">
                    <label className="text-black text-[13.5px] font-bold block mb-1">
                      Vehicle Type <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100 border border-slate-200 text-slate-800 shadow-inner flex-shrink-0">
                        {getVehicleIconSvg(newVehicleType, "w-8 h-8 text-slate-700")}
                      </div>
                      <select
                        value={newVehicleType}
                        onChange={(e) => setNewVehicleType(e.target.value)}
                        className="flex-1 bg-slate-100/90 text-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#00ddff] focus:bg-white transition-all border border-transparent font-semibold cursor-pointer"
                      >
                        <option value="Car">Car</option>
                        <option value="SUV">SUV</option>
                        <option value="Cab / Double Cab">Cab / Double Cab</option>
                        <option value="Van">Van</option>
                        <option value="Motorbike">Motorbike</option>
                        <option value="Three-Wheeler">Three-Wheeler</option>
                        <option value="Lorry / Truck">Lorry / Truck</option>
                        <option value="Bus">Bus</option>
                        <option value="Tractor">Tractor</option>
                      </select>
                    </div>
                  </div>

                  {/* Company input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-black text-[13.5px] font-bold block mb-1">
                      Company <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Toyota"
                      value={newCompany}
                      onChange={(e) => setNewCompany(e.target.value)}
                      className="w-full bg-slate-100/90 text-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#00ddff] focus:bg-white transition-all border border-transparent font-semibold"
                    />
                  </div>

                  {/* Model input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-black text-[13.5px] font-bold block mb-1">
                      Model <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Corolla"
                      value={newModel}
                      onChange={(e) => setNewModel(e.target.value)}
                      className="w-full bg-slate-100/90 text-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#00ddff] focus:bg-white transition-all border border-transparent font-semibold"
                    />
                  </div>

                  {/* Year input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-black text-[13.5px] font-bold block mb-1">
                      Year <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2020"
                      value={newYear}
                      onChange={(e) => setNewYear(e.target.value)}
                      className="w-full bg-slate-100/90 text-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#00ddff] focus:bg-white transition-all border border-transparent font-semibold"
                    />
                  </div>

                  {/* Policy Number input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-black text-[13.5px] font-bold block mb-1">
                      Insurance Policy Number <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SAN12345"
                      value={newPolicyNumber}
                      onChange={(e) => setNewPolicyNumber(e.target.value)}
                      className="w-full bg-slate-100/90 text-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#00ddff] focus:bg-white transition-all border border-transparent font-semibold"
                    />
                  </div>

                  {/* Engine Number input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-black text-[13.5px] font-bold block mb-1">
                      Engine Number <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1NZ-FE-xxxx"
                      value={newEngineNumber}
                      onChange={(e) => setNewEngineNumber(e.target.value)}
                      className="w-full bg-slate-100/90 text-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#00ddff] focus:bg-white transition-all border border-transparent font-semibold font-mono"
                    />
                  </div>

                  {/* Chassis Number input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-black text-[13.5px] font-bold block mb-1">
                      Chassis Number <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. NZE141-xxxx"
                      value={newChassisNumber}
                      onChange={(e) => setNewChassisNumber(e.target.value)}
                      className="w-full bg-slate-100/90 text-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#00ddff] focus:bg-white transition-all border border-transparent font-semibold font-mono"
                    />
                  </div>
                </div>

                {/* Important warning banner */}
                <div className="text-[11px] md:text-xs text-slate-600 font-semibold flex items-start gap-1 mt-4 select-none">
                  <span className="text-yellow-500 mr-1 flex-shrink-0">⚠️</span>
                  <span>
                    <strong>Important:</strong> Your vehicle will be reviewed by office staff before submit. This usually takes 1-2 business days. You&apos;ll receive an email once approved
                  </span>
                </div>

              </div>

              {/* Modal Footer actions */}
              <div className="px-10 pb-8 pt-4 bg-white flex justify-between gap-6 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddVehicleOpen(false)}
                  className="bg-[#19385a] hover:bg-[#11273f] text-white font-extrabold text-sm py-3.5 px-10 rounded-full transition-all cursor-pointer border-none shadow-md flex items-center justify-center gap-1 hover:scale-[1.02] active:scale-[0.98]"
                >
                  &lt; Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#19385a] hover:bg-[#11273f] disabled:bg-slate-300 text-white font-extrabold text-sm py-3.5 px-12 rounded-full transition-all cursor-pointer border-none shadow-md flex items-center justify-center gap-1 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSubmitting ? "Submitting..." : "Submit >"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Floating Chat Support Bubble */}
      <button
        className="fixed bottom-8 right-8 z-40 bg-[#00ddff] hover:bg-[#00c8e6] text-white p-4.5 rounded-full shadow-2xl transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer focus:outline-none border-none flex items-center justify-center"
        aria-label="Chat support"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2.1 21.5l4.63-.827A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-3.5 11a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3.5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3.5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" clipRule="evenodd" />
        </svg>
      </button>

      <PolicyHolderFooter />
    </div>
  );
}
