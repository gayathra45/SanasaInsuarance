"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OfficeStaffNavbar from "@/app/Components/Office Staff/Navbar";
import OfficeStaffFooter from "@/app/Components/Office Staff/Footer";
import { API_URL } from "@/app/config";


// Province and Cities Sri Lanka Data
const provincesData = [
  { id: "western", name: "Western Province", cities: ["Colombo", "Gampaha", "Kalutara", "Negombo", "Dehiwala-Mount Lavinia", "Kaduwela", "Moratuwa"] },
  { id: "central", name: "Central Province", cities: ["Kandy", "Matale", "Nuwara Eliya", "Gampola", "Nawalapitiya", "Dambulla"] },
  { id: "southern", name: "Southern Province", cities: ["Galle", "Matara", "Hambantota", "Hikkaduwa", "Ambalangoda", "Tangalle"] },
  { id: "northern", name: "Northern Province", cities: ["Jaffna", "Vavuniya", "Mannar", "Kilinochchi", "Mullaitivu", "Point Pedro"] },
  { id: "eastern", name: "Eastern Province", cities: ["Trincomalee", "Batticaloa", "Ampara", "Kalmunai", "Samanthurai"] },
  { id: "north-western", name: "North Western Province", cities: ["Kurunegala", "Chilaw", "Puttalam", "Kuliyapitiya", "Wariyapola"] },
  { id: "north-central", name: "North Central Province", cities: ["Anuradhapura", "Polonnaruwa", "Medawachchiya", "Kekirawa"] },
  { id: "uva", name: "Uva Province", cities: ["Badulla", "Bandarawela", "Monaragala", "Welimada", "Mahiyanganaya"] },
  { id: "sabaragamuwa", name: "Sabaragamuwa Province", cities: ["Ratnapura", "Kegalle", "Balangoda", "Mawanella", "Embilipitiya"] }
];

interface Agent {
  _id: string;
  agentId: string;
  name: string;
  email: string;
  nic: string;
  address: string;
  dob: string;
  branch: string;
  phone?: string;
  city?: string;
  province?: string;
  bankName?: string;
  bankBranch?: string;
  accountNumber?: string;
  accountType?: string;
  accountHolderName?: string;
  nicFront?: string;
  nicBack?: string;
  birthCertificate?: string;
  policeReport?: string;
  availability?: string;
}

