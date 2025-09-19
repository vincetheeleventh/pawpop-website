'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const galleryImages = [
  { src: '/images/gallery/1.jpg', alt: 'PawPop artwork example 1' },
  { src: '/images/gallery/2.jpg', alt: 'PawPop artwork example 2' },
  { src: '/images/gallery/3.jpg', alt: 'PawPop artwork example 3' },
  { src: '/images/gallery/4.jpg', alt: 'PawPop artwork example 4' },
  { src: '/images/gallery/5.jpg', alt: 'PawPop artwork example 5' },
];

export const GallerySection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const nextImage = () => {
    console.log('nextImage called - currentIndex:', currentIndex, 'isTransitioning:', isTransitioning);
    if (isTransitioning) {
      console.log('Blocked by transition');
      return;
    }
    setIsTransitioning(true);
    const newIndex = (currentIndex + 1) % galleryImages.length;
    console.log('Setting new index:', newIndex);
    setCurrentIndex(newIndex);
  };

  const prevImage = () => {
    console.log('prevImage called - currentIndex:', currentIndex, 'isTransitioning:', isTransitioning);
    if (isTransitioning) {
      console.log('Blocked by transition');
      return;
    }
    setIsTransitioning(true);
    const newIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    console.log('Setting new index:', newIndex);
    setCurrentIndex(newIndex);
  };

  const goToImage = (index: number) => {
    console.log('goToImage called - index:', index, 'currentIndex:', currentIndex, 'isTransitioning:', isTransitioning);
    if (isTransitioning || index === currentIndex) {
      console.log('Blocked - same index or transitioning');
      return;
    }
    setIsTransitioning(true);
    console.log('Setting index to:', index);
    setCurrentIndex(index);
  };

  // Handle touch events for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      prevImage();
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Reset transition state after animation completes
  useEffect(() => {
    if (isTransitioning) {
      console.log('Starting transition timer');
      const timer = setTimeout(() => {
        console.log('Transition timer completed, resetting isTransitioning');
        setIsTransitioning(false);
      }, 250);
      return () => {
        console.log('Cleaning up transition timer');
        clearTimeout(timer);
      };
    }
  }, [isTransitioning]);

  // Debug state changes
  useEffect(() => {
    console.log('State changed - currentIndex:', currentIndex, 'isTransitioning:', isTransitioning);
  }, [currentIndex, isTransitioning]);

  return (
    <section className="py-12 bg-site-bg">
      <div className="max-w-4xl mx-auto px-6">
        {/* Section Title */}
        <div className="text-center mb-8">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-charcoal-frame mb-4">
            Gallery
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See how we transform beloved pets into timeless masterpieces
          </p>
        </div>

        {/* Debug Info */}
        <div className="fixed top-4 left-4 bg-black text-white p-2 text-xs z-50 rounded">
          Index: {currentIndex} | Transitioning: {isTransitioning ? 'YES' : 'NO'}<br/>
          Transform: {currentIndex * 100}% | Images: {galleryImages.length}
        </div>

        {/* Gallery Container */}
        <div className="relative">
          {/* Main Image Display */}
          <div 
            ref={containerRef}
            className="relative w-full overflow-hidden border-4 border-purple-500"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'pan-y pinch-zoom' }}
          >
            {/* Image Slider Container */}
            <div 
              className="flex transition-transform duration-[250ms] ease-gallery-snap will-change-transform"
              style={{ 
                transform: `translateX(-${currentIndex * 100}%)`,
                width: '500%'
              }}
            >
              {galleryImages.map((image, index) => (
                <div 
                  key={index}
                  className="flex-shrink-0"
                  style={{ 
                    width: '20%',
                    backgroundColor: index % 2 === 0 ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.1)',
                    border: '1px solid blue',
                    minHeight: '200px'
                  }}
                >
                  <div className="absolute top-2 left-2 bg-yellow-400 text-black px-1 text-xs z-10">
                    IMG {index + 1}
                  </div>
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-auto object-cover"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    onLoad={() => console.log(`Image ${index + 1} loaded successfully`)}
                    onError={() => console.error(`Image ${index + 1} failed to load`)}
                  />
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={(e) => {
                console.log('Previous button clicked!', e);
                prevImage();
              }}
              disabled={isTransitioning}
              className="absolute left-4 top-1/2 -translate-y-1/2 
                         bg-white/80 hover:bg-white/90 
                         rounded-full p-2 shadow-lg
                         transition-all duration-200 hover:scale-110
                         disabled:opacity-50 disabled:cursor-not-allowed
                         z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6 text-charcoal-frame" />
            </button>

            <button
              onClick={(e) => {
                console.log('Next button clicked!', e);
                nextImage();
              }}
              disabled={isTransitioning}
              className="absolute right-4 top-1/2 -translate-y-1/2 
                         bg-white/80 hover:bg-white/90 
                         rounded-full p-2 shadow-lg
                         transition-all duration-200 hover:scale-110
                         disabled:opacity-50 disabled:cursor-not-allowed
                         z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6 text-charcoal-frame" />
            </button>
          </div>

          {/* Dot Indicators */}
          <div className="flex justify-center mt-6 space-x-2">
            {galleryImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                disabled={isTransitioning}
                className={`w-3 h-3 rounded-full transition-all duration-200
                  ${index === currentIndex 
                    ? 'bg-mona-gold scale-110' 
                    : 'bg-gray-300 hover:bg-gray-400'
                  }
                  disabled:cursor-not-allowed`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};
