import React from 'react'
import Footer from "@/app/Components/Homepage/Footer";
import Navbar from "@/app/Components/Homepage/Navbar";
import Image from "next/image";

function page() {
  return (
    <div>page</div>
  )
}

export default function About() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <section className="relative w-full max-w-[1400px] h-32 md:h-40 lg:h-48 mb-12 mt-4">
        <div className="absolute top-0 left-0 w-[95%] md:w-[85%] h-full overflow-hidden rounded-r-[3rem] md:rounded-r-[5rem]">
          <Image
            src="/about_header.jpg"
            alt="About Banner"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Dark teal/blue overlay */}
          <div className="absolute inset-0 bg-[#004f6e]/70 mix-blend-multiply"></div>
          <div className="absolute inset-0 flex items-center px-10 md:px-20 lg:px-32">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white tracking-wide">
              About Us
            </h1>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="w-full flex flex-col md:flex-row items-center justify-between py-12 md:py-20 px-6 md:px-16 gap-10 max-w-6xl mx-auto">
        {/* Left Side - Content */}
        <div className="flex-1 flex flex-col items-start">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-6 leading-tight">
            Founder
          </h2>
          <div className="space-y-4 text-base text-gray-700 leading-relaxed">
            <h3 className="font-bold text-gray-900 text-lg">
              Dr. P.A. Kiriwandeniya
            </h3>
            <p>
              Dr. Kiriwandeniya the Chairman of Sanasa Movement is an innovative
              thinker and the founding member of co-operative Movement of Sri
              Lanka. Dr. Kiriwandeniya graduated from the University of Sri
              Jayawardanapura in 1965 and was awarded with a Doctorate from the
              University of Ruhuna for the yeoman services rendered by him to
              uplift the cooperative Movement in Sri Lanka. Dr. Kiriwandeniya is
              a recipient of the Vishwaprasadani Presidential Award in 1996, one
              of Sri Lanka's highest and most prestigious national honors.
            </p>
          </div>
        </div>

        {/* Right Side - Image */}
        <div className="flex-1 flex justify-center items-center">
          <Image
            src="/about 1.jpg"
            alt="Founder Dr. P.A. Kiriwandeniya"
            width={350}
            height={400}
            className="object-contain rounded-lg shadow-lg"
            priority
          />
        </div>
      </section>

      {/* Company Profile Section */}
      <section className="w-full py-12 md:py-20 px-6 md:px-16 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-8 leading-tight">
            Company Profile
          </h2>
          <p className="text-base text-gray-700 leading-relaxed">
            Sanasa Motor Vehicle Insurance, offered by SANASA Insurance Company
            Limited, provides reliable and affordable coverage tailored to the
            needs of vehicle owners across Sri Lanka. The policy typically
            includes protection against accidental damage, theft, and
            third-party liabilities, ensuring financial security in unexpected
            situations. Known for its customer-friendly service and strong
            community-based approach, SANASA Insurance focuses on quick claim
            settlements and flexible premium options. This makes it a popular
            choice among individuals seeking dependable insurance solutions with
            a focus on trust, accessibility, and value for money.
          </p>
        </div>
      </section>

      
      <Footer />
    </div>
  );
}