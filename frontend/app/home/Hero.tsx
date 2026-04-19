import Image from "next/image";
import Link from "next/link";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <div className={styles.heroContainer}>
      <div className={styles.leftSection}>
        <h1 className={styles.heading}>
          Protect Your Drive<br />
          with Confidence.
        </h1>
        <p className={styles.paragraph}>
          Fast Claims. Affordable Plans. Trusted Protection.
        </p>
        
        <div className={styles.buttonContainer}>
          <Link 
            href="/login" 
            className={styles.actionButton}
          >
            Login
          </Link>
          <Link 
            href="/signup" 
            className={styles.actionButton}
          >
            Sign up
          </Link>
        </div>
      </div>
      
      <div className={styles.imageContainer}>
        <Image
          src="/home1.jpg"
          alt="Woman sitting in the trunk of a car looking out at a landscape"
          fill
          style={{ objectFit: 'cover' }}
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>
    </div>
  );
}
