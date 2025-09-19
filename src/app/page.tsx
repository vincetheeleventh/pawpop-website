import { HeroSection } from "@/components/landing/HeroSection";
import { GallerySection } from "@/components/landing/GallerySection";
import { ExamplesSection } from "@/components/landing/ExamplesSection";
import { ReactionsSection } from "@/components/landing/ReactionsSection";
import { WhyPawPopSection } from "@/components/landing/WhyPawPopSection";
import { ProcessSection } from "@/components/landing/ProcessSection";
import { PricingSection } from "@/components/landing/PricingSection";

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <GallerySection />
      <ExamplesSection />
      <ReactionsSection />
      <WhyPawPopSection />
      <ProcessSection />
      <PricingSection />
    </div>
  );
}
