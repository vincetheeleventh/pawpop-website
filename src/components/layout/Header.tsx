// src/components/layout/Header.tsx
'use client';

import { landingPageCopy } from '@/lib/copy';
import Link from 'next/link';

export const Header = () => {
  const { logoText, navLinks } = landingPageCopy.header;

  return (
    <header className="navbar bg-base-100 shadow-lg sticky top-0 z-50">
      <div className="navbar-start">
        <Link href="/" className="btn btn-ghost text-xl font-bold">
          {logoText}
        </Link>
      </div>
      <div className="navbar-end hidden md:flex">
        <ul className="menu menu-horizontal px-1">
          {navLinks.map((link) => (
            <li key={link.text}>
              <Link href={link.href} className="btn btn-ghost">
                {link.text}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
};
