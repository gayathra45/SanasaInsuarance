"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function OfficeStaffNavbar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Home", href: "/Office_Staff/Dashboard" },
    { name: "Claims", href: "/Office_Staff/Claims" },
    { name: "Registrations", href: "/Office_Staff/Registrations" },
    { name: "Policy Holders", href: "/Office_Staff/PolicyHolders" },
    { name: "Add Vehicles", href: "/Office_Staff/AddVehicles" },
    { name: "Agents", href: "/Office_Staff/Agents" },
    { name: "Reports", href: "/Office_Staff/Reports" },
    { name: "Contact", href: "/Office_Staff/Contact" },
  ];

  const getIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "home":
      case "dashboard":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        );
      case "claims":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        );
      case "registrations":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
          </svg>
        );
      case "policy holders":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766v-.109A12.318 12.318 0 018.624 18c2.331 0 4.512.645 6.376 1.766zm-6.75-6a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5zm9-3a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case "add vehicles":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "agents":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 0A49.535 49.535 0 006 4.024m0 0c-1.13.094-1.976 1.057-1.976 2.192V16.5A2.25 2.25 0 006.25 18.75h.75m.75-12.75v12.75c0 .621.504 1.125 1.125 1.125H18" />
          </svg>
        );
      case "reports":
      case "analytics & reports":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        );
      case "contact":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.802-5.122-4.1-6.924-6.924l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <aside className="w-[280px] bg-[#102A43] min-h-screen flex flex-col text-white shadow-xl flex-shrink-0 select-none">
      {/* Logo Section */}
      <div className="py-8 px-6 flex flex-col items-center border-b border-white/5">
        <div className="relative w-44 h-16">
          <Image
            src="/logo.png"
            alt="Sanasa General Insurance Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Menu Navigation Links */}
      <nav className="flex-1 mt-6 flex flex-col">
        {menuItems.map((item) => {
          // Check if active (matches exact path or prefix path)
          const isActive = pathname === item.href || (item.href !== "/Office_Staff/Dashboard" && pathname?.startsWith(item.href));
          const hasChevron = ["policy holders", "agents", "staff", "analytics & reports", "claims", "registrations", "reports", "add vehicles"].includes(item.name.toLowerCase());

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`mx-4 my-1 px-4 py-3 text-base font-semibold transition-all duration-150 no-underline flex items-center gap-3 rounded-xl group relative ${
                isActive
                  ? "bg-[#1b75e0] text-white shadow-sm font-bold pl-5"
                  : "text-slate-100 hover:bg-white/10 hover:text-white"
              }`}
            >
              {isActive && (
                <div className="absolute left-1.5 w-1 h-5 bg-[#00ddff] rounded-full" />
              )}
              {getIcon(item.name)}
              <span>{item.name}</span>
              {hasChevron && (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5 ml-auto text-slate-100 opacity-60 group-hover:opacity-100 transition-opacity">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout Footer Section */}
      <div className="p-6 mt-auto">
        <Link
          href="/Login"
          className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white font-extrabold text-base transition-colors no-underline duration-150"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5.636 5.636a9 9 0 1012.728 0M12 3v9"
            />
          </svg>
          Logout
        </Link>
      </div>
    </aside>
  );
}
