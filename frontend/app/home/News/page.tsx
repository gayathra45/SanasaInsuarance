import Footer from '@/app/Components/Homepage/Footer'
import Navbar from '@/app/Components/Homepage/Navbar'
import React from 'react' 
import Image from "next/image";



export default function News() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
    <Navbar />
    <section className="relative w-full max-w-[1400px] h-32 md:h-40 lg:h-48 mb-12 mt-4">
             <div className="absolute top-0 left-0 w-[95%] md:w-[85%] h-full overflow-hidden rounded-r-[3rem] md:rounded-r-[5rem]">
                <Image 
                   src="/news_header.jpg" 
                   alt="News Banner" 
                   fill 
                   className="object-cover object-center" 
                   priority
                />
                {/* Dark teal/blue overlay */}
                <div className="absolute inset-0 bg-[#004f6e]/70 mix-blend-multiply"></div>
                <div className="absolute inset-0 flex items-center px-10 md:px-20 lg:px-32">
                   <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white tracking-wide">News</h1>
                </div>
             </div>
          </section>

    {/* Introducing Insurance App Section */}
    <section className="w-full flex flex-col md:flex-row items-center justify-between py-12 md:py-20 px-6 md:px-16 gap-10 max-w-6xl mx-auto">
      {/* Left Side - Image */}
      <div className="flex-1 flex justify-center items-center">
        <Image
          src="/Home 3.1.png"
          alt="Insurance App Introduction"
          width={400}
          height={500}
          className="object-contain"
          priority
        />
      </div>

      {/* Right Side - Content */}
      <div className="flex-1 flex flex-col items-start">
        <h2 className="text-4xl md:text-5xl font-bold text-black mb-3 leading-tight">
          Introducing Insurance App
        </h2>
        <p className="text-lg font-semibold text-gray-800 mb-6">
          Specifically built for our policy holders
        </p>
        <p className="text-base text-gray-800 leading-relaxed">
          SANASA Vehicle Insurance App makes managing your insurance simple and convenient. Policyholders can view their policies, track claims, pay premiums, upload documents, and get 24/7 support all from a secure, user-friendly mobile platform.
        </p>
      </div>
    </section>

    <Footer />
    </div>
  )
}