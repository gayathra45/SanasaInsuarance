"use client";

import React, { useState, useEffect } from "react";
import PolicyHolderNavbar from "@/app/Components/Policy_Holder/Navbar";
import PolicyHolderFooter from "@/app/Components/Policy_Holder/footer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_URL } from "@/app/config";

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

function getVehicleEmoji(type: string): string {
  if (!type) return "🚗";
  const t = type.toLowerCase().trim();
  if (t.includes("suv")) return "🚙";
  if (t.includes("cab") || t.includes("pickup")) return "🛻";
  if (t.includes("van") || t.includes("minibus")) return "🚐";
  if (t.includes("bike") || t.includes("motorcycle") || t.includes("scooter")) return "🏍️";
  if (t.includes("three") || t.includes("rickshaw") || t.includes("tuk")) return "🛺";
  if (t.includes("lorry") || t.includes("truck")) return "🚛";
  if (t.includes("bus")) return "🚌";
  if (t.includes("tractor")) return "🚜";
  return "🚗";
}

interface Vehicle {
  numberPlate: string;
  vehicleType: string;
  year: string;
  company: string;
  model: string;
  engineNumber?: string;
  chassisNumber?: string;
  policyNumber?: string;
}

export default function FileNewClaim() {
  const router = useRouter();

  // State for form fields
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [damageType, setDamageType] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("Colombo, Sri Lanka");
  const [isLocating, setIsLocating] = useState(false);

  // Load vehicles from sessionStorage or fetch from backend on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const loadVehicles = async () => {
        // 1. Try to load from logged_in_user session and fetch from backend
        const userStr = sessionStorage.getItem("logged_in_user");
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user.nic) {
              const res = await fetch(`${API_URL}/policy-holder/vehicles?nic=${user.nic}`);
              if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data.vehicles) && data.vehicles.length > 0) {
                  setVehicles(data.vehicles);
                  return;
                }
              }
              // Fallback to locally stored user vehicles if API fetch fails
              if (Array.isArray(user.vehicles) && user.vehicles.length > 0) {
                setVehicles(user.vehicles);
                return;
              }
            }
          } catch (err) {
            console.error("Error loading user vehicles from database", err);
          }
        }

        // 2. Try to load from signup details
        try {
          const savedVehiclesStr = sessionStorage.getItem("signup_vehicle_details");
          if (savedVehiclesStr) {
            const parsed = JSON.parse(savedVehiclesStr);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setVehicles(parsed);
              return;
            }
          }
        } catch (err) {
          console.error("Error loading vehicles from sessionStorage", err);
        }

        // 3. Final Fallback vehicles
        const fallbackVehicles: Vehicle[] = [
          { numberPlate: "CBH-3202", vehicleType: "Car", year: "2019", company: "Toyota", model: "Corolla" },
          { numberPlate: "NE-7856", vehicleType: "Lorry", year: "2016", company: "Ashok Leyland", model: "Lorry" }
        ];
        setVehicles(fallbackVehicles);
      };

      loadVehicles();
    }
  }, []);

  // Pre-select vehicle if plate parameter is present in URL
  useEffect(() => {
    if (typeof window !== "undefined" && vehicles.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const plate = urlParams.get("plate");
      if (plate) {
        const matchingVehicle = vehicles.find(
          v => v.numberPlate.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() === plate.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
        );
        if (matchingVehicle) {
          setSelectedVehicle(matchingVehicle.numberPlate);
        }
      }
    }
  }, [vehicles]);

  // Preset Damage Types
  const damageTypes = [
    "Front Bumper / Grille Damage",
    "Rear Bumper Damage",
    "Side Scratch / Dent (Left/Right)",
    "Windshield / Glass Crack",
    "Engine / Mechanical Failure",
    "Suspension Damage",
    "Total Loss / Rollover",
    "Other Accident Damage"
  ];

  // Geolocation Handler
  const handleGPSLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      setAddress("123 Galle Road, Colombo, Sri Lanka");
      return;
    }

    setIsLocating(true);

    const getPosition = (options: PositionOptions): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });
    };

    const tryGetLocation = async () => {
      try {
        let position;
        try {
          // Try high accuracy with a shorter 5s timeout
          position = await getPosition({ enableHighAccuracy: true, timeout: 5000 });
        } catch (highAccError: any) {
          console.warn("High accuracy geolocation failed or timed out, trying low accuracy...", highAccError.message);
          // Fall back to low accuracy with 10s timeout
          position = await getPosition({ enableHighAccuracy: false, timeout: 10000 });
        }

        const { latitude, longitude } = position.coords;

        try {
          // Reverse-geocoding using OpenStreetMap Nominatim API
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                "Accept-Language": "en"
              }
            }
          );
          const data = await res.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          } else {
            setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          }
        } catch (geocodeError) {
          console.warn("Reverse geocoding failed, falling back to coordinates:", geocodeError);
          setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
      } catch (err: any) {
        console.warn("Geolocation failed:", err);
        let errorMsg = "Could not retrieve your location.";
        if (err.code === 1) { // PERMISSION_DENIED
          errorMsg = "Location access was denied. Please allow location permissions in your browser settings for this website.";
        } else if (err.code === 2) { // POSITION_UNAVAILABLE
          errorMsg = "Location information is unavailable on your device.";
        } else if (err.code === 3) { // TIMEOUT
          errorMsg = "Location request timed out. Please check your network or device GPS.";
        }
        alert(errorMsg);
        setAddress("123 Galle Road, Colombo, Sri Lanka");
      } finally {
        setIsLocating(false);
      }
    };

    tryGetLocation();
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !incidentDate || !incidentTime || !damageType || !description || !address) {
      alert("Please fill in all required fields marked with *");
      return;
    }

    // Retrieve userNic from session storage
    let userNic = "123456789V";
    if (typeof window !== "undefined") {
      const userStr = sessionStorage.getItem("logged_in_user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.nic) userNic = user.nic;
        } catch (err) {
          console.error("Error parsing user context", err);
        }
      }
    }

    const claimPayload = {
      userNic,
      selectedVehicle,
      incidentDate,
      incidentTime,
      damageType,
      description,
      address,
      status: "In Progress",
      createdAt: new Date().toISOString()
    };
    sessionStorage.setItem("current_claim_draft", JSON.stringify(claimPayload));
    
    router.push("/Policy_Holder/New_Claim/page1");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans relative">
      <PolicyHolderNavbar />

      {/* Styled curved header matching the mockup exactly */}
      <div className="max-w-4xl w-full mx-auto px-6 md:px-12 mt-8 relative">
        {/* Absolute positioned background banner spanning to left edge of screen */}
        <div className="absolute top-0 bottom-0 left-[calc(50%-50vw)] right-6 md:right-12 bg-[url('/newclaim1.webp')] bg-cover bg-center rounded-r-[75px] md:rounded-r-[95px] overflow-hidden shadow-md">
          {/* Mockup dark slate overlay */}
          <div className="absolute inset-0 bg-slate-900/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d2a3a]/90 via-[#0d2a3a]/75 to-transparent" />
        </div>

        {/* Text content aligned automatically with the page container */}
        <header className="relative z-10 h-[210px] flex flex-col justify-center pl-4 md:pl-8 select-none">
          <h1 className="text-white text-3xl md:text-[40px] font-bold tracking-tight leading-none">
            File New Claim
          </h1>
          <p className="text-slate-200 text-xs md:text-sm font-semibold mt-3.5 tracking-wide opacity-95">
            Report an accident or damage incident
          </p>
        </header>
      </div>

      {/* Main Content Form */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 md:px-12 py-10">
        <form onSubmit={handleNext} className="flex flex-col gap-10">
          
          {/* Section 1: Vehicle & Incident */}
          <section className="flex flex-col gap-6">
            <h2 className="text-2xl md:text-[28px] font-bold text-[#0d2a3a] tracking-tight flex items-center gap-5 mt-4 select-none">
              Vehicle & Incident <span className="font-semibold text-2xl text-[#0d2a3a]">&gt;</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Select Vehicle Dropdown */}
              <div className="flex flex-col gap-2">
                <label className="text-slate-800 text-sm font-semibold mb-1">
                  Select Vehicle <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={selectedVehicle}
                    onChange={(e) => setSelectedVehicle(e.target.value)}
                    className="w-full bg-[#e2e8f0]/80 hover:bg-[#e2e8f0]/95 text-slate-800 rounded-2xl py-3.5 px-4 pr-10 appearance-none border border-transparent focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00ddff] focus:border-transparent font-medium transition-all cursor-pointer"
                  >
                    <option value="" disabled>Select Vehicle</option>
                    {vehicles.map((v) => (
                      <option key={v.numberPlate} value={v.numberPlate}>
                        {formatNumberPlate(v.numberPlate)} - {v.company} {v.model} ({v.year})
                      </option>
                    ))}
                  </select>
                  <span className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </span>
                </div>
              </div>

              {/* Incident Date */}
              <div className="flex flex-col gap-2">
                <label className="text-slate-800 text-sm font-semibold mb-1">
                  Incident Date <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full bg-[#e2e8f0]/80 text-slate-800 rounded-2xl py-3.5 px-4 pr-10 border border-transparent focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00ddff] focus:border-transparent font-medium transition-all"
                  />
                </div>
              </div>

              {/* Incident Time */}
              <div className="flex flex-col gap-2">
                <label className="text-slate-800 text-sm font-semibold mb-1">
                  Incident Time <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <input
                    type="time"
                    required
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                    className="w-full bg-[#e2e8f0]/80 text-slate-800 rounded-2xl py-3.5 px-4 pr-10 border border-transparent focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00ddff] focus:border-transparent font-medium transition-all"
                  />
                </div>
              </div>

              {/* Damage Type Dropdown */}
              <div className="flex flex-col gap-2">
                <label className="text-slate-800 text-sm font-semibold mb-1">
                  Damage Type <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={damageType}
                    onChange={(e) => setDamageType(e.target.value)}
                    className="w-full bg-[#e2e8f0]/80 hover:bg-[#e2e8f0]/95 text-slate-800 rounded-2xl py-3.5 px-4 pr-10 appearance-none border border-transparent focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00ddff] focus:border-transparent font-medium transition-all cursor-pointer"
                  >
                    <option value="" disabled>Select Damage Type</option>
                    {damageTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <span className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </span>
                </div>
              </div>

            </div>

            {/* Description Textarea */}
            <div className="flex flex-col gap-2 mt-2">
              <label className="text-slate-800 text-sm font-semibold mb-1">
                Description <span className="text-red-500 ml-0.5">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#e2e8f0]/80 text-slate-800 rounded-2xl p-4 border border-transparent focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00ddff] focus:border-transparent font-medium transition-all"
              />
            </div>
          </section>

          {/* Section 2: Incident Location */}
          <section className="flex flex-col gap-6 mt-8">
            <h2 className="text-2xl md:text-[28px] font-bold text-[#0d2a3a] tracking-tight flex items-center gap-5 mt-4 select-none">
              Incident Location <span className="font-semibold text-2xl text-[#0d2a3a]">&gt;</span>
            </h2>

            <div className="flex flex-col gap-2">
              <label className="text-slate-800 text-sm font-semibold mb-1">
                Enter Address or Land Mark <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#e2e8f0]/80 text-slate-800 rounded-2xl py-3.5 pl-4 pr-12 border border-transparent focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00ddff] focus:border-transparent font-medium transition-all"
                />
                <span className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-black">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.155-1.155C14.702 20.018 16 18.27 16 16c0-2.828-2.172-5-5-5S6 13.172 6 16c0 2.27 1.298 4.018 2.484 5.196.386.383.77.747 1.155 1.055l.07.04zM11 16a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7zm0 9.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Map and GPS Retrieval */}
            <div className="flex flex-col md:flex-row gap-6 items-stretch">
              
              {/* Map Iframe */}
              <div className="flex-1 h-[280px] bg-slate-100 rounded-3xl overflow-hidden relative border border-slate-200/80 shadow-sm">
                <iframe
                  width="100%"
                  height="100%"
                  className="border-none"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  allowFullScreen
                  loading="lazy"
                ></iframe>
              </div>

              {/* GPS Button */}
              <div className="flex flex-col justify-center items-center md:w-[200px]">
                <button
                  type="button"
                  onClick={handleGPSLocation}
                  disabled={isLocating}
                  className="bg-[#00ddff] hover:bg-[#00c8e6] disabled:bg-[#a6ecf7] text-white font-bold text-[14px] leading-tight px-4 rounded-3xl shadow-sm transition-all duration-150 active:scale-[0.97] flex flex-col items-center justify-center gap-3 cursor-pointer border-none text-center h-[120px] w-full"
                >
                  <svg className={`w-8 h-8 ${isLocating ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3m0 14v3M2 12h3m14 0h3M12 9a3 3 0 100 6 3 3 0 000-6z" />
                  </svg>
                  <span className="font-semibold block">
                    Use my GPS<br />location
                  </span>
                </button>
              </div>

            </div>
          </section>

          {/* Action Button Row */}
          <div className="flex flex-row justify-between items-center mt-4 mb-10">
            <Link
              href="/Policy_Holder/Home"
              className="bg-[#0f2d3a] hover:bg-[#0b222c] text-white font-bold text-base px-10 py-3.5 rounded-full transition-all duration-150 active:scale-[0.97] no-underline shadow-[0_4px_12px_rgba(15,45,58,0.25)] flex items-center justify-center gap-4"
            >
              <span>&lt;</span> <span>Cancel</span>
            </Link>
            <button
              type="submit"
              className="bg-[#0f2d3a] hover:bg-[#0b222c] text-white font-bold text-base px-12 py-3.5 rounded-full transition-all duration-150 active:scale-[0.97] shadow-[0_4px_12px_rgba(15,45,58,0.25)] border-none cursor-pointer flex items-center justify-center gap-4"
            >
              <span>Next</span> <span>&gt;</span>
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

      <PolicyHolderFooter />
    </div>
  );
}
