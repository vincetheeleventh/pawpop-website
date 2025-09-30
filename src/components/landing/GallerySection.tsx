// src/components/landing/GallerySection.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';

export const GallerySection = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  // Gallery images from public/images/gallery
  const galleryImages = [
    {
      src: '/images/gallery/1.jpg',
      alt: 'PawPop artwork example 1'
    },
    {
      src: '/images/gallery/2.jpg',
      alt: 'PawPop artwork example 2'
    },
    {
      src: '/images/gallery/3.jpg',
      alt: 'PawPop artwork example 3'
    },
    {
      src: '/images/gallery/4.jpg',
      alt: 'PawPop artwork example 4'
    },
    {
      src: '/images/gallery/5.jpg',
      alt: 'PawPop artwork example 5'
    }
  ];

  // Responsive breakpoints for react-multi-carousel
  const responsive = {
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 3,
      slidesToSlide: 1,
      partialVisibilityGutter: 40 // Shows partial next/prev images
    },
    tablet: {
      breakpoint: { max: 1024, min: 768 },
      items: 3,
      slidesToSlide: 1,
      partialVisibilityGutter: 30
    },
    mobile: {
      breakpoint: { max: 768, min: 0 },
      items: 1,
      slidesToSlide: 1,
      partialVisibilityGutter: 0 // Full width on mobile portrait
    }
  };

  return (
    <section className="w-full bg-site-bg py-8 md:py-12">
      {/* Section Title - Always visible, outside carousel container */}
      <div className="text-center mb-6 md:mb-8 px-6">
        <h2 className="font-arvo text-5xl md:text-6xl lg:text-7xl font-bold text-text-primary mb-2">
          Gallery
        </h2>
        <p className="text-gray-600 text-base md:text-lg">
          See what we've created for other pet moms
        </p>
      </div>

      {/* Multi-Image Carousel Container */}
      <div className="w-full">
        <div className="w-full px-0 md:px-6">
          <div className="gallery-carousel-container">
            {isClient && <Carousel
            responsive={responsive}
            infinite={true}
            autoPlay={false}
            keyBoardControl={true}
            customTransition="transform 300ms ease-in-out"
            transitionDuration={300}
            containerClass="gallery-multi-carousel"
            removeArrowOnDeviceType={[]}
            dotListClass="custom-dot-list-style"
            itemClass="gallery-carousel-item"
            showDots={true}
            arrows={true}
            swipeable={true}
            draggable={true}
            partialVisible={true}
            renderButtonGroupOutside={false}
            renderDotsOutside={false}
            customLeftArrow={
              <button
                className="
                  absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 z-10
                  bg-white/80 hover:bg-white/90 backdrop-blur-sm
                  rounded-full w-10 h-10 md:w-12 md:h-12
                  flex items-center justify-center
                  shadow-lg hover:shadow-xl
                  transition-all duration-200
                  touch-manipulation
                "
                aria-label="Previous images"
              >
                <svg 
                  className="w-5 h-5 md:w-6 md:h-6 text-text-primary" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            }
            customRightArrow={
              <button
                className="
                  absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 z-10
                  bg-white/80 hover:bg-white/90 backdrop-blur-sm
                  rounded-full w-10 h-10 md:w-12 md:h-12
                  flex items-center justify-center
                  shadow-lg hover:shadow-xl
                  transition-all duration-200
                  touch-manipulation
                "
                aria-label="Next images"
              >
                <svg 
                  className="w-5 h-5 md:w-6 md:h-6 text-text-primary" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            }
          >
            {galleryImages.map((image, index) => (
              <div key={index} className="px-0 md:px-3">
                <div className="relative w-full">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={400}
                    height={400}
                    className="
                      w-full h-auto
                      object-contain object-center
                      select-none block
                      rounded-none md:rounded-xl
                      shadow-lg hover:shadow-xl
                      transition-shadow duration-200
                    "
                    priority={index === 0}
                    quality={90}
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 33vw"
                    draggable={false}
                  />
                  {/* Optional overlay for better visual appeal */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none rounded-none md:rounded-xl" />
                </div>
              </div>
            ))}
          </Carousel>}
          </div>
        </div>
      </div>

      {/* Custom CSS for react-multi-carousel styling */}
      <style jsx global>{`
        .gallery-multi-carousel {
          position: relative;
        }
        
        .gallery-carousel-item {
          display: flex !important;
          justify-content: center;
          align-items: center;
        }
        
        .custom-dot-list-style {
          display: flex !important;
          justify-content: center;
          align-items: center;
          margin-top: 20px !important;
          padding: 0 20px;
        }
        
        .custom-dot-list-style li {
          margin: 0 4px !important;
        }
        
        .custom-dot-list-style li button {
          width: 8px !important;
          height: 8px !important;
          border-radius: 50% !important;
          border: none !important;
          background: rgba(255, 255, 255, 0.6) !important;
          transition: all 200ms ease-in-out !important;
          cursor: pointer !important;
        }
        
        .custom-dot-list-style li button:hover {
          background: rgba(255, 255, 255, 0.8) !important;
        }
        
        .custom-dot-list-style li.react-multi-carousel-dot--active button {
          background: #FF9770 !important;
          transform: scale(1.25) !important;
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
          .custom-dot-list-style {
            padding: 0 15px;
            margin-top: 15px !important;
          }
          
          .gallery-carousel-item {
            padding: 0 !important;
          }
          
          .gallery-carousel-item > div {
            padding: 0 !important;
          }
        }
        
        /* Full-width carousel container only (not the entire section) */
        @media (max-width: 768px) {
          .gallery-carousel-container {
            margin: 0;
            width: 100vw;
            position: relative;
            left: 50%;
            right: 50%;
            margin-left: -50vw;
            margin-right: -50vw;
          }
        }
        
        /* Desktop and tablet partial visibility styling */
        @media (min-width: 768px) {
          .react-multi-carousel-item--partial {
            opacity: 0.7;
            transform: scale(0.95);
            transition: all 300ms ease-in-out;
          }
          
          .react-multi-carousel-item--partial:hover {
            opacity: 0.9;
            transform: scale(0.98);
          }
        }
        
        /* Smooth transitions */
        .react-multi-carousel-list {
          transition: transform 300ms ease-in-out !important;
        }
        
        .react-multi-carousel-track {
          display: flex !important;
          align-items: center !important;
        }
      `}</style>
    </section>
  );
};
