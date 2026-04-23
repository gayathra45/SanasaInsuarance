import Navbar from "../../Components/Homepage/Navbar";
import Footer from "../../Components/Homepage/Footer";

export default function ContactUs() {
  // ClassName variables for better readability
  const pageContainer = "min-h-screen bg-white";
  const mainSection = "py-16 px-6";
  const contentWrapper = "max-w-4xl mx-auto";
  const pageTitle = "text-4xl font-bold mb-4";
  const pageDesc = "text-lg text-gray-600 mb-8";
  const formGrid = "grid grid-cols-1 md:grid-cols-2 gap-12";
  const formContainer = "space-y-6";
  const formGroup = "space-y-6";
  const formField = "space-y-2";
  const formLabel = "block text-sm font-medium text-gray-700 mb-2";
  const formInput = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500";
  const formTextarea = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 h-32";
  const submitBtn = "w-full bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition";
  const infoContainer = "space-y-8";
  const infoBlock = "bg-gray-50 p-6 rounded-lg border border-gray-200";
  const infoTitle = "text-xl font-bold text-gray-800 mb-2";
  const infoText = "text-gray-600";

  return (
    <div className={pageContainer}>
      <Navbar />
      <main>
        <section className={mainSection}>
          <div className={contentWrapper}>
            <h1 className={pageTitle}>Contact Us</h1>
            <p className={pageDesc}>
              Get in touch with us for any questions or support you need.
            </p>
            
            <div className={formGrid}>
              {/* Contact Form */}
              <form className={formContainer}>
                <div className={formField}>
                  <label className={formLabel}>
                    Name
                  </label>
                  <input
                    type="text"
                    className={formInput}
                    placeholder="Your Name"
                  />
                </div>
                
                <div className={formField}>
                  <label className={formLabel}>
                    Email
                  </label>
                  <input
                    type="email"
                    className={formInput}
                    placeholder="your@email.com"
                  />
                </div>
                
                <div className={formField}>
                  <label className={formLabel}>
                    Subject
                  </label>
                  <input
                    type="text"
                    className={formInput}
                    placeholder="Subject"
                  />
                </div>
                
                <div className={formField}>
                  <label className={formLabel}>
                    Message
                  </label>
                  <textarea
                    className={formTextarea}
                    placeholder="Your message..."
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  className={submitBtn}
                >
                  Send Message
                </button>
              </form>
              
              {/* Contact Information */}
              <div className={infoContainer}>
                <div className={infoBlock}>
                  <h3 className={infoTitle}>Phone</h3>
                  <p className={infoText}>+94 11 234 5678</p>
                </div>
                
                <div className={infoBlock}>
                  <h3 className={infoTitle}>Email</h3>
                  <p className={infoText}>support@sanasainsurance.com</p>
                </div>
                
                <div className={infoBlock}>
                  <h3 className={infoTitle}>Address</h3>
                  <p className={infoText}>
                    123 Insurance Street<br />
                    Colombo, Sri Lanka 00100
                  </p>
                </div>
                
                <div className={infoBlock}>
                  <h3 className={infoTitle}>Hours</h3>
                  <p className={infoText}>
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
