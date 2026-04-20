import Navbar from "../Navbar";
import Footer from "../Footer";

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
            <p className="text-lg text-gray-600 mb-8">
              Get in touch with us for any questions or support you need.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Contact Form */}
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Your Name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="your@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Subject"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 h-32"
                    placeholder="Your message..."
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition"
                >
                  Send Message
                </button>
              </form>
              
              {/* Contact Information */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Phone</h3>
                  <p className="text-gray-600">+94 11 234 5678</p>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Email</h3>
                  <p className="text-gray-600">support@sanasainsurance.com</p>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Address</h3>
                  <p className="text-gray-600">
                    123 Insurance Street<br />
                    Colombo, Sri Lanka 00100
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Hours</h3>
                  <p className="text-gray-600">
                    Monday - Friday: 9:00 AM - 6:00 PM<br />
                    Saturday: 10:00 AM - 4:00 PM<br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
