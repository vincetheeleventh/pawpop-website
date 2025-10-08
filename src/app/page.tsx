'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, lazy } from 'react';
import { HeroSection } from "@/components/landing/HeroSection";

// Lazy load below-the-fold sections for better initial load performance
const GallerySection = lazy(() => import("@/components/landing/GallerySection").then(mod => ({ default: mod.GallerySection })));
const SeeFirstSection = lazy(() => import("@/components/landing/SeeFirstSection").then(mod => ({ default: mod.SeeFirstSection })));
const ReactionsSection = lazy(() => import("@/components/landing/ReactionsSection").then(mod => ({ default: mod.ReactionsSection })));
const PricingSection = lazy(() => import("@/components/landing/PricingSection").then(mod => ({ default: mod.PricingSection })));

function HomeContent() {
  const searchParams = useSearchParams();
  const autoOpenUpload = searchParams.get('upload') === 'true';

  return (
    <div className="min-h-screen">
      <section id="home">
        <HeroSection autoOpenUpload={autoOpenUpload} />
      </section>
      <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="animate-pulse text-gray-400">Loading...</div></div>}>
        <section id="gallery">
          <GallerySection />
        </section>
      </Suspense>
      <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="animate-pulse text-gray-400">Loading...</div></div>}>
        <section id="see-first">
          <SeeFirstSection />
        </section>
      </Suspense>
      <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="animate-pulse text-gray-400">Loading...</div></div>}>
        <section id="testimonials">
          <ReactionsSection />
        </section>
      </Suspense>
      <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="animate-pulse text-gray-400">Loading...</div></div>}>
        <section id="pricing">
          <PricingSection />
        </section>
      </Suspense>
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
