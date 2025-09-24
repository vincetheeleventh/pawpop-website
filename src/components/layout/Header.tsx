// src/components/layout/Header.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
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
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/images/logo_small.png"
              alt="PawPop Logo"
              width={120}
              height={40}
              className="h-10 w-auto"
              priority
            />
            <span className="font-arvo text-2xl font-bold text-text-primary">
              PawPop Art
            </span>
          </Link>

          {/* Navigation Links - Hidden on mobile, shown on desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#gallery"
              className="text-text-primary/70 hover:text-text-primary transition-colors font-medium"
            >
              Gallery
            </a>
            <a
              href="#testimonials"
              className="text-text-primary/70 hover:text-text-primary transition-colors font-medium"
            >
              Reviews
            </a>
            <a
              href="#process"
              className="text-text-primary/70 hover:text-text-primary transition-colors font-medium"
            >
              How It Works
            </a>
            
            {/* CTA Button */}
            <Link
              href="/upload"
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
          </nav>

          {/* Mobile CTA only */}
          <Link
            href="/upload"
            className="
              md:hidden
              bg-atomic-tangerine hover:bg-orange-600
              text-white font-fredoka font-medium
              px-4 py-2 rounded-full text-sm
              transition-all duration-200
              hover:scale-105 hover:shadow-lg
              focus:outline-none focus:ring-2 focus:ring-atomic-tangerine/50
            "
          >
            Upload
          </Link>
        </div>

        {/* No mobile menu for squeeze page */}
      </div>
    </header>
  );
};
