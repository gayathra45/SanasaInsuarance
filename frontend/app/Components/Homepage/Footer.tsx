import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#ffa500] text-white pt-10 pb-5 px-6 md:px-16 mt-[60px] w-full">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-8 text-center md:text-left">
        
        {/* Left Section - Logo */}
        <div className="flex-shrink-0 flex justify-center md:justify-start">
          <Link href="/">
            <Image
              src="/footer logo.svg"
              alt="Sanasa General Insurance"
              width={140}
              height={55}
              className="h-auto max-w-[160px] object-contain"
              priority
            />
          </Link>
        </div>

        {/* Center Section - Navigation Links */}
        <div className="flex flex-col gap-2 font-medium text-base md:text-lg">
          <Link href="/" className="hover:text-white/80 transition-colors duration-150 no-underline text-white">
            Home
          </Link>
          <Link href="/home/News" className="hover:text-white/80 transition-colors duration-150 no-underline text-white">
            News
          </Link>
          <Link href="/home/contactUs" className="hover:text-white/80 transition-colors duration-150 no-underline text-white">
            Contact Us
          </Link>
          <Link href="/home/AboutUs" className="hover:text-white/80 transition-colors duration-150 no-underline text-white">
            About Us
          </Link>
        </div>

        {/* Center-Right Section - Contact Info */}
        <div className="flex flex-col gap-1 text-base md:text-[17px] font-normal">
          <span className="font-bold text-lg mb-1 block">Contact :</span>
          <span className="opacity-95">Tel. - 077 1974163</span>
          <span className="opacity-95">No. 07, Galle Road, Colombo 08</span>
        </div>

        {/* Right Section - Login/Sign Up & Social Media */}
        <div className="flex flex-col items-center md:items-end gap-5 flex-shrink-0 w-full md:w-auto">
          <div className="flex gap-[15px] flex-shrink-0 justify-center w-full md:w-auto">
            <Link
              href="/Login"
              className="bg-transparent border-2 border-white text-white py-2 px-6 rounded-full no-underline text-sm font-semibold transition-all duration-300 hover:bg-white hover:text-[#ffa500]"
            >
              Login
            </Link>
            <Link
              href="/SignUp"
              className="bg-white text-[#ffa500] py-2 px-6 rounded-full no-underline text-sm font-semibold border-none cursor-pointer transition-all duration-300 hover:opacity-90 hover:-translate-y-[2px]"
            >
              Sign Up
            </Link>
          </div>

          <div className="flex flex-row md:flex-col gap-4 items-center md:items-end justify-center">
            {/* Facebook */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-white transition-transform duration-300 hover:scale-110"
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
              className="text-white transition-transform duration-300 hover:scale-110"
            >
              <svg
                className="w-8 h-8"
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
      <div className="max-w-[1200px] mx-auto text-center pt-5 mt-8 border-t border-white/20 text-[13px] opacity-90">
        <p className="m-0">
          © 2025 Sanasa General Insurance Co. LTD. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
