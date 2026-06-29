"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) return; // Keep visible if mobile menu is open
      const currentScrollY = window.scrollY;
      
      if (currentScrollY <= 50) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        setIsVisible(false); // Scrolling down: hide
      } else {
        setIsVisible(true); // Scrolling up: show
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isOpen]);

  // Check if link is active
  const isActive = (href: string) => {
    if (href === "/Agent/Home") {
      return pathname === "/Agent/Dashboard" || pathname === "/Agent" || pathname === "/Agent/";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const getNavLinkClass = (href: string) => {
    if (isActive(href)) {
      return "bg-[#00ddff] text-black font-semibold px-6 py-2 rounded-full transition-all duration-200 shadow-sm";
    }
    return "text-slate-800 hover:text-[#00ddff] font-medium px-4 py-2 transition-all duration-200";
  };

  return (
    <div className="w-full h-[70px] md:h-[80px]">
      <nav
        className={`fixed left-0 right-0 w-full bg-white border-b border-gray-100 py-3 px-6 md:px-16 z-50 transition-all duration-300 ease-in-out shadow-sm ${
          isVisible ? "top-0" : "-top-24"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/Agent/Dashboard">
              <Image
                src="/logo.png"
                alt="Sanasa General Insurance"
                width={120}
                height={48}
                className="object-contain h-auto"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-base font-semibold">
            <Link href="/Agent/Dashboard" className={getNavLinkClass("/Agent/Home")}>
              Home
            </Link>
            <Link href="/Agent/Documents" className={getNavLinkClass("/Agent/Documents")}>
              Documents
            </Link>
            <Link href="/Agent/MyActivity" className={getNavLinkClass("/Agent/MyActivity")}>
              My Activity
            </Link>
            <Link href="/Agent/Contact" className={getNavLinkClass("/Agent/Contact")}>
              Contact
            </Link>
            <Link
              href="/Agent/MyClaims"
              className="bg-[#ff9800] text-white hover:bg-[#e68900] font-bold px-6 py-2 rounded-full shadow-md transition-all duration-150 hover:scale-[1.03] active:scale-[0.98] no-underline"
            >
              My Claims
            </Link>
          </div>

          {/* Action Items (Right) */}
          <div className="hidden md:flex items-center gap-6">
            {/* Notification Bell */}
            <Link href="/Agent/Notifications" className="relative text-black hover:text-[#00ddff] transition-colors p-1" aria-label="Notifications">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-7 h-7"
              >
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </Link>

            {/* Profile Avatar Icon */}
            <Link href="/Login" className="text-black hover:text-[#00ddff] transition-colors p-1" aria-label="Profile">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="w-8 h-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
                />
              </svg>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden flex items-center justify-center p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-black focus:outline-none transition-all duration-200 cursor-pointer"
            aria-label="Toggle Navigation Menu"
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Dropdown Navigation Menu */}
        {isOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-200 py-4 px-6 flex flex-col gap-4 shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <Link
              href="/Agent/Dashboard"
              onClick={() => setIsOpen(false)}
              className={`font-semibold text-lg py-2.5 px-5 rounded-2xl transition-all duration-200 ${
                isActive("/Agent/Home") ? "bg-[#00ddff] text-black" : "text-slate-800 hover:text-[#00ddff] hover:bg-slate-50"
              }`}
            >
              Home
            </Link>
            <Link
              href="/Agent/Documents"
              onClick={() => setIsOpen(false)}
              className={`font-semibold text-lg py-2.5 px-5 rounded-2xl transition-all duration-200 ${
                isActive("/Agent/Documents") ? "bg-[#00ddff] text-black" : "text-slate-800 hover:text-[#00ddff] hover:bg-slate-50"
              }`}
            >
              Documents
            </Link>
            <Link
              href="/Agent/MyActivity"
              onClick={() => setIsOpen(false)}
              className={`font-semibold text-lg py-2.5 px-5 rounded-2xl transition-all duration-200 ${
                isActive("/Agent/MyActivity") ? "bg-[#00ddff] text-black" : "text-slate-800 hover:text-[#00ddff] hover:bg-slate-50"
              }`}
            >
              My Activity
            </Link>
            <Link
              href="/Agent/Contact"
              onClick={() => setIsOpen(false)}
              className={`font-semibold text-lg py-2.5 px-5 rounded-2xl transition-all duration-200 ${
                isActive("/Agent/Contact") ? "bg-[#00ddff] text-black" : "text-slate-800 hover:text-[#00ddff] hover:bg-slate-50"
              }`}
            >
              Contact
            </Link>
            <Link
              href="/Agent/MyClaims"
              onClick={() => setIsOpen(false)}
              className="bg-[#ff9800] text-white hover:bg-[#e68900] font-bold py-3 px-5 rounded-2xl shadow-md transition-all duration-150 text-center mx-5 cursor-pointer no-underline"
            >
              My Claims
            </Link>
            <div className="h-px bg-gray-100 my-2" />
            <div className="flex items-center justify-between px-5 py-2">
              <div className="flex gap-4">
                <Link href="/Agent/Notifications" onClick={() => setIsOpen(false)} className="relative text-black hover:text-[#00ddff] p-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-6 h-6"
                  >
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                  </svg>
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
                </Link>
                <Link href="/Login" onClick={() => setIsOpen(false)} className="text-black hover:text-[#00ddff] p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-7 h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
