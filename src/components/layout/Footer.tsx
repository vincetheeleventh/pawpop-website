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
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="font-playfair text-2xl font-bold text-mona-gold hover:text-joy-yellow transition-colors">
              {footer.brand.name}
            </Link>
            <p className="mt-4 font-inter text-gray-300 max-w-md">
              {footer.brand.description}
            </p>
            
            {/* Monsieur Brush Character */}
            <div className="mt-6 bg-warm-peach/10 rounded-lg p-4 border border-warm-peach/20">
              <div className="flex items-center mb-2">
                <span className="text-xl mr-2">🎨</span>
                <h4 className="font-fredoka text-sm font-semibold text-mona-gold">Monsieur Brush Says:</h4>
              </div>
              <p className="font-fredoka text-sm text-gray-300 italic">
                "{footer.characterMessage}"
              </p>
            </div>
            
            <div className="mt-6">
              <h4 className="font-inter text-sm font-semibold text-gray-200 uppercase tracking-wider">Contact</h4>
              <div className="mt-2 space-y-1 font-inter text-gray-300">
                <p>📧 {footer.contact.email}</p>
                <p>📞 {footer.contact.phone}</p>
                <p>📍 {footer.contact.address}</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-inter text-sm font-semibold text-gray-200 uppercase tracking-wider">Experience</h4>
            <div className="mt-4 space-y-2">
              {footer.links.experience.map((link: {label: string, href: string}, index: number) => (
                <Link key={index} href={link.href} className="block font-inter text-gray-300 hover:text-mona-gold transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-inter text-sm font-semibold text-gray-200 uppercase tracking-wider">Support</h4>
            <div className="mt-4 space-y-2">
              {footer.links.support.map((link: {label: string, href: string}, index: number) => (
                <Link key={index} href={link.href} className="block font-inter text-gray-300 hover:text-mona-gold transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="mt-8 pt-8 border-t border-warm-peach/20">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="font-inter text-gray-400 text-sm">
              {footer.copyright}
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {footer.social.map((social: {name: string, href: string, icon: string}, index: number) => (
                <a key={index} href={social.href} className="text-gray-400 hover:text-mona-gold transition-colors">
                  <span className="sr-only">{social.name}</span>
                  <span className="text-xl">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
