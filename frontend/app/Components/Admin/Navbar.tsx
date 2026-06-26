"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function AdminNavbar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Home", href: "/Admin/Dashboard" },
    { name: "Claims", href: "/Admin/Claims" },
    { name: "Policy Holders", href: "/Admin/PolicyHolders" },
    { name: "Agents", href: "/Admin/Agents" },
    { name: "Staff", href: "/Admin/Staff" },
    { name: "Analytics & Reports", href: "/Admin/Analytics" },
    { name: "Contact", href: "/Admin/Contact" },
  ];

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
          const isActive = pathname === item.href || (item.href !== "/Admin/Dashboard" && pathname?.startsWith(item.href));

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
