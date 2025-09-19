// src/components/landing/PricingSection.tsx

import { landingPageCopy } from '@/lib/copy';
import Link from 'next/link';

export const PricingSection = () => {
  const { title, options } = landingPageCopy.pricing;

  return (
    <section id="pricing" className="py-20 bg-card-surface">
      <div className="container mx-auto px-6">
        <h2 className="font-playfair text-3xl md:text-4xl font-bold text-center text-text-primary mb-12">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-4xl mx-auto">
          {options.map((option, index) => (
            <div key={index} className="bg-card-surface rounded-xl shadow-xl p-8 border border-gray-100 hover:border-naples-yellow transition-all duration-200">
              <div className="text-center">
                <h3 className="font-playfair text-2xl font-bold text-text-primary mb-4">{option.name}</h3>
                <p className="text-4xl font-extrabold text-atomic-tangerine mb-4">{option.price}</p>
                <ul className="text-gray-600 space-y-2 mb-6 flex-grow font-inter">
                  {option.features.map((feature, i) => (
                    <li key={i}>{feature}</li>
                  ))}
                </ul>
                <div className="flex justify-center">
                  <Link href="/order" className="bg-atomic-tangerine hover:bg-orange-600 text-white font-fredoka font-bold px-8 py-3 rounded-full transition-all duration-200 hover:scale-105 shadow-lg w-full text-center">
                    {option.cta}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
