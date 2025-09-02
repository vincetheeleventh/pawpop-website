// src/components/landing/HeroSection.tsx

import Link from 'next/link';
import { landingPageCopy } from '@/lib/copy';
import { HeroVideoReveal } from './HeroVideoReveal';

export const HeroSection = () => {
  const { hero } = landingPageCopy;

  return (
    <section className="min-h-screen flex items-center justify-center px-0 md:px-6 py-8 bg-gallery-white">
      <div className="w-full max-w-2xl mx-auto text-center">
        {/* Hero Image - Full Width on Mobile */}
        <div className="mb-8 w-full px-6 md:px-0">
          <img
            src="/images/hero_image.png"
            alt="Pet mom transformed into Mona Lisa with her dog"
            className="w-full md:max-w-md md:mx-auto rounded-2xl shadow-2xl"
          />
        </div>

        {/* Headline */}
        <div className="px-6 md:px-0">
          <h1 className="
            font-playfair text-3xl md:text-4xl lg:text-5xl font-bold 
            text-charcoal-frame mb-4 leading-tight
          ">
            {hero.title}
          </h1>

          {/* Single CTA Button - Mobile Optimized */}
          <Link
            href="/create"
            className="
              inline-block w-full max-w-xs
              bg-mona-gold hover:bg-yellow-600
              text-charcoal-frame font-fredoka font-bold
              py-4 px-8 rounded-full text-xl
              transition-all duration-200
              transform hover:scale-105 shadow-xl hover:shadow-2xl
              min-h-[56px] touch-manipulation
            "
          >
            {hero.ctaButton}
          </Link>

          {/* Monsieur Brush Quote */}
          <div className="mt-6">
            <p className="font-fredoka text-charcoal-frame/80 italic text-base">
              {hero.characterIntro}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
