'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { HeroSection } from "@/components/landing/HeroSection";
import { GallerySection } from "@/components/landing/GallerySection";
import { SeeFirstSection } from "@/components/landing/SeeFirstSection";
import { ReactionsSection } from "@/components/landing/ReactionsSection";
import { PricingSection } from "@/components/landing/PricingSection";

function HomeContent() {
  const searchParams = useSearchParams();
  const autoOpenUpload = searchParams.get('upload') === 'true';

  return (
    <div className="min-h-screen">
      <section id="home">
        <HeroSection autoOpenUpload={autoOpenUpload} />
      </section>
      <section id="gallery">
        <GallerySection />
      </section>
      <section id="see-first">
        <SeeFirstSection />
      </section>
      <section id="testimonials">
        <ReactionsSection />
      </section>
      <section id="pricing">
        <PricingSection />
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
