import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  // ClassName variables for better readability
  const footerContainer = "bg-[#ffa500] text-white pt-10 pb-5 px-5 mt-[60px]";
  const contentWrapper = "max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-[25px] md:gap-10 mb-[30px] text-center md:text-left";
  const logoSection = "flex-shrink-0 w-full md:w-auto flex justify-center md:justify-start";
  const logoImage = "h-auto max-w-[150px] block";
  const linksSection = "flex flex-row md:flex-col flex-wrap justify-center md:justify-start gap-[15px] flex-1 w-full md:w-auto";
  const footerLink = "text-white no-underline text-[15px] font-medium transition-opacity duration-300 hover:opacity-80";
  const buttonsSection = "flex flex-col items-center md:items-end gap-5 flex-shrink-0 w-full md:w-auto";
  const buttonContainer = "flex gap-[15px] flex-shrink-0 justify-center w-full md:w-auto";
  const loginBtn = "bg-transparent border-2 border-white text-white py-2 px-6 rounded-full no-underline text-sm font-semibold transition-all duration-300 hover:bg-white hover:text-[#ffa500]";
  const signupBtn = "bg-white text-[#ffa500] py-2 px-6 rounded-full no-underline text-sm font-semibold border-none cursor-pointer transition-all duration-300 hover:opacity-90 hover:-translate-y-[2px]";
  const socialContainer = "flex flex-row md:flex-col gap-[15px] items-center md:items-end justify-center w-full md:w-auto";
  const socialIcon = "inline-flex items-center justify-center transition-transform duration-300 hover:scale-125";
  const socialSvg = "w-6 h-6";
  const copyrightSection = "text-center pt-5 border-t border-white/20 text-[13px] text-white/90";

  return (
    <footer className={footerContainer}>
      <div className={contentWrapper}>
        {/* Left Section - Logo */}
        <div className={logoSection}>
          <Link href="/">
            <Image
              src="/footer logo.svg"
              alt="Sanasa General Insurance"
              width={120}
              height={50}
              className={logoImage}
            />
          </Link>
        </div>

        {/* Center Section - Navigation Links */}
        <div className={linksSection}>
          <Link href="/" className={footerLink}>
            Home
          </Link>
          <Link href="/news" className={footerLink}>
            News
          </Link>
          <Link href="/home/home_contact" className={footerLink}>
            Contact Us
          </Link>
          <Link href="/about" className={footerLink}>
            About Us
          </Link>
        </div>

        {/* Right Section - Login/Sign Up & Social Media */}
        <div className={buttonsSection}>
          <div className={buttonContainer}>
            <Link href="/login" className={loginBtn}>
              Login
            </Link>
            <Link href="/signup" className={signupBtn}>
              Sign Up
            </Link>
          </div>

          <div className={socialContainer}>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className={socialIcon}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="white"
                className={socialSvg}
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className={socialIcon}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="white"
                className={socialSvg}
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Copyright Section */}
      <div className={copyrightSection}>
        <p className="m-0">© 2023 Sanasa General Insurance Co. LTD. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
