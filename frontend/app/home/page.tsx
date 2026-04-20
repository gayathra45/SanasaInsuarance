import Image from "next/image";
import Link from "next/link";
import Navbar from "./Navbar";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        {/* --- Hero Section --- */}
        <div className={styles.heroContainer}>
          <div className={styles.heroLeftSection}>
            <h1 className={styles.heroHeading}>
              Protect Your Drive
              <br />
              with Confidence.
            </h1>
            <p className={styles.heroParagraph}>
              Fast Claims. Affordable Plans. Trusted Protection.
            </p>

            <div className={styles.heroButtonContainer}>
              <Link href="/login" className={styles.heroActionButton}>
                Login
              </Link>
              <Link href="/signup" className={styles.heroActionButton}>
                Sign up
              </Link>
            </div>
          </div>

          <div className={styles.heroImageContainer}>
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
        <section className={styles.servicesContainer}>
          <h2 className={styles.servicesTitle}>Our Services</h2>

          <div className={styles.servicesCardsWrapper}>
            <div className={styles.servicesCard}>
              <div className={styles.servicesIconWrapper}>
                {/* Trusted Service Custom Icon */}
                <svg
                  className={styles.servicesIcon}
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
              <div className={styles.servicesCardTitle}>Trusted Service</div>
            </div>

            <div className={styles.servicesCard}>
              <div className={styles.servicesIconWrapper}>
                {/* Fast Claim SVG */}
                <svg
                  className={styles.servicesIcon}
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
              <div className={styles.servicesCardTitle}>
                Fast Claim
                <br />
                Processing
              </div>
            </div>

            <div className={styles.servicesCard}>
              <div className={styles.servicesIconWrapper}>
                {/* 24/7 Customer Support SVG */}
                <svg
                  className={styles.servicesIcon}
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
              <div className={styles.servicesCardTitle}>
                24/7
                <br />
                Customer Support
              </div>
            </div>

            <div className={styles.servicesCard}>
              <div className={styles.servicesIconWrapper}>
                {/* Transparent Policies SVG */}
                <svg
                  className={styles.servicesIcon}
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
              <div className={styles.servicesCardTitle}>
                Transparent Policies
              </div>
            </div>
          </div>

          <p className={styles.servicesDescription}>
            Our vehicle insurance service is built on trust, reliability, and
            customer satisfaction, offering fast claim processing, secure
            transactions, and 24/7 support to ensure a smooth experience. With
            affordable plans, transparent policies, and islandwide coverage, we
            make it easy and convenient for policyholders to manage their
            insurance needs with confidence and peace of mind.
          </p>
        </section>

        {/* --- Motor Insurance Section --- */}
        <section className={styles.motorSection}>
          <div className={styles.motorBanner}>
            <Image
              src="/home2.jpg"
              alt="Motor Insurance SUV"
              fill
              className={styles.motorBgImage}
              style={{ objectFit: 'cover' }}
            />
            <div className={styles.motorOverlay}>
              <h2 className={styles.motorHeading}>Our Motor Insurance</h2>
              <div className={styles.arrowsWrapper}>
                <Image src="/Home 2.2.1.png" alt="Arrow 1" width={400} height={200} className={styles.arrowImg} />
                <Image src="/Home 2.2.2.png" alt="Arrow 2" width={400} height={200} className={styles.arrowImg} />
                <Image src="/Home 2.2.3.png" alt="Arrow 3" width={400} height={200} className={styles.arrowImg} />
              </div>
            </div>
          </div>
          
          <div className={styles.motorBottom}>
            <div className={styles.motorBottomText}>
              <p>
                SANASA Vehicle Insurance provides reliable and affordable
                protection for your vehicle, ensuring peace of mind with fast claim
                processing, secure services, and islandwide support. Designed to
                meet the needs of policyholders, it offers a convenient and
                trustworthy way to manage your insurance.
              </p>
            </div>
            <div className={styles.motorBottomImage}>
              <Image
                src="/Home 2.1.jpg"
                alt="Vehicles Covered"
                width={1000}
                height={400}
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
