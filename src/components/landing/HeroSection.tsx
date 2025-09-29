// src/components/landing/HeroSection.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { landingPageCopy } from '@/lib/copy';
import { HeroVideoReveal } from './HeroVideoReveal';
import { UploadModal } from '@/components/forms/UploadModal';
import { hotjar } from '@/lib/hotjar';

interface HeroSectionProps {
  autoOpenUpload?: boolean;
}

export const HeroSection = ({ autoOpenUpload = false }: HeroSectionProps) => {
  const { hero } = landingPageCopy;
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auto-open modal if URL parameter is present
  useEffect(() => {
    if (autoOpenUpload) {
      setIsModalOpen(true);
    }
  }, [autoOpenUpload]);

  // Track landing page view
  useEffect(() => {
    hotjar.landingPage.viewed();
  }, []);

  return (
    <section className="min-h-screen flex items-center justify-center px-0 md:px-6 py-8 bg-card-surface">
      <div className="w-full max-w-2xl mx-auto text-center">
        {/* Hero Image - Full Width on Mobile */}
        <div className="mb-8 w-full px-6 md:px-0">
          <Image
            src="/images/hero_1.jpeg"
            alt="Pet mom transformed into Mona Lisa with her dog"
            width={800}
            height={600}
            priority={true}
            quality={95}
            sizes="(max-width: 768px) 100vw, 448px"
            className="w-full md:max-w-md md:mx-auto rounded-2xl shadow-2xl"
          />
        </div>

        {/* Headline */}
        <div className="px-6 md:px-0">
          <h1 className="font-arvo text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-4 leading-tight">
            {hero.title}
          </h1>

          {/* Subtitle */}
          <p className="
            text-lg md:text-xl text-gray-600 mb-8 leading-relaxed
          ">
            {hero.subtitle}
          </p>

          {/* Single CTA Button - Mobile Optimized */}
          <button
            onClick={() => {
              setIsModalOpen(true);
              hotjar.landingPage.ctaClicked();
            }}
            className="
              inline-block w-full max-w-xs
              bg-atomic-tangerine hover:bg-orange-600
              text-white font-fredoka font-bold
              py-4 px-8 text-xl rounded-full
              transition-all duration-200
              transform hover:scale-105 shadow-xl hover:shadow-2xl
              min-h-[56px] touch-manipulation
            "
            data-testid="upload-button"
          >
            {hero.ctaButton}
          </button>

          {/* Sub-CTA Copy */}
          <p className="text-sm md:text-base text-gray-500 mt-4 font-medium">
            {hero.subCta}
          </p>

        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </section>
  );
};
