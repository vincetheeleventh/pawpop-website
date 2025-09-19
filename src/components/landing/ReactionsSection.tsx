// src/components/landing/ReactionsSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { landingPageCopy } from '@/lib/copy';

export const ReactionsSection = () => {
  const { reactions } = landingPageCopy;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-advance carousel
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reactions.testimonials.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, reactions.testimonials.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % reactions.testimonials.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + reactions.testimonials.length) % reactions.testimonials.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-text-primary mb-4">
            {reactions.title}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {reactions.subtitle}
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Testimonial Cards */}
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {reactions.testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="w-full flex-shrink-0 px-4"
                >
                  <div className="bg-card-surface rounded-2xl shadow-lg p-8 mx-auto max-w-2xl">
                    {/* Quote */}
                    <div className="text-center mb-6">
                      <div className="text-4xl text-naples-yellow mb-4">"</div>
                      <p className="text-lg text-gray-700 leading-relaxed italic">
                        {testimonial.quote}
                      </p>
                    </div>

                    {/* Author Info */}
                    <div className="flex items-center justify-center space-x-4">
                      {/* Emoji Avatar */}
                      <div className="w-12 h-12 bg-cyclamen rounded-full flex items-center justify-center text-2xl">
                        {testimonial.emoji}
                      </div>
                      
                      {/* Author Details */}
                      <div className="text-center">
                        <p className="font-fredoka font-bold text-text-primary">
                          {testimonial.author}
                        </p>
                        <p className="text-sm text-gray-500">
                          {testimonial.petName}'s Mom
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-card-surface rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
            aria-label="Previous testimonial"
          >
            <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-card-surface rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
            aria-label="Next testimonial"
          >
            <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center space-x-2 mt-8">
          {reactions.testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-atomic-tangerine scale-125' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>

        {/* Mobile Swipe Hint */}
        <div className="text-center mt-6 md:hidden">
          <p className="text-sm text-gray-500">
            👈 Swipe to see more reactions 👉
          </p>
        </div>
      </div>
    </section>
  );
};
