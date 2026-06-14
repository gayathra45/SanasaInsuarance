import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function PolicyHolderFooter() {
  return (
    <footer className="bg-[#ffa500] text-white pt-12 pb-6 px-6 md:px-16 w-full">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-10">
        
        {/* Left Section - Logo */}
        <div className="flex-shrink-0 flex justify-center md:justify-start">
          <Link href="/Policy_Holder/Home">
            <Image
              src="/footer logo.svg"
              alt="Sanasa General Insurance"
              width={130}
              height={52}
              className="h-auto max-w-[150px] object-contain"
              priority
            />
          </Link>
        </div>

        {/* Center Sections - Two Navigation Columns */}
        <div className="flex flex-col sm:flex-row gap-12 md:gap-40 justify-center md:justify-center flex-1 w-full text-center sm:text-left">
          {/* Column 1 */}
          <div className="flex flex-col gap-2.5 font-medium text-base">
            <Link href="/Policy_Holder/Home" className="hover:text-white/80 transition-colors duration-150 no-underline text-white font-semibold">
              Home
            </Link>
            <Link href="/Policy_Holder/MyClaims" className="hover:text-white/80 transition-colors duration-150 no-underline text-white font-semibold">
              My Claims
            </Link>
            <Link href="/Policy_Holder/New_Claim" className="hover:text-white/80 transition-colors duration-150 no-underline text-white font-semibold">
              New Claims
            </Link>
            <Link href="/Policy_Holder/Documents" className="hover:text-white/80 transition-colors duration-150 no-underline text-white font-semibold">
              Documents
            </Link>
            <Link href="/Policy_Holder/Contact" className="hover:text-white/80 transition-colors duration-150 no-underline text-white font-semibold">
              Contact
            </Link>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col gap-2.5 font-medium text-base">
            <Link href="/Policy_Holder/Notifications" className="hover:text-white/80 transition-colors duration-150 no-underline text-white font-semibold">
              Notifications
            </Link>
            <Link href="/Policy_Holder/MyVehicles" className="hover:text-white/80 transition-colors duration-150 no-underline text-white font-semibold">
              My Vehicles
            </Link>
            <Link href="/Policy_Holder/TrackClaims" className="hover:text-white/80 transition-colors duration-150 no-underline text-white font-semibold">
              Track Claims
            </Link>
            <Link href="/Policy_Holder/HelpCentre" className="hover:text-white/80 transition-colors duration-150 no-underline text-white font-semibold">
              Help Centre
            </Link>
            <Link href="/Policy_Holder/Profile" className="hover:text-white/80 transition-colors duration-150 no-underline text-white font-semibold">
              My Profile
            </Link>
          </div>
        </div>

        {/* Right Section - Contact & Socials */}
        <div className="flex flex-col items-center md:items-end gap-6 flex-shrink-0 w-full md:w-auto">
          {/* 24 Hours Contact */}
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 01-7.108-7.108c-.145-.44.02-.927.396-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
              />
            </svg>
            <span className="font-bold text-base md:text-lg">
              24 Hours : 0725 575 575
            </span>
          </div>

          {/* Social Icons Stacked Vertically */}
          <div className="flex flex-row md:flex-col gap-3.5 items-center justify-center md:self-end">
            {/* Facebook */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-white hover:opacity-85 transition-opacity duration-150"
            >
              <svg
                className="w-7 h-7"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
            </a>
            
            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-white hover:opacity-85 transition-opacity duration-150"
            >
              <svg
                className="w-7 h-7"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10zm4.5 12.8c0 .94-.76 1.7-1.7 1.7H9.2c-.94 0-1.7-.76-1.7-1.7V9.2c0-.94.76-1.7 1.7-1.7h5.6c.94 0 1.7.76 1.7 1.7v5.6z" />
                <path d="M12 9.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5zm0 3.25a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm3.25-3.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" />
              </svg>
            </a>
          </div>
        </div>

      </div>

      {/* Copyright Bar */}
      <div className="max-w-7xl mx-auto text-center pt-6 mt-10 border-t border-white/15 text-[14px]">
        <p className="m-0 font-medium">
          © 2025 Sanasa General Insurance Co. LTD. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
