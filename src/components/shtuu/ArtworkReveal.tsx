'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ArtworkRevealProps {
  imageUrl: string;
  parodyStyle: string;
  onDownload?: () => void;
  onShare?: () => void;
}

export default function ArtworkReveal({
  imageUrl,
  parodyStyle,
  onDownload,
  onShare
}: ArtworkRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  // Trigger reveal animation after mount
  useState(() => {
    setTimeout(() => setIsRevealed(true), 300);
  });

  const styleNames: Record<string, string> = {
    wizard: 'Wizarding Portrait',
    paws: 'PAWS Movie Poster',
    popstar: 'Pop Star Album',
    dogfather: 'The Dogfather'
  };

  return (
    <div className="bg-card-surface border-2 border-naples-yellow rounded-2xl p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="font-arvo text-2xl font-bold text-text-primary mb-2">
            Ta-da! ✨
          </h2>
          <p className="font-geist text-text-primary/70">
            Shtuu made you a <strong>{styleNames[parodyStyle] || 'special'}</strong> artwork!
          </p>
        </div>

        {/* Artwork display with reveal animation */}
        <div 
          className={`relative aspect-square rounded-xl overflow-hidden border-4 border-naples-yellow shadow-2xl transition-all duration-700 ${
            isRevealed ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <Image
            src={imageUrl}
            alt="Your custom artwork"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onDownload}
            className="flex-1 bg-atomic-tangerine hover:bg-atomic-tangerine/90 text-white font-fredoka text-lg px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105"
          >
            📥 Download Free Preview
          </button>
          
          {onShare && (
            <button
              onClick={onShare}
              className="flex-1 bg-pale-azure hover:bg-pale-azure/90 text-text-primary font-fredoka text-lg px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105"
            >
              🔗 Share
            </button>
          )}
        </div>

        {/* Info box */}
        <div className="bg-cyclamen/10 border-2 border-cyclamen/30 rounded-xl p-4">
          <p className="font-geist text-sm text-text-primary/80 text-center">
            <strong>Want high-resolution?</strong> Upgrade to get print-quality artwork, exclusive styles, and more! (Coming soon)
          </p>
        </div>

        {/* Make another */}
        <div className="text-center pt-4 border-t border-naples-yellow/30">
          <p className="font-geist text-sm text-text-primary/60">
            Want to try a different style? Shtuu can make more!
          </p>
        </div>
      </div>
    </div>
  );
}
