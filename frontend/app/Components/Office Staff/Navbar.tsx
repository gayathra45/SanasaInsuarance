"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

export default function OfficeStaffNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: "Home", href: "/Office_Staff/Dashboard" },
    { name: "Claims", href: "/Office_Staff/Claims" },
    { name: "Registrations", href: "/Office_Staff/Registrations" },
    { name: "Policy Holders", href: "/Office_Staff/PolicyHolders" },
    { name: "Agents", href: "/Office_Staff/Agents" },
    { name: "Reports", href: "/Office_Staff/Reports" },
    { name: "Contact", href: "/Office_Staff/Contact" },
  ];

  const handleLogout = () => {
    sessionStorage.clear();
    router.push("/Login");
  };

  return (
    <aside className="w-[280px] bg-[#1a365d] min-h-screen flex flex-col text-white shadow-xl flex-shrink-0 select-none">
      {/* Logo Section */}
      <div className="py-8 px-6 flex flex-col items-center">
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
          const isActive =
            pathname === item.href ||
            (item.href !== "/Office_Staff/Dashboard" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`px-8 py-3.5 text-base font-extrabold transition-all duration-150 no-underline block ${
                isActive
                  ? "bg-[#00ddff] text-white"
                  : "text-slate-200 hover:bg-[#152a48] hover:text-white"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout Footer Section */}
      <div className="p-6 mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white font-extrabold text-base transition-colors duration-150 bg-transparent border-none cursor-pointer w-full"
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
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
            />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}
