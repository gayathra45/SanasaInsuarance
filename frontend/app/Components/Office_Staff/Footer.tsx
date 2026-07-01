"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function OfficeStaffFooter() {
  return (
    <footer className="bg-[#102A43] w-full text-white py-12 px-6 md:px-16 select-none relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* Top Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center md:items-start flex-col">
            <div className="relative w-44 h-20 brightness-0 invert">
              <Image
                src="/logo.png"
                alt="Sanasa General Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Links Columns */}
          <div className="flex flex-row gap-12 md:gap-24 flex-1 justify-center md:justify-start md:pl-20">
            {/* Column 1 */}
            <div className="flex flex-col gap-3.5">
              <Link href="/Office_Staff/Dashboard" className="hover:text-slate-200 transition-colors font-extrabold text-base no-underline">
                Home
              </Link>
              <Link href="/Office_Staff/Claims" className="hover:text-slate-200 transition-colors font-extrabold text-base no-underline">
                Claims
              </Link>
              <Link href="/Office_Staff/Registrations" className="hover:text-slate-200 transition-colors font-extrabold text-base no-underline">
                Registrations
              </Link>
              <Link href="/Office_Staff/Contact" className="hover:text-slate-200 transition-colors font-extrabold text-base no-underline">
                Contact
              </Link>
            </div>

            {/* Column 2 */}
            <div className="flex flex-col gap-3.5">
              <Link href="/Office_Staff/PolicyHolders" className="hover:text-slate-200 transition-colors font-extrabold text-base no-underline">
                Policy Holders
              </Link>
              <Link href="/Office_Staff/Agents" className="hover:text-slate-200 transition-colors font-extrabold text-base no-underline">
                Agents
              </Link>
              <Link href="/Office_Staff/Reports" className="hover:text-slate-200 transition-colors font-extrabold text-base no-underline">
                Reports
              </Link>
            </div>
          </div>

          {/* Contact and Socials Info */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
            {/* 24 Hours Contact */}
            <div className="flex items-center gap-3">
              {/* Phone Icon */}
              <div className="bg-white/10 p-2.5 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6 text-white"
                >
                  <path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c1.358 3.35 4.07 6.062 7.42 7.42l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-black text-[15px] tracking-wide whitespace-nowrap">
                24 Hours : 0725 575 575
              </span>
            </div>

            {/* Social Icons Stacked Vertically */}
            <div className="flex flex-row md:flex-col gap-4">
              {/* Facebook Icon */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-white hover:bg-white hover:text-[#f59e0b] text-white flex items-center justify-center transition-all"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                </svg>
              </a>

              {/* Instagram Icon */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-white hover:bg-white hover:text-[#f59e0b] text-white flex items-center justify-center transition-all"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            </div>

          </div>

        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/20 pt-6 text-center select-none">
          <p className="text-sm font-bold opacity-90 tracking-wide">
            &copy; 2025 Sanasa General Insurance Co. LTD. All Rights Reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}
