// src/components/landing/GallerySection.tsx
'use client';

import React from 'react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

export const GallerySection = () => {
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

  return (
    <section className="w-full bg-site-bg py-0 md:py-12">
      <div className="w-full">
        {/* Section Title - Hidden on mobile for cleaner look */}
        <div className="hidden md:block text-center mb-8 px-6">
          <h2 className="font-arvo text-2xl md:text-3xl font-bold text-text-primary mb-2">
            Gallery
          </h2>
          <p className="text-gray-600 text-lg">
            See what we've created for other pet moms
          </p>
        </div>

        {/* Mobile-First Carousel - Full width on mobile */}
        <div className="w-full px-0 md:px-6">
          <Carousel
            showArrows={true}
            showStatus={false}
            showIndicators={true}
            infiniteLoop={true}
            useKeyboardArrows={true}
            autoPlay={false}
            swipeable={true}
            emulateTouch={true}
            dynamicHeight={true}
            transitionTime={300}
            interval={5000}
            showThumbs={false}
            className="gallery-carousel"
            renderArrowPrev={(onClickHandler, hasPrev, label) =>
              hasPrev && (
                <button
                  type="button"
                  onClick={onClickHandler}
                  title={label}
                  className="
                    absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 z-10
                    bg-white/80 hover:bg-white/90 backdrop-blur-sm
                    rounded-full w-10 h-10 md:w-12 md:h-12
                    flex items-center justify-center
                    shadow-lg hover:shadow-xl
                    transition-all duration-200
                    touch-manipulation
                  "
                  aria-label="Previous image"
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
              )
            }
            renderArrowNext={(onClickHandler, hasNext, label) =>
              hasNext && (
                <button
                  type="button"
                  onClick={onClickHandler}
                  title={label}
                  className="
                    absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 z-10
                    bg-white/80 hover:bg-white/90 backdrop-blur-sm
                    rounded-full w-10 h-10 md:w-12 md:h-12
                    flex items-center justify-center
                    shadow-lg hover:shadow-xl
                    transition-all duration-200
                    touch-manipulation
                  "
                  aria-label="Next image"
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
              )
            }
            renderIndicator={(onClickHandler, isSelected, index, label) => {
              const defStyle = {
                marginLeft: 4,
                marginRight: 4,
                cursor: 'pointer',
                display: 'inline-block'
              };
              const style = isSelected
                ? { ...defStyle }
                : { ...defStyle };
              
              return (
                <button
                  key={index}
                  style={style}
                  onClick={onClickHandler}
                  onKeyDown={onClickHandler}
                  value={index}
                  tabIndex={0}
                  title={`${label} ${index + 1}`}
                  role="button"
                  className={`
                    w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-200
                    ${isSelected 
                      ? 'bg-atomic-tangerine scale-125' 
                      : 'bg-white/60 hover:bg-white/80'
                    }
                  `}
                  aria-label={`Go to slide ${index + 1}`}
                />
              );
            }}
          >
            {galleryImages.map((image, index) => (
              <div key={index} className="relative w-full">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="
                    w-full h-auto
                    object-contain object-center
                    select-none block
                  "
                  loading={index === 0 ? 'eager' : 'lazy'}
                  draggable={false}
                />
                {/* Optional overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
              </div>
            ))}
          </Carousel>
        </div>
      </div>

      {/* Custom CSS for additional styling */}
      <style jsx global>{`
        .gallery-carousel .carousel .slide {
          background: transparent;
        }
        
        .gallery-carousel .carousel .control-dots {
          bottom: 15px;
          margin: 0;
          padding: 0 20px;
        }
        
        .gallery-carousel .carousel .control-dots .dot {
          box-shadow: none;
          background: transparent;
          border: none;
          outline: none;
          opacity: 1;
        }
        
        .gallery-carousel .carousel.carousel-slider {
          overflow: visible;
        }
        
        .gallery-carousel .carousel .slider-wrapper {
          overflow: hidden;
          margin: auto;
          width: 100%;
          transition: height 0.15s ease-in;
        }
        
        .gallery-carousel .carousel .slider {
          margin: 0;
          padding: 0;
          position: relative;
          list-style: none;
          width: 100%;
        }
        
        .gallery-carousel .carousel .slider .slide {
          min-height: 100%;
          margin: 0;
          position: relative;
          text-align: center;
          background: transparent;
        }
        
        .gallery-carousel .carousel .slider .slide img {
          width: 100%;
          vertical-align: top;
          border: 0;
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
          .gallery-carousel .carousel .control-dots {
            bottom: 10px;
            padding: 0 15px;
          }
          
          .gallery-carousel .carousel .slider-wrapper {
            margin: 0;
            width: 100vw;
            position: relative;
            left: 50%;
            right: 50%;
            margin-left: -50vw;
            margin-right: -50vw;
          }
        }
        
        /* Smooth transitions */
        .gallery-carousel .carousel .slider-wrapper.axis-horizontal .slider {
          -ms-box-orient: horizontal;
          display: -webkit-box;
          display: -moz-box;
          display: -ms-flexbox;
          display: -moz-flex;
          display: -webkit-flex;
          display: flex;
          transition: all 300ms ease-in-out;
        }
        
        .gallery-carousel .carousel .slider .slide {
          -webkit-box-flex: 1;
          -moz-box-flex: 1;
          -webkit-flex: 1 1 auto;
          -ms-flex: 1 1 auto;
          flex: 1 1 auto;
          display: block;
        }
      `}</style>
    </section>
  );
};
