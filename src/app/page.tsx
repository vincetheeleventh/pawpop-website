import { EmailCaptureSection } from "@/components/landing/EmailCaptureSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { ProcessSection } from "@/components/landing/ProcessSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <ProcessSection />
      <TestimonialsSection />
      <PricingSection />
      <EmailCaptureSection />
    </div>
  );
}
