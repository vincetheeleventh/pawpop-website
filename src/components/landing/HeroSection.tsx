// src/components/landing/HeroSection.tsx
'use client';

import { landingPageCopy } from '@/lib/copy';
import Link from 'next/link';

export const HeroSection = () => {
  const { title, subtitle, ctaButton } = landingPageCopy.hero;

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="container mx-auto max-w-7xl px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
          {title}
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          {subtitle}
        </p>
        <Link href="/order" className="btn btn-primary btn-lg mt-8 inline-block">
          {ctaButton}
        </Link>
        <div className="mt-10 w-full">
          {/* Placeholder for a hero image */}
          <div className="w-full max-w-4xl mx-auto bg-gray-200 h-96 rounded-lg shadow-lg p-4 flex items-center justify-center">
            <p className="text-gray-600">High-quality example of a finished portrait here</p>
          </div>
        </div>
      </div>
    </section>
  );
};
