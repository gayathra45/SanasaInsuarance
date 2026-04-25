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



    <Footer />
    </div>
  )
}