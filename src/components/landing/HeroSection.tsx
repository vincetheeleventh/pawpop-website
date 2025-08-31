// src/components/landing/HeroSection.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { landingPageCopy } from '@/lib/copy';

export const HeroSection = () => {
  const { hero } = landingPageCopy;

  return (
    <section className="
      bg-gallery-gradient from-gallery-white to-warm-peach/10
      py-16 lg:py-24
    ">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            {/* Character Introduction */}
            <div className="
              relative bg-warm-peach/20 rounded-2xl p-6 mb-8
              border-2 border-warm-peach
              before:content-[''] before:absolute before:-left-2 before:top-6
              before:w-4 before:h-4 before:bg-warm-peach before:rotate-45
            ">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-french-blue rounded-full flex items-center justify-center animate-character-bounce">
                  <span className="text-xl">🎨</span>
                </div>
                <div>
                  <p className="font-fredoka text-charcoal-frame text-lg">
                    {hero.characterIntro}
                  </p>
                  <span className="font-inter text-sm text-gray-600 mt-1 block">
                    - Monsieur Brush
                  </span>
                </div>
              </div>
            </div>

            <h1 className="
              font-playfair text-4xl md:text-5xl lg:text-6xl font-black 
              text-charcoal-frame mb-6 leading-tight
            ">
              {hero.title}
            </h1>
            <p className="font-inter text-xl text-gray-600 mb-8 max-w-2xl">
              {hero.subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link 
                href="/create" 
                className="
                  bg-mona-gold hover:bg-yellow-600 
                  text-charcoal-frame font-fredoka font-medium
                  px-8 py-4 rounded-full text-lg
                  transform hover:scale-105 transition-all duration-200
                  shadow-lg hover:shadow-xl
                  border-2 border-transparent hover:border-yellow-700
                "
              >
                {hero.ctaButton}
              </Link>
              <Link 
                href="/process" 
                className="
                  bg-transparent border-2 border-french-blue
                  text-french-blue hover:bg-french-blue hover:text-white
                  font-inter font-medium
                  px-8 py-4 rounded-full text-lg
                  transition-all duration-200
                "
              >
                How It Works
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex flex-wrap justify-center lg:justify-start gap-8 text-sm font-inter text-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-joy-yellow text-lg">✨</span>
                <span>AI-Powered Artistry</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-love-pink text-lg">💕</span>
                <span>Pet Mom Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-mona-gold text-lg">🖼️</span>
                <span>Museum Quality</span>
              </div>
            </div>
          </div>

          {/* Right Column - Before/After Showcase */}
          <div className="relative">
            {/* Main Gallery Frame */}
            <div className="
              relative bg-gallery-white rounded-lg shadow-2xl
              border-4 border-mona-gold overflow-hidden
              transform hover:scale-105 transition-all duration-300
            ">
              <div className="grid grid-cols-2 h-80">
                {/* Before */}
                <div className="bg-gray-100 flex flex-col items-center justify-center p-6">
                  <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center mb-3">
                    <span className="text-3xl">👩</span>
                  </div>
                  <span className="font-inter text-sm text-gray-600">Before</span>
                </div>
                
                {/* After */}
                <div className="bg-gradient-to-br from-mona-gold/20 to-warm-peach/30 flex flex-col items-center justify-center p-6">
                  <div className="w-24 h-24 bg-mona-gold/30 rounded-full flex items-center justify-center mb-3">
                    <span className="text-3xl">🖼️</span>
                  </div>
                  <span className="font-fredoka text-sm text-charcoal-frame">Mona Lisa!</span>
                </div>
              </div>
              
              {/* Gallery Label */}
              <div className="absolute bottom-0 left-0 right-0 bg-charcoal-frame text-gallery-white p-3 text-center">
                <span className="font-playfair text-sm">"Sarah & Bella" - Renaissance Masterpiece</span>
              </div>
            </div>
            
            {/* Floating Character Elements */}
            <div className="absolute -top-6 -right-6 bg-french-blue rounded-full p-4 shadow-lg animate-character-bounce">
              <span className="text-2xl">🎨</span>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-joy-yellow rounded-full p-4 shadow-lg animate-pulse">
              <span className="text-2xl">✨</span>
            </div>
            <div className="absolute top-1/2 -left-4 bg-love-pink rounded-full p-3 shadow-lg animate-bounce">
              <span className="text-xl">💕</span>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="mt-16 text-center">
          <p className="font-inter text-gray-600 mb-6">Loved by pet moms everywhere</p>
          <div className="flex justify-center items-center space-x-8 opacity-80">
            <div className="flex items-center space-x-1">
              <span className="text-2xl font-fredoka text-joy-yellow">4.9</span>
              <span className="text-joy-yellow text-xl">⭐</span>
            </div>
            <div className="font-inter text-sm text-gray-500">2,500+ Transformations</div>
            <div className="font-inter text-sm text-gray-500">Pet Moms Delighted</div>
          </div>
        </div>
      </div>
    </section>
  );
};
