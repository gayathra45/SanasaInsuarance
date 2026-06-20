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
        // Always show near the very top of the page
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        // Scrolling down: hide the navbar
        setIsVisible(false);
      } else {
        // Scrolling up: instantly reveal the navbar
        setIsVisible(true);
      }
      
      // Update the mutable ref value directly without triggering re-renders
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isOpen]);

  const navContainer = "fixed left-0 right-0 w-full bg-white border-b border-gray-200 py-2 px-6 md:px-16 z-50 transition-all duration-300 ease-in-out shadow-sm";
  const logoContainer = "flex items-center";
  const logoImage = "object-contain h-auto";
  const navLinksContainer = "hidden md:flex items-center gap-10 font-bold text-[#333] text-lg";
  const navLinkBase = "text-inherit no-underline transition-all duration-150 py-1 px-7 rounded-full hover:text-[#00ddff]";
  const navLinkActive = "bg-[#00ddff] !text-black";
  const profileButton = `transition-colors duration-150 bg-transparent border-none cursor-pointer p-0 ${
    pathname === "/Login" ? "text-[#00ddff]" : "text-black hover:text-[#00ddff]"
  }`;
  const profileIcon = "w-9 h-9";

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname === "";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const getLinkClass = (href: string) => {
    const activeStyles = isActive(href) ? navLinkActive : "";
    return `${navLinkBase} ${activeStyles}`;
  };

  return (
    <div className="w-full h-[57px] md:h-[65px]">
      <nav className={`${navContainer} ${isVisible ? "top-0" : "-top-24"}`}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className={logoContainer}>
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Sanasa General Insurance"
                width={100}
                height={40}
                className={logoImage}
                priority
              />
            </Link>
          </div>

          {/* Desktop Links */}
          <div className={navLinksContainer}>
            <Link href="/" className={getLinkClass("/")}>
              Home
            </Link>
            <Link
              href="/home/contactUs"
              className={getLinkClass("/home/contactUs")}
            >
              Contact Us
            </Link>
            <Link href="/home/News" className={getLinkClass("/home/News")}>
              News
            </Link>
            <Link href="/home/AboutUs" className={getLinkClass("/home/AboutUs")}>
              About Us
            </Link>
          </div>

          {/* Action Buttons (Profile & Hamburger) */}
          <div className="flex items-center gap-4">
            <Link href="/Login">
              <button className={profileButton} aria-label="User Profile">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={profileIcon}
                >
                  <path
                    fillRule="evenodd"
                    d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                    clipRule="evenodd"
                  />
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
              href="/"
              onClick={() => setIsOpen(false)}
              className={`font-bold text-lg py-2.5 px-5 rounded-2xl transition-all duration-200 ${
                isActive("/") ? "bg-[#00ddff] text-black" : "text-[#333] hover:text-[#00ddff] hover:bg-slate-50"
              }`}
            >
              Home
            </Link>
            <Link
              href="/home/contactUs"
              onClick={() => setIsOpen(false)}
              className={`font-bold text-lg py-2.5 px-5 rounded-2xl transition-all duration-200 ${
                isActive("/home/contactUs") ? "bg-[#00ddff] text-black" : "text-[#333] hover:text-[#00ddff] hover:bg-slate-50"
              }`}
            >
              Contact Us
            </Link>
            <Link
              href="/home/News"
              onClick={() => setIsOpen(false)}
              className={`font-bold text-lg py-2.5 px-5 rounded-2xl transition-all duration-200 ${
                isActive("/home/News") ? "bg-[#00ddff] text-black" : "text-[#333] hover:text-[#00ddff] hover:bg-slate-50"
              }`}
            >
              News
            </Link>
            <Link
              href="/home/AboutUs"
              onClick={() => setIsOpen(false)}
              className={`font-bold text-lg py-2.5 px-5 rounded-2xl transition-all duration-200 ${
                isActive("/home/AboutUs") ? "bg-[#00ddff] text-black" : "text-[#333] hover:text-[#00ddff] hover:bg-slate-50"
              }`}
            >
              About Us
            </Link>
          </div>
        )}
      </nav>
    </div>
  );
}
