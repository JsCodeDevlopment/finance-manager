import { Header } from "../components/landing/Header";
import { Hero } from "../components/landing/Hero";
import { Stats } from "../components/landing/Stats";
import { Features } from "../components/landing/Features";
import { HowItWorks } from "../components/landing/HowItWorks";
import { FAQ } from "../components/landing/FAQ";
import { CTA } from "../components/landing/CTA";
import { Footer } from "../components/landing/Footer";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-[#ff632a]/30">
      <Header />
      <main>
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
