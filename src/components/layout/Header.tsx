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
      bg-gallery-white border-b border-gray-100
      sticky top-0 z-50 backdrop-blur-sm
    ">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-mona-gold rounded-full flex items-center justify-center">
              <span className="text-white font-bold">P</span>
            </div>
            <span className="font-playfair text-2xl font-bold text-charcoal-frame">
              {header.logoText}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {header.navLinks.map((link) => (
              <Link
                key={link.text}
                href={link.href}
                className="font-inter text-charcoal-frame hover:text-mona-gold transition-colors"
              >
                {link.text}
              </Link>
            ))}
            <Link
              href="/create"
              className="
                bg-mona-gold hover:bg-yellow-600
                text-charcoal-frame font-fredoka font-medium
                px-6 py-2 rounded-full
                transition-all duration-200
                transform hover:scale-105
              "
            >
              {header.ctaButton}
            </Link>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-charcoal-frame hover:text-mona-gold focus:outline-none transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-100">
              {header.navLinks.map((link) => (
                <Link
                  key={link.text}
                  href={link.href}
                  className="text-charcoal-frame hover:text-mona-gold block px-3 py-2 text-base font-medium transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.text}
                </Link>
              ))}
              <Link
                href="/create"
                className="
                  bg-mona-gold hover:bg-yellow-600
                  text-charcoal-frame font-fredoka font-medium
                  block px-3 py-2 rounded-full text-base
                  transition-all duration-200 mt-4
                "
                onClick={() => setIsMenuOpen(false)}
              >
                {header.ctaButton}
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
