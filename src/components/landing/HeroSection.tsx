// src/components/landing/HeroSection.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';

export const HeroSection = () => {
  return (
    <section className="bg-gradient-to-br from-blue-50 to-purple-50 section-padding">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Turn Your Pet Into a 
              <span className="text-gradient block">Pop Art Icon</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl">
              The most unique and hilarious gift for the pet mom who has everything. 
              A timeless treasure that is both funny and deeply personal.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/products" className="btn-primary text-lg px-8 py-4">
                Create Your Masterpiece
              </Link>
              <Link href="#process" className="btn-outline text-lg px-8 py-4">
                How It Works
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex flex-wrap justify-center lg:justify-start gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>100% Satisfaction Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Fast 3-5 Day Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Expert Artists</span>
              </div>
            </div>
          </div>

          {/* Right Column - Hero Image */}
          <div className="relative">
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 transform rotate-2 hover:rotate-0 transition-transform duration-300">
              <div className="bg-gradient-to-br from-pink-400 via-purple-500 to-blue-500 rounded-xl p-6 text-center">
                <div className="bg-white rounded-lg p-4 mb-4">
                  <div className="w-32 h-32 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-4xl">🐕</span>
                  </div>
                </div>
                <h3 className="text-white font-bold text-xl mb-2">Max the Golden Retriever</h3>
                <p className="text-pink-100 text-sm">Pop Art Portrait</p>
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 bg-yellow-400 rounded-full p-3 shadow-lg animate-bounce">
              <span className="text-2xl">⭐</span>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-pink-400 rounded-full p-3 shadow-lg animate-pulse">
              <span className="text-2xl">🎨</span>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-6">Trusted by thousands of pet parents</p>
          <div className="flex justify-center items-center space-x-8 opacity-60">
            <div className="text-2xl font-bold text-gray-400">4.9★</div>
            <div className="text-sm text-gray-500">1,200+ Reviews</div>
            <div className="text-sm text-gray-500">5,000+ Happy Pets</div>
          </div>
        </div>
      </div>
    </section>
  );
};
