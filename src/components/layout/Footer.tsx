// src/components/layout/Footer.tsx

import Link from 'next/link';
import Image from 'next/image';
import { landingPageCopy } from '@/lib/copy';

export const Footer = () => {
  const { footer } = landingPageCopy;
  
  return (
    <footer className="bg-text-primary text-card-surface">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info - Minimal */}
          <div className="space-y-3">
            <div className="flex items-center">
              <Image
                src="/images/logo_small.png"
                alt="PawPop Logo"
                width={100}
                height={33}
                className="h-8 w-auto brightness-0 invert"
              />
            </div>
            <div className="text-sm text-gray-600">
              <p><strong>Email:</strong> {footer.contact.email}</p>
              <p><strong>Phone:</strong> {footer.contact.phone}</p>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-fredoka font-semibold text-card-surface mb-3">Contact</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-pale-azure transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <a href={`mailto:${footer.contact.email}`} className="text-gray-600 hover:text-pale-azure transition-colors text-sm">
                  Order Support
                </a>
              </li>
            </ul>
          </div>

          {/* Legal - Required for Google Merchant Center */}
          <div>
            <h3 className="font-fredoka font-semibold text-card-surface mb-3">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-pale-azure transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-pale-azure transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-gray-600 hover:text-pale-azure transition-colors text-sm">
                  Return Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-gray-700 mt-8 pt-6 text-center">
          <p className="text-gray-600 text-sm">{footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
};
