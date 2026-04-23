"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  // ClassName variables for better readability
  const navContainer = "w-full bg-white border-b border-gray-200 py-4 px-6 md:px-16 flex items-center justify-between";
  const logoContainer = "flex items-center";
  const logoImage = "object-contain h-auto";
  const navLinksContainer = "hidden md:flex items-center gap-12 font-bold text-[#333] text-xl";
  const navLinkBase = "text-inherit no-underline transition-all duration-150 py-2 px-9 rounded-full hover:text-[#00ddff]";
  const navLinkActive = "bg-[#00ddff] !text-black";
  const profileButton = "text-black transition-colors duration-150 bg-transparent border-none cursor-pointer hover:text-[#00ddff] p-0";
  const profileIcon = "w-9 h-9";

  const isActive = (href: string) => {
    // For home link, only match exact path
    if (href === "/home") {
      return pathname === "/home" || pathname === "/";
    }
    // For other links, match exact path or subpaths
    return pathname === href || pathname.startsWith(href + "/");
  };

  const getLinkClass = (href: string) => {
    const activeStyles = isActive(href) ? navLinkActive : "";
    return `${navLinkBase} ${activeStyles}`;
  };

  return (
    <nav className={navContainer}>
      <div className={logoContainer}>
        <Link href="/">
          <Image
            src="/logo.png"
            alt="Sanasa General Insurance"
            width={150}
            height={60}
            className={logoImage}
            priority
          />
        </Link>
      </div>
      
      <div className={navLinksContainer}>
        <Link 
          href="/home" 
          className={getLinkClass("/home")}
        >
          Home
        </Link>
        <Link 
          href="/home/Contactus" 
          className={getLinkClass("/home/Contactus")}
        >
          Contact Us
        </Link>
        <Link 
          href="/news" 
          className={getLinkClass("/news")}
        >
          News
        </Link>
        <Link 
          href="/about" 
          className={getLinkClass("/about")}
        >
          About Us
        </Link>
      </div>

      <div className={logoContainer}>
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
      </div>
    </nav>
  );
}
