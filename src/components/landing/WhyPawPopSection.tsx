// src/components/landing/WhyPawPopSection.tsx

'use client';

import { useState } from 'react';
import { landingPageCopy } from '@/lib/copy';

export const WhyPawPopSection = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { whyPawPop } = landingPageCopy;

  return (
    <section className="px-6 py-8 bg-gallery-white">
      <div className="max-w-2xl mx-auto">
        {/* Collapsible Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="
            w-full flex items-center justify-between
            p-4 bg-white rounded-lg border border-gray-200
            hover:border-french-blue transition-colors
            focus:outline-none focus:ring-2 focus:ring-french-blue/20
          "
        >
          <span className="font-playfair text-lg font-semibold text-charcoal-frame">
            {whyPawPop.title}
          </span>
          <span className={`
            text-french-blue transition-transform duration-200
            ${isOpen ? 'rotate-180' : 'rotate-0'}
          `}>
            ▼
          </span>
        </button>

        {/* Collapsible Content */}
        <div className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
        `}>
          <div className="pt-6 space-y-6">
            {/* Benefits */}
            {whyPawPop.items.map((item, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="
                  w-10 h-10 bg-french-blue/10 rounded-full 
                  flex items-center justify-center flex-shrink-0
                ">
                  <span className="text-lg">{item.icon}</span>
                </div>
                <div>
                  <h3 className="font-inter font-semibold text-charcoal-frame mb-1">
                    {item.title}
                  </h3>
                  <p className="font-inter text-gray-600 text-sm">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}

            {/* Character Quote */}
            <div className="
              bg-warm-peach/20 rounded-lg p-4 mt-6
              border border-warm-peach/30
            ">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🎨</span>
                <span className="font-fredoka text-sm font-semibold text-charcoal-frame">
                  Monsieur Brush
                </span>
              </div>
              <p className="font-fredoka text-sm text-charcoal-frame italic">
                {whyPawPop.characterQuote}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
