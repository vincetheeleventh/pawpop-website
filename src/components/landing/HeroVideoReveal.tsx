// src/components/landing/HeroVideoReveal.tsx

'use client';

import { useState, useRef, useEffect } from 'react';

interface HeroVideoRevealProps {
  posterImage: string;
  videoSrc: string;
  fallbackImage: string;
  alt: string;
  className?: string;
}

export const HeroVideoReveal = ({
  posterImage,
  videoSrc,
  fallbackImage,
  alt,
  className = ''
}: HeroVideoRevealProps) => {
  const [videoEnded, setVideoEnded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [finalImageLoaded, setFinalImageLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Preload final image while video plays
  useEffect(() => {
    const img = new Image();
    img.onload = () => setFinalImageLoaded(true);
    img.src = fallbackImage;
  }, [fallbackImage]);

  const handleVideoEnd = () => {
    setVideoEnded(true);
  };

  const handleVideoError = () => {
    setVideoError(true);
  };

  // Show final image immediately since we don't have video assets yet
  const showFinalImage = true; // Will switch to video logic when assets are ready

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Final Revealed Image - Demo mode */}
      <img
        src={fallbackImage}
        alt={alt}
        className="w-full h-full object-cover"
        loading="eager"
      />

      {/* Future: Video implementation when assets are ready */}
      {/* 
      {!showFinalImage && (
        <img
          src={posterImage}
          alt={`${alt} - covered`}
          className="w-full h-full object-cover"
          loading="eager"
        />
      )}

      {!showFinalImage && videoSrc && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnd}
          onError={handleVideoError}
          poster={posterImage}
        >
          <source src={videoSrc.replace('.mp4', '.webm')} type="video/webm" />
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}
      */}
    </div>
  );
};
