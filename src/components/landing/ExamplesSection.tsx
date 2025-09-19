// src/components/landing/ExamplesSection.tsx
'use client';

import { useState } from 'react';
import { landingPageCopy } from '@/lib/copy';

export const ExamplesSection = () => {
  const { examples } = landingPageCopy;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="py-16 px-6 bg-card-surface">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-text-primary mb-4">
            {examples.title}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {examples.subtitle}
          </p>
        </div>

        {/* Before/After Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {examples.pairs.map((pair, index) => (
            <div
              key={index}
              className="relative group cursor-pointer"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Container for before/after images */}
              <div className="relative aspect-square rounded-lg overflow-hidden shadow-lg">
                {/* Before Image */}
                <img
                  src={pair.before}
                  alt={`Before: ${pair.altText.split(' → ')[0]}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                    hoveredIndex === index ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                
                {/* After Image */}
                <img
                  src={pair.after}
                  alt={`After: ${pair.altText.split(' → ')[1]}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                    hoveredIndex === index ? 'opacity-100' : 'opacity-0'
                  }`}
                />

                {/* Overlay with arrow */}
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white bg-opacity-90 rounded-full p-3">
                    <span className="text-2xl">✨</span>
                  </div>
                </div>

                {/* Before/After Labels */}
                <div className="absolute top-3 left-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium transition-opacity duration-300 ${
                    hoveredIndex === index 
                      ? 'bg-naples-yellow text-text-primary opacity-100' 
                      : 'bg-gray-800 text-white opacity-80'
                  }`}>
                    {hoveredIndex === index ? 'After' : 'Before'}
                  </span>
                </div>
              </div>

              {/* Alt Text */}
              <p className="text-center mt-3 text-sm text-gray-600 font-medium">
                {pair.altText}
              </p>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Ready to see your transformation?</p>
          <button className="bg-atomic-tangerine hover:bg-orange-600 text-white font-fredoka font-bold px-8 py-3 rounded-full transition-all duration-200 hover:scale-105 shadow-lg">
            Make My Masterpiece
          </button>
        </div>
      </div>
    </section>
  );
};
