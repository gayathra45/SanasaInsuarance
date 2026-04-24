import Image from "next/image";
import Navbar from "../../Components/Homepage/Navbar";
import Footer from "../../Components/Homepage/Footer";

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Navbar />
      
      {/* Banner Section */}
      <section className="relative w-full max-w-[1400px] h-32 md:h-40 lg:h-48 mb-12 mt-4">
         <div className="absolute top-0 left-0 w-[95%] md:w-[85%] h-full overflow-hidden rounded-r-[3rem] md:rounded-r-[5rem]">
            <Image 
               src="/contact_border.jpeg" 
               alt="Contact Banner" 
               fill 
               className="object-cover object-center" 
               priority
            />
            {/* Dark teal/blue overlay */}
            <div className="absolute inset-0 bg-[#004f6e]/70 mix-blend-multiply"></div>
            <div className="absolute inset-0 flex items-center px-10 md:px-20 lg:px-32">
               <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white tracking-wide">Contact Us</h1>
            </div>
         </div>
      </section>

      {/* Info Section */}
      <section className="max-w-5xl mx-auto w-full px-6 py-8 md:py-16 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-0 relative z-10">
        
        {/* Head Office */}
        <div className="flex flex-col items-start md:px-12">
          <div className="w-14 h-14 rounded-full bg-gray-300 flex items-center justify-center mb-6">
             <svg className="w-7 h-7 text-white fill-current" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
          <h3 className="font-bold text-gray-800 text-sm mb-3">Head Office</h3>
          <p className="text-gray-600 text-xs leading-relaxed">No: 172, Elvitigala Mv, Colombo 8,<br/>Sri Lanka</p>
        </div>

        {/* Open Hours */}
        <div className="flex flex-col items-start md:px-12 md:border-l md:border-gray-200">
          <div className="w-14 h-14 rounded-full bg-gray-300 flex items-center justify-center mb-6">
            <svg className="w-7 h-7 text-white fill-current" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
          </div>
          <h3 className="font-bold text-gray-800 text-sm mb-3">Open Hours</h3>
          <p className="text-gray-600 text-xs leading-relaxed">Monday - Friday<br/>8:30AM–5:15PM</p>
        </div>

        {/* Hotline */}
        <div className="flex flex-col items-start md:px-12 md:border-l md:border-gray-200">
          <div className="w-14 h-14 rounded-full bg-gray-300 flex items-center justify-center mb-6">
            <svg className="w-7 h-7 text-white fill-current" viewBox="0 0 24 24"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>
          </div>
          <h3 className="font-bold text-gray-800 text-sm mb-3">Hotline</h3>

          <p className="text-gray-600 text-xs leading-relaxed mb-1">+94 112 003 000</p>
          <p className="text-gray-600 text-xs leading-relaxed">+94 112 003 000 - 24 Hours Hotline</p>
        </div>

      </section>

      {/* Location Section */}
      <section className="relative w-full mt-16 md:mt-24 pt-12 md:pt-20">
         {/* Background image for the location section */}
         <div className="absolute inset-0 top-0 h-[400px] md:h-[450px] w-full overflow-hidden">
            <Image 
               src="/contact_location.png" 
               alt="Location Background" 
               fill 
               className="object-cover object-center" 
            />
            {/* Dark gradient overlay on the left to make "Location" text pop */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#1b3b55]/90 via-[#1b3b55]/40 to-transparent"></div>
            {/* White gradient overlay from bottom to fade out the background */}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent"></div>
         </div>
         
         <div className="relative max-w-6xl mx-auto px-6 z-10 flex flex-col">
            
            {/* Location Title */}
            <div className="flex justify-between items-start mb-6 md:mb-10">
               <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-md md:pl-4">Location</h2>
            </div>

            <div className="flex flex-col md:flex-row gap-8 lg:gap-16 items-start">
              {/* Map iframe overlapping bottom */}
              <div className="w-full md:w-[60%] lg:w-[55%] -mb-12 md:-mb-24 z-20 md:pl-4">
                 <div className="relative w-full h-[250px] md:h-[350px] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl border-[6px] border-white bg-white">
                    <iframe 
                       src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3961.2661808899647!2d79.87076!3d6.918!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae259ab28a0b0f1%3A0x5f5b0b0b0b0b0b0b!2sSanasa%20General%20Insurance!5e0!3m2!1sen!2slk!4v1234567890"
                       width="100%" 
                       height="100%" 
                       style={{ border: 0 }} 
                       allowFullScreen={true} 
                       loading="lazy" 
                       referrerPolicy="no-referrer-when-downgrade"
                       className="absolute inset-0 w-full h-full"
                    ></iframe>
                 </div>
              </div>

              {/* Head Office text next to map */}
              <div className="w-full md:w-[40%] lg:w-[45%] mt-4 md:mt-32">
                 <h3 className="font-bold text-gray-800 text-sm md:text-base mb-2">Head Office</h3>
                 <p className="text-gray-600 text-sm leading-relaxed">No: 172, Elvitigala Mv, Colombo 8,<br/>Sri Lanka</p>
              </div>
            </div>

         </div>
         {/* Spacer to prevent overlapping with footer due to negative margin */}
         <div className="h-12 md:h-24"></div>
      </section>

      <Footer />
    </div>
  );
}
