"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    // For home link, only match exact path
    if (href === "/home") {
      return pathname === "/home" || pathname === "/";
    }
    // For other links, match exact path or subpaths
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav className="w-full bg-white border-b border-gray-200 py-4 px-6 md:px-16 flex items-center justify-between">
      <div className="flex items-center">
        <Link href="/">
          <Image
            src="/logo.png"
            alt="Sanasa General Insurance"
            width={150}
            height={60}
            className="object-contain h-auto"
            priority
          />
        </Link>
      </div>
      
      <div className="hidden md:flex items-center gap-12 font-bold text-[#333] text-xl">
        <Link 
          href="/home" 
          className={`text-inherit no-underline transition-all duration-150 py-2 px-9 rounded-full hover:text-[#00ddff] ${isActive("/home") ? "bg-[#00ddff] !text-black" : ""}`}
        >
          Home
        </Link>
        <Link 
          href="/home/Contactus" 
          className={`text-inherit no-underline transition-all duration-150 py-2 px-9 rounded-full hover:text-[#00ddff] ${isActive("/home/Contactus") ? "bg-[#00ddff] !text-black" : ""}`}
        >
          Contact Us
        </Link>
        <Link 
          href="/news" 
          className={`text-inherit no-underline transition-all duration-150 py-2 px-9 rounded-full hover:text-[#00ddff] ${isActive("/news") ? "bg-[#00ddff] !text-black" : ""}`}
        >
          News
        </Link>
        <Link 
          href="/about" 
          className={`text-inherit no-underline transition-all duration-150 py-2 px-9 rounded-full hover:text-[#00ddff] ${isActive("/about") ? "bg-[#00ddff] !text-black" : ""}`}
        >
          About Us
        </Link>
      </div>

      <div className="flex items-center">
        <button className="text-black transition-colors duration-150 bg-transparent border-none cursor-pointer hover:text-[#00ddff] p-0" aria-label="User Profile">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-9 h-9"
          >
            <path
              fillRule="evenodd"
              d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </nav>
  );
}
