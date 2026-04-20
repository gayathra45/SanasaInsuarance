"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Navbar.module.css";

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
    <nav className={styles.navbar}>
      <div className={styles.logoContainer}>
        <Link href="/">
          <Image
            src="/logo.png"
            alt="Sanasa General Insurance"
            width={150}
            height={60}
            className={styles.logoImage}
            priority
          />
        </Link>
      </div>
      
      <div className={styles.navLinks}>
        <Link 
          href="/home" 
          className={`${styles.homeLink} ${isActive("/home") ? styles.active : ""}`}
        >
          Home
        </Link>
        <Link 
          href="/home/Contactus" 
          className={`${styles.navLink} ${isActive("/home/Contactus") ? styles.active : ""}`}
        >
          Contact Us
        </Link>
        <Link 
          href="/news" 
          className={`${styles.navLink} ${isActive("/news") ? styles.active : ""}`}
        >
          News
        </Link>
        <Link 
          href="/about" 
          className={`${styles.navLink} ${isActive("/about") ? styles.active : ""}`}
        >
          About Us
        </Link>
      </div>

      <div className={styles.profileContainer}>
        <button className={styles.profileButton} aria-label="User Profile">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={styles.profileIcon}
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
