import Image from "next/image";
import Link from "next/link";
import Navbar from "../Components/Homepage/Navbar";
import Footer from "../Components/Homepage/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        {/* --- Hero Section --- */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between py-6 px-6 pb-16 md:pl-16 md:pr-0 xl:pl-24 gap-10">
          <div className="flex flex-col items-start pt-8 md:w-[45%] md:pr-8">
            <h1 className="text-5xl md:text-[4.5rem] leading-[1.2] font-bold text-black tracking-tight mb-6">
              Protect Your Drive
              <br />
              with Confidence.
            </h1>
            <p className="text-lg text-gray-800 mb-16 font-medium">
              Fast Claims. Affordable Plans. Trusted Protection.
            </p>

            <div className="flex gap-8">
              <Link href="/login" className="bg-[#00ddff] text-black font-bold text-xl py-3 px-12 rounded-full transition-colors duration-150 shadow-sm hover:bg-[#22d3ee] no-underline">
                Login
              </Link>
              <Link href="/signup" className="bg-[#00ddff] text-black font-bold text-xl py-3 px-12 rounded-full transition-colors duration-150 shadow-sm hover:bg-[#22d3ee] no-underline">
                Sign up
              </Link>
            </div>
          </div>

          <div className="relative h-[400px] md:h-[550px] w-full md:w-[55%] rounded-[3rem] md:rounded-[4rem_0_0_4rem] overflow-hidden shadow-lg">
            <Image
              src="/home1.jpg"
              alt="Woman sitting in the trunk of a car looking out at a landscape"
              fill
              style={{ objectFit: "cover" }}
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        </div>

        {/* --- Services Section --- */}
        <section className="py-16 px-6 md:py-24 md:px-16 bg-white flex flex-col items-center">
          <h2 className="text-3xl font-bold text-black mb-12 text-center">Our Services</h2>

          <div className="flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap justify-center lg:justify-between gap-6 w-full max-w-[1200px] mb-12">
            <div className="flex-1 min-w-[calc(50%-1rem)] lg:min-w-0 bg-white border border-gray-200 rounded-[1.5rem] p-10 flex flex-col items-center text-center shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200">
              <div className="text-gray-600 mb-6 flex items-center justify-center">
                {/* Trusted Service Custom Icon */}
                <svg
                  className="w-[72px] h-[72px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <div className="text-lg font-bold text-gray-900 leading-snug">Trusted Service</div>
            </div>

            <div className="flex-1 min-w-[calc(50%-1rem)] lg:min-w-0 bg-white border border-gray-200 rounded-[1.5rem] p-10 flex flex-col items-center text-center shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200">
              <div className="text-gray-600 mb-6 flex items-center justify-center">
                {/* Fast Claim SVG */}
                <svg
                  className="w-[72px] h-[72px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="8" />
                  <path d="M12 4V2" />
                  <path d="M12 12l2.5 2.5" />
                  <path d="M4 12H2" />
                  <path d="M6.34 6.34L4.93 4.93" />
                  <path d="M6.34 17.66l-1.41 1.41" />
                  <path d="M22 12h-2" />
                </svg>
              </div>
              <div className="text-lg font-bold text-gray-900 leading-snug">
                Fast Claim
                <br />
                Processing
              </div>
            </div>

            <div className="flex-1 min-w-[calc(50%-1rem)] lg:min-w-0 bg-white border border-gray-200 rounded-[1.5rem] p-10 flex flex-col items-center text-center shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200">
              <div className="text-gray-600 mb-6 flex items-center justify-center">
                {/* 24/7 Customer Support SVG */}
                <svg
                  className="w-[72px] h-[72px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="text-lg font-bold text-gray-900 leading-snug">
                24/7
                <br />
                Customer Support
              </div>
            </div>

            <div className="flex-1 min-w-[calc(50%-1rem)] lg:min-w-0 bg-white border border-gray-200 rounded-[1.5rem] p-10 flex flex-col items-center text-center shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200">
              <div className="text-gray-600 mb-6 flex items-center justify-center">
                {/* Transparent Policies SVG */}
                <svg
                  className="w-[72px] h-[72px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
                  <path d="m9 14 2 2 4-4" />
                </svg>
              </div>
              <div className="text-lg font-bold text-gray-900 leading-snug">
                Transparent Policies
              </div>
            </div>
          </div>

          <p className="max-w-[900px] text-center text-base text-gray-700 leading-relaxed mx-auto">
            Our vehicle insurance service is built on trust, reliability, and
            customer satisfaction, offering fast claim processing, secure
            transactions, and 24/7 support to ensure a smooth experience. With
            affordable plans, transparent policies, and islandwide coverage, we
            make it easy and convenient for policyholders to manage their
            insurance needs with confidence and peace of mind.
          </p>
        </section>

        {/* --- Motor Insurance Section --- */}
        <section className="w-full flex flex-col">
          <div className="relative w-full h-[300px] md:h-[400px] flex">
            <Image
              src="/home2 h.png"
              alt="Motor Insurance Features"
              fill
              className="z-[1]"
              style={{ objectFit: 'cover' }}
            />
            <div className="absolute inset-0 z-[2] bg-gradient-to-b from-white/90 via-transparent to-black/80 flex justify-between items-end p-8 md:px-24 md:py-12">
              <h2 className="text-white text-[2.5rem] md:text-[4rem] font-bold mb-8">Our Motor Insurance</h2>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row p-8 md:p-16 bg-white items-center gap-8 md:justify-between">
            <div className="flex-1 text-lg leading-relaxed text-gray-800 font-medium text-left">
              <p>
                SANASA Vehicle Insurance provides reliable and affordable
                protection for your vehicle, ensuring peace of mind with fast claim
                processing, secure services, and islandwide support. Designed to
                meet the needs of policyholders, it offers a convenient and
                trustworthy way to manage your insurance.
              </p>
            </div>
            <div className="flex-[1.5] flex justify-center items-center">
              <Image
                src="/Home 2.1.png"
                alt="Vehicles Covered"
                width={1000}
                height={400}
                style={{ objectFit: 'contain' }}
                className="w-full max-w-[800px] h-auto object-contain"
              />
            </div>
          </div>
        </section>

        {/* --- Insurance App Section --- */}
        <section className="relative w-full min-h-[500px] md:min-h-[550px] flex items-center justify-center mt-12 overflow-hidden">
          <div className="absolute inset-0 w-full h-full z-[1]">
            <Image
              src="/Home 3.jpg"
              alt="Insurance App background"
              fill
              style={{ objectFit: "cover" }}
            />
          </div>

          <div className="relative z-[2] flex flex-col md:flex-row items-center justify-center md:justify-between w-full max-w-[1200px] p-8 md:px-16 md:py-12 gap-8 md:gap-16">
            <div className="flex-none md:flex-1 flex justify-center items-center">
              <Image
                src="/Home 3.1.png"
                alt="Insurance app with phone, car and shield"
                width={400}
                height={500}
                style={{ objectFit: "contain" }}
              />
            </div>

            <div className="flex-1 bg-white/98 p-8 md:p-10 rounded-3xl text-slate-900 text-center md:text-left shadow-2xl">
              <p className="text-xs font-bold tracking-[0.15em] uppercase text-slate-500 mb-3">Introducing Insurance App</p>
              <h2 className="text-[1.75rem] md:text-4xl leading-[1.2] font-extrabold text-slate-900 mb-4">
                Specifically built for our policy holders
              </h2>
              <p className="text-[0.95rem] leading-[1.7] text-slate-600">
                SANASA Vehicle Insurance App makes managing your insurance simple
                and convenient. Policyholders can view their policies, track claims,
                pay premiums, upload documents, and get 24/7 support all from a
                secure, user-friendly mobile platform.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
