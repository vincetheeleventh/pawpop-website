// src/components/layout/Footer.tsx

import Link from 'next/link';
import { landingPageCopy } from '@/lib/copy';

export const Footer = () => {
  const { footer } = landingPageCopy;
  
  return (
    <footer className="bg-charcoal-frame text-gallery-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-mona-gold rounded-full flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <span className="font-playfair text-xl font-bold text-charcoal-frame">
                PawPop
              </span>
            </div>
            <p className="text-gray-600 text-sm">
              Transform your pet into Renaissance masterpieces with our AI-powered custom portrait service.
            </p>
            <div className="text-sm text-gray-600">
              <p><strong>Business Hours:</strong></p>
              <p>Monday-Friday: 9 AM - 6 PM PST</p>
              <p>Saturday: 10 AM - 4 PM PST</p>
              <p>Sunday: Closed</p>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-fredoka font-semibold text-charcoal-frame mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <strong>Email:</strong> hello@pawpop.art
              </li>
              <li>
                <strong>Phone:</strong> +1-555-PAWPOP1
              </li>
              <li>
                <strong>Address:</strong><br />
                123 Art Street<br />
                San Francisco, CA 94102
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-fredoka font-semibold text-charcoal-frame mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-french-blue transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-gray-600 hover:text-french-blue transition-colors text-sm">
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <a href="mailto:hello@pawpop.art" className="text-gray-600 hover:text-french-blue transition-colors text-sm">
                  Order Support
                </a>
              </li>
            </ul>
          </div>

          {/* Legal - Required for Google Merchant Center */}
          <div>
            <h3 className="font-fredoka font-semibold text-charcoal-frame mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-french-blue transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-french-blue transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-gray-600 hover:text-french-blue transition-colors text-sm">
                  Return Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};
