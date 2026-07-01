import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#ffa500] text-white pt-12 pb-6 px-6 md:px-16 w-full">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between gap-8 md:gap-4">
        
        {/* Left Column - Logo */}
        <div className="flex-shrink-0 flex justify-start items-start">
          <Link href="/Agent/Dashboard">
            <Image
              src="/footer_logo.svg"
              alt="Sanasa General Insurance"
              width={150}
              height={60}
              className="h-auto max-w-[170px] object-contain"
              priority
            />
          </Link>
        </div>

        {/* Center Navigation Column 1 */}
        <div className="flex flex-col gap-3 font-semibold text-lg md:pl-8">
          <Link href="/Agent/Dashboard" className="hover:text-white/80 transition-colors duration-150 no-underline text-white">
            Home
          </Link>
          <Link href="/Agent/Dashboard" className="hover:text-white/80 transition-colors duration-150 no-underline text-white">
            My Claims
          </Link>
          <Link href="/Agent/MyActivity" className="hover:text-white/80 transition-colors duration-150 no-underline text-white">
            My Activity
          </Link>
          <Link href="/Agent/Contact" className="hover:text-white/80 transition-colors duration-150 no-underline text-white">
            Contact
          </Link>
        </div>

        {/* Center Navigation Column 2 */}
        <div className="flex flex-col gap-3 font-semibold text-lg md:pl-8">
          <Link href="/Agent/Notifications" className="hover:text-white/80 transition-colors duration-150 no-underline text-white">
            Notifications
          </Link>
          <Link href="/Agent/Documents" className="hover:text-white/80 transition-colors duration-150 no-underline text-white">
            Documents
          </Link>
          <Link href="/Login" className="hover:text-white/80 transition-colors duration-150 no-underline text-white">
            My Profile
          </Link>
        </div>

        {/* Right Section - Helpline & Social Icons */}
        <div className="flex-1 flex flex-col md:flex-row justify-between items-start md:items-start gap-6">
          {/* 24 Hours Helpline */}
          <div className="flex items-center gap-2.5 text-lg font-bold md:ml-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-6 h-6 rotate-[15deg] animate-pulse"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.47-5.112-3.758-6.58-6.58l1.293-.97c.362-.272.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
              />
            </svg>
            <span>24 Hours : 0725 575 575</span>
          </div>

          {/* Social Icons Stacked Vertically */}
          <div className="flex flex-row md:flex-col gap-4 items-center justify-start self-end md:self-auto md:ml-auto">
            {/* Facebook */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-white hover:text-white/80 transition-transform duration-200 hover:scale-110"
            >
              <svg
                className="w-8 h-8"
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
              className="text-white hover:text-white/80 transition-transform duration-200 hover:scale-110"
            >
              <svg
                className="w-8 h-8"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm4.5 12.8c0 .94-.76 1.7-1.7 1.7H9.2c-.94 0-1.7-.76-1.7-1.7V9.2c0-.94.76-1.7 1.7-1.7h5.6c.94 0 1.7.76 1.7 1.7v5.6z" />
                <path d="M12 9.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5zm0 3.25a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm3.25-3.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" />
              </svg>
            </a>
          </div>
        </div>

      </div>

      {/* Copyright Bar */}
      <div className="max-w-[1200px] mx-auto text-center pt-6 mt-10 border-t border-white/10 text-sm font-semibold tracking-wide">
        <p className="m-0">
          © 2025 Sanasa General Insurance Co. LTD. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