export default function AgentsPage() {
  const router = useRouter();
  const [branch, setBranch] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal / Form states
  const [showModal, setShowModal] = useState(false);
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    nic: "",
    phone: "",
    dob: "",
    address: "",
    province: "",
    city: "",
    password: "",
    confirmPassword: "",
    nicFront: "",
    nicBack: "",
    birthCertificate: "",
    policeReport: ""
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submittingAgent, setSubmittingAgent] = useState(false);

  // View agent modal states
  const [selectedAgentForView, setSelectedAgentForView] = useState<Agent | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [agentClaims, setAgentClaims] = useState<any[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const activeAgent = selectedAgentForView 
    ? (agents.find(a => a._id === selectedAgentForView._id) || selectedAgentForView) 
    : null;

  // Edit agent states
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    nic: "",
    dob: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    bankName: "",
    bankBranch: "",
    accountNumber: "",
    accountType: "",
    accountHolderName: "",
    nicFront: "",
    nicBack: "",
    birthCertificate: "",
    policeReport: ""
  });
  const [editTab, setEditTab] = useState<"Personal" | "Contact" | "Bank Details">("Personal");
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Document Preview Modal states
  const [previewDocName, setPreviewDocName] = useState<string | null>(null);

  // Message agent modal states
  const [selectedAgentForMessage, setSelectedAgentForMessage] = useState<Agent | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState("");
  const [messageError, setMessageError] = useState("");

  const loadAgents = async (currentBranch: string, showLoader: boolean = true) => {
    if (showLoader) {
      setLoading(true);
    }
    try {
      const res = await fetch(`${API_URL}/office-staff/agents?branch=${currentBranch}`);
      if (!res.ok) {
        throw new Error("Failed to fetch agents.");
      }
      const data = await res.json();
      setAgents(data.agents || []);
    } catch (err: any) {
      console.error("Load agents error:", err);
      setError(err.message || "Failed to load branch agents.");
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

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

    if (currentBranch) {
      loadAgents(currentBranch, true);
      const interval = setInterval(() => {
        loadAgents(currentBranch, false);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [router]);

  // Lock background scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen = showModal || showViewModal || showMessageModal || !!previewDocName;
    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal, showViewModal, showMessageModal, previewDocName]);

  const validateStep1 = () => {
    setFormError("");
    if (!formData.firstName.trim()) { setFormError("First Name is required."); return false; }
    if (!formData.lastName.trim()) { setFormError("Last Name is required."); return false; }
    if (!formData.nic.trim()) { setFormError("NIC Number is required."); return false; }
    if (!formData.phone.trim()) { setFormError("Mobile Number is required."); return false; }
    if (!formData.email.trim()) { setFormError("Email Address is required."); return false; }
    if (!formData.dob.trim()) { setFormError("Date of Birth is required."); return false; }
    if (!formData.address.trim()) { setFormError("Residential Address is required."); return false; }
    if (!formData.province) { setFormError("Province is required."); return false; }
    if (!formData.city) { setFormError("City is required."); return false; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setFormError("Please enter a valid email address.");
      return false;
    }

    const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
    if (!nicRegex.test(formData.nic.trim())) {
      setFormError("Invalid NIC format. Must be 9 digits followed by V/X, or exactly 12 digits.");
      return false;
    }

    const mobileRegex = /^0[0-9]{9}$/;
    if (!mobileRegex.test(formData.phone.trim())) {
      setFormError("Invalid Mobile Number. Must be exactly 10 digits starting with 0.");
      return false;
    }

    return true;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!validateStep1()) return;

    if (!formData.nicFront) return setFormError("NIC Front document is required.");
    if (!formData.nicBack) return setFormError("NIC Back document is required.");
    if (!formData.policeReport) return setFormError("Police Report document is required.");
    if (!formData.birthCertificate) return setFormError("Birth Certificate document is required.");

    setSubmittingAgent(true);
    const combinedName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();

    try {
      const res = await fetch(`${API_URL}/office-staff/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: combinedName,
          email: formData.email,
          nic: formData.nic,
          dob: formData.dob,
          address: formData.address,
          branch,
          phone: formData.phone,
          city: formData.city,
          province: formData.province,
          nicFront: formData.nicFront,
          nicBack: formData.nicBack,
          birthCertificate: formData.birthCertificate,
          policeReport: formData.policeReport
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register agent.");
      }

      setFormSuccess("Agent registered successfully!");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        nic: "",
        phone: "",
        dob: "",
        address: "",
        province: "",
        city: "",
        password: "",
        confirmPassword: "",
        nicFront: "",
        nicBack: "",
        birthCertificate: "",
        policeReport: ""
      });

      if (branch) {
        await loadAgents(branch);
      }

      setTimeout(() => {
        setShowModal(false);
        setFormSuccess("");
        setRegisterStep(1);
      }, 1500);

    } catch (err: any) {
      console.error("Register agent error:", err);
      setFormError(err.message || "Something went wrong.");
    } finally {
      setSubmittingAgent(false);
    }
  };

  const fetchAgentClaims = async (email: string) => {
    setLoadingClaims(true);
    try {
      const res = await fetch(`${API_URL}/agent/claims?email=${email}`);
      if (res.ok) {
        const data = await res.json();
        setAgentClaims(data || []);
      }
    } catch (err) {
      console.error("Error fetching agent claims:", err);
    } finally {
      setLoadingClaims(false);
    }
  };

  const handleOpenViewModal = (agent: Agent) => {
    setSelectedAgentForView(agent);
    setShowViewModal(true);
    setIsEditing(false);
    setAgentClaims([]); // Reset claim stats array before loading new ones
    fetchAgentClaims(agent.email);
  };

  const handleRemoveAgent = async (agentId: string) => {
    if (!window.confirm("Are you sure you want to remove this agent?")) return;
    try {
      const res = await fetch(`${API_URL}/office-staff/agents/${agentId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to remove agent.");
      }
      // Reload agents
      if (branch) {
        await loadAgents(branch);
      }
      setShowViewModal(false);
      setSelectedAgentForView(null);
      alert("Agent removed successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to remove agent.");
    }
  };

  const handleStartEdit = (agent: Agent) => {
    const names = (agent.name || "").trim().split(" ");
    const firstName = names[0] || "";
    const lastName = names.slice(1).join(" ") || "";

    setEditFormData({
      firstName,
      lastName,
      email: agent.email || "",
      nic: agent.nic || "",
      dob: agent.dob || "",
      phone: agent.phone || "",
      address: agent.address || "",
      city: agent.city || "",
      province: agent.province || "",
      bankName: agent.bankName || "",
      bankBranch: agent.bankBranch || "",
      accountNumber: agent.accountNumber || "",
      accountType: agent.accountType || "",
      accountHolderName: agent.accountHolderName || "",
      nicFront: agent.nicFront || "",
      nicBack: agent.nicBack || "",
      birthCertificate: agent.birthCertificate || "",
      policeReport: agent.policeReport || ""
    });
    setEditTab("Personal");
    setEditError("");
    setEditSuccess("");
    setIsEditing(true);
  };

  const handleSaveEdit = async (e: React.FormEvent, agentId: string) => {
    e.preventDefault();
    setEditError("");
    setEditSuccess("");
    setSavingEdit(true);

    const combinedName = `${editFormData.firstName.trim()} ${editFormData.lastName.trim()}`.trim();

    try {
      const res = await fetch(`${API_URL}/office-staff/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: combinedName,
          email: editFormData.email,
          nic: editFormData.nic,
          dob: editFormData.dob,
          phone: editFormData.phone,
          address: editFormData.address,
          city: editFormData.city,
          province: editFormData.province,
          bankName: editFormData.bankName,
          bankBranch: editFormData.bankBranch,
          accountNumber: editFormData.accountNumber,
          accountType: editFormData.accountType,
          accountHolderName: editFormData.accountHolderName,
          nicFront: editFormData.nicFront,
          nicBack: editFormData.nicBack,
          birthCertificate: editFormData.birthCertificate,
          policeReport: editFormData.policeReport
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update agent.");
      }
      setEditSuccess("Agent updated successfully!");
      // Reload agents
      if (branch) {
        await loadAgents(branch);
      }
      // Update selected agent state
      setSelectedAgentForView(data.agent);
      setTimeout(() => {
        setIsEditing(false);
        setEditSuccess("");
      }, 1000);
    } catch (err: any) {
      setEditError(err.message || "Failed to update agent.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleOpenMessageModal = (agent: Agent) => {
    setSelectedAgentForMessage(agent);
    setMessageText("");
    setMessageSuccess("");
    setMessageError("");
    setShowMessageModal(true);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) {
      setMessageError("Please enter a message to send.");
      return;
    }
    setSendingMessage(true);
    setMessageError("");
    setMessageSuccess("");

    // Simulate sending message to agent
    setTimeout(() => {
      setSendingMessage(false);
      setMessageSuccess(`Message sent to Agent ${selectedAgentForMessage?.name} successfully!`);
      setMessageText("");
      setTimeout(() => {
        setShowMessageModal(false);
        setMessageSuccess("");
      }, 2000);
    }, 1200);
  };

  const renderDocEditField = (label: string, fieldKey: "nicFront" | "nicBack" | "birthCertificate" | "policeReport") => {
    const value = editFormData[fieldKey];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setEditFormData(prev => ({
            ...prev,
            [fieldKey]: reader.result as string
          }));
        };
        reader.readAsDataURL(file);
      }
    };

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation(); // Avoid triggering preview
      setEditFormData(prev => ({
        ...prev,
        [fieldKey]: ""
      }));
    };

    if (value) {
      // Document is uploaded/selected
      return (
        <div className="relative group flex items-center justify-between py-3 px-5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-sm rounded-[14px] transition-all border border-emerald-200/50 h-[50px] shadow-sm select-none">
          <button
            type="button"
            onClick={() => setPreviewDocName(label)}
            className="flex-1 text-left font-extrabold cursor-pointer truncate mr-2 bg-transparent border-none outline-none text-emerald-800"
          >
            {label} ✓
          </button>
          <button
            type="button"
            onClick={handleDelete}
            title="Delete document"
            className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-[#ff0000] cursor-pointer transition-all border-none outline-none flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      );
    } else {
      // Document is not uploaded
      return (
        <div className="relative flex items-center justify-center bg-[#e5e7eb]/60 hover:bg-[#d1d5db] text-slate-800 font-extrabold text-sm rounded-[14px] transition-all border-none outline-none cursor-pointer h-[50px]">
          <label className="w-full h-full flex items-center justify-center cursor-pointer gap-2 select-none">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4 text-slate-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Add {label}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      );
    }
  };

  const renderDocUploadCard = (label: string, fieldKey: "nicFront" | "nicBack" | "birthCertificate" | "policeReport") => {
    const value = formData[fieldKey];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            [fieldKey]: reader.result as string
          }));
        };
        reader.readAsDataURL(file);
      }
    };

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      setFormData(prev => ({
        ...prev,
        [fieldKey]: ""
      }));
    };

    return (
      <div className={`relative border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all h-[150px] cursor-pointer ${
        value 
          ? "border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50" 
          : "border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-[#0f2d4a]"
      }`}>
        {value ? (
          <div className="flex flex-col items-center justify-center w-full h-full relative">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-emerald-100 shadow-sm flex items-center justify-center mb-2">
              <img src={value} alt={label} className="w-full h-full object-cover" />
            </div>
            <span className="text-xs font-bold text-emerald-800 tracking-wide">{label} ✓</span>
            <span className="text-[10px] text-emerald-600 mt-0.5">Uploaded</span>
            
            <button
              type="button"
              onClick={handleDelete}
              title="Delete document"
              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-[#ff0000] cursor-pointer transition-all border border-red-100/50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        ) : (
          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer select-none">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            </div>
            <span className="text-xs font-extrabold text-slate-700 tracking-wide">{label}</span>
            <span className="text-[10px] text-slate-400 mt-1">Tap to select image</span>
          </label>
        )}
      </div>
    );
  };


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
            <div className="flex items-center gap-5">
              {/* Notification Bell Icon */}
              <button className="relative p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                  <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 1.65.342 3.228.96 4.658A1.875 1.875 0 0 1 18 17.25H6a1.875 1.875 0 0 1-1.71-2.842 9.06 9.06 0 0 0 .96-4.658V9ZM12 18.75a2.25 2.25 0 0 1-2.247-2.118.75.75 0 0 1 .746-.757h3a.75.75 0 0 1 .746.757A2.25 2.25 0 0 1 12 18.75Z" clipRule="evenodd" />
                </svg>
              </button>
              {/* User Avatar Icon */}
              <button className="relative p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
                  <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12c0 2.754 1.14 5.244 2.98 7.03-.028-.01-.053-.024-.082-.031a.75.75 0 0 1-.502-.879C5.556 14.931 8.193 12 12 12s6.444 2.931 7.352 6.12a.75.75 0 0 1-.502.88c-.029.007-.054.02-.082.031ZM12 11.25a3.375 3.375 0 1 0 0-6.75 3.375 3.375 0 0 0 0 6.75Z" clipRule="evenodd" />
                </svg>
              </button>
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
                  <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
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
                    <button
                      onClick={() => {
                        setFormData({
                          firstName: "",
                          lastName: "",
                          email: "",
                          nic: "",
                          phone: "",
                          dob: "",
                          address: "",
                          province: "",
                          city: "",
                          password: "",
                          confirmPassword: "",
                          nicFront: "",
                          nicBack: "",
                          birthCertificate: "",
                          policeReport: ""
                        });
                        setFormError("");
                        setFormSuccess("");
                        setRegisterStep(1);
                        setShowModal(true);
                      }}
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 transition-all border-none outline-none cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <span>Add New Agent</span>
                    </button>
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
                              <span className="w-20 flex-shrink-0 text-slate-400">Phone</span>
                              <span>: {agent.phone || "N/A"}</span>
                            </div>
                            <div className="flex">
                              <span className="w-20 flex-shrink-0 text-slate-400">Address</span>
                              <span className="truncate">: {agent.address}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-5 flex gap-2">
                          <button
                            onClick={() => handleOpenMessageModal(agent)}
                            className="flex-1 py-2 px-3 bg-[#0f2d4a] hover:bg-[#1a3d5e] active:scale-95 text-white text-xs font-bold rounded-xl border-none outline-none flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-1.074-.765 6.003 6.003 0 011.085-3.11 8.261 8.261 0 01-1.672-4.82c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                            </svg>
                            Message
                          </button>
                          <button
                            onClick={() => handleOpenViewModal(agent)}
                            className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition-all outline-none cursor-pointer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            View
                          </button>
                        </div>

                        {/* Card Footer */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold select-none">
                          <span>Assign Area: {agent.branch}</span>
                          {agent.availability === "Offline" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500 text-white select-none">
                              Offline
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-white select-none">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                              </span>
                              Active
                            </span>
                          )}
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

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden transform scale-100 transition-all flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 flex justify-between items-center bg-white border-b border-slate-200 select-none">
              <h2 className="font-extrabold text-xl text-slate-800">
                Register Agent - {registerStep === 1 ? "Step 1: Personal Details" : "Step 2: Verification Documents"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 bg-transparent border-none outline-none cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content / Form */}
            <form onSubmit={handleFormSubmit} className="flex flex-col bg-white">
              {/* Errors container fixed at top of form */}
              {(formError || formSuccess) && (
                <div className="px-6 pt-4 flex flex-col gap-2">
                  {formError && (
                    <div className="bg-red-50 text-red-600 text-xs font-bold px-4 py-2.5 rounded-xl border border-red-100">
                      {formError}
                    </div>
                  )}
                  {formSuccess && (
                    <div className="bg-emerald-50 text-emerald-600 text-xs font-bold px-4 py-2.5 rounded-xl border border-emerald-100">
                      {formSuccess}
                    </div>
                  )}
                </div>
              )}

              {/* Scrollable inputs wrapper */}
              <div className="max-h-[50vh] overflow-y-auto px-6 py-4 flex flex-col gap-4">
                {registerStep === 1 ? (
                  /* STEP 1: PERSONAL DETAILS */
                  <div className="flex flex-col gap-4">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 ml-1">First Name</label>
                        <input
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          placeholder="John"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f2d4a] focus:border-transparent transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 ml-1">Last Name</label>
                        <input
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          placeholder="Doe"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f2d4a] focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    {/* NIC & Phone Number */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 ml-1">NIC Number</label>
                        <input
                          type="text"
                          required
                          value={formData.nic}
                          onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                          placeholder="e.g., 199912345678 or 991234567V"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f2d4a] focus:border-transparent transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 ml-1">Mobile Number</label>
                        <input
                          type="text"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="e.g., 0771234567"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f2d4a] focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    {/* Email & Date of Birth */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 ml-1">Email Address</label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="agent@sanasainsurance.lk"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f2d4a] focus:border-transparent transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 ml-1">Date of Birth</label>
                        <input
                          type="date"
                          required
                          value={formData.dob}
                          onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f2d4a] focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    {/* Home Address */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 ml-1">Residential Address</label>
                      <textarea
                        required
                        rows={2}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Enter residential address here..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f2d4a] focus:border-transparent transition-all resize-none"
                      />
                    </div>

                    {/* Province & City dropdowns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 ml-1">Province</label>
                        <div className="relative">
                          <select
                            required
                            value={formData.province}
                            onChange={(e) => setFormData({ ...formData, province: e.target.value, city: "" })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f2d4a] focus:border-transparent transition-all bg-white appearance-none cursor-pointer"
                          >
                            <option value="" disabled>Select Province</option>
                            {provincesData.map((p) => (
                              <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                          </select>
                          <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                            </svg>
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 ml-1">City</label>
                        <div className="relative">
                          <select
                            required
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            disabled={!formData.province}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f2d4a] focus:border-transparent transition-all bg-white appearance-none disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <option value="" disabled>Select City</option>
                            {provincesData
                              .find((p) => p.name === formData.province)
                              ?.cities.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              )) || null}
                          </select>
                          <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* STEP 2: DOCUMENTS */
                  <div className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {renderDocUploadCard("NIC Front", "nicFront")}
                      {renderDocUploadCard("NIC Back", "nicBack")}
                      {renderDocUploadCard("Police Report", "policeReport")}
                      {renderDocUploadCard("Birth Certificate", "birthCertificate")}
                    </div>
                  </div>
                )}
              </div>

              {/* Fixed bottom area */}
              <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex flex-col gap-4 bg-slate-50/50">
                {/* Read-only Branch Info */}
                <div className="flex flex-col gap-1.5 bg-slate-50 border border-slate-100 p-3 rounded-xl select-none">
                  <span className="text-xs font-bold text-slate-400">Assigned Branch</span>
                  <span className="text-sm font-extrabold text-slate-600">{branch} Branch</span>
                </div>

                {/* Bottom Red-Filled Progress Bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden select-none">
                  <div
                    className="bg-[#ff0000] h-full transition-all duration-300"
                    style={{ width: registerStep === 1 ? "50%" : "100%" }}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                  {registerStep === 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="px-6 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold transition-all text-sm cursor-pointer bg-white"
                      >
                        &lt; Close
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (validateStep1()) {
                            setRegisterStep(2);
                          }
                        }}
                        className="px-8 py-2.5 rounded-full bg-[#0f2d4a] hover:bg-[#1a3d5e] text-white font-bold transition-all text-sm shadow-md shadow-[#0f2d4a]/20 active:scale-95 border-none outline-none cursor-pointer"
                      >
                        Next &gt;
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setRegisterStep(1)}
                        className="px-6 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold transition-all text-sm cursor-pointer bg-white"
                      >
                        &lt; Back
                      </button>
                      <button
                        type="submit"
                        disabled={submittingAgent}
                        className="px-8 py-2.5 rounded-full bg-[#0f2d4a] hover:bg-[#1a3d5e] text-white font-bold transition-all text-sm shadow-md shadow-[#0f2d4a]/20 active:scale-95 border-none outline-none cursor-pointer disabled:opacity-60 flex items-center gap-2"
                      >
                        {submittingAgent ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <span>Submit &gt;</span>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Agent Details Modal */}
      {showViewModal && activeAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          {isEditing ? (
            /* EDIT MODAL DESIGN */
            <div className="bg-white rounded-[32px] w-full max-w-3xl shadow-2xl border border-slate-300 overflow-hidden transform scale-100 transition-all">
              {/* Modal Header */}
              <div className="px-8 pt-6 pb-4 flex justify-between items-center bg-white select-none">
                <h2 className="font-extrabold text-xl text-slate-800">
                  Edit - {activeAgent.agentId} - {activeAgent.name}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-slate-400 hover:text-slate-600 bg-transparent border-none outline-none cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="px-8">
                <hr className="border-t border-slate-300" />
              </div>

              {/* Modal Content / Form */}
              <form onSubmit={(e) => handleSaveEdit(e, activeAgent._id)} className="p-8 flex flex-col gap-6">
                {editError && (
                  <div className="bg-red-50 text-red-600 text-xs font-bold px-4 py-2.5 rounded-xl border border-red-100">
                    {editError}
                  </div>
                )}
                {editSuccess && (
                  <div className="bg-emerald-50 text-emerald-600 text-xs font-bold px-4 py-2.5 rounded-xl border border-emerald-100">
                    {editSuccess}
                  </div>
                )}

                {/* Tabs selector */}
                <div className="bg-[#f3f4f6] p-1.5 rounded-full flex justify-between items-center text-sm font-semibold w-full mx-auto select-none shadow-inner border border-slate-200/50">
                  {(["Personal", "Contact", "Bank Details"] as const).map((tab) => {
                    const isActive = editTab === tab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setEditTab(tab)}
                        className={`flex-1 py-2.5 text-center text-sm font-black transition-all rounded-full cursor-pointer border-none outline-none ${
                          isActive
                            ? "text-[#ff0000] bg-transparent scale-105"
                            : "text-slate-600 hover:text-slate-800 bg-transparent"
                        }`}
                      >
                        {tab} &gt;
                      </button>
                    );
                  })}
                </div>

                {/* Tab Contents */}
                <div className="flex flex-col justify-between h-[450px] overflow-y-auto pr-1">
                  <div>
                    {editTab === "Personal" && (
                      <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-extrabold text-slate-800 ml-1">First Name</label>
                            <input
                              type="text"
                              required
                              value={editFormData.firstName}
                              onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                              className="bg-[#e5e7eb]/60 border-none rounded-[14px] px-4 py-3 text-sm text-slate-800 font-bold focus:outline-none focus:bg-[#e5e7eb]/80 transition-all w-full h-[45px]"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-extrabold text-slate-800 ml-1">Last Name</label>
                            <input
                              type="text"
                              required
                              value={editFormData.lastName}
                              onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                              className="bg-[#e5e7eb]/60 border-none rounded-[14px] px-4 py-3 text-sm text-slate-800 font-bold focus:outline-none focus:bg-[#e5e7eb]/80 transition-all w-full h-[45px]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-extrabold text-slate-800 ml-1">NIC</label>
                            <input
                              type="text"
                              required
                              value={editFormData.nic}
                              onChange={(e) => setEditFormData({ ...editFormData, nic: e.target.value })}
                              className="bg-[#e5e7eb]/60 border-none rounded-[14px] px-4 py-3 text-sm text-slate-800 font-bold focus:outline-none focus:bg-[#e5e7eb]/80 transition-all w-full h-[45px]"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-extrabold text-slate-800 ml-1">Date of Birth</label>
                            <input
                              type="date"
                              required
                              value={editFormData.dob}
                              onChange={(e) => setEditFormData({ ...editFormData, dob: e.target.value })}
                              className="bg-[#e5e7eb]/60 border-none rounded-[14px] px-4 py-3 text-sm text-slate-800 font-bold focus:outline-none focus:bg-[#e5e7eb]/80 transition-all w-full h-[45px]"
                            />
                          </div>
                        </div>

                        {/* Verification Documents Buttons Grid */}
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-6">
                          {renderDocEditField("NIC Front", "nicFront")}
                          {renderDocEditField("NIC Back", "nicBack")}
                          {renderDocEditField("Birth Certificate", "birthCertificate")}
                          {renderDocEditField("Police report", "policeReport")}
                        </div>
                      </div>
                    )}

                    {editTab === "Contact" && (() => {
                      const activeProvinceObj = provincesData.find(p => p.name === editFormData.province);
                      const activeCities = activeProvinceObj ? activeProvinceObj.cities : [];
                      return (
                        <div className="flex flex-col gap-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-extrabold text-slate-800 ml-1">Email</label>
                              <input
                                type="email"
                                required
                                value={editFormData.email}
                                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                className="bg-[#e5e7eb]/60 border-none rounded-[14px] px-4 py-3 text-sm text-slate-800 font-bold focus:outline-none focus:bg-[#e5e7eb]/80 transition-all w-full h-[45px]"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-extrabold text-slate-800 ml-1">Phone Number</label>
                              <input
                                type="text"
                                value={editFormData.phone}
                                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                className="bg-[#e5e7eb]/60 border-none rounded-[14px] px-4 py-3 text-sm text-slate-800 font-bold focus:outline-none focus:bg-[#e5e7eb]/80 transition-all w-full h-[45px]"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-extrabold text-slate-800 ml-1">Address</label>
                            <textarea
                              required
                              rows={3}
                              value={editFormData.address}
                              onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                              className="bg-[#e5e7eb]/60 border-none rounded-[14px] px-4 py-3 text-sm text-slate-800 font-bold focus:outline-none focus:bg-[#e5e7eb]/80 transition-all w-full resize-none"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            {/* Province Selection */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-extrabold text-slate-800 ml-1">Province</label>
                              <div className="relative">
                                <select
                                  required
                                  value={editFormData.province}
                                  onChange={(e) => setEditFormData({ ...editFormData, province: e.target.value, city: "" })}
                                  className="bg-[#e5e7eb]/60 border-none rounded-[14px] px-4 py-3 pr-10 text-sm text-slate-800 font-bold focus:outline-none focus:bg-[#e5e7eb]/80 transition-all w-full h-[45px] appearance-none cursor-pointer"
                                >
                                  <option value="" disabled>Select Province</option>
                                  {provincesData.map((p) => (
                                    <option key={p.id} value={p.name}>{p.name}</option>
                                  ))}
                                </select>
                                <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-700">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                  </svg>
                                </span>
                              </div>
                            </div>

                            {/* City Selection */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-extrabold text-slate-800 ml-1">City</label>
                              <div className="relative">
                                <select
                                  required
                                  value={editFormData.city}
                                  onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                                  disabled={!editFormData.province}
                                  className="bg-[#e5e7eb]/60 border-none rounded-[14px] px-4 py-3 pr-10 text-sm text-slate-800 font-bold focus:outline-none focus:bg-[#e5e7eb]/80 transition-all w-full h-[45px] appearance-none disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  <option value="" disabled>Select City</option>
                                  {activeCities.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </select>
                                <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-700">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                  </svg>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {editTab === "Bank Details" && (
                      <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-extrabold text-slate-800 ml-1">Bank Name</label>
                            <input
                              type="text"
                              value={editFormData.bankName}
                              onChange={(e) => setEditFormData({ ...editFormData, bankName: e.target.value })}
                              className="bg-[#e5e7eb]/60 border-none rounded-[14px] px-4 py-3 text-sm text-slate-800 font-bold focus:outline-none focus:bg-[#e5e7eb]/80 transition-all w-full h-[45px]"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-extrabold text-slate-800 ml-1">Branch</label>
                            <input
                              type="text"
                              value={editFormData.bankBranch}
                              onChange={(e) => setEditFormData({ ...editFormData, bankBranch: e.target.value })}
                              className="bg-[#e5e7eb]/60 border-none rounded-[14px] px-4 py-3 text-sm text-slate-800 font-bold focus:outline-none focus:bg-[#e5e7eb]/80 transition-all w-full h-[45px]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-extrabold text-slate-800 ml-1">Account Number</label>
                            <input
                              type="text"
                              value={editFormData.accountNumber}
                              onChange={(e) => setEditFormData({ ...editFormData, accountNumber: e.target.value })}
                              className="bg-[#e5e7eb]/60 border-none rounded-[14px] px-4 py-3 text-sm text-slate-800 font-bold focus:outline-none focus:bg-[#e5e7eb]/80 transition-all w-full h-[45px]"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-extrabold text-slate-800 ml-1">Account Type</label>
                            <input
                              type="text"
                              value={editFormData.accountType}
                              onChange={(e) => setEditFormData({ ...editFormData, accountType: e.target.value })}
                              className="bg-[#e5e7eb]/60 border-none rounded-[14px] px-4 py-3 text-sm text-slate-800 font-bold focus:outline-none focus:bg-[#e5e7eb]/80 transition-all w-full h-[45px]"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-extrabold text-slate-800 ml-1">Account Holder Name</label>
                          <input
                            type="text"
                            value={editFormData.accountHolderName}
                            onChange={(e) => setEditFormData({ ...editFormData, accountHolderName: e.target.value })}
                            className="bg-[#e5e7eb]/60 border-none rounded-[14px] px-4 py-3 text-sm text-slate-800 font-bold focus:outline-none focus:bg-[#e5e7eb]/80 transition-all w-full h-[45px]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Save and Cancel Buttons Footer */}
                  <div className="flex justify-start mt-6 flex-shrink-0">
                    <button
                      type="submit"
                      disabled={savingEdit}
                      className="px-12 py-3 bg-[#0f2d4a] hover:bg-[#1a3d5e] active:scale-95 text-white rounded-xl text-sm font-extrabold transition-all border-none outline-none cursor-pointer flex items-center gap-2 shadow-lg shadow-[#0f2d4a]/25 disabled:opacity-60 h-[48px]"
                    >
                      {savingEdit ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Save</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            /* VIEW MODAL DESIGN */
            <div className="bg-white rounded-[32px] w-full max-w-4xl shadow-2xl border border-slate-300 overflow-hidden transform scale-100 transition-all">
              {/* Modal Header */}
              <div className="px-8 pt-6 pb-4 flex justify-between items-center bg-white select-none">
                <h2 className="font-extrabold text-xl text-slate-800">
                  Agent - {activeAgent.name}
                </h2>
                {activeAgent.availability === "Offline" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-[#ef4444] text-white select-none shadow-sm">
                    Offline
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-[#10b981] text-white select-none shadow-sm">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                    </span>
                    Active
                  </span>
                )}
              </div>
              <div className="px-8">
                <hr className="border-t border-slate-300" />
              </div>

              {/* Modal Content */}
              <div className="p-8 flex flex-col gap-6">
                
                {/* Top row: Profile Info & Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  
                  {/* Details Column */}
                  <div className="md:col-span-2 flex flex-col gap-3.5 text-sm select-none">
                    <div className="flex flex-col gap-3.5 font-semibold text-slate-700">
                      <div className="flex items-center">
                        <span className="w-36 text-slate-800 font-extrabold text-base">Agent Number :</span>
                        <span className="text-slate-600 text-base">{activeAgent.agentId}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-36 text-slate-800 font-extrabold text-base">Contact No. :</span>
                        <span className="text-slate-600 text-base">{activeAgent.phone || "0771974163"}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-36 text-slate-800 font-extrabold text-base">NIC :</span>
                        <span className="text-slate-600 text-base">{activeAgent.nic}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-36 text-slate-800 font-extrabold text-base">Address :</span>
                        <span className="text-slate-600 text-base truncate">{activeAgent.address}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-36 text-slate-800 font-extrabold text-base">Email :</span>
                        <span className="text-slate-600 text-base truncate">{activeAgent.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Stack Column */}
                  <div className="flex flex-col justify-start gap-3">
                    <button
                      onClick={() => handleRemoveAgent(activeAgent._id)}
                      className="w-full py-2.5 bg-[#ff0000] hover:bg-red-700 active:scale-[0.98] text-white font-extrabold text-sm rounded-xl transition-all cursor-pointer border-none outline-none"
                    >
                      Remove
                    </button>
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        handleOpenMessageModal(activeAgent);
                      }}
                      className="w-full py-2.5 bg-[#0f2d4a] hover:bg-[#1a3d5e] active:scale-[0.98] text-white font-extrabold text-sm rounded-xl transition-all cursor-pointer border-none outline-none"
                    >
                      Message
                    </button>
                    <button
                      onClick={() => handleStartEdit(activeAgent)}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-extrabold text-sm rounded-xl transition-all cursor-pointer border-none outline-none"
                    >
                      Edit
                    </button>
                  </div>

                </div>

                {/* Middle row: Grid of verification documents buttons */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  {[
                    { label: "NIC Front", key: "nicFront" },
                    { label: "NIC Back", key: "nicBack" },
                    { label: "Birth Certificate", key: "birthCertificate" },
                    { label: "Police report", key: "policeReport" }
                  ].map(({ label, key }) => {
                    const hasDoc = !!(activeAgent as any)[key];
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setPreviewDocName(label)}
                        className={`py-4 px-6 font-extrabold text-sm rounded-[20px] transition-all border outline-none cursor-pointer text-center ${
                          hasDoc
                            ? "bg-[#f0fbf7] hover:bg-[#e6f7ef] text-[#0a5c36] border-[#d3ecd8] shadow-sm"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-400 border border-slate-200/60 shadow-sm"
                        }`}
                      >
                        {label} {hasDoc ? "✓" : ""}
                      </button>
                    );
                  })}
                </div>

                {/* Bottom row: Claims Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 select-none">
                  <div className="bg-white border border-slate-200 rounded-[20px] p-5 flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="text-[11px] font-bold text-slate-400 tracking-wide uppercase">Total Claims</span>
                    <span className="text-2xl font-black text-slate-800 mt-2">
                      {loadingClaims ? "..." : agentClaims.length}
                    </span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-[20px] p-5 flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="text-[11px] font-bold text-slate-400 tracking-wide uppercase">New Assigned Claims</span>
                    <span className="text-2xl font-black text-slate-800 mt-2">
                      {loadingClaims ? "..." : agentClaims.filter(c => c.status === "Pending").length}
                    </span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-[20px] p-5 flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="text-[11px] font-bold text-slate-400 tracking-wide uppercase">Urgent Claims</span>
                    <span className="text-2xl font-black text-slate-800 mt-2">
                      {loadingClaims ? "..." : agentClaims.filter(c => c.status === "In Progress").length}
                    </span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-[20px] p-5 flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="text-[11px] font-bold text-slate-400 tracking-wide uppercase">Approval Claims</span>
                    <span className="text-2xl font-black text-slate-800 mt-2">
                      {loadingClaims ? "..." : agentClaims.filter(c => c.status === "Approved").length}
                    </span>
                  </div>
                </div>

                {/* Back Button Footer */}
                <div className="flex justify-start mt-4 pb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowViewModal(false);
                      setSelectedAgentForView(null);
                    }}
                    className="px-8 py-2.5 bg-[#0f2d4a] hover:bg-[#1a3d5e] active:scale-95 text-white rounded-full text-sm font-extrabold transition-all cursor-pointer border-none outline-none flex items-center gap-1.5 shadow-md shadow-[#0f2d4a]/20"
                  >
                    &lt; Back
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDocName && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden transform scale-100 transition-all select-none">
            <div className="bg-slate-800 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-base">{previewDocName} Verification Document</h3>
              <button
                onClick={() => setPreviewDocName(null)}
                className="text-white hover:text-slate-200 bg-transparent border-none outline-none cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-8 flex flex-col items-center justify-center bg-slate-50 min-h-[300px]">
              {(() => {
                const keyMap: Record<string, string> = {
                  "NIC Front": "nicFront",
                  "NIC Back": "nicBack",
                  "Birth Certificate": "birthCertificate",
                  "Police report": "policeReport"
                };
                const key = keyMap[previewDocName];
                const docUrl = isEditing 
                  ? (editFormData as any)[key] 
                  : activeAgent ? (activeAgent as any)[key] : null;

                if (docUrl) {
                  return (
                    <div className="w-full aspect-[1.6] rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-200 relative flex items-center justify-center">
                      <img src={docUrl} alt={previewDocName} className="max-w-full max-h-full object-contain" />
                    </div>
                  );
                }

                return (
                  <div className="w-full aspect-[1.6] rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center bg-white p-6 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-16 h-16 text-slate-400 mb-4 animate-pulse">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <span className="text-sm font-extrabold text-slate-700">{previewDocName} File Attachment</span>
                    <span className="text-xs text-slate-400 mt-1">No Document Uploaded</span>
                  </div>
                );
              })()}
            </div>
            <div className="p-4 bg-slate-100 flex justify-end">
              <button
                onClick={() => setPreviewDocName(null)}
                className="px-6 py-2 bg-[#0f2d4a] hover:bg-[#1a3d5e] text-white rounded-xl text-xs font-bold transition-all border-none outline-none cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Agent Modal */}
      {showMessageModal && selectedAgentForMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden transform scale-100 transition-all">
            {/* Modal Header */}
            <div className="bg-[#f59e0b] px-6 py-4 flex justify-between items-center text-white select-none">
              <h2 className="font-bold text-lg">Send Message to Agent</h2>
              <button
                onClick={() => {
                  setShowMessageModal(false);
                  setSelectedAgentForMessage(null);
                }}
                className="text-white hover:text-slate-100 bg-transparent border-none outline-none cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSendMessage} className="p-6 flex flex-col gap-4">
              {messageError && (
                <div className="bg-red-50 text-red-600 text-xs font-bold px-4 py-2.5 rounded-xl border border-red-100 animate-shake">
                  {messageError}
                </div>
              )}
              {messageSuccess && (
                <div className="bg-emerald-50 text-emerald-600 text-xs font-bold px-4 py-2.5 rounded-xl border border-emerald-100">
                  {messageSuccess}
                </div>
              )}

              {/* Agent Recipient Details */}
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-4 rounded-2xl select-none mb-2">
                <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-extrabold">
                  {selectedAgentForMessage.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">RECIPIENT</span>
                  <span className="text-sm font-extrabold text-slate-800">{selectedAgentForMessage.name} (Agent ID: {selectedAgentForMessage.agentId})</span>
                </div>
              </div>

              {/* Message Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 ml-1">Your Message</label>
                <textarea
                  required
                  rows={4}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message to the agent here..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowMessageModal(false);
                    setSelectedAgentForMessage(null);
                  }}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-bold transition-all cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingMessage || !!messageSuccess}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer border-none outline-none disabled:opacity-60 flex items-center gap-2"
                >
                  {sendingMessage ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send Message</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <OfficeStaffFooter />
    </div>
  );
}
