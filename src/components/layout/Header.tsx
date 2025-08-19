// src/components/layout/Header.tsx
'use client';

import { landingPageCopy } from '@/lib/copy';
import Link from 'next/link';

export const Header = () => {
  const { logoText, navLinks } = landingPageCopy.header;

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-gray-800 hover:text-indigo-600 transition-colors">
          {logoText}
        </Link>
        <div className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link key={link.text} href={link.href} className="text-gray-600 hover:text-indigo-600 transition-colors">
              {link.text}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
};
