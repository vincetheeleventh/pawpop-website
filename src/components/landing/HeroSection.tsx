// src/components/landing/HeroSection.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { landingPageCopy } from '@/lib/copy';
import { HeroVideoReveal } from './HeroVideoReveal';
import { UploadModalEmailFirst } from '@/components/forms/UploadModalEmailFirst';

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

  return (
    <section className="min-h-screen flex items-center justify-center px-0 md:px-6 py-8 bg-card-surface">
      <div className="w-full max-w-6xl mx-auto">
        {/* Mobile: Stacked Layout */}
        <div className="md:hidden text-center">
          {/* Hero Image - Full Width on Mobile */}
          <div className="mb-8 w-full px-6">
            <Image
              src="/images/hero_1.jpeg"
              alt="Pet mom transformed into Mona Lisa with her dog"
              width={800}
              height={600}
              priority={true}
              quality={95}
              sizes="100vw"
              className="w-full rounded-2xl shadow-2xl"
            />
          </div>

          {/* Content */}
          <div className="px-6">
            <h1 className="font-arvo text-3xl font-bold text-text-primary mb-4 leading-tight">
              {hero.title}
            </h1>

            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              {hero.subtitle}
            </p>

            <button
              onClick={() => setIsModalOpen(true)}
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

            <p className="text-sm text-gray-500 mt-4 font-medium">
              {hero.subCta}
            </p>
          </div>
        </div>

        {/* Desktop: Side by Side Layout */}
        <div className="hidden md:grid md:grid-cols-2 md:gap-12 md:items-center">
          {/* Left: Content */}
          <div className="text-left pl-8 lg:pl-12">
            <h1 className="font-arvo text-4xl lg:text-5xl font-bold text-text-primary mb-6 leading-tight">
              {hero.title}
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {hero.subtitle}
            </p>

            <div className="flex flex-col items-center">
              <button
                onClick={() => setIsModalOpen(true)}
                className="
                  inline-block
                  bg-atomic-tangerine hover:bg-orange-600
                  text-white font-fredoka font-bold
                  py-4 px-8 text-xl rounded-full
                  transition-all duration-200
                  transform hover:scale-105 shadow-xl hover:shadow-2xl
                "
                data-testid="upload-button"
              >
                {hero.ctaButton}
              </button>

              <p className="text-base text-gray-500 mt-4 font-medium">
                {hero.subCta}
              </p>
            </div>
          </div>

          {/* Right: Hero Image */}
          <div>
            <Image
              src="/images/hero_1.jpeg"
              alt="Pet mom transformed into Mona Lisa with her dog"
              width={800}
              height={600}
              priority={true}
              quality={95}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="w-full rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </div>

      {/* Upload Modal - Email First Flow */}
      <UploadModalEmailFirst 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </section>
  );
};
