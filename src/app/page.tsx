import { HeroSection } from "@/components/landing/HeroSection";
import { GallerySection } from "@/components/landing/GallerySection";
import { ReactionsSection } from "@/components/landing/ReactionsSection";
import { WhyPawPopSection } from "@/components/landing/WhyPawPopSection";
import { ProcessSection } from "@/components/landing/ProcessSection";

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <GallerySection />
      <ReactionsSection />
      <WhyPawPopSection />
      <ProcessSection />
    </div>
  );
}
