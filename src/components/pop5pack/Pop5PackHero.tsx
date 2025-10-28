'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ParodyUploadModal from './ParodyUploadModal';

const parodyStyles = [
  {
    id: 'wizard',
    name: 'Wizard',
    image: '/images/parodypack/parodypack1.png',
    icon: '🪄',
  },
  {
    id: 'paws',
    name: 'PAWS',
    image: '/images/parodypack/parodypack2.jpeg',
    icon: '🦈',
  },
  {
    id: 'popstar',
    name: 'Popstar',
    image: '/images/parodypack/parodypack3.jpeg',
    icon: '🎤',
  },
  {
    id: 'dogfather',
    name: 'Dogfather',
    image: '/images/parodypack/parodypack4.jpeg',
    icon: '🎩',
  },
];

export default function Pop5PackHero() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % parodyStyles.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % parodyStyles.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + parodyStyles.length) % parodyStyles.length);
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-12 md:py-20">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Text Content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            {/* Main Headline */}
            <h1 className="font-arvo text-4xl md:text-6xl lg:text-7xl font-bold text-text-primary mb-6">
              Show Everyone Your Pet is <span className="text-cyclamen">Iconic</span>.
            </h1>

            {/* Subheadline */}
            <p className="font-geist text-lg md:text-xl text-text-primary/80 mb-8">
              Get 4 hilarious iconic parodies. Simply upload a picture of your pet.
            </p>

            {/* CTA Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-atomic-tangerine hover:bg-atomic-tangerine/90 text-white font-fredoka text-xl px-12 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 mb-4"
            >
              Try With My Pet, Free
            </button>

            {/* Limited Time Offer */}
            <p className="font-geist text-base text-text-primary/70 mb-2">
              For a limited time: choose your favorite one and get it for free.
            </p>

            {/* No Credit Card */}
            <div className="flex items-center justify-center lg:justify-start gap-2 text-sm text-text-primary/60">
              <svg className="w-5 h-5 text-cyclamen" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No credit card</span>
            </div>
          </div>

          {/* Right Side - Carousel */}
          <div className="order-1 lg:order-2">
            <div className="relative max-w-lg mx-auto">
              {/* Main Carousel Container - Fixed Height */}
              <div className="relative h-[500px] md:h-[600px] flex items-center justify-center">
                {/* Images */}
                <div className="relative w-full h-full">
                  {parodyStyles.map((style, index) => (
                    <div
                      key={style.id}
                      className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
                        index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                      }`}
                    >
                      <div className="relative max-h-full max-w-full">
                        <Image
                          src={style.image}
                          alt={`${style.name} parody style`}
                          width={800}
                          height={800}
                          className="max-h-[500px] md:max-h-[600px] w-auto h-auto object-contain shadow-2xl"
                          priority={index === 0}
                          sizes="(max-width: 768px) 90vw, 50vw"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Navigation Arrows */}
                <button
                  onClick={prevSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-text-primary rounded-full p-2 md:p-3 shadow-lg transition-all duration-200 hover:scale-110 z-20"
                  aria-label="Previous image"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-text-primary rounded-full p-2 md:p-3 shadow-lg transition-all duration-200 hover:scale-110 z-20"
                  aria-label="Next image"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <ParodyUploadModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
}
