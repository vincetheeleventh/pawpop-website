// src/components/landing/HeroSection.tsx
'use client';

import { landingPageCopy } from '@/lib/copy';
import Link from 'next/link';
import Image from 'next/image';

export const HeroSection = () => {
  const { title, subtitle, ctaButton } = landingPageCopy.hero;

  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-6 text-center">
        <h1 className="text-4xl font-bold text-gray-800 md:text-6xl">{title}</h1>
        <p className="mt-4 text-lg text-gray-600">{subtitle}</p>
        <Link href="/order" className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors">
          {ctaButton}
        </Link>
        <div className="mt-10">
            {/* Placeholder for a hero image */}
            <div className="w-full max-w-4xl mx-auto bg-gray-200 h-96 rounded-lg shadow-lg">
                <p className='p-4'>High-quality example of a finished portrait here</p>
            </div>
        </div>
      </div>
    </section>
  );
};
