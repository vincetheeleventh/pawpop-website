import { HeroSection } from "@/components/landing/HeroSection";
import { WhyPawPopSection } from "@/components/landing/WhyPawPopSection";
import { ProcessSection } from "@/components/landing/ProcessSection";
import { PricingSection } from "@/components/landing/PricingSection";

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <WhyPawPopSection />
      <ProcessSection />
      <PricingSection />
    </div>
  );
}
