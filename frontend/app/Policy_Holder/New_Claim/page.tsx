"use client";

import React, { useState, useEffect } from "react";
import PolicyHolderNavbar from "@/app/Components/Policy_Holder/Navbar";
import PolicyHolderFooter from "@/app/Components/Policy_Holder/footer";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  const [latitude, setLatitude] = useState(6.9271);
  const [longitude, setLongitude] = useState(79.8612);
  const [initialCoords] = useState({ latitude: 6.9271, longitude: 79.8612 });
  const [modalInitialCoords, setModalInitialCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);

  // Message listener for location select from map iframe
  useEffect(() => {
    const handleMapMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data.latitude && data.longitude) {
          setLatitude(data.latitude);
          setLongitude(data.longitude);
          reverseGeocode(data.latitude, data.longitude);
        }
      } catch (err) {}
    };

    window.addEventListener("message", handleMapMessage);
    return () => window.removeEventListener("message", handleMapMessage);
  }, []);

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
              const res = await fetch(`http://localhost:5000/api/policy-holder/vehicles?nic=${user.nic}`);
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

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
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
        setAddress(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
      }
    } catch (geocodeError) {
      console.error("Reverse geocoding failed, falling back to coordinates:", geocodeError);
      setAddress(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
    }
  };

  const geocodeAddress = async (addrStr: string) => {
    if (!addrStr || addrStr.trim() === "") return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addrStr)}&limit=1`,
        {
          headers: {
            "Accept-Language": "en"
          }
        }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setLatitude(lat);
        setLongitude(lon);
        
        // Update map iframe
        const iframe = document.getElementById("map-iframe") as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(JSON.stringify({ latitude: lat, longitude: lon }), "*");
        }
        const modalIframe = document.getElementById("modal-map-iframe") as HTMLIFrameElement;
        if (modalIframe && modalIframe.contentWindow) {
          modalIframe.contentWindow.postMessage(JSON.stringify({ latitude: lat, longitude: lon }), "*");
        }
      }
    } catch (err) {
      console.error("Geocoding address failed:", err);
    }
  };

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

        const { latitude: lat, longitude: lon } = position.coords;
        setLatitude(lat);
        setLongitude(lon);

        // Update map iframe marker location
        const iframe = document.getElementById("map-iframe") as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(JSON.stringify({ latitude: lat, longitude: lon }), "*");
        }
        const modalIframe = document.getElementById("modal-map-iframe") as HTMLIFrameElement;
        if (modalIframe && modalIframe.contentWindow) {
          modalIframe.contentWindow.postMessage(JSON.stringify({ latitude: lat, longitude: lon }), "*");
        }

        await reverseGeocode(lat, lon);
      } catch (err: any) {
        console.error("Geolocation failed:", err);
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
              <div className="relative w-full bg-[#e2e8f0]/80 hover:bg-[#e2e8f0]/95 focus-within:bg-white border border-transparent focus-within:border-[#0284c7] focus-within:ring-4 focus-within:ring-[#0284c7]/10 rounded-2xl pl-5 pr-2.5 py-2 flex items-center gap-3 transition-all duration-200 shadow-sm focus-within:shadow-md">
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      geocodeAddress(address);
                    }
                  }}
                  onBlur={() => geocodeAddress(address)}
                  placeholder="Enter address or landmark..."
                  className="flex-1 bg-transparent text-slate-800 text-[15px] placeholder-slate-400 focus:outline-none font-medium border-none"
                />
                {address && (
                  <button
                    type="button"
                    onClick={() => setAddress("")}
                    className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-1 flex items-center justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => geocodeAddress(address)}
                  className="bg-[#0284c7] hover:bg-[#0275a1] active:scale-95 text-white py-2 px-5 rounded-full text-xs font-bold transition-all duration-150 border-none cursor-pointer flex items-center justify-center shadow-md shadow-[#0284c7]/20 whitespace-nowrap"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Map and GPS Retrieval */}
            <div className="flex flex-col md:flex-row gap-6 items-stretch">
              
              {/* Map Iframe */}
              <div className="flex-1 h-[280px] bg-slate-100 rounded-3xl overflow-hidden relative border border-slate-200/80 shadow-sm">
                <iframe
                  id="map-iframe"
                  width="100%"
                  height="100%"
                  className="border-none"
                  src={`/api/map?lat=${initialCoords.latitude}&lon=${initialCoords.longitude}`}
                  allowFullScreen
                ></iframe>
              </div>

              {/* Action Buttons on the right of the Map */}
              <div className="flex flex-row md:flex-col gap-4 justify-between items-stretch md:w-[200px]">
                {/* Use GPS Button */}
                <button
                  type="button"
                  onClick={handleGPSLocation}
                  disabled={isLocating}
                  className="flex-1 bg-[#0284c7] hover:bg-[#0275a1] disabled:bg-[#0284c7]/50 text-white font-bold text-[14px] leading-tight px-4 rounded-[24px] shadow-[0_4px_12px_rgba(2,132,199,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 flex flex-col items-center justify-center gap-3 border-none cursor-pointer text-center h-[130px]"
                >
                  <svg className={`w-8 h-8 text-white ${isLocating ? "animate-pulse" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z" />
                  </svg>
                  <span className="font-semibold block">
                    {isLocating ? "Locating..." : "Use GPS"}
                  </span>
                </button>

                {/* Select on Map Button */}
                <button
                  type="button"
                  onClick={() => {
                    setModalInitialCoords({ latitude, longitude });
                    setShowMapModal(true);
                  }}
                  className="flex-1 bg-[#0284c7] hover:bg-[#0275a1] text-white font-bold text-[14px] leading-tight px-4 rounded-[24px] shadow-[0_4px_12px_rgba(2,132,199,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 flex flex-col items-center justify-center gap-3 border-none cursor-pointer text-center h-[130px]"
                >
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span className="font-semibold block">
                    Select on Map
                  </span>
                </button>
              </div>

            </div>

            {/* Full-screen web Map Modal */}
            {showMapModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white rounded-[32px] w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh] border border-slate-100">
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
                    <h3 className="text-lg font-bold text-[#0d2a3a]">Select Location on Map</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setModalInitialCoords(null);
                        setShowMapModal(false);
                      }}
                      className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer border-none bg-transparent transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  
                  {/* Map Frame Container (with floating overlays) */}
                  <div className="flex-1 bg-slate-50 relative overflow-hidden">
                    <iframe
                      id="modal-map-iframe"
                      width="100%"
                      height="100%"
                      className="border-none"
                      src={`/api/map?lat=${modalInitialCoords?.latitude ?? latitude}&lon=${modalInitialCoords?.longitude ?? longitude}`}
                      allowFullScreen
                    ></iframe>

                    {/* Floating Geocoding Search Panel */}
                    <div className="absolute top-4 left-4 right-4 z-10 max-w-md bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-full pl-5 pr-1.5 py-1.5 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.15)] flex items-center gap-2 transition-all">
                      <span className="text-slate-400 flex items-center justify-center pointer-events-none">
                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            geocodeAddress(address);
                          }
                        }}
                        placeholder="Search address or landmark..."
                        className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
                      />
                      {address && (
                        <button
                          type="button"
                          onClick={() => setAddress("")}
                          className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-1"
                        >
                          ✕
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => geocodeAddress(address)}
                        className="bg-[#0284c7] hover:bg-[#0275a1] active:scale-95 text-white p-2.5 rounded-full transition-all duration-150 border-none cursor-pointer flex items-center justify-center shadow-md shadow-[#0284c7]/20"
                        title="Search"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </button>
                    </div>

                    {/* Floating GPS Button */}
                    <button
                      type="button"
                      onClick={handleGPSLocation}
                      disabled={isLocating}
                      className="absolute top-4 right-4 z-10 w-12 h-12 bg-white/90 backdrop-blur-md hover:bg-white text-slate-700 hover:text-sky-600 rounded-2xl shadow-xl flex items-center justify-center border border-slate-200/60 cursor-pointer transition-all duration-150 active:scale-95 disabled:bg-slate-100"
                      title="Locate Me"
                    >
                      <svg className={`w-6 h-6 ${isLocating ? "animate-pulse text-sky-500" : "text-slate-600"}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <line x1="2" x2="5" y1="12" y2="12" />
                        <line x1="19" x2="22" y1="12" y2="12" />
                        <line x1="12" x2="12" y1="2" y2="5" />
                        <line x1="12" x2="12" y1="19" y2="22" />
                        <circle cx="12" cy="12" r="7" />
                        <circle cx="12" cy="12" r="2" fill="currentColor" />
                      </svg>
                    </button>


                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-slate-100 flex justify-end items-center bg-white">
                    <button
                      type="button"
                      onClick={() => {
                        setModalInitialCoords(null);
                        setShowMapModal(false);
                      }}
                      className="bg-[#0d2a3a] hover:bg-[#0284c7] text-white font-bold text-sm px-8 py-3.5 rounded-full shadow-[0_4px_12px_rgba(13,42,58,0.25)] hover:shadow-[0_4px_16px_rgba(2,132,199,0.3)] transition-all duration-200 cursor-pointer border-none hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Confirm Location
                    </button>
                  </div>
                </div>
              </div>
            )}
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
