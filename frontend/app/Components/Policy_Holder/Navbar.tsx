"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PolicyHolderNavbar() {
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
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isOpen]);

  const isActive = (href: string) => {
    if (href === "/Policy_Holder/Home") {
      return pathname === "/Policy_Holder/Home" || pathname === "/Policy_Holder";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const getLinkClass = (href: string) => {
    if (isActive(href)) {
      return "bg-[#00ddff] text-black font-bold px-6 py-1.5 rounded-full shadow-sm transition-all duration-150 no-underline";
    }
    return "text-[#333] hover:text-[#00ddff] font-bold px-6 py-1.5 transition-all duration-150 no-underline";
  };

  return (
    <div className="w-full h-[57px] md:h-[65px]">
      <nav
        className={`fixed left-0 right-0 w-full bg-white border-b border-gray-200 py-2.5 px-6 md:px-16 z-50 transition-all duration-300 ease-in-out shadow-sm ${
          isVisible ? "top-0" : "-top-24"
        }`}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/Policy_Holder/Home">
              <Image
                src="/logo.png"
                alt="Sanasa General Insurance"
                width={110}
                height={42}
                className="object-contain h-auto"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-5 text-base font-bold">
            <Link href="/Policy_Holder/Home" className={getLinkClass("/Policy_Holder/Home")}>
              Home
            </Link>
            <Link href="/Policy_Holder/My_claims" className={getLinkClass("/Policy_Holder/My_claims")}>
              My Claims
            </Link>
            <Link href="/Policy_Holder/Documents" className={getLinkClass("/Policy_Holder/Documents")}>
              Documents
            </Link>
            <Link href="/Policy_Holder/Contact" className={getLinkClass("/Policy_Holder/Contact")}>
              Contact
            </Link>
            <Link
              href="/Policy_Holder/New_Claim"
              className="bg-[#ff9800] text-white hover:bg-[#e68900] font-bold px-6 py-2 rounded-full shadow-md transition-all duration-150 hover:scale-[1.03] active:scale-[0.98] no-underline"
            >
              New Claim
            </Link>
          </div>

          {/* Right Action Icons (Notifications, Profile & Mobile Menu Toggle) */}
          <div className="flex items-center gap-4">
            {/* Notifications Bell */}
            <Link
              href="/Policy_Holder/Notifications"
              className="relative transition-colors duration-150 p-1.5 text-black hover:text-[#00ddff] no-underline flex items-center justify-center"
              aria-label="Notifications"
            >
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

            {/* Profile Menu */}
            <Link href="/Login">
              <button
                className="transition-colors duration-150 bg-transparent border-none cursor-pointer p-0 text-black hover:text-[#00ddff] focus:outline-none"
                aria-label="User Profile"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-8 h-8"
                >
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="10" r="3.2" fill="currentColor" stroke="none" />
                  <path d="M6 18c0-3.2 2.8-4.2 6-4.2s6 1 6 4.2" fill="currentColor" stroke="none" />
                </svg>
              </button>
            </Link>

            {/* Hamburger Menu Icon for Mobile View */}
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
        </div>

        {/* Mobile Dropdown Navigation Menu */}
        {isOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 py-4 px-6 flex flex-col gap-3.5 shadow-[0_10px_20px_rgba(0,0,0,0.08)] z-50 transition-all duration-300">
            <Link
              href="/Policy_Holder/Home"
              onClick={() => setIsOpen(false)}
              className={`font-bold text-base py-2.5 px-5 rounded-2xl transition-all duration-200 ${
                isActive("/Policy_Holder/Home") ? "bg-[#00ddff] text-black" : "text-[#333] hover:text-[#00ddff] hover:bg-slate-50"
              }`}
            >
              Home
            </Link>
            <Link
              href="/Policy_Holder/My_claims"
              onClick={() => setIsOpen(false)}
              className={`font-bold text-base py-2.5 px-5 rounded-2xl transition-all duration-200 ${
                isActive("/Policy_Holder/My_claims") ? "bg-[#00ddff] text-black" : "text-[#333] hover:text-[#00ddff] hover:bg-slate-50"
              }`}
            >
              My Claims
            </Link>
            <Link
              href="/Policy_Holder/Documents"
              onClick={() => setIsOpen(false)}
              className={`font-bold text-base py-2.5 px-5 rounded-2xl transition-all duration-200 ${
                isActive("/Policy_Holder/Documents") ? "bg-[#00ddff] text-black" : "text-[#333] hover:text-[#00ddff] hover:bg-slate-50"
              }`}
            >
              Documents
            </Link>
            <Link
              href="/Policy_Holder/Contact"
              onClick={() => setIsOpen(false)}
              className={`font-bold text-base py-2.5 px-5 rounded-2xl transition-all duration-200 ${
                isActive("/Policy_Holder/Contact") ? "bg-[#00ddff] text-black" : "text-[#333] hover:text-[#00ddff] hover:bg-slate-50"
              }`}
            >
              Contact
            </Link>
            <Link
              href="/Policy_Holder/New_Claim"
              onClick={() => setIsOpen(false)}
              className="bg-[#ff9800] text-white hover:bg-[#e68900] font-bold py-3 px-5 rounded-2xl shadow-md transition-all duration-150 text-center"
            >
              New Claim
            </Link>
          </div>
        )}
      </nav>
    </div>
  );
}
