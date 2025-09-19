// src/components/layout/Header.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { landingPageCopy } from '@/lib/copy';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { header } = landingPageCopy;

  return (
    <header className="
      bg-card-surface border-b border-gray-100
      sticky top-0 z-50 backdrop-blur-sm shadow-sm
    ">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-naples-yellow rounded-full flex items-center justify-center">
              <span className="text-text-primary font-bold">P</span>
            </div>
            <span className="font-arvo text-2xl font-bold text-text-primary">
              {header.logoText}
            </span>
          </Link>

          {/* Single CTA for squeeze page */}
          <Link
            href="/create"
            className="
              bg-atomic-tangerine hover:bg-orange-600
              text-white font-fredoka font-medium
              px-6 py-2 rounded-full
              transition-all duration-200
              hover:scale-105 hover:shadow-lg
              focus:outline-none focus:ring-2 focus:ring-atomic-tangerine/50
            "
          >
            {header.ctaButton}
          </Link>

          {/* No mobile menu needed for squeeze page */}
        </div>

        {/* No mobile menu for squeeze page */}
      </div>
    </header>
  );
};
