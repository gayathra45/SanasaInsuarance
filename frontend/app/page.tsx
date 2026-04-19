import Navbar from "./home/Navbar";
import Hero from "./home/Hero";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
      </main>
    </div>
  );
}
