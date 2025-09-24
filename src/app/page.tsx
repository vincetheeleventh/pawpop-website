'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { HeroSection } from "@/components/landing/HeroSection";
import { GallerySection } from "@/components/landing/GallerySection";
import { ReactionsSection } from "@/components/landing/ReactionsSection";
import { WhyPawPopSection } from "@/components/landing/WhyPawPopSection";
import { ProcessSection } from "@/components/landing/ProcessSection";

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
      <section id="testimonials">
        <ReactionsSection />
      </section>
      <section id="why">
        <WhyPawPopSection />
      </section>
      <section id="process">
        <ProcessSection />
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
