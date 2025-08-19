// src/components/layout/Footer.tsx

import { landingPageCopy } from '@/lib/copy';
import Link from 'next/link';

export const Footer = () => {
  const { copyright, links } = landingPageCopy.footer;

  return (
    <footer className="bg-gray-50 border-t">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">{copyright}</p>
          <div className="flex space-x-4">
            {links.map((link) => (
              <Link key={link.text} href={link.href} className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                {link.text}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
