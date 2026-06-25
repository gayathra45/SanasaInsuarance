"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const lastScrollY = useRef(0);
  const profileMenuRef = useRef<HTMLDivElement>(null);

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

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    router.push("/Login");
  };

  // Check if link is active
  const isActive = (href: string) => {
    if (href === "/Agent/Dashboard") {
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
            <Link href="/Agent/Dashboard" className={getNavLinkClass("/Agent/Dashboard")}>
              Home
            </Link>
            <Link href="/Agent/Dashboard" className="text-slate-800 hover:text-[#00ddff] font-medium px-4 py-2 transition-all duration-200">
              My Activity
            </Link>
            <Link href="/Agent/Dashboard" className="text-slate-800 hover:text-[#00ddff] font-medium px-4 py-2 transition-all duration-200">
              Contact
            </Link>
            <Link
              href="/Agent/Dashboard"
              className="bg-[#ff9800] text-white hover:bg-[#e68900] font-bold px-6 py-2 rounded-full shadow-md transition-all duration-150 hover:scale-[1.03] active:scale-[0.98] no-underline"
            >
              My Claims
            </Link>
          </div>

          {/* Action Items (Right) */}
          <div className="hidden md:flex items-center gap-6">
            {/* Notification Bell */}
            <Link href="/Agent/Dashboard" className="text-black hover:text-[#00ddff] transition-colors p-1" aria-label="Notifications">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-7 h-7"
              >
                <path
                  fillRule="evenodd"
                  d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 1.823.508 3.527 1.392 4.978.077.127.112.274.103.42-.008.147-.063.287-.156.398a1.5 1.5 0 0 1-1.093.504H5a1.5 1.5 0 0 1-1.25-.668c-.147-.23-.198-.51-.139-.783A11.962 11.962 0 0 0 5.25 9.75V9Zm.75 9.75a3 3 0 0 0 6 0v-.75h-6v.75Z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className="text-black hover:text-[#00ddff] transition-colors p-1 bg-transparent border-none cursor-pointer focus:outline-none"
                aria-label="Profile"
                aria-expanded={profileMenuOpen}
              >
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
              </button>

              {/* Dropdown Menu */}
              {profileMenuOpen && (
                <div
                  className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-100 py-2 z-50"
                  style={{ top: "100%" }}
                >
                  {/* Arrow */}
                  <div className="absolute -top-2 right-4 w-4 h-4 bg-white border-l border-t border-slate-100 rotate-45" />

                  <Link
                    href="/Agent/Dashboard"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-3 px-5 py-3 text-slate-700 hover:bg-slate-50 hover:text-[#00ddff] font-semibold text-sm transition-colors no-underline"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    My Profile
                  </Link>

                  <div className="mx-4 my-1 border-t border-slate-100" />

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-5 py-3 text-red-500 hover:bg-red-50 font-semibold text-sm transition-colors text-left bg-transparent border-none cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
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
                isActive("/Agent/Dashboard") ? "bg-[#00ddff] text-black" : "text-slate-800 hover:text-[#00ddff] hover:bg-slate-50"
              }`}
            >
              Home
            </Link>
            <Link
              href="/Agent/Dashboard"
              onClick={() => setIsOpen(false)}
              className="text-slate-800 hover:text-[#00ddff] hover:bg-slate-50 font-semibold text-lg py-2.5 px-5 rounded-2xl transition-all duration-200"
            >
              My Activity
            </Link>
            <Link
              href="/Agent/Dashboard"
              onClick={() => setIsOpen(false)}
              className="text-slate-800 hover:text-[#00ddff] hover:bg-slate-50 font-semibold text-lg py-2.5 px-5 rounded-2xl transition-all duration-200"
            >
              Contact
            </Link>
            <Link
              href="/Agent/Dashboard"
              onClick={() => setIsOpen(false)}
              className="bg-[#ff9800] text-white hover:bg-[#e68900] font-bold py-3 px-5 rounded-2xl shadow-md transition-all duration-150 text-center mx-5 cursor-pointer no-underline"
            >
              My Claims
            </Link>
            <div className="h-px bg-gray-100 my-2" />
            <div className="flex items-center justify-between px-5 py-2">
              <div className="flex gap-4">
                <Link href="/Agent/Dashboard" onClick={() => setIsOpen(false)} className="text-black hover:text-[#00ddff] p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 1.823.508 3.527 1.392 4.978.077.127.112.274.103.42-.008.147-.063.287-.156.398a1.5 1.5 0 0 1-1.093.504H5a1.5 1.5 0 0 1-1.25-.668c-.147-.23-.198-.51-.139-.783A11.962 11.962 0 0 0 5.25 9.75V9Zm.75 9.75a3 3 0 0 0 6 0v-.75h-6v.75Z" clipRule="evenodd" />
                  </svg>
                </Link>
                {/* Mobile Logout button */}
                <button
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-600 p-1 bg-transparent border-none cursor-pointer"
                  aria-label="Logout"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-7 h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
