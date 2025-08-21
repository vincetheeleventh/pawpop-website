// src/components/layout/Footer.tsx

import { landingPageCopy } from '@/lib/copy';
import Link from 'next/link';

export const Footer = () => {
  const { copyright, links } = landingPageCopy.footer;

  return (
    <footer className="footer footer-center p-10 bg-base-200 text-base-content">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">{copyright}</p>
          <div className="flex gap-4">
            {links.map((link) => (
              <Link key={link.text} href={link.href} className="link link-hover text-sm">
                {link.text}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
